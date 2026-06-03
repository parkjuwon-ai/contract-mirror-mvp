from pathlib import Path
import sys

JS_FILES = [
    Path("app/static/js/constants.js"),
    Path("app/static/js/state.js"),
    Path("app/static/js/apiClient.js"),
    Path("app/static/js/actions.js"),
    Path("app/static/js/app.js"),
]

REQUIRED_SYMBOLS = [
    "const APP_VERSION",
    "const STORAGE_KEY",
    "const confirmationQuestions",
    "const BASE_STATE",
    "const PERSISTED_STATE_KEYS",
    "function createDefaultState",
    "function normalizeSavedState",
    "function createPersistedSnapshot",
    "function replaceState",
    "function resetDemoState",
    "function addEvent",
    "function goTo",
    "function handleAction",
    "window.ContractMirrorApi",
]

missing_files = [str(path) for path in JS_FILES if not path.exists()]
if missing_files:
    print("Missing frontend JS files:")
    for file_path in missing_files:
        print(f"- {file_path}")
    sys.exit(1)

combined_js = "\n\n".join(path.read_text(encoding="utf-8") for path in JS_FILES)

missing_symbols = [symbol for symbol in REQUIRED_SYMBOLS if symbol not in combined_js]

if missing_symbols:
    print("Missing required frontend symbols:")
    for symbol in missing_symbols:
        print(f"- {symbol}")
    sys.exit(1)

print("Frontend required symbols OK")
