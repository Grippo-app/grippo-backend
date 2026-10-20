#!/bin/bash -p
# macOS ships Bash 3.2. No sourced profiles, curl-to-shell pipes or shell rc edits.
set -eu
set +x
umask 077

TASK_DIR=$(CDPATH= cd -- "$(/usr/bin/dirname -- "$0")" && pwd -P)
TASK_PATH=/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:/opt/homebrew/opt/node@24/bin:/usr/local/opt/node@24/bin:/opt/homebrew/opt/python@3.13/libexec/bin:/usr/local/opt/python@3.13/libexec/bin:/opt/homebrew/opt/python@3.13/bin:/usr/local/opt/python@3.13/bin:/opt/homebrew/opt/postgresql@15/bin:/usr/local/opt/postgresql@15/bin:/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/bin:/bin:/usr/sbin:/sbin
export PATH="$TASK_PATH"

case "${1:---plan}" in
  --help)
    if [ "$#" != 1 ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi
    cat <<'HELP'
Usage: scripts/setup-mac.sh [--plan | --install | --check | --check-online |
       --setup-admin | --export ABSOLUTE_FILE --writers-stopped |
       --import ABSOLUTE_FILE --writers-stopped [--resume]]
Export may also include --ssh-key ABSOLUTE_FILE and --env-file ABSOLUTE_FILE.

Default --plan and --check are offline. --install installs missing local tools,
npm dependencies and our native Keychain helper. Missing Homebrew uses a pinned,
hash-verified official installer in a local terminal. Apple/admin prompts remain.
No server connection, deploy, dump, S3 upload or exercise publication is included.
--check-online checks existing admin/AWS/GitHub access without publication.
Transfer requires a hidden local passphrase and stopped publication writers.
Exit: 0 local checks ready / transfer done; 2 readiness gaps; 1 operation failed.
HELP
    exit 0 ;;
  --plan|--install|--check|--check-online|--setup-admin|--export|--import) ;;
  *) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1 ;;
esac

case "${1:---plan}" in
  --export|--import)
    TASK_ARGUMENTS=("$@")
    TASK_INDEX=2
    TASK_WRITERS_SEEN=0
    TASK_RESUME_SEEN=0
    TASK_SSH_SEEN=0
    TASK_ENV_SEEN=0
    while [ "$TASK_INDEX" -lt "$#" ]; do
      TASK_FLAG=${TASK_ARGUMENTS[$TASK_INDEX]}
      case "$TASK_FLAG" in
        --writers-stopped)
          if [ "$TASK_WRITERS_SEEN" = 1 ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi
          TASK_WRITERS_SEEN=1 ;;
        --resume)
          if [ "$1" != --import ] || [ "$TASK_RESUME_SEEN" = 1 ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi
          TASK_RESUME_SEEN=1 ;;
        --ssh-key|--env-file)
          if [ "$1" != --export ] || { [ "$TASK_FLAG" = --ssh-key ] && [ "$TASK_SSH_SEEN" = 1 ]; } || { [ "$TASK_FLAG" = --env-file ] && [ "$TASK_ENV_SEEN" = 1 ]; }; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi
          TASK_INDEX=$((TASK_INDEX + 1))
          if [ "$TASK_INDEX" -ge "$#" ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi
          case "${TASK_ARGUMENTS[$TASK_INDEX]}" in /*) ;; *) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1 ;; esac
          if [ "$TASK_FLAG" = --ssh-key ]; then TASK_SSH_SEEN=1; else TASK_ENV_SEEN=1; fi ;;
        *) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1 ;;
      esac
      TASK_INDEX=$((TASK_INDEX + 1))
    done
    if [ "$TASK_WRITERS_SEEN" != 1 ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi ;;
  *) if [ "$#" -gt 1 ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi ;;
esac

case "${1:---plan}" in
  --export|--import)
    if [ "$#" -lt 3 ]; then printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1; fi
    case "$2" in /*) ;; *) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1 ;; esac
    case "$2" in *$'\n'*|*$'\r'*) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_ARGUMENTS_INVALID"}'; exit 1 ;; esac ;;
esac

if [ "$(/usr/bin/uname -s)" != Darwin ] || [ "$(/usr/bin/id -u)" = 0 ]; then
  printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_MACOS_USER_REQUIRED"}'
  exit 1
fi

# Drop inherited interpreter preload, credentials, endpoints and daemon overrides
# before even starting Node. Each child receives another explicit environment.
TASK_ACCOUNT=$(/usr/bin/id -un)
TASK_USER_HOME=$(/usr/bin/env -i PATH=/usr/bin:/bin /bin/bash --noprofile --norc -c 'unset HOME; printf "%s" ~')
case "$TASK_USER_HOME" in
  /*) ;;
  *) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_OS_HOME_REQUIRED"}'; exit 1 ;;
esac
case "$TASK_USER_HOME" in *$'\n'*|*$'\r'*) printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_OS_HOME_REQUIRED"}'; exit 1 ;; esac
if [ ! -d "$TASK_USER_HOME" ] || [ -L "$TASK_USER_HOME" ]; then
  printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_OS_HOME_REQUIRED"}'; exit 1
fi
TASK_ENV=(/usr/bin/env -i "HOME=$TASK_USER_HOME" "USER=$TASK_ACCOUNT" "LOGNAME=$TASK_ACCOUNT" "SHELL=/bin/bash" "PATH=$TASK_PATH" "LANG=en_US.UTF-8" "TERM=dumb")

if [ "${1:---plan}" = --install ]; then
  if ! /usr/bin/xcode-select -p >/dev/null 2>&1; then
    "${TASK_ENV[@]}" /usr/bin/xcode-select --install >/dev/null 2>&1 || true
    printf '%s\n' '{"schemaVersion":1,"status":"PENDING","allSkillsReady":false,"code":"MAC_SETUP_CLT_INSTALL_PENDING","next":"Finish the Apple Command Line Tools installer, then rerun --install. If no window appears, see https://developer.apple.com/download/all/."}'
    exit 2
  fi
  if [ ! -x /opt/homebrew/bin/brew ] && [ ! -x /usr/local/bin/brew ]; then
    if [ "$(/usr/bin/uname -m)" != arm64 ]; then
      printf '%s\n' '{"schemaVersion":1,"status":"PENDING","allSkillsReady":false,"code":"MAC_SETUP_BREW_PLATFORM_PENDING","next":"The pinned official Homebrew installer supports Apple Silicon. Review https://docs.brew.sh/Installation for this Mac; an existing Intel Homebrew can be used."}'
      exit 2
    fi
    if [ ! -t 0 ] || [ ! -t 2 ]; then
      printf '%s\n' '{"schemaVersion":1,"status":"PENDING","allSkillsReady":false,"code":"MAC_SETUP_BREW_INTERACTIVE_REQUIRED","next":"Run --install in a local Terminal. The official installer requires its own confirmation and may request the Mac admin password."}'
      exit 2
    fi
    # Reviewed public installer pinned to a full commit and exact SHA-256.
    # Update both only after reviewing the new official source. No fallback URL.
    TASK_BREW_COMMIT=be041513824fd2666a0e93cf5c3b0ca3bb0eb4b6
    TASK_BREW_SHA256=5f333bbe53bc490e51e7ccb1df8779b3dd6ee73a1a7379efda216edb08ccb148
    TASK_STAGE=$(/usr/bin/mktemp -d /private/tmp/grippo-mac-setup.XXXXXXXX 2>/dev/null) || {
      printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_BREW_STAGING_FAILED"}'; exit 1
    }
    task_clean_stage() { /bin/rm -f "$TASK_STAGE/install.sh"; /bin/rmdir "$TASK_STAGE"; }
    trap task_clean_stage EXIT
    trap 'exit 1' HUP INT TERM
    if ! "${TASK_ENV[@]}" /usr/bin/curl -q --proto '=https' --tlsv1.2 --fail --silent --max-time 120 --max-filesize 131072 \
      --output "$TASK_STAGE/install.sh" "https://raw.githubusercontent.com/Homebrew/install/$TASK_BREW_COMMIT/install.sh"; then
      printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_BREW_DOWNLOAD_FAILED"}'; exit 1
    fi
    TASK_ACTUAL_SHA=$("${TASK_ENV[@]}" /usr/bin/shasum -a 256 "$TASK_STAGE/install.sh" 2>/dev/null) || {
      printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_BREW_INSTALLER_INVALID"}'; exit 1
    }
    if [ "${TASK_ACTUAL_SHA%% *}" != "$TASK_BREW_SHA256" ] || ! /bin/bash -n "$TASK_STAGE/install.sh"; then
      printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_BREW_INSTALLER_INVALID"}'; exit 1
    fi
    printf '%s\n' 'Starting the verified official Homebrew installer. Its prompts stay in this terminal.' >&2
    if ! "${TASK_ENV[@]}" HOMEBREW_NO_ANALYTICS=1 /bin/bash "$TASK_STAGE/install.sh" >&2; then
      printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_BREW_INSTALL_FAILED","next":"Inspect the official installer result in this terminal. Existing partial files were preserved."}'; exit 1
    fi
    task_clean_stage
    trap - EXIT HUP INT TERM
  fi
fi

TASK_NODE=
for TASK_CANDIDATE in /opt/homebrew/opt/node@22/bin/node /usr/local/opt/node@22/bin/node /opt/homebrew/opt/node@24/bin/node /usr/local/opt/node@24/bin/node /opt/homebrew/bin/node /usr/local/bin/node; do
  if [ -x "$TASK_CANDIDATE" ]; then
    TASK_VERSION=$("${TASK_ENV[@]}" "$TASK_CANDIDATE" -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)
    case "$TASK_VERSION" in 22|24) TASK_NODE=$TASK_CANDIDATE; break ;; esac
  fi
done

if [ -z "$TASK_NODE" ] && [ "${1:---plan}" = --install ] && [ "$#" = 1 ]; then
  TASK_BREW=
  for TASK_CANDIDATE in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$TASK_CANDIDATE" ]; then TASK_BREW=$TASK_CANDIDATE; break; fi
  done
  if [ -n "$TASK_BREW" ] && /usr/bin/xcode-select -p >/dev/null 2>&1; then
    printf '%s\n' 'Installing local Node.js 22 through existing Homebrew…' >&2
    if ! "${TASK_ENV[@]}" HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_ANALYTICS=1 "$TASK_BREW" install --formula homebrew/core/node@22 >/dev/null 2>&1; then
      printf '%s\n' '{"status":"FAIL","code":"MAC_SETUP_NODE_INSTALL_FAILED","next":"Inspect Homebrew node@22 availability; no runtime version was substituted."}'
      exit 1
    fi
    for TASK_CANDIDATE in /opt/homebrew/opt/node@22/bin/node /usr/local/opt/node@22/bin/node; do
      if [ -x "$TASK_CANDIDATE" ]; then TASK_NODE=$TASK_CANDIDATE; break; fi
    done
  fi
fi

if [ -z "$TASK_NODE" ]; then
  printf '%s\n' '{"schemaVersion":1,"status":"PENDING","allSkillsReady":false,"code":"MAC_SETUP_NODE_REQUIRED","capabilities":[{"id":"node","status":"PENDING","required":true,"next":"Install supported Node.js 22 or 24; --install can install node@22 through existing Homebrew."},{"id":"homebrew","status":"NOT_CHECKED","required":true,"next":"Install Homebrew using https://docs.brew.sh/Installation if absent."},{"id":"xcode-clt","status":"NOT_CHECKED","required":true,"next":"If absent, run xcode-select --install and finish Apple installer, then rerun."}],"boundary":"No deploy, server connection or exercise publication."}'
  exit 2
fi

exec "${TASK_ENV[@]}" "$TASK_NODE" "$TASK_DIR/internal/setup-mac.cjs" "$@"
