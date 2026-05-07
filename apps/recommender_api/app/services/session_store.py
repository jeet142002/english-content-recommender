from __future__ import annotations

import json
import os
from pathlib import Path
from threading import RLock

from apps.recommender_api.app.models.schemas import SessionState


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_SESSION_STORE_PATH = ROOT / ".tmp" / "recommender_sessions.json"


class JsonSessionStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or DEFAULT_SESSION_STORE_PATH
        self._lock = RLock()
        self._sessions: dict[str, SessionState] = {}
        self._load()

    @classmethod
    def from_env(cls) -> "JsonSessionStore":
        configured_path = os.environ.get("SESSION_STORE_PATH")
        if not configured_path:
            return cls()

        path = Path(configured_path)
        if not path.is_absolute():
            path = ROOT / path
        return cls(path)

    @property
    def label(self) -> str:
        return str(self.path)

    def get(self, session_id: str) -> SessionState:
        with self._lock:
            state = self._sessions.get(session_id)
            if not state:
                raise KeyError(session_id)
            return state.model_copy(deep=True)

    def save(self, state: SessionState) -> None:
        with self._lock:
            self._sessions[state.sessionId] = state.model_copy(deep=True)
            self._flush()

    def _load(self) -> None:
        if not self.path.exists():
            return

        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            self._sessions = {}
            return

        self._sessions = {
            session_id: SessionState.model_validate(session)
            for session_id, session in payload.items()
        }

    def _flush(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            session_id: session.model_dump(mode="json")
            for session_id, session in self._sessions.items()
        }
        temp_path = self.path.with_name(f"{self.path.name}.tmp")
        temp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        temp_path.replace(self.path)
