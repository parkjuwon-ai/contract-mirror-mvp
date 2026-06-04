from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from app.db import SessionLocal, init_db  # noqa: E402
from app.repositories.session_repository import (  # noqa: E402
    create_default_participants,
    create_session,
    get_session_aggregate,
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
        db.commit()

    with SessionLocal() as db:
        aggregate = get_session_aggregate(db, session_id)

    if not aggregate:
        raise RuntimeError("Failed to load DB session aggregate")

    print(json.dumps(aggregate, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
