from __future__ import annotations

from pathlib import Path
import random
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from apps.recommender_api.app.models.schemas import FeedbackRequest, SessionPreferences, SessionState
from apps.recommender_api.app.services.recommender import RecommenderService


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}
        self.label = "in-memory-eval-store"

    def get(self, session_id: str) -> SessionState:
        return self._sessions[session_id].model_copy(deep=True)

    def save(self, state: SessionState) -> None:
        self._sessions[state.sessionId] = state.model_copy(deep=True)


def build_service() -> RecommenderService:
    store = InMemorySessionStore()
    return RecommenderService(session_store=store, rng=random.Random(7))


def run_session(service: RecommenderService, preferences: SessionPreferences, scripted_feedback: list[str]) -> None:
    session = service.start_session(preferences)
    shown_titles = [session.title.title]
    for feedback in scripted_feedback:
        session = service.submit_feedback(
            FeedbackRequest(sessionId=session.sessionId, titleId=session.title.id, value=feedback)
        )
        shown_titles.append(session.title.title)

    result = service.stop(session.sessionId)
    print(f"scenario: {preferences.contentMode}/{preferences.adventureLevel}")
    print("shown:", " -> ".join(shown_titles[: len(scripted_feedback) + 1]))
    print("hero:", result.hero.title)
    print("confidence:", result.confidence)
    print("backups:", ", ".join(item.title for item in result.backups))
    for reason in result.reasons:
        print("-", reason.label, "=>", reason.detail)
    print()


def validate_not_seen_signal() -> None:
    service = build_service()
    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))
    before = service.get_state(session.sessionId)
    service.submit_feedback(
        FeedbackRequest(sessionId=session.sessionId, titleId=session.title.id, value="not_seen")
    )
    after = service.get_state(session.sessionId)
    assert before.profile == after.profile, "not_seen should not alter taste profile"
    assert after.familiarityProfile != before.familiarityProfile, "not_seen should alter familiarity profile"
    print("check: not_seen updates familiarity without changing taste")


def validate_like_and_dislike_direction() -> None:
    service = build_service()
    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))
    liked_title = session.title
    service.submit_feedback(
        FeedbackRequest(sessionId=session.sessionId, titleId=liked_title.id, value="like")
    )
    state = service.get_state(session.sessionId)
    positive_score = service._final_score(state, liked_title)

    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))
    disliked_title = session.title
    service.submit_feedback(
        FeedbackRequest(sessionId=session.sessionId, titleId=disliked_title.id, value="dislike")
    )
    dislike_state = service.get_state(session.sessionId)
    negative_score = service._final_score(dislike_state, disliked_title)

    assert positive_score > negative_score, "liked titles should score above disliked titles"
    print("check: likes boost aligned titles more than dislikes")


def run_simulation() -> None:
    validate_not_seen_signal()
    validate_like_and_dislike_direction()
    print()

    scenarios = [
        (SessionPreferences(contentMode="either", adventureLevel="balanced"), ["like", "like", "not_seen", "dislike", "like"]),
        (SessionPreferences(contentMode="movie", adventureLevel="safe"), ["like", "dislike", "not_seen", "like", "like"]),
        (SessionPreferences(contentMode="series", adventureLevel="surprise"), ["not_seen", "like", "dislike", "like", "not_seen"]),
    ]

    for preferences, scripted_feedback in scenarios:
        run_session(build_service(), preferences, scripted_feedback)


if __name__ == "__main__":
    run_simulation()
