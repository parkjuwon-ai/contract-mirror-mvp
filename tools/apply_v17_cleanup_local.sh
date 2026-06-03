#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f "app/main.py" || ! -d "app/static" ]]; then
  echo "ERROR: 프로젝트 루트에서 실행해줘. 예: cd /Users/parkseoul/Desktop/VSCode/contract-mirror-mvp" >&2
  exit 1
fi

STAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_DIR="_archive/v17_cleanup_${STAMP}"
mkdir -p "$ARCHIVE_DIR"

move_if_exists() {
  local target="$1"
  if [[ -e "$target" ]]; then
    mkdir -p "$(dirname "$ARCHIVE_DIR/$target")"
    mv "$target" "$ARCHIVE_DIR/$target"
    echo "archived: $target -> $ARCHIVE_DIR/$target"
  fi
}

# 로컬에 잘못 중첩된 이전 빌드/복사본은 삭제하지 않고 보관 이동
move_if_exists "contract-mirror-mvp"
move_if_exists "v14_build"

mkdir -p docs/history
for f in README_HOME_V*.md README_V16_FRAME_RESPONSIVE_PATCH.md; do
  if [[ -e "$f" ]]; then
    mv "$f" "docs/history/"
    echo "moved history doc: $f -> docs/history/"
  fi
done

# 실행에 필요 없는 캐시/중복 CSS 제거
find app -type d -name "__pycache__" -prune -exec rm -rf {} +
find app -type f -name "*.pyc" -delete
rm -f app/static/css/styles.css

echo "v17 cleanup done. Archive: $ARCHIVE_DIR"
