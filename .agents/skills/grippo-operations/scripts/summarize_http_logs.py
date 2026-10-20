#!/usr/bin/env python3
"""Filter Docker/Nest HTTP records from stdin; never echo arbitrary log text."""

import argparse
from datetime import datetime, timezone
import json
import re
import sys
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


STATIC_ROUTES = {
    '/health', '/trainings', '/exercise-examples', '/muscles', '/equipments',
    '/push-tokens', '/weight-history', '/users', '/users/experience', '/users/height',
    '/users/excluded-muscles', '/users/excluded-equipments', '/users/goal',
    '/auth/login', '/auth/register', '/auth/google', '/auth/apple', '/auth/refresh',
    '/admin/exercise-examples', '/admin/users', '/admin/users/make-admin',
}
UUID = r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}'
DYNAMIC_ROUTES = [
    (re.compile(pattern), route) for pattern, route in [
        (rf'/trainings/{UUID}', '/trainings/:id'),
        (rf'/exercise-examples/{UUID}', '/exercise-examples/:id'),
        (rf'/weight-history/{UUID}', '/weight-history/:id'),
        (rf'/exercise-metrics/exercise-example/{UUID}/achievements', '/exercise-metrics/exercise-example/:id/achievements'),
        (rf'/exercise-metrics/exercise-example/{UUID}/recent', '/exercise-metrics/exercise-example/:id/recent'),
        (rf'/admin/exercise-examples/{UUID}', '/admin/exercise-examples/:id'),
        (rf'/admin/exercise-examples/{UUID}/translations', '/admin/exercise-examples/:id/translations'),
        (rf'/admin/users/{UUID}', '/admin/users/:id'),
        *[(rf'/admin/users/{UUID}/{suffix}', f'/admin/users/:id/{suffix}')
          for suffix in ('role', 'goal', 'trainings', 'weight-history', 'device-tokens')],
    ]
]
ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
HTTP = re.compile(
    r'^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?Z) '
    r'.*?\[HTTP\]\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD) '
    r'(/\S{0,2048}) ([1-5]\d{2})(?: uid=\S{1,200})? - (\d{1,12})ms$'
)
MAX_LINE = 16384


def canonical_route(path):
    path = re.split(r'[?#]', path, maxsplit=1)[0]
    if path in STATIC_ROUTES:
        return path
    return next((route for pattern, route in DYNAMIC_ROUTES if pattern.fullmatch(path)), None)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--route', choices=sorted(STATIC_ROUTES | {route for _, route in DYNAMIC_ROUTES}))
    parser.add_argument('--include-health', action='store_true')
    args = parser.parse_args()
    try:
        kyiv = ZoneInfo('Europe/Kyiv')
    except ZoneInfoNotFoundError:
        kyiv = None
    records = 0
    oversized = False
    while chunk := sys.stdin.buffer.readline(MAX_LINE + 1):
        complete = chunk.endswith(b'\n')
        if oversized or len(chunk) > MAX_LINE:
            oversized = not complete
            continue
        if not complete:
            continue
        match = HTTP.fullmatch(ANSI.sub('', chunk.decode('utf-8', errors='replace').strip()))
        if not match:
            continue
        stamp, method, path, status, duration = match.groups()
        route = canonical_route(path)
        if not route or (args.route and args.route != route):
            continue
        if route == '/health' and not args.include_health and args.route != '/health':
            continue
        try:
            instant = datetime.fromisoformat(re.sub(r'(\.\d{6})\d+Z$', r'\1Z', stamp).replace('Z', '+00:00'))
        except ValueError:
            continue
        record = {'utc': instant.astimezone(timezone.utc).isoformat(timespec='milliseconds'),
                  'method': method, 'route': route, 'status': int(status), 'duration_ms': int(duration)}
        if kyiv:
            record['kyiv'] = instant.astimezone(kyiv).isoformat(timespec='milliseconds')
        print(json.dumps(record, ensure_ascii=True), flush=True)
        records += 1
    print(json.dumps({'summary': 'HTTP metadata only; omitted text is not evidence of no errors',
                      'http_records': records}), flush=True)
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
