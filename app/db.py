from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


PROJECT_ROOT = Path(__file__).resolve().parents[1]
STORAGE_DIR = PROJECT_ROOT / "storage"
DEFAULT_SQLITE_PATH = STORAGE_DIR / "contract_mirror.sqlite3"

DATABASE_URL = os.getenv(
    "CONTRACT_MIRROR_DATABASE_URL",
    f"sqlite:///{DEFAULT_SQLITE_PATH}",
)


class Base(DeclarativeBase):
    pass


def _make_engine():
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    return create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        future=True,
    )


engine = _make_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


def init_db() -> None:
    # Import models so SQLAlchemy registers table metadata before create_all.
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
