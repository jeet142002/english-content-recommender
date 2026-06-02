from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from datetime import timedelta
from pathlib import Path
from threading import RLock

from apps.recommender_api.app.models.schemas import SessionState, utc_now


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_SESSION_STORE_PATH = ROOT / ".tmp" / "recommender_sessions.sqlite3"
LEGACY_SESSION_STORE_PATH = ROOT / ".tmp" / "recommender_sessions.json"
DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24
DEFAULT_CLEANUP_EVERY = 25


class SqliteSessionStore:
    def __init__(
        self,
        path: Path | None = None,
        ttl_seconds: int = DEFAULT_SESSION_TTL_SECONDS,
        cleanup_every: int = DEFAULT_CLEANUP_EVERY,
        migration_source: Path | None = None,
    ) -> None:
        self.path = path or DEFAULT_SESSION_STORE_PATH
        self.ttl_seconds = max(1, ttl_seconds)
        self.cleanup_every = max(1, cleanup_every)
        self._lock = RLock()
        self._operation_count = 0
        self._migration_source = migration_source
        self._initialize()

    @classmethod
    def from_env(cls) -> "SqliteSessionStore":
        configured_path = os.environ.get("SESSION_STORE_PATH")
        ttl_seconds = int(os.environ.get("SESSION_TTL_SECONDS", DEFAULT_SESSION_TTL_SECONDS))
        if not configured_path:
            migration_source = LEGACY_SESSION_STORE_PATH if LEGACY_SESSION_STORE_PATH.exists() else None
            return cls(ttl_seconds=ttl_seconds, migration_source=migration_source)

        path = Path(configured_path)
        if not path.is_absolute():
            path = ROOT / path
        migration_source: Path | None = None
        if path.suffix.lower() == ".json":
            migration_source = path
            path = path.with_suffix(".sqlite3")
        return cls(path, ttl_seconds=ttl_seconds, migration_source=migration_source)

    @property
    def label(self) -> str:
        return f"sqlite:{self.path}"

    def get(self, session_id: str) -> SessionState:
        with self._lock:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT payload, expires_at FROM sessions WHERE session_id = ?",
                    (session_id,),
                ).fetchone()
            if not row:
                raise KeyError(session_id)

            now_ts = utc_now().timestamp()
            if row["expires_at"] <= now_ts:
                self._delete_session(session_id)
                raise KeyError(session_id)

            self._maybe_cleanup()
            return SessionState.model_validate_json(row["payload"])

    def save(self, state: SessionState) -> None:
        with self._lock:
            refreshed = self._refresh_state(state)
            payload = refreshed.model_dump_json()
            with closing(self._connect()) as connection:
                connection.execute(
                    """
                    INSERT INTO sessions(session_id, payload, updated_at, expires_at)
                    VALUES(?, ?, ?, ?)
                    ON CONFLICT(session_id) DO UPDATE SET
                        payload = excluded.payload,
                        updated_at = excluded.updated_at,
                        expires_at = excluded.expires_at
                    """,
                    (
                        refreshed.sessionId,
                        payload,
                        refreshed.updatedAt.timestamp(),
                        refreshed.expiresAt.timestamp(),
                    ),
                )
                connection.commit()
            self._maybe_cleanup()

    def _initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self._connect()) as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    updated_at REAL NOT NULL,
                    expires_at REAL NOT NULL
                )
                """
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)"
            )
            connection.commit()

        self._migrate_legacy_json()
        self._cleanup_expired_sessions()

    def _migrate_legacy_json(self) -> None:
        if (
            not self._migration_source
            or not self._migration_source.exists()
            or self._has_sessions()
        ):
            return

        try:
            payload = json.loads(self._migration_source.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return

        for session in payload.values():
            self.save(SessionState.model_validate(session))

    def _refresh_state(self, state: SessionState) -> SessionState:
        now = utc_now()
        return state.model_copy(
            deep=True,
            update={
                "updatedAt": now,
                "expiresAt": now + timedelta(seconds=self.ttl_seconds),
            },
        )

    def _maybe_cleanup(self) -> None:
        self._operation_count += 1
        if self._operation_count % self.cleanup_every == 0:
            self._cleanup_expired_sessions()

    def _cleanup_expired_sessions(self) -> None:
        with closing(self._connect()) as connection:
            connection.execute(
                "DELETE FROM sessions WHERE expires_at <= ?",
                (utc_now().timestamp(),),
            )
            connection.commit()

    def _delete_session(self, session_id: str) -> None:
        with closing(self._connect()) as connection:
            connection.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            connection.commit()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def _has_sessions(self) -> bool:
        with closing(self._connect()) as connection:
            row = connection.execute("SELECT 1 FROM sessions LIMIT 1").fetchone()
        return row is not None
