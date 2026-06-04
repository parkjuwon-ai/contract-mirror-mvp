from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from app.db import SessionLocal, init_db  # noqa: E402
from app.repositories.audit_repository import (  # noqa: E402
    audit_event_to_dict,
    create_audit_event,
    get_audit_events,
)
from app.repositories.file_repository import (  # noqa: E402
    create_file_record,
    file_to_dict,
    get_files_by_session,
    get_latest_file_by_type,
)
from app.repositories.session_repository import (  # noqa: E402
    create_default_participants,
    create_session,
)


def main() -> None:
    init_db()

    session_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"

    with SessionLocal() as db:
        create_session(
            db,
            session_id=session_id,
            contract_type="real_estate_sale",
        )
        create_default_participants(db, session_id=session_id)

        create_file_record(
            db,
            file_id=f"FILE-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id,
            file_type="contract",
            original_name="sample_contract.txt",
            mime_type="text/plain",
            size_bytes=21,
            sha256_hash="sha256:test-contract-hash",
            storage_path=f"storage/uploads/{session_id}/sample_contract.txt",
        )

        create_audit_event(
            db,
            session_id=session_id,
            event_type="CONTRACT_UPLOADED",
            message="file=sample_contract.txt",
        )

        db.commit()

    with SessionLocal() as db:
        files = [file_to_dict(item) for item in get_files_by_session(db, session_id)]
        latest_contract = get_latest_file_by_type(
            db,
            session_id=session_id,
            file_type="contract",
        )
        events = [audit_event_to_dict(item) for item in get_audit_events(db, session_id)]

    payload = {
        "sessionId": session_id,
        "files": files,
        "latestContract": file_to_dict(latest_contract) if latest_contract else None,
        "auditEvents": events,
    }

    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
