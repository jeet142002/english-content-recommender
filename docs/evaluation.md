# Evaluation

## Offline checks

- run deterministic session simulations
- inspect final recommendation confidence
- verify that `not_seen` produces weaker taste movement than `dislike`

## Product checks

- CTA click-through
- average number of ratings before stop
- recommendation acceptance
- catalog coverage
- long-tail exposure

## Local command

```bash
npm run eval:model
```

This executes a scripted session against the recommender engine and prints the resulting hero pick, backups, and reasons.
