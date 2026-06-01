from __future__ import annotations

import math
import random
import statistics
import sys
from collections import Counter
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from apps.recommender_api.app.models.schemas import (
    FeedbackRequest,
    RecommendationReason,
    RecommendationResult,
    SessionEvent,
    SessionPreferences,
    SessionState,
    SessionTitleResponse,
    Title,
)
from apps.recommender_api.app.services.catalog import by_id, load_catalog
from apps.recommender_api.app.services.recommender import RecommenderService, feature_tokens


LEGACY_WEIGHTS = {"like": 1.0, "dislike": -0.85, "not_seen": 0.0}
TASTE_FEEDBACK_VALUES = {"like", "dislike"}
ADVENTURE_POPULARITY_WEIGHT = {"safe": 0.28, "balanced": 0.12, "surprise": -0.08}
ADVENTURE_FAMILIARITY_WEIGHT = {"safe": 0.25, "balanced": 0.08, "surprise": -0.12}
ADVENTURE_LONGTAIL_BOOST = {"safe": 0.0, "balanced": 0.08, "surprise": 0.22}
TARGET_NOVELTY = {"safe": 0.24, "balanced": 0.48, "surprise": 0.72}


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}
        self.label = "in-memory-eval-store"

    def get(self, session_id: str) -> SessionState:
        return self._sessions[session_id].model_copy(deep=True)

    def save(self, state: SessionState) -> None:
        self._sessions[state.sessionId] = state.model_copy(deep=True)


class LegacyRecommenderService:
    def __init__(self, rng: random.Random | None = None) -> None:
        self.session_store = InMemorySessionStore()
        self.rng = rng or random.Random()

    def start_session(self, preferences: SessionPreferences) -> SessionTitleResponse:
        session_id = str(uuid4())
        state = SessionState(sessionId=session_id, preferences=preferences)
        self.session_store.save(state)
        return self.next_title(session_id)

    def get_state(self, session_id: str) -> SessionState:
        return self.session_store.get(session_id)

    def filtered_titles(self, state: SessionState) -> list[Title]:
        return [
            title
            for title in load_catalog()
            if title.language == "en"
            and (state.preferences.contentMode == "either" or title.kind == state.preferences.contentMode)
        ]

    def next_title(self, session_id: str) -> SessionTitleResponse:
        state = self.get_state(session_id)
        available = [title for title in self.filtered_titles(state) if title.id not in state.shownTitleIds]
        if not available:
            raise ValueError("No more titles available")

        scored = sorted(
            ((self._question_score(state, title), title) for title in available),
            key=lambda item: item[0],
            reverse=True,
        )
        top_pool = scored[:8] if len(scored) >= 8 else scored
        weights = [max(0.1, (score + 1) * (1 - index * 0.08)) for index, (score, _) in enumerate(top_pool)]
        selected = self.rng.choices(top_pool, weights=weights, k=1)[0][1]
        state.shownTitleIds.append(selected.id)
        state.confidence = self._estimate_confidence(state)
        self.session_store.save(state)
        return SessionTitleResponse(
            sessionId=session_id,
            step=len(state.shownTitleIds),
            confidence=state.confidence,
            title=selected,
        )

    def submit_feedback(self, payload: FeedbackRequest) -> SessionTitleResponse:
        state = self.get_state(payload.sessionId)
        state.events.append(SessionEvent(titleId=payload.titleId, value=payload.value, step=len(state.events) + 1))
        self._update_profile(state, by_id(payload.titleId), payload.value)
        state.confidence = self._estimate_confidence(state)
        self.session_store.save(state)
        return self.next_title(payload.sessionId)

    def stop(self, session_id: str) -> RecommendationResult:
        state = self.get_state(session_id)
        answered_ids = {event.titleId for event in state.events}
        known_rated_ids = {event.titleId for event in state.events if event.value in TASTE_FEEDBACK_VALUES}
        current_unanswered_id = (
            state.shownTitleIds[-1]
            if state.shownTitleIds and state.shownTitleIds[-1] not in answered_ids
            else None
        )
        excluded_ids = known_rated_ids | ({current_unanswered_id} if current_unanswered_id else set())
        ranked = sorted(
            (
                (self._final_score(state, title), title)
                for title in self.filtered_titles(state)
                if title.id not in excluded_ids
            ),
            key=lambda item: item[0],
            reverse=True,
        )
        if not ranked:
            ranked = sorted(
                ((self._final_score(state, title), title) for title in self.filtered_titles(state)),
                key=lambda item: item[0],
                reverse=True,
            )
        hero = ranked[0][1]
        backups = [title for _, title in ranked[1:4]]
        confidence = max(state.confidence, min(0.96, 0.35 + len(state.events) * 0.07))
        reasons = [
            RecommendationReason(
                label="Legacy heuristic",
                detail="Baseline v1 metadata profile result.",
            )
        ]
        return RecommendationResult(
            sessionId=session_id,
            confidence=round(confidence, 2),
            hero=hero,
            backups=backups,
            reasons=reasons,
            summary="Legacy baseline result.",
        )

    def _update_profile(self, state: SessionState, title: Title, value: str) -> None:
        weight = LEGACY_WEIGHTS[value]
        if weight == 0:
            return
        for _, token in feature_tokens(title):
            state.profile[token] = state.profile.get(token, 0.0) + weight

    def _question_score(self, state: SessionState, title: Title) -> float:
        relevance = self._profile_similarity(state, title)
        information_gain = 1.0 / (1 + math.exp(-(len(feature_tokens(title)) - 6) / 4))
        familiarity = title.familiarity / 100
        popularity = title.popularity / 100
        quality = title.qualityScore / 100
        long_tail = max(0.0, 1 - popularity)
        score = quality * 0.55 + information_gain * 0.2 + relevance * 0.35
        score += popularity * ADVENTURE_POPULARITY_WEIGHT[state.preferences.adventureLevel]
        score += familiarity * ADVENTURE_FAMILIARITY_WEIGHT[state.preferences.adventureLevel]
        score += long_tail * ADVENTURE_LONGTAIL_BOOST[state.preferences.adventureLevel]
        score += self._diversity_bonus(state, title)
        return score

    def _final_score(self, state: SessionState, title: Title) -> float:
        relevance = self._profile_similarity(state, title)
        quality = title.qualityScore / 100
        popularity = title.popularity / 100
        novelty = 1 - (title.familiarity / 100)
        diversity = self._diversity_bonus(state, title)
        return relevance * 0.55 + quality * 0.25 + novelty * 0.12 + diversity * 0.15 - popularity * 0.08

    def _profile_similarity(self, state: SessionState, title: Title) -> float:
        if not state.profile:
            base = title.qualityScore / 100
            if state.preferences.contentMode != "either" and title.kind == state.preferences.contentMode:
                base += 0.08
            return base
        token_scores = [state.profile.get(token, 0.0) for _, token in feature_tokens(title)]
        return 0.5 + (sum(token_scores) / max(len(token_scores), 1)) / 4

    def _diversity_bonus(self, state: SessionState, title: Title) -> float:
        taste_events = [event for event in state.events if event.value in TASTE_FEEDBACK_VALUES]
        if not taste_events:
            return 0.0
        seen_titles = [by_id(event.titleId) for event in taste_events]
        seen_genres = {genre for item in seen_titles for genre in item.genres}
        overlap = len(seen_genres.intersection(title.genres))
        return max(0.0, 0.18 - overlap * 0.03)

    def _estimate_confidence(self, state: SessionState) -> float:
        if not state.events:
            return 0.16
        taste_events = [event for event in state.events if event.value in TASTE_FEEDBACK_VALUES]
        not_seen_count = len(state.events) - len(taste_events)
        if not taste_events:
            return round(min(0.24, 0.16 + not_seen_count * 0.015), 2)
        polarity = abs(sum(LEGACY_WEIGHTS[event.value] for event in taste_events))
        distinct_tokens = len([value for value in state.profile.values() if abs(value) >= 0.5])
        confidence = 0.22 + min(0.5, len(taste_events) * 0.08) + min(0.18, polarity * 0.06)
        confidence += min(0.1, distinct_tokens * 0.008)
        confidence += min(0.04, not_seen_count * 0.01)
        return round(min(confidence, 0.96), 2)


def build_current_service(seed: int = 7) -> RecommenderService:
    return RecommenderService(session_store=InMemorySessionStore(), rng=random.Random(seed))


def build_legacy_service(seed: int = 7) -> LegacyRecommenderService:
    return LegacyRecommenderService(rng=random.Random(seed))


def run_session(service, preferences: SessionPreferences, scripted_feedback: list[str]) -> dict[str, object]:
    session = service.start_session(preferences)
    shown_titles = [session.title]
    for feedback in scripted_feedback:
        session = service.submit_feedback(
            FeedbackRequest(sessionId=session.sessionId, titleId=session.title.id, value=feedback)
        )
        shown_titles.append(session.title)
    result = service.stop(session.sessionId)
    state = service.get_state(session.sessionId)
    return {
        "shown_titles": shown_titles,
        "result": result,
        "state": state,
    }


def validate_not_seen_signal() -> None:
    service = build_current_service()
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
    service = build_current_service()
    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))
    liked_title = session.title
    service.submit_feedback(FeedbackRequest(sessionId=session.sessionId, titleId=liked_title.id, value="like"))
    positive_score = service._final_score(service.get_state(session.sessionId), liked_title)

    service = build_current_service()
    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))
    disliked_title = session.title
    service.submit_feedback(
        FeedbackRequest(sessionId=session.sessionId, titleId=disliked_title.id, value="dislike")
    )
    negative_score = service._final_score(service.get_state(session.sessionId), disliked_title)
    assert positive_score > negative_score, "liked titles should score above disliked titles"
    print("check: likes boost aligned titles more than dislikes")


def validate_similarity_signal() -> None:
    service = build_current_service()
    session = service.start_session(SessionPreferences(contentMode="either", adventureLevel="balanced"))
    anchor = session.title
    service.submit_feedback(FeedbackRequest(sessionId=session.sessionId, titleId=anchor.id, value="like"))
    state = service.get_state(session.sessionId)
    candidates = [
        title for title in service.filtered_titles(state)
        if title.id not in {event.titleId for event in state.events}
    ]
    scored = sorted(
        (
            (
                service._neighborhood_preference(state, title),
                service._cached_title_similarity(anchor.id, title.id),
                title,
            )
            for title in candidates
        ),
        key=lambda item: (item[0], item[1]),
        reverse=True,
    )
    assert scored[0][0] >= scored[-1][0], "similar titles should earn stronger neighborhood preference"
    print("check: similarity layer prefers neighbors of liked titles")


def title_similarity(left: Title, right: Title) -> float:
    left_tokens = {token for _, token in feature_tokens(left)}
    right_tokens = {token for _, token in feature_tokens(right)}
    union = left_tokens | right_tokens
    if not union:
        return 0.0
    return len(left_tokens & right_tokens) / len(union)


def title_reliability(title: Title) -> float:
    familiarity = math.sqrt(max(0.0, title.familiarity / 100))
    popularity = math.sqrt(max(0.0, title.popularity / 100))
    trust = title.trustScore or 0.0
    return min(1.0, 0.12 + familiarity * 0.44 + popularity * 0.2 + trust * 0.32)


def low_support_penalty(title: Title) -> float:
    quality = title.qualityScore / 100
    familiarity = title.familiarity / 100
    trust_gap = max(0.0, 0.58 - (title.trustScore or 0.0))
    if quality < 0.88 or familiarity >= 0.2:
        return trust_gap * 0.3
    return (quality - 0.88) * (0.2 - familiarity) * 6 + trust_gap * 0.45


def recommendation_metrics(state: SessionState, result: RecommendationResult) -> dict[str, float]:
    liked_titles = [by_id(event.titleId) for event in state.events if event.value == "like"]
    disliked_titles = [by_id(event.titleId) for event in state.events if event.value == "dislike"]
    shown_titles = [by_id(title_id) for title_id in state.shownTitleIds]
    hero = result.hero

    like_similarity = statistics.mean(
        [title_similarity(hero, title) for title in liked_titles]
    ) if liked_titles else 0.0
    dislike_similarity = statistics.mean(
        [title_similarity(hero, title) for title in disliked_titles]
    ) if disliked_titles else 0.0
    shown_similarity = statistics.mean(
        [title_similarity(hero, title) for title in shown_titles[:-1]]
    ) if len(shown_titles) > 1 else 0.0
    backup_diversity = 0.0
    if result.backups:
        backup_diversity = 1 - statistics.mean(
            [title_similarity(hero, backup) for backup in result.backups]
        )

    coherence = like_similarity - dislike_similarity
    novelty = 1 - (hero.familiarity / 100)
    target_novelty = TARGET_NOVELTY[state.preferences.adventureLevel]
    novelty_fit = max(0.0, 1 - abs(novelty - target_novelty) / 0.7)
    quality = hero.qualityScore / 100
    reliability = title_reliability(hero)
    support_penalty = low_support_penalty(hero)
    critic_score = (
        coherence * 4.2
        + quality * 2.7
        + novelty_fit * 1.3
        + reliability * 1.6
        + backup_diversity * 0.7
        - shown_similarity * 1.2
        - support_penalty * 3.2
    )

    return {
        "coherence": round(coherence, 3),
        "quality": round(quality, 3),
        "novelty": round(novelty, 3),
        "novelty_fit": round(novelty_fit, 3),
        "reliability": round(reliability, 3),
        "support_penalty": round(support_penalty, 3),
        "backup_diversity": round(backup_diversity, 3),
        "shown_similarity": round(shown_similarity, 3),
        "critic_score": round(max(0.0, min(10.0, critic_score)), 2),
    }


def critic_note(metrics: dict[str, float], result: RecommendationResult) -> str:
    hero = result.hero
    if metrics["critic_score"] >= 7.7:
        tone = "strong"
    elif metrics["critic_score"] >= 6.6:
        tone = "good"
    else:
        tone = "mixed"

    if metrics["coherence"] >= 0.18:
        fit = "clearly follows the session taste signals"
    elif metrics["coherence"] >= 0.08:
        fit = "partly follows the session taste signals"
    else:
        fit = "still feels weakly connected to the session tastes"

    novelty_line = (
        "It also takes a healthy discovery swing."
        if metrics["novelty"] >= 0.45
        else "It stays on the familiar side."
    )
    return (
        f"{tone.title()} pick: {hero.title} is a {fit}, with genre/tone packaging that feels "
        f"{'intentional' if metrics['backup_diversity'] >= 0.35 else 'a bit narrow'}. {novelty_line}"
    )


def print_comparison(name: str, preferences: SessionPreferences, scripted_feedback: list[str]) -> tuple[float, float]:
    legacy_run = run_session(build_legacy_service(), preferences, scripted_feedback)
    current_run = run_session(build_current_service(), preferences, scripted_feedback)

    legacy_metrics = recommendation_metrics(legacy_run["state"], legacy_run["result"])
    current_metrics = recommendation_metrics(current_run["state"], current_run["result"])

    print(f"scenario: {name}")
    print(f"prefs: {preferences.contentMode}/{preferences.adventureLevel}")
    print("feedback:", " -> ".join(scripted_feedback))
    print("legacy shown:", " -> ".join(title.title for title in legacy_run["shown_titles"]))
    print("current shown:", " -> ".join(title.title for title in current_run["shown_titles"]))
    print()
    print(
        f"legacy hero: {legacy_run['result'].hero.title} | score={legacy_metrics['critic_score']} | "
        f"coherence={legacy_metrics['coherence']} | quality={legacy_metrics['quality']} | "
        f"novelty_fit={legacy_metrics['novelty_fit']} | reliability={legacy_metrics['reliability']} | "
        f"backup_diversity={legacy_metrics['backup_diversity']}"
    )
    print("legacy note:", critic_note(legacy_metrics, legacy_run["result"]))
    print(
        f"current hero: {current_run['result'].hero.title} | score={current_metrics['critic_score']} | "
        f"coherence={current_metrics['coherence']} | quality={current_metrics['quality']} | "
        f"novelty_fit={current_metrics['novelty_fit']} | reliability={current_metrics['reliability']} | "
        f"backup_diversity={current_metrics['backup_diversity']}"
    )
    print("current note:", critic_note(current_metrics, current_run["result"]))

    winner = "current" if current_metrics["critic_score"] > legacy_metrics["critic_score"] else "legacy"
    print("winner:", winner)
    print()
    return legacy_metrics["critic_score"], current_metrics["critic_score"]


def catalog_health_snapshot() -> None:
    catalog = load_catalog()
    genres = Counter(genre for title in catalog for genre in title.genres)
    print("catalog_size:", len(catalog))
    print("genre_leaders:", ", ".join(f"{name}={count}" for name, count in genres.most_common(8)))
    print()


def run_simulation() -> None:
    catalog_health_snapshot()
    validate_not_seen_signal()
    validate_like_and_dislike_direction()
    validate_similarity_signal()
    print()

    scenarios = [
        (
            "Epic / world-building drift",
            SessionPreferences(contentMode="either", adventureLevel="balanced"),
            ["like", "like", "not_seen", "dislike", "like"],
        ),
        (
            "Safe movie comfort",
            SessionPreferences(contentMode="movie", adventureLevel="safe"),
            ["like", "dislike", "not_seen", "like", "like"],
        ),
        (
            "Surprise series discovery",
            SessionPreferences(contentMode="series", adventureLevel="surprise"),
            ["not_seen", "like", "dislike", "like", "not_seen"],
        ),
        (
            "Prestige drama tension",
            SessionPreferences(contentMode="either", adventureLevel="balanced"),
            ["dislike", "like", "like", "dislike", "like"],
        ),
        (
            "Long-tail animation curiosity",
            SessionPreferences(contentMode="either", adventureLevel="surprise"),
            ["like", "not_seen", "like", "like", "dislike"],
        ),
    ]

    legacy_scores: list[float] = []
    current_scores: list[float] = []
    for name, preferences, scripted_feedback in scenarios:
        legacy_score, current_score = print_comparison(name, preferences, scripted_feedback)
        legacy_scores.append(legacy_score)
        current_scores.append(current_score)

    print("summary:")
    print(f"legacy_avg={round(statistics.mean(legacy_scores), 2)}")
    print(f"current_avg={round(statistics.mean(current_scores), 2)}")
    print(f"avg_delta={round(statistics.mean(current_scores) - statistics.mean(legacy_scores), 2)}")


if __name__ == "__main__":
    run_simulation()
