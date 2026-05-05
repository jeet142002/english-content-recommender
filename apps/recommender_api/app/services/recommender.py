from __future__ import annotations

import math
import random
from collections import Counter
from uuid import uuid4

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


WEIGHTS = {"like": 1.0, "dislike": -0.85, "not_seen": 0.0}
TASTE_FEEDBACK_VALUES = {"like", "dislike"}
ADVENTURE_POPULARITY_WEIGHT = {"safe": 0.28, "balanced": 0.12, "surprise": -0.08}
ADVENTURE_FAMILIARITY_WEIGHT = {"safe": 0.25, "balanced": 0.08, "surprise": -0.12}
ADVENTURE_LONGTAIL_BOOST = {"safe": 0.0, "balanced": 0.08, "surprise": 0.22}


def feature_tokens(title: Title) -> list[str]:
    tokens: list[str] = []
    tokens.extend(f"genre:{value.lower()}" for value in title.genres)
    tokens.extend(f"subgenre:{value.lower()}" for value in title.subgenres)
    tokens.extend(f"tone:{value.lower()}" for value in title.tone)
    tokens.extend(f"style:{value.lower()}" for value in title.style)
    tokens.extend(f"cast:{value.lower()}" for value in title.cast[:3])
    if title.director:
        tokens.append(f"director:{title.director.lower()}")
    tokens.extend(f"keyword:{value.lower()}" for value in title.keywords[:4])
    tokens.append(f"kind:{title.kind}")
    tokens.append(f"era:{(title.year // 10) * 10}")
    return tokens


class RecommenderService:
    def __init__(self) -> None:
        self.sessions: dict[str, SessionState] = {}
        self.catalog = load_catalog()

    def start_session(self, preferences: SessionPreferences) -> SessionTitleResponse:
        session_id = str(uuid4())
        state = SessionState(sessionId=session_id, preferences=preferences)
        self.sessions[session_id] = state
        return self.next_title(session_id)

    def get_state(self, session_id: str) -> SessionState:
        state = self.sessions.get(session_id)
        if not state:
            raise KeyError(session_id)
        return state

    def filtered_titles(self, state: SessionState) -> list[Title]:
        return [
            title
            for title in self.catalog
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
        # Pick from top 8 with weighted randomness for variety (biased toward higher scores)
        top_pool = scored[:8] if len(scored) >= 8 else scored
        weights = [max(0.1, (score + 1) * (1 - i * 0.08)) for i, (score, _) in enumerate(top_pool)]
        total = sum(weights)
        probs = [w / total for w in weights]
        selected = random.choices(top_pool, weights=probs, k=1)[0][1]
        title = selected
        state.shownTitleIds.append(title.id)
        state.confidence = self._estimate_confidence(state)
        step = len(state.shownTitleIds)
        return SessionTitleResponse(sessionId=session_id, step=step, confidence=state.confidence, title=title)

    def submit_feedback(self, payload: FeedbackRequest) -> SessionTitleResponse:
        state = self.get_state(payload.sessionId)
        event = SessionEvent(titleId=payload.titleId, value=payload.value, step=len(state.events) + 1)
        state.events.append(event)
        self._update_profile(state, by_id(payload.titleId), payload.value)
        state.confidence = self._estimate_confidence(state)
        return self.next_title(payload.sessionId)

    def stop(self, session_id: str) -> RecommendationResult:
        state = self.get_state(session_id)
        answered_ids = {event.titleId for event in state.events}
        known_rated_ids = {
            event.titleId for event in state.events if event.value in TASTE_FEEDBACK_VALUES
        }
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
                (
                    (self._final_score(state, title), title)
                    for title in self.filtered_titles(state)
                ),
                key=lambda item: item[0],
                reverse=True,
            )
        hero = ranked[0][1]
        backups = [title for _, title in ranked[1:4]]
        confidence = max(state.confidence, min(0.96, 0.35 + len(state.events) * 0.07))
        reasons = self._build_reasons(state, hero)
        summary = (
            f"This pick fits your session because it aligns with {reasons[0].label.lower()} "
            f"while avoiding patterns you pushed away."
        )
        return RecommendationResult(
            sessionId=session_id,
            confidence=round(confidence, 2),
            hero=hero,
            backups=backups,
            reasons=reasons,
            summary=summary,
        )

    def _update_profile(self, state: SessionState, title: Title, value: str) -> None:
        weight = WEIGHTS[value]
        if weight == 0:
            return
        for token in feature_tokens(title):
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

        token_scores = [state.profile.get(token, 0.0) for token in feature_tokens(title)]
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
        polarity = abs(sum(WEIGHTS[event.value] for event in taste_events))
        distinct_tokens = len([value for value in state.profile.values() if abs(value) >= 0.5])
        confidence = 0.22 + min(0.5, len(taste_events) * 0.08) + min(0.18, polarity * 0.06)
        confidence += min(0.1, distinct_tokens * 0.008)
        confidence += min(0.04, not_seen_count * 0.01)
        return round(min(confidence, 0.96), 2)

    def _build_reasons(self, state: SessionState, hero: Title) -> list[RecommendationReason]:
        liked_tokens = [
            token.split(":", 1)[1].replace("_", " ")
            for token, value in sorted(state.profile.items(), key=lambda item: item[1], reverse=True)
            if value > 0
        ][:3]
        disliked_tokens = [
            token.split(":", 1)[1].replace("_", " ")
            for token, value in sorted(state.profile.items(), key=lambda item: item[1])
            if value < 0
        ][:2]
        top_genres = ", ".join(hero.genres[:2]).lower()
        dominant = ", ".join(liked_tokens) if liked_tokens else "high-quality English storytelling"
        avoided = ", ".join(disliked_tokens) if disliked_tokens else "obvious crowd-pleasers"

        liked_events = [event for event in state.events if event.value == "like"]
        cast_counter = Counter(cast for event in liked_events for cast in by_id(event.titleId).cast)
        familiar_faces = [name for name, _ in cast_counter.most_common(2) if name in hero.cast]

        reasons = [
            RecommendationReason(
                label="Your strongest taste signal",
                detail=f"You leaned toward {dominant}, and this {hero.kind} sits directly in that pocket.",
            ),
            RecommendationReason(
                label="Balanced discovery",
                detail=f"It keeps the pull of {top_genres} while avoiding too much of {avoided}.",
            ),
        ]
        if familiar_faces:
            reasons.append(
                RecommendationReason(
                    label="Cast continuity",
                    detail=f"It also preserves actor overlap with {', '.join(familiar_faces)} without repeating a title you already rated.",
                )
            )
        else:
            reasons.append(
                RecommendationReason(
                    label="Fresh but aligned",
                    detail="It offers a slightly fresher edge than your known comfort zone while still matching the tone you rewarded.",
                )
            )
        return reasons


service = RecommenderService()
