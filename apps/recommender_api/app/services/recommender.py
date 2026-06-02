from __future__ import annotations

import math
import random
from collections import Counter
from functools import lru_cache
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

from apps.recommender_api.app.services.catalog import by_id, get_catalog_snapshot, load_catalog
from apps.recommender_api.app.services.session_store import SqliteSessionStore


WEIGHTS = {"like": 1.0, "dislike": -0.85, "not_seen": 0.0}
TASTE_FEEDBACK_VALUES = {"like", "dislike"}
FAMILIARITY_WEIGHTS = {"like": 0.45, "dislike": 0.3, "not_seen": -0.35}
ADVENTURE_POPULARITY_WEIGHT = {"safe": 0.28, "balanced": 0.12, "surprise": -0.08}
ADVENTURE_FAMILIARITY_WEIGHT = {"safe": 0.25, "balanced": 0.08, "surprise": -0.12}
ADVENTURE_LONGTAIL_BOOST = {"safe": 0.0, "balanced": 0.08, "surprise": 0.22}
QUESTION_FAMILIARITY_ALIGNMENT_WEIGHT = {"safe": 0.22, "balanced": 0.08, "surprise": -0.12}
FINAL_FAMILIARITY_ALIGNMENT_WEIGHT = {"safe": 0.14, "balanced": 0.04, "surprise": -0.08}
ADVENTURE_RELIABILITY_WEIGHT = {"safe": 0.2, "balanced": 0.12, "surprise": 0.05}
FEATURE_GROUP_WEIGHTS = {
    "genre": 1.35,
    "subgenre": 0.85,
    "tone": 1.1,
    "style": 0.95,
    "editorial": 1.05,
    "cast": 0.55,
    "director": 0.5,
    "keyword": 0.45,
    "kind": 0.7,
    "era": 0.35,
}
MAX_REASON_TOKENS = 3
REASON_GROUPS = {"genre", "subgenre", "tone", "style", "editorial", "cast", "director", "keyword"}
NEIGHBORHOOD_QUESTION_WEIGHT = 0.17
NEIGHBORHOOD_FINAL_WEIGHT = 0.24
NEIGHBORHOOD_REDUNDANCY_PENALTY = 0.08
MAX_NEIGHBORS_PER_TITLE = 18


def feature_tokens(title: Title) -> list[tuple[str, str]]:
    tokens: list[tuple[str, str]] = []
    tokens.extend(("genre", f"genre:{value.lower()}") for value in title.genres)
    tokens.extend(("subgenre", f"subgenre:{value.lower()}") for value in title.subgenres)
    tokens.extend(("tone", f"tone:{value.lower()}") for value in title.tone)
    tokens.extend(("style", f"style:{value.lower()}") for value in title.style)
    tokens.extend(("editorial", f"editorial:{value.lower()}") for value in title.editorialTags[:5])
    tokens.extend(("cast", f"cast:{value.lower()}") for value in title.cast[:3])
    if title.director:
        tokens.append(("director", f"director:{title.director.lower()}"))
    tokens.extend(("keyword", f"keyword:{value.lower()}") for value in title.keywords[:4])
    tokens.append(("kind", f"kind:{title.kind}"))
    tokens.append(("era", f"era:{(title.year // 10) * 10}"))
    return tokens


class RecommenderService:
    def __init__(
        self,
        session_store: SqliteSessionStore | None = None,
        rng: random.Random | None = None,
    ) -> None:
        self.session_store = session_store or SqliteSessionStore.from_env()
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
        # Pick from top 8 with weighted randomness for variety (biased toward higher scores)
        top_pool = scored[:8] if len(scored) >= 8 else scored
        weights = [max(0.1, (score + 1) * (1 - i * 0.08)) for i, (score, _) in enumerate(top_pool)]
        total = sum(weights)
        probs = [w / total for w in weights]
        selected = self.rng.choices(top_pool, weights=probs, k=1)[0][1]
        title = selected
        state.shownTitleIds.append(title.id)
        state.confidence = self._estimate_confidence(state)
        self.session_store.save(state)
        step = len(state.shownTitleIds)
        return SessionTitleResponse(sessionId=session_id, step=step, confidence=state.confidence, title=title)

    def submit_feedback(self, payload: FeedbackRequest) -> SessionTitleResponse:
        state = self.get_state(payload.sessionId)
        event = SessionEvent(titleId=payload.titleId, value=payload.value, step=len(state.events) + 1)
        state.events.append(event)
        self._update_profile(state, by_id(payload.titleId), payload.value)
        state.confidence = self._estimate_confidence(state)
        self.session_store.save(state)
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
        familiarity_weight = FAMILIARITY_WEIGHTS[value]
        for group, token in feature_tokens(title):
            feature_weight = self._feature_weight(group, token)
            if weight != 0:
                state.profile[token] = state.profile.get(token, 0.0) + weight * feature_weight
            if familiarity_weight != 0:
                state.familiarityProfile[token] = (
                    state.familiarityProfile.get(token, 0.0) + familiarity_weight * feature_weight
                )

    def _question_score(self, state: SessionState, title: Title) -> float:
        relevance = self._profile_similarity(state, title)
        uncertainty = self._uncertainty_score(state, title)
        information_gain = self._information_gain(state, title)
        familiarity_alignment = self._familiarity_alignment(state, title)
        neighborhood_signal = self._neighborhood_preference(state, title)
        familiarity = title.familiarity / 100
        popularity = title.popularity / 100
        quality = title.qualityScore / 100
        reliability = self._reliability_score(title)
        long_tail = max(0.0, 1 - popularity)
        redundancy_penalty = self._redundancy_penalty(state, title)

        score = relevance * 0.34 + self._adjusted_quality(title) * 0.2 + uncertainty * 0.18 + information_gain * 0.14
        score += popularity * ADVENTURE_POPULARITY_WEIGHT[state.preferences.adventureLevel]
        score += familiarity * ADVENTURE_FAMILIARITY_WEIGHT[state.preferences.adventureLevel]
        score += long_tail * ADVENTURE_LONGTAIL_BOOST[state.preferences.adventureLevel]
        score += familiarity_alignment * QUESTION_FAMILIARITY_ALIGNMENT_WEIGHT[state.preferences.adventureLevel]
        score += reliability * ADVENTURE_RELIABILITY_WEIGHT[state.preferences.adventureLevel]
        score += neighborhood_signal * NEIGHBORHOOD_QUESTION_WEIGHT
        score -= self._low_support_penalty(title) * 0.12
        score += self._diversity_bonus(state, title)
        score -= redundancy_penalty * 0.18
        return score

    def _final_score(self, state: SessionState, title: Title) -> float:
        relevance = self._profile_similarity(state, title)
        adjusted_quality = self._adjusted_quality(title)
        popularity = title.popularity / 100
        novelty = 1 - (title.familiarity / 100)
        diversity = self._diversity_bonus(state, title)
        familiarity_alignment = self._familiarity_alignment(state, title)
        neighborhood_signal = self._neighborhood_preference(state, title)
        reliability = self._reliability_score(title)
        redundancy_penalty = self._redundancy_penalty(state, title)
        return (
            relevance * 0.56
            + adjusted_quality * 0.24
            + novelty * 0.1
            + diversity * 0.1
            + familiarity_alignment * FINAL_FAMILIARITY_ALIGNMENT_WEIGHT[state.preferences.adventureLevel]
            + reliability * ADVENTURE_RELIABILITY_WEIGHT[state.preferences.adventureLevel]
            + neighborhood_signal * NEIGHBORHOOD_FINAL_WEIGHT
            - popularity * 0.05
            - self._low_support_penalty(title) * 0.16
            - redundancy_penalty * 0.12
        )

    def _profile_similarity(self, state: SessionState, title: Title) -> float:
        if not state.profile:
            base = title.qualityScore / 100
            if state.preferences.contentMode != "either" and title.kind == state.preferences.contentMode:
                base += 0.08
            return base

        raw = self._weighted_profile_average(state.profile, title)
        return 0.5 + math.tanh(raw) * 0.5

    def _diversity_bonus(self, state: SessionState, title: Title) -> float:
        taste_events = [event for event in state.events if event.value in TASTE_FEEDBACK_VALUES]
        if not taste_events:
            return 0.0
        seen_titles = [by_id(event.titleId) for event in taste_events]
        seen_genres = {genre for item in seen_titles for genre in item.genres}
        overlap = len(seen_genres.intersection(title.genres))
        liked_titles = [by_id(event.titleId) for event in taste_events if event.value == "like"]
        recent_similarity = max(
            (self._title_similarity(title, seen_title) for seen_title in liked_titles[-3:]),
            default=0.0,
        )
        genre_bonus = max(0.0, 0.18 - overlap * 0.03)
        return max(0.0, genre_bonus + (0.08 if recent_similarity < 0.35 else 0.0))

    def _estimate_confidence(self, state: SessionState) -> float:
        if not state.events:
            return 0.16
        taste_events = [event for event in state.events if event.value in TASTE_FEEDBACK_VALUES]
        not_seen_count = len(state.events) - len(taste_events)
        if not taste_events:
            return round(min(0.24, 0.16 + not_seen_count * 0.015), 2)
        polarity = abs(sum(WEIGHTS[event.value] for event in taste_events))
        distinct_tokens = len([value for value in state.profile.values() if abs(value) >= 0.65])
        familiarity_tokens = len([value for value in state.familiarityProfile.values() if abs(value) >= 0.4])
        confidence = 0.22 + min(0.5, len(taste_events) * 0.08) + min(0.18, polarity * 0.06)
        confidence += min(0.1, distinct_tokens * 0.008)
        confidence += min(0.04, not_seen_count * 0.01)
        confidence += min(0.04, familiarity_tokens * 0.004)
        return round(min(confidence, 0.96), 2)

    def _build_reasons(self, state: SessionState, hero: Title) -> list[RecommendationReason]:
        hero_feature_tokens = {
            token for group, token in feature_tokens(hero) if group in REASON_GROUPS
        }
        liked_tokens = [
            token.split(":", 1)[1].replace("_", " ")
            for token, value in sorted(state.profile.items(), key=lambda item: item[1], reverse=True)
            if value > 0 and token in hero_feature_tokens
        ][:MAX_REASON_TOKENS]
        disliked_tokens = [
            token.split(":", 1)[1].replace("_", " ")
            for token, value in sorted(state.profile.items(), key=lambda item: item[1])
            if value < 0 and token.split(":", 1)[0] in REASON_GROUPS
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
            familiarity_alignment = self._familiarity_alignment(state, hero)
            freshness_line = (
                "It stays close to the kind of titles you already seem to know."
                if familiarity_alignment >= 0
                else "It pushes a little beyond the titles you already know, without drifting away from your taste."
            )
            reasons.append(
                RecommendationReason(
                    label="Fresh but aligned",
                    detail=f"{freshness_line} It still matches the tone and genre signals you rewarded.",
                )
            )
        return reasons

    def _feature_weight(self, group: str, token: str) -> float:
        return FEATURE_GROUP_WEIGHTS[group] * self._token_idf(token)

    def _weighted_profile_average(self, profile: dict[str, float], title: Title) -> float:
        weighted_sum = 0.0
        total_weight = 0.0
        for group, token in feature_tokens(title):
            feature_weight = self._feature_weight(group, token)
            weighted_sum += profile.get(token, 0.0)
            total_weight += feature_weight
        if total_weight == 0:
            return 0.0
        return weighted_sum / total_weight

    def _familiarity_alignment(self, state: SessionState, title: Title) -> float:
        if not state.familiarityProfile:
            return 0.0
        return max(-1.0, min(1.0, self._weighted_profile_average(state.familiarityProfile, title)))

    def _information_gain(self, state: SessionState, title: Title) -> float:
        features = feature_tokens(title)
        if not features:
            return 0.0
        explored = sum(
            1
            for _, token in features
            if token in state.profile or token in state.familiarityProfile
        )
        rare_signal = sum(self._token_idf(token) for _, token in features) / len(features)
        unexplored_ratio = 1 - (explored / len(features))
        return max(0.0, min(1.0, unexplored_ratio * 0.65 + (rare_signal - 1.0) * 0.25 + 0.2))

    def _uncertainty_score(self, state: SessionState, title: Title) -> float:
        if not state.profile:
            return 0.55
        raw = self._weighted_profile_average(state.profile, title)
        return max(0.0, 1 - min(1.0, abs(raw) / 1.4))

    def _redundancy_penalty(self, state: SessionState, title: Title) -> float:
        recent_ids = state.shownTitleIds[-4:]
        recent_titles = [by_id(title_id) for title_id in recent_ids if title_id != title.id]
        recent_similarity = max((self._title_similarity(title, candidate) for candidate in recent_titles), default=0.0)
        neighborhood_overlap = self._neighbor_overlap(state, title)
        return min(1.0, recent_similarity + neighborhood_overlap * NEIGHBORHOOD_REDUNDANCY_PENALTY)

    def _title_similarity(self, left: Title, right: Title) -> float:
        left_weights = {token: self._feature_weight(group, token) for group, token in feature_tokens(left)}
        right_weights = {token: self._feature_weight(group, token) for group, token in feature_tokens(right)}
        overlap = sum(min(left_weights[token], right_weights[token]) for token in left_weights.keys() & right_weights.keys())
        union = sum(left_weights.values()) + sum(right_weights.values()) - overlap
        if union <= 0:
            return 0.0
        return overlap / union

    def _token_idf(self, token: str) -> float:
        return token_idf_lookup().get(token, 1.0)

    def _reliability_score(self, title: Title) -> float:
        familiarity = math.sqrt(max(0.0, title.familiarity / 100))
        popularity = math.sqrt(max(0.0, title.popularity / 100))
        trust_score = title.trustScore or 0.0
        return min(1.0, 0.12 + familiarity * 0.44 + popularity * 0.2 + trust_score * 0.32)

    def _adjusted_quality(self, title: Title) -> float:
        base_quality = title.qualityScore / 100
        reliability = self._reliability_score(title)
        return base_quality * (0.68 + reliability * 0.32)

    def _low_support_penalty(self, title: Title) -> float:
        quality = title.qualityScore / 100
        familiarity = title.familiarity / 100
        trust_gap = max(0.0, 0.58 - (title.trustScore or 0.0))
        if quality < 0.88 or familiarity >= 0.2:
            return trust_gap * 0.3
        return (quality - 0.88) * (0.2 - familiarity) * 6 + trust_gap * 0.45

    def _neighborhood_preference(self, state: SessionState, title: Title) -> float:
        rated_events = [event for event in state.events if event.value in TASTE_FEEDBACK_VALUES]
        if not rated_events:
            return 0.0

        contributions: list[float] = []
        for event in rated_events[-5:]:
            similarity = self._cached_title_similarity(title.id, event.titleId)
            if similarity <= 0:
                continue
            direction = 1.0 if event.value == "like" else -0.8
            recency_weight = 1.0 - max(0, len(rated_events) - event.step) * 0.08
            contributions.append(similarity * direction * max(0.55, recency_weight))

        if not contributions:
            return 0.0
        return max(-1.0, min(1.0, sum(contributions) / len(contributions)))

    def _neighbor_overlap(self, state: SessionState, title: Title) -> float:
        liked_ids = [event.titleId for event in state.events if event.value == "like"]
        if not liked_ids:
            return 0.0
        candidate_neighbors = {neighbor_id for neighbor_id, _ in title_neighbor_lookup().get(title.id, [])[:8]}
        if not candidate_neighbors:
            return 0.0
        overlap_count = 0
        for liked_id in liked_ids[-3:]:
            liked_neighbors = {neighbor_id for neighbor_id, _ in title_neighbor_lookup().get(liked_id, [])[:8]}
            overlap_count += len(candidate_neighbors.intersection(liked_neighbors))
        return min(1.0, overlap_count / 8)

    def _cached_title_similarity(self, left_id: str, right_id: str) -> float:
        if left_id == right_id:
            return 1.0
        return title_similarity_lookup().get(_pair_key(left_id, right_id), 0.0)


service = RecommenderService()


@lru_cache(maxsize=4)
def token_idf_lookup(
    source_path: str | None = None,
    file_modified_at: float | None = None,
    catalog_size: int | None = None,
) -> dict[str, float]:
    if source_path is None or file_modified_at is None or catalog_size is None:
        snapshot = get_catalog_snapshot()
        return token_idf_lookup(
            str(snapshot.source_path),
            snapshot.file_modified_at,
            len(snapshot.titles),
        )

    del source_path, file_modified_at
    snapshot = get_catalog_snapshot()
    document_frequency: Counter[str] = Counter()
    for title in snapshot.titles:
        document_frequency.update({token for _, token in feature_tokens(title)})

    total_titles = max(1, catalog_size)
    lookup: dict[str, float] = {}
    for token, frequency in document_frequency.items():
        raw_idf = math.log((1 + total_titles) / (1 + frequency)) + 1
        lookup[token] = round(min(1.8, max(0.7, raw_idf)), 4)
    return lookup


@lru_cache(maxsize=4)
def title_similarity_lookup(
    source_path: str | None = None,
    file_modified_at: float | None = None,
    catalog_size: int | None = None,
) -> dict[tuple[str, str], float]:
    if source_path is None or file_modified_at is None or catalog_size is None:
        snapshot = get_catalog_snapshot()
        return title_similarity_lookup(
            str(snapshot.source_path),
            snapshot.file_modified_at,
            len(snapshot.titles),
        )

    del source_path, file_modified_at, catalog_size
    snapshot = get_catalog_snapshot()
    title_weights = {
        title.id: {token: FEATURE_GROUP_WEIGHTS[group] * token_idf_lookup().get(token, 1.0) for group, token in feature_tokens(title)}
        for title in snapshot.titles
    }

    lookup: dict[tuple[str, str], float] = {}
    titles = snapshot.titles
    for index, left in enumerate(titles):
        left_weights = title_weights[left.id]
        for right in titles[index + 1 :]:
            right_weights = title_weights[right.id]
            overlap = sum(
                min(left_weights[token], right_weights[token])
                for token in left_weights.keys() & right_weights.keys()
            )
            if overlap <= 0:
                continue
            union = sum(left_weights.values()) + sum(right_weights.values()) - overlap
            if union <= 0:
                continue
            similarity = round(overlap / union, 4)
            if similarity >= 0.08:
                lookup[_pair_key(left.id, right.id)] = similarity
    return lookup


@lru_cache(maxsize=4)
def title_neighbor_lookup(
    source_path: str | None = None,
    file_modified_at: float | None = None,
    catalog_size: int | None = None,
) -> dict[str, list[tuple[str, float]]]:
    if source_path is None or file_modified_at is None or catalog_size is None:
        snapshot = get_catalog_snapshot()
        return title_neighbor_lookup(
            str(snapshot.source_path),
            snapshot.file_modified_at,
            len(snapshot.titles),
        )

    del source_path, file_modified_at, catalog_size
    snapshot = get_catalog_snapshot()
    neighbors: dict[str, list[tuple[str, float]]] = {title.id: [] for title in snapshot.titles}
    for (left_id, right_id), similarity in title_similarity_lookup().items():
        neighbors[left_id].append((right_id, similarity))
        neighbors[right_id].append((left_id, similarity))

    return {
        title_id: sorted(items, key=lambda item: item[1], reverse=True)[:MAX_NEIGHBORS_PER_TITLE]
        for title_id, items in neighbors.items()
    }


def _pair_key(left_id: str, right_id: str) -> tuple[str, str]:
    return (left_id, right_id) if left_id < right_id else (right_id, left_id)
