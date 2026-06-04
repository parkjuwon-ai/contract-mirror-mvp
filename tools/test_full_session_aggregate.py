from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from app.db import SessionLocal, init_db  # noqa: E402
from app.repositories.analysis_repository import create_analysis_job, update_analysis_job  # noqa: E402
from app.repositories.file_repository import create_file_record  # noqa: E402
from app.repositories.report_repository import (  # noqa: E402
    create_report,
    create_report_mismatch,
    create_report_question,
)
from app.repositories.session_repository import (  # noqa: E402
    create_default_participants,
    create_session,
    get_session_aggregate,
)
from app.repositories.verification_repository import create_verification  # noqa: E402


def main() -> None:
    init_db()

    session_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
    job_id = f"JOB-{uuid.uuid4().hex[:8].upper()}"
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    verification_id = f"VER-{uuid.uuid4().hex[:8].upper()}"

    with SessionLocal() as db:
        session = create_session(
            db,
            session_id=session_id,
            contract_type="real_estate_sale",
            status="report_ready",
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

        create_file_record(
            db,
            file_id=f"FILE-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id,
            file_type="recording",
            original_name="sample_recording.txt",
            mime_type="text/plain",
            size_bytes=22,
            sha256_hash="sha256:test-recording-hash",
            storage_path=f"storage/uploads/{session_id}/sample_recording.txt",
        )

        create_analysis_job(
            db,
            job_id=job_id,
            session_id=session_id,
            status="processing",
            progress=50,
        )
        update_analysis_job(
            db,
            job_id=job_id,
            status="completed",
            progress=100,
        )

        create_report(
            db,
            report_id=report_id,
            session_id=session_id,
            analysis_job_id=job_id,
            report_hash="sha256:test-report-hash",
            risk_level="high",
            summary="설명 내용과 계약 조항 사이에 중요한 불일치 후보가 발견되었습니다.",
        )

        create_report_mismatch(
            db,
            mismatch_id=f"MM-{uuid.uuid4().hex[:8].upper()}",
            report_id=report_id,
            title="수익 보장성 발언과 면책 조항의 불일치 후보",
            risk_level="high",
            transcript_text="예상 수익은 안정적으로 보장된다고 설명된 후보 발언입니다.",
            contract_text="계약서에는 수익을 보장하지 않는다는 면책 조항이 포함되어 있습니다.",
            basis="녹취 발언 / 계약서 조항",
            display_order=1,
        )

        create_report_question(
            db,
            question_id=f"Q-{uuid.uuid4().hex[:8].upper()}",
            report_id=report_id,
            text="수익 보장처럼 들릴 수 있는 설명이 있었는지 다시 확인이 필요합니다.",
            target="explainer",
            display_order=1,
        )

        create_verification(
            db,
            verification_id=verification_id,
            session_id=session_id,
            report_id=report_id,
            status="valid",
            contract_hash="sha256:test-contract-hash",
            recording_hash="sha256:test-recording-hash",
            report_hash="sha256:test-report-hash",
            risk_summary="높음",
            tampered=False,
        )

        session.updated_at = session.created_at
        db.commit()

    with SessionLocal() as db:
        aggregate = get_session_aggregate(db, session_id)

    if aggregate is None:
        raise RuntimeError("Failed to load aggregate")

    print(json.dumps(aggregate, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
