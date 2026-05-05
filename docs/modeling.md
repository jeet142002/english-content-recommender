# Modeling Notes

## V1 approach

The local recommender uses a hybrid metadata profile plus a session bandit heuristic.

### Title representation

Each title is encoded through:

- genres and subgenres
- tone and style descriptors
- cast and director overlap
- year bucket
- keywords
- title type: movie or series

These are converted into feature tokens such as `genre:science fiction`, `tone:cerebral`, or `cast:amy adams`.

### Session update semantics

- `like`: strong positive update
- `dislike`: strong negative update
- `not_seen`: weak familiarity-only update

This preserves the core product rule that unfamiliarity is not equivalent to dislike.

### Next-title selection

The questioning loop uses a weighted score made of:

- inferred relevance to the current profile
- expected information gain from a rich metadata title
- familiarity/popularity floor for recognizability
- diversity bonus so the session does not collapse too early

The `adventureLevel` shifts the familiarity and long-tail weights:

- `safe`: more recognizable titles
- `balanced`: moderate discovery
- `surprise`: more long-tail exploration

### Final ranking

The stop-stage ranking blends:

- profile relevance
- quality score
- novelty
- diversity bonus
- a small popularity penalty

This keeps the final answer strong without degenerating into “the biggest mainstream title”.

## Future upgrades

The current implementation is designed to evolve into:

1. learned metadata embeddings trained against public ratings
2. separate heads for preference, familiarity, and stop likelihood
3. debiased offline evaluation from live traffic
4. session-sequence models once real usage logs exist
