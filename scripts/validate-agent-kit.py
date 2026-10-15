#!/usr/bin/env python3
"""Read-only validation of this repository's skills, agent profiles and source map.

Requires Python 3.11+ and Node with the existing dev dependency tree (js-yaml).
Does not read .env, SQL data, initialize Nest/TypeORM, or execute operational scripts.
"""

import argparse
import json
from pathlib import Path
import re
import subprocess
import sys
import tomllib
from urllib.parse import unquote, urlsplit


LINK = re.compile(r"(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)")
NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
YAML_BRIDGE = """
const fs = require('fs');
const yaml = require('js-yaml');
const inputs = JSON.parse(fs.readFileSync(0, 'utf8'));
const outputs = inputs.map(({label, text}) => {
  try { return {label, value: yaml.load(text)}; }
  catch (error) { return {label, error: error.message}; }
});
process.stdout.write(JSON.stringify(outputs));
"""
CONFIG_FILES = {
    '.gitignore', '.dockerignore', 'CLAUDE.md', 'Dockerfile', 'README.md', 'docker-compose.yml',
    'nest-cli.json', 'package.json', 'package-lock.json', 'tsconfig.build.json',
    'tsconfig.json',
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1],
                        help='Repository or isolated fixture root (default: script repository)')
    args = parser.parse_args()
    root = args.root.resolve()
    errors = []
    warnings = []

    def relative(path):
        return str(path.relative_to(root))

    def fail(path, message):
        errors.append(f'{relative(path)}: {message}')

    skills = sorted((root / '.agents/skills').glob('grippo-*/SKILL.md'))
    profiles = sorted((root / '.codex/agents').glob('grippo-*.toml'))
    if not skills:
        errors.append('No project Grippo skills found')
    if not profiles:
        errors.append('No standalone Grippo custom agents found')

    yaml_inputs = []
    for skill in skills:
        content = skill.read_text(encoding='utf-8')
        match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', content, re.S)
        if not match:
            fail(skill, 'missing YAML frontmatter')
        else:
            yaml_inputs.append({'label': relative(skill), 'text': match.group(1)})
        metadata = skill.parent / 'agents/openai.yaml'
        if metadata.is_file():
            yaml_inputs.append({'label': relative(metadata),
                                'text': metadata.read_text(encoding='utf-8')})
        else:
            fail(skill, 'missing agents/openai.yaml')

    parsed = {}
    if yaml_inputs:
        try:
            result = subprocess.run(['node', '-e', YAML_BRIDGE], cwd=root,
                                    input=json.dumps(yaml_inputs), text=True,
                                    capture_output=True, check=True)
            for item in json.loads(result.stdout):
                if 'error' in item:
                    errors.append(f"{item['label']}: invalid YAML: {item['error']}")
                else:
                    parsed[item['label']] = item.get('value')
        except (OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
            errors.append('YAML validation unavailable: Node and existing js-yaml '
                          'are required; no packages were installed. ' + str(error))

    seen_names = set()
    for skill in skills:
        data = parsed.get(relative(skill))
        if not isinstance(data, dict):
            fail(skill, 'frontmatter must be a mapping')
            continue
        name = data.get('name')
        if not isinstance(name, str) or not NAME.fullmatch(name) or len(name) > 64:
            fail(skill, 'invalid skill name')
        elif name != skill.parent.name or name in seen_names:
            fail(skill, 'skill name must match directory and be unique')
        else:
            seen_names.add(name)
        if not isinstance(data.get('description'), str) or not data['description'].strip():
            fail(skill, 'description must be a nonempty string')
        if len(skill.read_text(encoding='utf-8').splitlines()) > 150:
            warnings.append(f'{relative(skill)}: consider moving conditional detail to references')
        metadata = skill.parent / 'agents/openai.yaml'
        ui_data = parsed.get(relative(metadata))
        ui = ui_data.get('interface', {}) if isinstance(ui_data, dict) else {}
        if not isinstance(ui, dict):
            fail(metadata, 'interface must be a mapping')
            continue
        for key in ('display_name', 'short_description', 'default_prompt'):
            if not isinstance(ui.get(key), str) or not ui[key].strip():
                fail(metadata, f'interface.{key} must be a nonempty string')
        if isinstance(ui.get('short_description'), str) and not 25 <= len(ui['short_description']) <= 64:
            fail(metadata, 'short_description must contain 25–64 characters')
        prompt = ui.get('default_prompt')
        if isinstance(name, str) and isinstance(prompt, str) and f'${name}' not in prompt:
            fail(metadata, 'default_prompt must mention this $skill-name')

    seen_agents = set()
    for profile in profiles:
        try:
            data = tomllib.loads(profile.read_text(encoding='utf-8'))
        except tomllib.TOMLDecodeError as error:
            fail(profile, f'invalid TOML: {error}')
            continue
        for key in ('name', 'description', 'developer_instructions'):
            if not isinstance(data.get(key), str) or not data[key].strip():
                fail(profile, f'{key} must be a nonempty string')
        name = data.get('name')
        if name != profile.stem or name in seen_agents:
            fail(profile, 'agent name must match filename and be unique')
        if isinstance(name, str):
            seen_agents.add(name)
        # This kit inherits permissions and model from its parent session.
        extra = set(data) - {'name', 'description', 'developer_instructions'}
        if extra:
            fail(profile, 'unexpected overrides; review intended inheritance: ' + ', '.join(sorted(extra)))
        instructions = data.get('developer_instructions', '')
        if isinstance(instructions, str):
            for target in re.findall(
                r'\.agents/skills/[a-z0-9-]+/(?:[a-zA-Z0-9_.-]+/)*[a-zA-Z0-9_.-]+\.md',
                instructions,
            ):
                if not (root / target).is_file():
                    fail(profile, f'missing skill reference: {target}')

    docs = sorted((root / '.agents/skills').glob('grippo-*/**/*.md'))
    docs += [root / name for name in ('AGENTS.md', 'README.md', 'CLAUDE.md')]
    docs += sorted((root / 'tasks').glob('*.md'))
    docs += sorted((root / 'test/postgres').rglob('*.md'))
    graph = {}
    checked_links = 0
    for doc in docs:
        if not doc.is_file():
            fail(doc, 'required document missing')
            continue
        content = doc.read_text(encoding='utf-8')
        if '-----BEGIN PRIVATE KEY-----' in content or '-----BEGIN EC PRIVATE KEY-----' in content:
            fail(doc, 'private key material marker in instructions')
        graph[doc.resolve()] = set()
        for destination in LINK.findall(content):
            destination = destination.strip().removeprefix('<').removesuffix('>')
            try:
                parts = urlsplit(destination)
            except ValueError as error:
                fail(doc, f'invalid link {destination}: {error}')
                continue
            if parts.scheme or not parts.path:
                continue
            target = (doc.parent / unquote(parts.path)).resolve()
            checked_links += 1
            if not target.is_relative_to(root):
                fail(doc, f'local link escapes repository: {destination}')
            elif not target.exists():
                fail(doc, f'broken local link: {destination}')
            else:
                graph[doc.resolve()].add(target)

    # Public routing tables are the inventory: missing linked entries and
    # unregistered files must both fail, without a second hardcoded name list.
    registered_skills = graph.get((root / 'AGENTS.md').resolve(), set())
    for skill in skills:
        if skill.resolve() not in registered_skills:
            fail(skill, 'skill is not registered in AGENTS.md routing')
    role_index = root / '.agents/skills/grippo-orchestrator/references/workflow.md'
    registered_profiles = graph.get(role_index.resolve(), set())
    for profile in profiles:
        if profile.resolve() not in registered_profiles:
            fail(profile, 'agent is not registered in orchestrator role routing')

    # Every detailed reference must be reachable from its own skill entrypoint.
    for skill in skills:
        reached = set()
        pending = [skill.resolve()]
        while pending:
            current = pending.pop()
            if current not in reached:
                reached.add(current)
                pending.extend(target for target in graph.get(current, set()) - reached
                               if target.is_relative_to(skill.parent.resolve()))
        for reference in (skill.parent / 'references').rglob('*.md'):
            if reference.resolve() not in reached:
                fail(reference, 'not reachable from SKILL.md through Markdown links')

    source_map = root / '.agents/skills/grippo-architecture/references/source-map.md'
    expected = {path.resolve() for path in (root / 'src').rglob('*') if path.is_file()}
    expected |= {path.resolve() for path in (root / 'scripts').rglob('*.sh')}
    expected |= {path.resolve() for path in (root / 'scripts').rglob('*.py')}
    postgres_tests = (root / 'test/postgres').resolve()
    expected |= {path.resolve() for path in postgres_tests.rglob('*')
                 if path.is_file() and path.name != '.DS_Store'}
    expected |= {(root / name).resolve() for name in CONFIG_FILES}
    if not source_map.is_file():
        fail(source_map, 'source inventory missing')
    else:
        inventory = {target for target in graph.get(source_map.resolve(), set())
                     if target in expected or '/src/' in str(target) or target.suffix == '.sh'
                     or target.is_relative_to(postgres_tests)}
        for path in sorted(expected - inventory):
            errors.append(f'Source not indexed: {relative(path)}')
        for path in sorted(inventory - expected):
            errors.append(f'Stale indexed source: {relative(path)}')

    for warning in warnings:
        print('WARN ' + warning)
    for error in errors:
        print('ERROR ' + error)
    if errors:
        print(f'FAIL: {len(errors)} error(s)')
        return 1
    print(f'PASS: {len(skills)} skills, {len(profiles)} agents, '
          f'{checked_links} local links, {len(expected)} indexed source/config/script/test files')
    print('Scope: format, references, discoverability and source inventory; '
          'does not prove behavioral correctness or client activation.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
