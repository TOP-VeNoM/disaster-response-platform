# API Reference

Base URL (development): `http://localhost:5000/api`

All endpoints except `/health`, `/auth/register`, and `/auth/login` require a
`Authorization: Bearer <token>` header, where `<token>` is returned from
register/login.

---

## Auth

### `POST /auth/register`
Body: `{ name, email, password, role? }` — `role` is one of `reporter` (default),
`responder`, `admin`.
Returns: `{ token, user }`

### `POST /auth/login`
Body: `{ email, password }`
Returns: `{ token, user }`

### `GET /auth/me`
Returns the currently authenticated user: `{ user }`

---

## Reports

### `POST /reports`
Creates a report and kicks off the agent pipeline in the background (the
response returns immediately; you don't wait for the agent to finish).
Body: `{ description, disasterType, location: { address?, lat?, lng? } }`
Returns: `{ report }` (status will be `submitted` initially, then flips to
`processing` moments later — poll `GET /reports/:id` to watch it progress)

### `GET /reports`
Query params: `status?, disasterType?, urgency?, page?, limit?`
Reporters only see their own reports; responders/admins see all.
Returns: `{ reports, total, page, pages }`

### `GET /reports/:id`
Returns a single report with reporter/reviewer populated: `{ report }`

### `GET /reports/:id/timeline`
Returns the agent's step-by-step action log for this report: `{ actions }`

---

## Agent

All routes below require `responder` or `admin` role except `GET /agent/:reportId/timeline`,
which any authenticated user can view.

### `GET /agent/pending`
Lists all reports currently at `awaiting_review` status, sorted by urgency.
Returns: `{ reports }`

### `GET /agent/:reportId/timeline`
Same data as `GET /reports/:id/timeline`, exposed here too for convenience.

### `POST /agent/:reportId/approve`
Body: `{ notes? }`
Moves the report to `approved` and records who reviewed it.

### `POST /agent/:reportId/reject`
Body: `{ notes? }`
Moves the report to `rejected` and records who reviewed it.

### `POST /agent/:reportId/rerun`
Re-triggers the full agent pipeline for a report — useful if it's stuck at
`submitted` after a transient failure (e.g. the LLM call timed out).

---

## SOPs

### `GET /sops`
Query params: `disasterType?`
Returns: `{ sops }` (embeddings are never included in list/get responses)

### `GET /sops/:id`
Returns: `{ sop }`

### `POST /sops` — admin only
Adds a new SOP, embeds it, and stores it. Body: `{ title, disasterType, content, steps? }`
Returns: `{ sop }`

### `DELETE /sops/:id` — admin only

### `POST /sops/test-retrieval` — responder/admin only
Runs a query through the same retriever the agent uses, without submitting a
full report. Useful for tuning the SOP corpus.
Body: `{ query, disasterType?, topK? }`
Returns: `{ results }`

---

## Errors

All errors return `{ error: "message" }` with an appropriate HTTP status code
(400 validation, 401 auth, 404 not found, 502 external service failure, 500
unexpected). In development mode, 500-level errors also include a `stack` field.
