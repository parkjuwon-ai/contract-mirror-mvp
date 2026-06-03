from pathlib import Path
import re
import sys

HTML_FILES = [
    Path("app/templates/index.html"),
]

JS_FILES = [
    Path("app/static/js/constants.js"),
    Path("app/static/js/state.js"),
    Path("app/static/js/apiClient.js"),
    Path("app/static/js/actions.js"),
    Path("app/static/js/app.js"),
]

missing_files = [str(path) for path in HTML_FILES + JS_FILES if not path.exists()]
if missing_files:
    print("Missing files:")
    for file_path in missing_files:
        print(f"- {file_path}")
    sys.exit(1)

html_text = "\n\n".join(path.read_text(encoding="utf-8") for path in HTML_FILES)
js_text = "\n\n".join(path.read_text(encoding="utf-8") for path in JS_FILES)

actions = sorted(set(re.findall(r'data-action=["\\\']([^"\\\']+)["\\\']', html_text)))

missing_actions = []
for action in actions:
    if action not in js_text:
        missing_actions.append(action)

if missing_actions:
    print("Missing frontend action handlers or references:")
    for action in missing_actions:
        print(f"- {action}")
    sys.exit(1)

if "function handleAction" not in js_text:
    print("Missing function handleAction")
    sys.exit(1)

print("Frontend action check passed.")
