#!/usr/bin/env bash
export PYTHONDONTWRITEBYTECODE=1
set -euo pipefail

fail=0
check_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "MISSING: $path"
    fail=1
  else
    echo "OK: $path"
  fi
}

check_file "app/main.py"
check_file "app/templates/index.html"
check_file "app/static/css/style.css"
check_file "app/static/css/legacy-ui.css"
check_file "app/static/js/app.js"
check_file "requirements.txt"

if [ -f "app/static/css/styles.css" ]; then
  echo "WARN: app/static/css/styles.css exists. This project now uses style.css only."
  fail=1
fi

if find . -type d -name "__pycache__" | grep -q .; then
  echo "WARN: __pycache__ folders found. Run: bash tools/apply_v18_cleanup_local.sh"
  fail=1
fi

if find . -type f -name "*.pyc" | grep -q .; then
  echo "WARN: *.pyc files found. Run: bash tools/apply_v18_cleanup_local.sh"
  fail=1
fi

if grep -R "app/static/css/styles.css" -n README.md docs 2>/dev/null | grep -v "docs/history"; then
  echo "WARN: active docs still mention styles.css."
  fail=1
fi

if command -v python >/dev/null 2>&1; then
  python -B -m py_compile app/main.py || fail=1
  python tools/check_frontend_actions.py || fail=1
  python tools/check_frontend_required_symbols.py || fail=1
else
  echo "WARN: python command not found; skipped Python/frontend action checks."
  fail=1
fi

if command -v node >/dev/null 2>&1; then
  node --check app/static/js/app.js || fail=1
else
  echo "WARN: node command not found; skipped JS syntax check."
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "Health check passed."
else
  echo "Health check found issues."
fi

exit "$fail"
