#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_DIR="_archive/v18_cleanup_${STAMP}"
mkdir -p "$ARCHIVE_DIR"

move_if_exists() {
  local target="$1"
  if [ -e "$target" ]; then
    echo "archive: $target -> $ARCHIVE_DIR/"
    mv "$target" "$ARCHIVE_DIR/"
  fi
}

# Local duplicate folders that were accidentally created during zip extraction/copy.
move_if_exists "contract-mirror-mvp"
move_if_exists "v14_build"
move_if_exists "app_backup_before_ui_fix"
move_if_exists "_backups"

# Generated files that should not stay in the repo.
find . -type d -name "__pycache__" -prune -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
rm -f app/static/css/styles.css

# Keep archive folder if it has files; remove empty archive folder.
if [ -z "$(ls -A "$ARCHIVE_DIR")" ]; then
  rmdir "$ARCHIVE_DIR"
  echo "v18 cleanup done. No duplicate folders were found."
else
  echo "v18 cleanup done. Archived duplicates in: $ARCHIVE_DIR"
fi
