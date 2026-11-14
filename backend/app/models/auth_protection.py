from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuthProtectionState(Base):
    __tablename__ = "auth_protection_states"

    __table_args__ = (
        UniqueConstraint(
            "identifier_type",
            "identifier_hash",
            name="uq_auth_protection_identifier",
        ),
        CheckConstraint(
            "identifier_type IN ('account', 'ip')",
            name="ck_auth_protection_identifier_type",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    identifier_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    identifier_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    failure_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    window_started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    lock_level: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
