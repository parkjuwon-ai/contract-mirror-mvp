#!/usr/bin/env python3
"""Lightweight frontend action consistency check for Contract Mirror.

It verifies that every literal data-action rendered by app.js is handled by
handleAction(), except dynamic action prefixes that are intentionally handled
separately.
"""
from __future__ import annotations

import re
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
APP_JS = ROOT / "app" / "static" / "js" / "app.js"

DYNAMIC_PREFIXES = ("copy-question-", "verify-", "consent-", "reject-")
SPECIAL_HANDLERS = {"copy-all-questions"}


def main() -> int:
    source = APP_JS.read_text(encoding="utf-8")
    data_actions = set(re.findall(r'data-action="([^"]+)"', source))
    route_keys = set(re.findall(r'"([^"]+)"\s*:\s*\(.*?\)\s*=>', source))

    unresolved: list[str] = []
    for action in sorted(data_actions):
        if "${" in action:
            # Template actions such as copy-question-${question.id} or verify-${role}
            # are covered by dynamic prefix handlers in handleAction().
            continue
        if action in SPECIAL_HANDLERS:
            continue
        if action in route_keys:
            continue
        if action.startswith(DYNAMIC_PREFIXES):
            continue
        unresolved.append(action)

    used_literals = {a for a in data_actions if "${" not in a and a not in SPECIAL_HANDLERS}
    unused_routes = sorted(route_keys - used_literals)

    # Some route keys can still be invoked by generated sheets that are only rendered
    # after state changes; they are still present as literal data-action values above.
    if unresolved:
        print("Unhandled data-action values:")
        for action in unresolved:
            print(f"  - {action}")
        return 1

    if unused_routes:
        print("Unused route handlers in handleAction():")
        for action in unused_routes:
            print(f"  - {action}")
        return 1

    print("Frontend action check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
