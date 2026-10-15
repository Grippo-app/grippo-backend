#!/usr/bin/env python3
"""Fail-closed Docker operations. Dotenv is never executed as shell code.

Requires Python 3.9+, Git and Docker Compose v2 JSON config. CLI confirmation
prevents accidents; it does not prove human permission or a write freeze.
"""

import argparse
import contextlib
import copy
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import stat
import subprocess
import sys
import tempfile
import time
import uuid


ROOT = Path(__file__).resolve().parents[2]
LOCK_ENV = "GRIPPO_OPERATIONS_LOCK_FD"


class OperationError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise OperationError(message)


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def path_arg(value):
    path = Path(value).expanduser()
    return Path(os.path.abspath(path if path.is_absolute() else ROOT / path))


def inside(path, parent):
    return path == parent or parent in path.parents


def safe_path(path, *, directory=False, private=False, missing=False):
    for part in [*reversed(path.parents), path]:
        require(not part.is_symlink(), "Symlink in an operations path; stop.")
        if part != path:
            parent = part.stat()
            require(stat.S_ISDIR(parent.st_mode) and parent.st_uid in (0, os.geteuid()),
                    "Operations path has an untrusted parent directory.")
            # Root-owned sticky temp directories cannot replace another user's
            # existing entries. Other shared writable parents are unsafe.
            sticky_root = parent.st_uid == 0 and bool(parent.st_mode & stat.S_ISVTX)
            require(not parent.st_mode & 0o022 or sticky_root,
                    "Operations path has a shared writable parent directory.")
    if missing and not path.exists():
        safe_path(path.parent, directory=True)
        return
    info = path.stat()
    require(stat.S_ISDIR(info.st_mode) if directory else stat.S_ISREG(info.st_mode),
            "Unexpected operations path type; stop.")
    require(info.st_uid == os.geteuid(), "Operations path must belong to the current user.")
    require(not info.st_mode & 0o022, "Operations path must not be writable by group/others.")
    if not directory:
        require(info.st_nlink == 1, "Hard-linked operations file; stop.")
    if private:
        require(not info.st_mode & 0o077, "Private path requires mode 600 (file) / 700 (directory).")


def run(command, label, *, output=None, timeout=60, pass_fds=(), env=None, merge_errors=False):
    # Raw diagnostics may contain credentials/SQL: never relay them to stdout.
    with tempfile.TemporaryFile() as errors:
        try:
            result = subprocess.run(command, cwd=ROOT, env=env, stdin=subprocess.DEVNULL,
                                    stdout=output if output is not None else subprocess.PIPE,
                                    stderr=output if merge_errors else errors, timeout=timeout,
                                    pass_fds=pass_fds, check=False)
        except subprocess.TimeoutExpired:
            raise OperationError(label + " timed out; inspect state before any retry.") from None
        require(result.returncode == 0, label + " failed; raw output withheld (may contain secrets).")
        return result.stdout if output is None else b""


def json_run(command, label, *, env=None):
    return json.loads(run(command, label, env=env))


def docker_binding():
    # Never consult the mutable active-context pointer during a rollout. Honor
    # Docker's context-over-host precedence, then pin the effective selector.
    context = os.environ.get("DOCKER_CONTEXT")
    if context:
        return ["docker", "--context", context], context
    host = os.environ.get("DOCKER_HOST")
    if host:
        # TLS env stays in this process and is inherited unchanged by dump.sh.
        return ["docker", "--host", host], "explicit-host"
    context = run(["docker", "context", "show"], "Initial Docker context").decode().strip()
    require(bool(context), "Docker context is missing.")
    os.environ["DOCKER_CONTEXT"] = context
    return ["docker", "--context", context], context


@contextlib.contextmanager
def operations_lock():
    lock_path = ROOT / ".grippo-operations.lock"
    safe_path(lock_path, missing=True)
    inherited = os.environ.get(LOCK_ENV)
    if inherited:
        fd = int(inherited)
        actual, expected = os.fstat(fd), lock_path.stat()
        require((actual.st_dev, actual.st_ino) == (expected.st_dev, expected.st_ino), "Invalid inherited lock.")
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield fd
        return
    fd = os.open(lock_path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    try:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise OperationError("Another dump/deploy holds the checkout lock.") from None
        yield fd
    finally:
        os.close(fd)


class Target:
    def __init__(self, args):
        self.args = args
        self.env_file = path_arg(args.env_file)
        self.compose_file = path_arg(args.compose_file)
        self.latest = path_arg(args.latest_file)
        self.recovery_dir = path_arg(args.backup_dir)
        require(Path(args.backup_dir).is_absolute(), "--backup-dir must be absolute.")
        require(not inside(self.recovery_dir, ROOT), "Recovery storage must be outside checkout/build context.")
        safe_path(self.recovery_dir, directory=True, private=True)
        safe_path(self.env_file, private=True)
        self.env_sha256 = digest(self.env_file)
        # Compose --env-file controls interpolation only. The reserved selector
        # also binds backend.env_file to the same verified file.
        os.environ["GRIPPO_ENV_FILE"] = str(self.env_file)
        # Build/plan always use the project-local tag. Only the final up command
        # receives the verified immutable ID through this reserved selector.
        os.environ["GRIPPO_RELEASE_IMAGE"] = ""
        safe_path(self.compose_file)
        safe_path(self.latest, missing=True)
        require(inside(self.compose_file, ROOT), "Compose file must be inside the approved checkout.")
        require(self.latest not in (self.env_file, self.compose_file), "Latest must not replace configuration.")
        require(self.latest.suffix == '.sql', "Latest must be a .sql path.")
        if inside(self.latest, ROOT):
            tracked = run(["git", "ls-files", "--", str(self.latest.relative_to(ROOT))], "Latest path safety")
            require(not tracked.strip(), "Latest must not overwrite a tracked project file.")
        self.docker, self.context = docker_binding()
        self.compose = [*self.docker, "compose", "--project-directory", str(ROOT),
                        "--env-file", str(self.env_file), "-f", str(self.compose_file)]
        self.config = json_run(self.compose + ["config", "--format", "json"], "Compose config")
        require(digest(self.env_file) == self.env_sha256, "Environment changed during configuration read.")
        self.project = self.config["name"]
        services = self.config["services"]
        self.db_env = services["db"]["environment"]
        self.backend_env = services["backend"]["environment"]
        self.image_ref = services["backend"].get("image")
        require(self.image_ref == self.project + "-backend:local",
                "Backend build image must be scoped to the approved Compose project.")
        build = services["backend"]["build"]
        require(path_arg(build["context"]) == ROOT and build.get("dockerfile", "Dockerfile") == "Dockerfile",
                "Only the reviewed checkout build context/Dockerfile is supported.")
        safe_path(ROOT / ".dockerignore")
        require(not (ROOT / "Dockerfile.dockerignore").exists(), "Unexpected Dockerfile-specific ignore override.")
        require(self.backend_env.get("NODE_ENV") == "production" and
                str(self.backend_env.get("POSTGRES_SYNC", "")).lower() == "false" and
                str(self.backend_env.get("POSTGRES_MIGRATIONS", "")).lower() == "false",
                "Production deployment requires schema synchronization/migrations disabled.")
        require(self.backend_env.get("POSTGRES_HOST") == "db" and str(self.backend_env.get("POSTGRES_PORT")) == "5432",
                "Only existing Compose db:5432 is supported; external DB needs a separate plan.")
        for key in ("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"):
            require(bool(self.db_env.get(key)), "Required PostgreSQL configuration is missing.")
        self.database = self.db_env["POSTGRES_DB"]
        self.username = self.db_env["POSTGRES_USER"]
        require("=" not in self.database and not self.database.startswith(("postgres://", "postgresql://")),
                "Connection strings are not accepted as database names.")
        self.daemon = run([*self.docker, "info", "--format", "{{.ID}}"], "Docker daemon identity").decode().strip()
        require(bool(self.daemon), "Docker daemon identity is missing.")
        db_ids = run(self.compose + ["ps", "--all", "--quiet", "db"], "Existing DB identity").decode().split()
        backend_ids = run(self.compose + ["ps", "--all", "--quiet", "backend"], "Existing backend identity").decode().split()
        require(len(db_ids) == 1 and len(backend_ids) == 1,
                "Exactly one existing DB/backend required; bootstrap is separate.")
        self.db_id, self.backend_id = db_ids[0], backend_ids[0]
        self.db = self.inspect(self.db_id)
        self.backend = self.inspect(self.backend_id)
        self.backend_image = self.backend["Image"]
        self.backend_revision = (self.backend["Config"].get("Labels") or {}).get("org.opencontainers.image.revision")
        # A missing runnable image blocks rollout, but must not prevent an
        # independently requested emergency database backup.
        if args.operation == "deploy":
            previous_image = self.inspect_image(self.backend_image)
            require(previous_image["Id"] == self.backend_image,
                    "Previous backend image is unavailable; prepare recovery before rollout.")
        for service, container in (("db", self.db), ("backend", self.backend)):
            labels = container["Config"].get("Labels") or {}
            require(labels.get("com.docker.compose.project") == self.project and
                    labels.get("com.docker.compose.service") == service, "Wrong Compose project/service.")
            require(labels.get("com.docker.compose.project.working_dir") == str(ROOT) and
                    labels.get("com.docker.compose.project.config_files") == str(self.compose_file),
                    "Existing containers belong to another checkout/Compose file.")
            if service == "db":
                require(container["State"].get("Running") is True, "Source DB must remain running.")
            else:
                require(not any(container["State"].get(key) for key in ("Dead", "Restarting")),
                        "Source backend is in an unstable state.")
        self.actual_db_env = self.container_env(self.db)
        self.actual_backend_env = self.container_env(self.backend)
        mapping = {"POSTGRES_USER": "POSTGRES_USERNAME", "POSTGRES_DB": "POSTGRES_DATABASE",
                   "POSTGRES_PASSWORD": "POSTGRES_PASSWORD"}
        for db_key, backend_key in mapping.items():
            require(self.actual_db_env.get(db_key) == self.db_env[db_key] ==
                    self.actual_backend_env.get(backend_key) == self.backend_env.get(backend_key),
                    "Running source/configuration differ; stop without changing the source.")
        require(self.actual_backend_env.get("POSTGRES_HOST") == "db" and
                str(self.actual_backend_env.get("POSTGRES_PORT")) == "5432",
                "Running source is not db:5432; do not silently retarget it.")
        db_networks = self.db["NetworkSettings"]["Networks"]
        backend_networks = self.backend["NetworkSettings"]["Networks"]
        require(any(name in backend_networks and "db" in (network.get("Aliases") or [])
                    for name, network in db_networks.items()), "Backend/DB service network mismatch.")
        mounts = [mount for mount in self.db["Mounts"] if mount.get("Destination") == "/var/lib/postgresql/data"]
        require(len(mounts) == 1 and mounts[0].get("Type") == "volume", "Expected existing named PostgreSQL volume.")
        volumes = [v for v in services["db"].get("volumes", []) if v.get("target") == "/var/lib/postgresql/data"]
        require(len(volumes) == 1, "Expected one declared PostgreSQL data volume.")
        expected_volume = self.config["volumes"][volumes[0]["source"]]["name"]
        self.volume = mounts[0]["Name"]
        require(self.volume == expected_volume, "Running PostgreSQL volume differs from the project.")
        probe = run(self.pg_command("psql", "-X", "-w", "-qAt", "-F", "\t", "-v", "ON_ERROR_STOP=1",
                                    "-c", "SELECT current_database(), current_user, inet_server_port();"),
                    "PostgreSQL source verification").decode().strip().split("\t")
        require(probe == [self.database, self.username, "5432"], "PostgreSQL source verification mismatch.")

    @staticmethod
    def container_env(container):
        return dict(item.split("=", 1) for item in container["Config"].get("Env", []) if "=" in item)

    def inspect(self, container_id):
        result = json_run([*self.docker, "inspect", container_id], "Container metadata")
        require(len(result) == 1, "Ambiguous container metadata.")
        return result[0]

    def inspect_image(self, image_ref):
        result = json_run([*self.docker, "image", "inspect", image_ref], "Backend image metadata")
        require(len(result) == 1 and re.fullmatch(r"sha256:[0-9a-f]{64}", result[0]["Id"]) is not None,
                "Expected exactly one available immutable backend image.")
        return result[0]

    def pg_command(self, program, *arguments):
        # Password is read only in the verified DB container, never host argv.
        shell = ('unset PGHOST PGHOSTADDR PGPORT PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSFILE; '
                 'PGPASSWORD="$POSTGRES_PASSWORD"; export PGPASSWORD; exec "$@"')
        return [*self.docker, "exec", self.db_id, "sh", "-ec", shell, "grippo-db", program,
                "--host=127.0.0.1", "--port=5432", "--username=" + self.username,
                "--dbname=" + self.database, *arguments]

    def identity(self):
        return {"root": str(ROOT), "host": socket.gethostname(), "daemon": self.daemon,
                "context": self.context, "docker_selector_sha256": fingerprint(self.docker),
                "project": self.project, "db": self.db_id,
                "backend": self.backend_id, "backend_image": self.backend_image,
                "backend_revision": self.backend_revision, "db_image": self.db["Image"],
                "volume": self.volume,
                "config_sha256": fingerprint(self.config), "env_sha256": self.env_sha256,
                "env_file": str(self.env_file), "compose_file": str(self.compose_file), "latest": str(self.latest),
                "recovery_dir": str(self.recovery_dir)}


def private_new(path):
    return os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600), "wb")


def durable_copy(source, destination):
    fd, name = tempfile.mkstemp(prefix=".recovery-", suffix=".partial", dir=destination.parent)
    temporary = Path(name)
    try:
        with os.fdopen(fd, "wb") as writer, source.open("rb") as reader:
            shutil.copyfileobj(reader, writer)
            writer.flush()
            os.fsync(writer.fileno())
        require(digest(source) == digest(temporary), "Recovery copy checksum mismatch.")
        os.link(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def sync_directory(path):
    fd = os.open(path, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def make_dump(target):
    backup_dir = ROOT / "backups"
    if not backup_dir.exists():
        backup_dir.mkdir(mode=0o700)
    safe_path(backup_dir, directory=True, private=True)
    safe_path(target.latest, missing=True)
    require(not inside(target.latest, backup_dir) and not inside(target.latest, target.recovery_dir),
            "Latest must not overlap immutable snapshot/recovery storage.")
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%SZ")
    name = "snapshot-" + stamp + "-" + uuid.uuid4().hex + ".sql"
    snapshot = backup_dir / name
    recovery = target.recovery_dir / name
    partial = backup_dir / (name + ".partial")
    created_partial = False
    latest_temp = None
    try:
        with private_new(partial) as writer:
            created_partial = True
            run(target.pg_command("pg_dump", "--no-password", "--format=p", "--inserts", "--no-owner",
                                  "--no-privileges", "--blobs"), "PostgreSQL dump", output=writer, timeout=3600)
            writer.flush()
            os.fsync(writer.fileno())
        require(partial.stat().st_size > 0, "Dump was empty; latest was preserved.")
        os.link(partial, snapshot)
        partial.unlink()
        sync_directory(backup_dir)
        durable_copy(snapshot, recovery)
        sync_directory(target.recovery_dir)
        expected = digest(snapshot)
        require(digest(recovery) == expected, "Recovery checksum mismatch; no rollout.")
        fd, temp_name = tempfile.mkstemp(prefix=".grippo-latest-", dir=target.latest.parent)
        latest_temp = Path(temp_name)
        with os.fdopen(fd, "wb") as writer, snapshot.open("rb") as reader:
            shutil.copyfileobj(reader, writer)
            writer.flush()
            os.fsync(writer.fileno())
        safe_path(target.latest, missing=True)
        os.replace(latest_temp, target.latest)
        latest_temp = None
        sync_directory(target.latest.parent)
        for file in (snapshot, recovery, target.latest):
            safe_path(file, private=True)
            require(file.stat().st_size > 0 and digest(file) == expected, "Backup checksum mismatch.")
        return {"snapshot": str(snapshot), "latest": str(target.latest), "recovery": str(recovery),
                "sha256": expected, "bytes": snapshot.stat().st_size, "source": target.identity()}
    finally:
        if created_partial and partial.exists():
            partial.unlink()
        if latest_temp is not None:
            latest_temp.unlink(missing_ok=True)


def git_revision(expected):
    require(re.fullmatch(r"[0-9a-f]{40}", expected) is not None, "--revision must be the full approved Git SHA.")
    env = dict(os.environ, GIT_OPTIONAL_LOCKS="0")
    actual = run(["git", "rev-parse", "HEAD"], "Git revision", env=env).decode().strip()
    require(actual == expected, "Checkout revision differs from approved revision.")
    status = run(["git", "status", "--porcelain=v1", "--untracked-files=normal"], "Git status", env=env)
    require(not status.strip(), "Checkout has changes; no deploy from an unreviewed tree.")
    return actual


def plan_for(target, revision, attempt):
    return {"attempt": attempt, "revision": revision, "target": target.identity(),
            "health_timeout": target.args.health_timeout,
            "actions": ["fresh scripts/dump.sh and verified recovery copy", "build backend",
                        "up --no-deps --force-recreate --no-build --pull never backend", "wait for DB-aware health"],
            "database_recreated": False, "sql_imported": False}


def wait_healthy(target, expected_image):
    deadline = time.monotonic() + target.args.health_timeout
    while time.monotonic() < deadline:
        ids = run(target.compose + ["ps", "--all", "--quiet", "backend"], "Updated backend identity").decode().split()
        require(len(ids) == 1, "Updated backend identity is ambiguous.")
        container = target.inspect(ids[0])
        require(ids[0] != target.backend_id, "Backend was not recreated; release was not applied.")
        require(container["Image"] == expected_image, "Updated backend is not using the verified built image.")
        require(container["State"].get("Running") is True, "Updated backend is not running.")
        labels = container["Config"].get("Labels") or {}
        require(labels.get("org.opencontainers.image.revision") == target.args.revision,
                "Updated image revision does not match the approved release.")
        runtime = target.container_env(container)
        for key in ("NODE_ENV", "POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DATABASE",
                    "POSTGRES_USERNAME", "POSTGRES_PASSWORD", "POSTGRES_SYNC", "POSTGRES_MIGRATIONS"):
            require(runtime.get(key) == str(target.backend_env[key]), "Updated backend configuration mismatch.")
        health = container["State"].get("Health", {}).get("Status")
        if health == "healthy":
            return
        require(health == "starting", "Backend health failed or healthcheck is missing.")
        time.sleep(1)
    raise OperationError("Backend health timed out; no automatic retry/rollback. Keep recovery copies.")


def execute(target, plan, lock_fd):
    args = target.args
    require(args.writers_frozen, "Confirm control of all writers with --writers-frozen.")
    require(args.approve_plan == fingerprint(plan), "Approval does not match this exact target/revision/attempt/plan.")
    journal = target.recovery_dir / ("attempt-" + plan["attempt"] + ".json")
    with private_new(journal) as writer:
        writer.write(json.dumps({"plan": plan, "status": "started; inspect state, do not replay"}, sort_keys=True).encode())
        writer.flush()
        os.fsync(writer.fileno())
    sync_directory(target.recovery_dir)
    built_image = None

    def checkpoint(phase, backup=None):
        # A consumed attempt stays consumed after failure. Persist completed
        # phases for diagnosis without inferring rollback or retry permission.
        fd, name = tempfile.mkstemp(prefix=".attempt-", dir=target.recovery_dir)
        temporary = Path(name)
        try:
            with os.fdopen(fd, "w") as writer:
                json.dump({"plan": plan, "phase": phase, "backup": backup, "built_image": built_image,
                           "replay_allowed": False}, writer, sort_keys=True)
                writer.flush()
                os.fsync(writer.fileno())
            safe_path(journal, private=True)
            os.replace(temporary, journal)
            sync_directory(target.recovery_dir)
        finally:
            temporary.unlink(missing_ok=True)
    child_env = dict(os.environ, **{LOCK_ENV: str(lock_fd)})
    receipt_bytes = run(["bash", str(ROOT / "scripts/dump.sh"), "--env-file", str(target.env_file),
                         "--compose-file", str(target.compose_file), "--latest-file", str(target.latest),
                         "--backup-dir", str(target.recovery_dir)], "Mandatory scripts/dump.sh",
                        timeout=3660, pass_fds=(lock_fd,), env=child_env)
    receipt = json.loads(receipt_bytes)
    require(receipt["source"] == target.identity(), "Backup source changed; rollout blocked.")
    require(receipt["latest"] == str(target.latest) and receipt["bytes"] > 0, "Unexpected backup receipt.")
    for key, parent in (("snapshot", ROOT / "backups"), ("recovery", target.recovery_dir),
                        ("latest", target.latest.parent)):
        file = path_arg(receipt[key])
        require(file.parent == parent, "Backup receipt escaped approved storage.")
        safe_path(file, private=True)
        require(file.stat().st_size == receipt["bytes"] and digest(file) == receipt["sha256"],
                "Backup checksum mismatch; rollout blocked.")
    checkpoint("backup-verified", receipt)
    require(Target(args).identity() == target.identity(), "Target changed after backup; stop.")
    git_revision(args.revision)
    build_log = target.recovery_dir / ("build-" + plan["attempt"] + ".log")
    with private_new(build_log) as writer:
        run(target.compose + ["build", "--build-arg", "RELEASE_SHA=" + args.revision, "backend"], "Backend build (private log retained)",
            output=writer, timeout=1800, merge_errors=True)
    image = target.inspect_image(target.image_ref)
    require((image["Config"].get("Labels") or {}).get("org.opencontainers.image.revision") == args.revision,
            "Built image revision differs from the approved release; no rollout.")
    built_image = image["Id"]
    require(Target(args).identity() == target.identity(), "Target changed during build; stop.")
    git_revision(args.revision)
    safe_path(target.latest, private=True)
    require(digest(target.latest) == receipt["sha256"], "Latest changed during build; stop.")
    checkpoint("build-verified", receipt)
    rollout_env = dict(os.environ, GRIPPO_RELEASE_IMAGE=built_image)
    rollout_config = json_run(target.compose + ["config", "--format", "json"],
                              "Immutable rollout configuration", env=rollout_env)
    expected_config = copy.deepcopy(target.config)
    expected_config["services"]["backend"]["image"] = built_image
    require(rollout_config == expected_config,
            "Immutable image selection changed other Compose settings; stop.")
    require(target.inspect_image(built_image)["Id"] == built_image, "Verified built image is unavailable.")
    run(target.compose + ["up", "-d", "--no-deps", "--force-recreate", "--no-build", "--pull", "never", "backend"],
        "Backend rollout", timeout=180, env=rollout_env)
    wait_healthy(target, built_image)
    db_after = target.inspect(target.db_id)
    require(db_after["Id"] == target.db["Id"] and db_after["State"].get("Running") is True,
            "Existing DB changed during rollout; inspect state.")
    checkpoint("healthy-awaiting-application-smoke", receipt)
    return {"status": "healthy", "revision": args.revision, "attempt": plan["attempt"],
            "backend_image": built_image, "previous_backend_image": target.backend_image,
            "backup": receipt, "database_recreated": False,
            "note": "Keep writer controls until the approved application smoke checks finish."}


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("dump", "deploy"))
    parser.add_argument("--env-file", default=".env")
    parser.add_argument("--compose-file", default=os.environ.get("DOCKER_COMPOSE_FILE", "docker-compose.yml"))
    parser.add_argument("--latest-file", default=os.environ.get("DB_DUMP_FILE", "scripts/dump.sql"))
    parser.add_argument("--backup-dir", required=True, help="Existing private recovery directory outside checkout")
    parser.add_argument("--revision")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--plan", action="store_true", help="Read-only deployment plan (default)")
    mode.add_argument("--execute", action="store_true")
    parser.add_argument("--attempt", help="Exact UUID from approved plan")
    parser.add_argument("--approve-plan", help="Exact approval SHA256 from approved plan")
    parser.add_argument("--writers-frozen", action="store_true", help="Operator attestation, not an automatic write lock")
    parser.add_argument("--health-timeout", type=int, default=120)
    args = parser.parse_args()
    require(1 <= args.health_timeout <= 1800, "Health timeout must be 1..1800 seconds.")
    if args.operation == "deploy":
        require(bool(args.revision), "Planning requires --revision.")
        require(not args.execute or bool(args.attempt and args.approve_plan), "Execution requires approved attempt/plan.")
    else:
        require(not any((args.execute, args.plan, args.revision, args.attempt, args.approve_plan, args.writers_frozen)),
                "Deployment flags are not accepted by dump-only.")
    if args.attempt:
        require(str(uuid.UUID(args.attempt)) == args.attempt, "Attempt must be a canonical UUID.")
    return args


def main():
    os.umask(0o077)
    args = arguments()
    if args.operation == "deploy" and not args.execute:
        target = Target(args)
        revision = git_revision(args.revision)
        plan = plan_for(target, revision, args.attempt or str(uuid.uuid4()))
        print(json.dumps({"plan": plan, "approval_sha256": fingerprint(plan)}, sort_keys=True, indent=2))
        return
    with operations_lock() as lock_fd:
        target = Target(args)
        if args.operation == "dump":
            result = make_dump(target)
        else:
            revision = git_revision(args.revision)
            result = execute(target, plan_for(target, revision, args.attempt), lock_fd)
        print(json.dumps(result, sort_keys=True, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OperationError, OSError, ValueError, KeyError, TypeError, IndexError, AttributeError) as error:
        message = str(error) if isinstance(error, OperationError) else "Invalid state/configuration or filesystem failure (details withheld)."
        print("ERROR: " + message, file=sys.stderr)
        sys.exit(1)
