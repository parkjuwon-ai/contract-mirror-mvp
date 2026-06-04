from __future__ import annotations

import json
import sqlite3
import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from app.db import SessionLocal, init_db  # noqa: E402
from app.repositories.file_repository import create_file_record, file_to_dict  # noqa: E402
from app.repositories.session_repository import create_default_participants, create_session  # noqa: E402


def main() -> None:
    init_db()

    session_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
    file_hash = "sha256:test-duplicate-hash"
    file_name = "duplicate_contract.txt"

    with SessionLocal() as db:
        create_session(
            db,
            session_id=session_id,
            contract_type="real_estate_sale",
        )
        create_default_participants(db, session_id=session_id)

        first = create_file_record(
            db,
            file_id=f"FILE-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id,
            file_type="contract",
            original_name=file_name,
            mime_type="text/plain",
            size_bytes=21,
            sha256_hash=file_hash,
            storage_path=f"storage/uploads/{session_id}/{file_name}",
        )

        second = create_file_record(
            db,
            file_id=f"FILE-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id,
            file_type="contract",
            original_name=file_name,
            mime_type="text/plain",
            size_bytes=21,
            sha256_hash=file_hash,
            storage_path=f"storage/uploads/{session_id}/{file_name}",
        )

        first_payload = file_to_dict(first)
        second_payload = file_to_dict(second)

        db.commit()

    conn = sqlite3.connect("storage/contract_mirror.sqlite3")
    count = conn.execute(
        """
        SELECT COUNT(*)
        FROM files
        WHERE session_id = ?
          AND file_type = 'contract'
          AND original_name = ?
          AND sha256_hash = ?
        """,
        (session_id, file_name, file_hash),
    ).fetchone()[0]
    conn.close()

    payload = {
        "sessionId": session_id,
        "firstFileId": first_payload["id"],
        "secondFileId": second_payload["id"],
        "sameFileReused": first_payload["id"] == second_payload["id"],
        "matchingRowCount": count,
    }

    print(json.dumps(payload, ensure_ascii=False, indent=2))

    if count != 1:
        raise RuntimeError(f"Expected 1 matching file row, got {count}")

    if first_payload["id"] != second_payload["id"]:
        raise RuntimeError("Expected duplicate file creation to reuse existing row")


if __name__ == "__main__":
    main()
