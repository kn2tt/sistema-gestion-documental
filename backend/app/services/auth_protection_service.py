import hashlib
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.auth_protection import AuthProtectionState


ACCOUNT_LOCK_DURATIONS = [
    30,
    60,
    300,
    1800,
    3600,
    86400,
]

IP_LOCK_DURATIONS = [
    60,
    300,
    1800,
]

IP_WINDOW_SECONDS = 600
ACCOUNT_FAILURE_LIMIT = 3
IP_FAILURE_LIMIT = 15


class AuthenticationLockedError(Exception):

    def __init__(self, retry_after: int):
        self.retry_after = max(1, retry_after)

        super().__init__(
            "Por seguridad, el acceso está temporalmente bloqueado."
        )


class AuthProtectionService:

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def hash_identifier(identifier: str) -> str:
        return hashlib.sha256(
            identifier.encode("utf-8")
        ).hexdigest()

    def _get_locked_state(
        self,
        identifier_type: str,
        identifier: str,
        now: datetime,
    ) -> AuthProtectionState:

        identifier_hash = self.hash_identifier(identifier)

        statement = (
            insert(AuthProtectionState)
            .values(
                identifier_type=identifier_type,
                identifier_hash=identifier_hash,
                failure_count=0,
                window_started_at=None,
                lock_level=0,
                locked_until=None,
                updated_at=now,
            )
            .on_conflict_do_nothing(
                index_elements=[
                    "identifier_type",
                    "identifier_hash",
                ]
            )
        )

        self.db.execute(statement)

        state = self.db.execute(
            select(AuthProtectionState)
            .where(
                AuthProtectionState.identifier_type
                == identifier_type,
                AuthProtectionState.identifier_hash
                == identifier_hash,
            )
            .with_for_update()
        ).scalar_one()

        return state

    @staticmethod
    def _remaining_lock(
        state: AuthProtectionState,
        now: datetime,
    ) -> int:

        if state.locked_until and state.locked_until > now:
            return max(
                1,
                int(
                    (state.locked_until - now).total_seconds()
                    + 0.999
                ),
            )

        if state.locked_until:
            state.locked_until = None
            state.updated_at = now

        return 0

    def obtener_estados(
        self,
        correo: str,
        client_ip: str,
    ) -> tuple[
        AuthProtectionState,
        AuthProtectionState,
        int,
    ]:

        now = datetime.utcnow()

        account_state = self._get_locked_state(
            "account",
            correo.strip().lower(),
            now,
        )

        ip_state = self._get_locked_state(
            "ip",
            client_ip,
            now,
        )

        account_remaining = self._remaining_lock(
            account_state,
            now,
        )

        ip_remaining = self._remaining_lock(
            ip_state,
            now,
        )

        return (
            account_state,
            ip_state,
            max(account_remaining, ip_remaining),
        )

    def registrar_fallo_cuenta(
        self,
        state: AuthProtectionState,
        now: datetime,
    ) -> int:

        state.failure_count += 1
        state.updated_at = now

        if state.failure_count < ACCOUNT_FAILURE_LIMIT:
            return 0

        duration_index = min(
            state.lock_level,
            len(ACCOUNT_LOCK_DURATIONS) - 1,
        )

        duration = ACCOUNT_LOCK_DURATIONS[duration_index]

        state.lock_level = min(
            state.lock_level + 1,
            len(ACCOUNT_LOCK_DURATIONS),
        )

        state.failure_count = 0
        state.locked_until = now + timedelta(seconds=duration)

        return duration

    def registrar_fallo_ip(
        self,
        state: AuthProtectionState,
        now: datetime,
    ) -> int:

        if (
            state.window_started_at is None
            or now - state.window_started_at
            >= timedelta(seconds=IP_WINDOW_SECONDS)
        ):
            state.failure_count = 0
            state.window_started_at = now

        state.failure_count += 1
        state.updated_at = now

        if state.failure_count < IP_FAILURE_LIMIT:
            return 0

        duration_index = min(
            state.lock_level,
            len(IP_LOCK_DURATIONS) - 1,
        )

        duration = IP_LOCK_DURATIONS[duration_index]

        state.lock_level = min(
            state.lock_level + 1,
            len(IP_LOCK_DURATIONS),
        )

        state.failure_count = 0
        state.window_started_at = now
        state.locked_until = now + timedelta(seconds=duration)

        return duration

    @staticmethod
    def resetear_cuenta(
        state: AuthProtectionState,
        now: datetime,
    ) -> None:

        state.failure_count = 0
        state.window_started_at = None
        state.lock_level = 0
        state.locked_until = None
        state.updated_at = now
