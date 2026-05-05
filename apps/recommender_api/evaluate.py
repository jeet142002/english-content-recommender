from __future__ import annotations

from apps.recommender_api.app.models.schemas import FeedbackRequest, SessionPreferences
from apps.recommender_api.app.services.recommender import RecommenderService

def run_simulation() -> None:
    service = RecommenderService()
    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))

    scripted_feedback = ["like", "like", "not_seen", "dislike", "like"]

    for feedback in scripted_feedback:
        session = service.submit_feedback(
            FeedbackRequest(sessionId=session.sessionId, titleId=session.title.id, value=feedback)
        )

    result = service.stop(session.sessionId)
    print("hero:", result.hero.title)
    print("confidence:", result.confidence)
    print("backups:", ", ".join(item.title for item in result.backups))
    print("reasons:")
    for reason in result.reasons:
        print("-", reason.label, "=>", reason.detail)


if __name__ == "__main__":
    run_simulation()
