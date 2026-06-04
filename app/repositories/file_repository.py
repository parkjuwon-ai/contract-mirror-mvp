from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FileModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def create_file_record(
    db: Session,
    *,
    file_id: str,
    session_id: str,
    file_type: str,
    original_name: str,
    mime_type: Optional[str],
    size_bytes: int,
    sha256_hash: str,
    storage_path: str,
) -> FileModel:
    file_record = FileModel(
        id=file_id,
        session_id=session_id,
        file_type=file_type,
        original_name=original_name,
        mime_type=mime_type,
        size_bytes=size_bytes,
        sha256_hash=sha256_hash,
        storage_path=storage_path,
        uploaded_at=utc_now(),
    )

    db.add(file_record)
    db.flush()

    return file_record


def get_files_by_session(db: Session, session_id: str) -> list[FileModel]:
    statement = (
        select(FileModel)
        .where(FileModel.session_id == session_id)
        .order_by(FileModel.uploaded_at.asc())
    )

    return list(db.scalars(statement).all())


def get_latest_file_by_type(
    db: Session,
    *,
    session_id: str,
    file_type: str,
) -> Optional[FileModel]:
    statement = (
        select(FileModel)
        .where(FileModel.session_id == session_id)
        .where(FileModel.file_type == file_type)
        .order_by(FileModel.uploaded_at.desc())
        .limit(1)
    )

    return db.scalars(statement).first()


def file_to_dict(file_record: FileModel) -> dict:
    return {
        "id": file_record.id,
        "sessionId": file_record.session_id,
        "fileType": file_record.file_type,
        "fileName": file_record.original_name,
        "fileSize": file_record.size_bytes,
        "mimeType": file_record.mime_type,
        "hash": file_record.sha256_hash,
        "storagePath": file_record.storage_path,
        "uploadedAt": to_iso(file_record.uploaded_at),
    }
