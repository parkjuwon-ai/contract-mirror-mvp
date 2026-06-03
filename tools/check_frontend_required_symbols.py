from pathlib import Path
import sys

JS_PATH = Path('app/static/js/app.js')
text = JS_PATH.read_text(encoding='utf-8')
required = [
    'const confirmationQuestions',
    'function reportScreen',
    'function addendumScreen',
    'function verifyScreen',
    '"go-mobile-report"',
    '"go-report"',
    '"go-verify"',
    '"go-addendum"',
]
missing = [item for item in required if item not in text]
if missing:
    print('Missing required frontend symbols:')
    for item in missing:
        print(f'- {item}')
    sys.exit(1)
print('Frontend required symbols OK')
