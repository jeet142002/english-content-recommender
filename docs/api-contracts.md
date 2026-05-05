# API Contracts

## Recommender API

### `GET /health`

Response:

```json
{
  "ok": true,
  "catalogSize": 15
}
```

### `POST /session/start`

Request:

```json
{
  "contentMode": "either",
  "adventureLevel": "balanced"
}
```

Returns the first title card payload.

### `POST /session/feedback`

Request:

```json
{
  "sessionId": "uuid",
  "titleId": "arrival",
  "value": "like"
}
```

Returns the next title card payload.

### `POST /session/stop`

Request:

```json
{
  "sessionId": "uuid"
}
```

Returns:

- hero recommendation
- backup recommendations
- explanation reasons
- confidence score

## Event schema

Each feedback event should track:

```json
{
  "sessionId": "uuid",
  "titleId": "arrival",
  "value": "like",
  "step": 3,
  "timestamp": "2026-04-28T13:45:00Z"
}
```

## Web API layer

The Next.js app exposes matching `/api/*` route handlers and proxies them to the FastAPI recommender service through `RECOMMENDER_API_BASE_URL`.
