# Disaster Response Platform

An agentic disaster-response system: citizens submit emergency reports, an
AI agent triages urgency, retrieves relevant Standard Operating Procedures
via MongoDB Atlas Vector Search, gathers real-time context (weather, similar
past incidents), and drafts a response plan — which a human responder must
approve or reject before anything is considered actionable. Nothing the
agent produces is auto-executed.

Stack: React + Vite + Tailwind (frontend), Node/Express + MongoDB Atlas
(backend), Groq (LLM), local embeddings via `@xenova/transformers` (RAG).

---

## What you need before starting

1. **Node.js 18 or newer** — check with `node -v`. (Needed for native
   `fetch`, used by the weather/geocoding tools.)
2. **A MongoDB Atlas account and cluster** — the free M0 tier works fine.
   You'll need your connection string (Atlas → Database → Connect → Drivers).
3. **A free Groq API key** — sign up at https://console.groq.com/keys
4. *(Optional, the app works without these — the agent just skips the tool
   and says so)*: an OpenWeather API key
   (https://openweathermap.org/api) and an OpenCage geocoding key
   (https://opencagedata.com/api).

Nothing else needs installing manually beyond `npm` — every JS dependency
is installed via the steps below.

---

## First-time setup (do this once)

**1. Unzip the project and open a terminal in its root folder.**

**2. Create your environment files.**

```bash
node scripts/setupDev.js
```

This copies `backend/.env.example` → `backend/.env` and
`frontend/.env.example` → `frontend/.env` for you, and tells you exactly
which values are still missing.

**3. Fill in `backend/.env`.** Open it and set at minimum:
- `MONGODB_URI` — your Atlas connection string. **Check that it has a
  database name in it.** Atlas's own connection dialog often gives you a
  string where the `/` and `?` are touching with nothing between them
  (e.g. `...mongodb.net/?retryWrites=true...`) — that means no database name
  was filled in. If yours looks like that, type a name into that gap
  yourself, e.g. `...mongodb.net/disaster_response?retryWrites=true...`.
  Without this, your data still saves, but it lands in an unnamed default
  database instead of one you'll be able to find later when creating the
  Atlas Vector Search index.
- `GROQ_API_KEY` — your Groq key
- `JWT_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

`frontend/.env` already has a working default (`VITE_API_URL=http://localhost:5000/api`) — you shouldn't need to touch it for local development.

**4. Re-run the check to confirm everything's filled in:**

```bash
node scripts/setupDev.js
```

You should see all checkmarks (✓) with no ✗ marks.

**5. Install all dependencies (root, backend, and frontend in one go):**

```bash
npm run install:all
```

This will take a couple of minutes — it's installing three separate
`node_modules` (root tooling, backend, frontend).

**6. Load the SOP knowledge base:**

```bash
npm run ingest:sops
```

First run downloads a small local embedding model (~90MB, one-time, cached
afterward) and embeds six starter SOPs. **Read the output carefully** — it
prints a JSON block and step-by-step instructions for creating the Atlas
Vector Search index. You need to do this manually in the Atlas UI (it can't
be scripted). The app still works without it — it falls back to keyword
search — but real semantic retrieval needs this index. It takes about 5
minutes total in the Atlas dashboard, and 1-2 minutes to finish building
after you click create.

**7. (Optional but recommended) Seed demo accounts and sample reports:**

```bash
npm run seed
```

Prints three ready-to-use logins (reporter/responder/admin, all password
`password123`) so you don't have to register manually before exploring the app.

**8. Start both servers:**

```bash
npm run dev
```

This runs the backend (port 5000) and frontend (port 5173) together in one
terminal, color-coded. Wait for both to say they're ready, then open:

**http://localhost:5173**

Log in with one of the seeded accounts (or register your own), submit a
report from "New Report", and watch it move through the agent pipeline on
its detail page. Log in as the responder or admin account to see the Agent
Review queue and approve/reject drafted plans.

---

## Every time after the first (regular day-to-day running)

You don't need to repeat steps 1-7 above. Just:

```bash
npm run dev
```

from the project root, then open http://localhost:5173. That's it.

If you ever need to run the backend or frontend independently instead of
together:

```bash
npm run dev:backend    # just the API on :5000
npm run dev:frontend   # just the UI on :5173
```

---

## Common issues

**"MongoDB connection attempt failed"** — Usually one of: (a) your Atlas
cluster is paused (free tier clusters pause after inactivity — resume it in
the Atlas dashboard), (b) your current IP isn't allow-listed under Atlas →
Network Access, or (c) a typo in `MONGODB_URI`.

**Reports get stuck at "submitted" and never classify** — Check the
backend terminal output for a Groq error. Most commonly this is an invalid
or missing `GROQ_API_KEY`. Once fixed, use the "rerun" option from the Agent
Review page (as a responder/admin) instead of resubmitting.

**Vector search seems to return generic/wrong SOPs** — You likely haven't
created the Atlas Vector Search index yet (step 6 above), so it's silently
using the keyword-search fallback. Check the backend terminal for a warning
about this.

**Weather/geocoding context is missing from generated plans** — Expected if
you skipped the optional `OPENWEATHER_API_KEY` / `OPENCAGE_API_KEY` — the
agent notes the tool was unavailable and proceeds without it rather than
failing the whole report.

---

## Project structure and further docs

- `docs/API.md` — full endpoint reference
- `docs/DEPLOYMENT.md` — what changes for a real (non-local) deployment
- `docs/SOP_SAMPLE.md` — how to write good SOP documents for retrieval quality

See the two architecture diagrams you provided for the high-level system
design — the codebase follows that structure directory-for-directory.
