# Deployment Notes

This project ships configured for local development. This doc covers what
changes for a real deployment — it's guidance, not a fully automated deploy
script, since your hosting choice (Render, Railway, Vercel, a VPS, etc.)
changes the specifics.

## Environment variables to change for production

In `backend/.env`:
- `NODE_ENV=production`
- `JWT_SECRET` — use a freshly generated secret, never reuse the dev one
- `CLIENT_URL` — set to your deployed frontend's real URL (CORS will reject
  requests from any other origin otherwise)
- `MONGODB_URI` — point at a production Atlas cluster, not a shared dev one
- Confirm your production server's IP (or `0.0.0.0/0` if using a
  serverless/dynamic-IP host) is allow-listed in Atlas Network Access

In `frontend/.env` (or your host's env var UI):
- `VITE_API_URL` — set to your deployed backend's real URL

## Backend

The backend is a standard Express app (`backend/server.js`) with no
platform-specific code, so it runs on most Node hosts as-is:

```bash
cd backend
npm install --production
npm start
```

Things to configure on whatever host you use:
- Node version ≥ 18 (uses native `fetch`, used by WeatherTool/GeocodingTool)
- Process manager (pm2, or your host's built-in one) for auto-restart on crash
- Reverse proxy / TLS termination if not handled by your host automatically

## Frontend

Build a static bundle and serve it from any static host (Vercel, Netlify,
S3+CloudFront, nginx, etc.):

```bash
cd frontend
npm install
npm run build
```

This outputs to `frontend/dist/` — deploy that directory. If your host needs
a rewrite rule for client-side routing (since this uses React Router), route
all paths to `index.html`.

## MongoDB Atlas Vector Search index in production

Before creating the index, confirm your `MONGODB_URI` actually names a
database. Atlas's own "Connect" dialog often gives you a URI like:

```
mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
```

Notice the `/` and `?` are touching — there's no database name between them.
If yours looks like that, Mongoose will silently connect to a default
database (usually one named `test`) instead of a database you'd recognize,
and later when Atlas asks you to pick a database while creating the vector
index, the one you expect won't show up with any collections in it.

Fix it by typing a name into that gap yourself:

```
mongodb+srv://user:pass@cluster.mongodb.net/disaster_response?retryWrites=true&w=majority
```

Any name works as long as it's consistent — `disaster_response` is just
what `backend/.env.example` uses by default. Update `MONGODB_URI` in
`backend/.env` with the name filled in before running `npm run ingest:sops`,
so the `sops` collection ends up in the database you'll actually select in
the Atlas UI.

The vector index you create via the Atlas UI (see `scripts/ingestSOPs.js`
output) is tied to a specific cluster and database, not to your codebase. If
you spin up a separate production cluster, you need to re-create the index
there too — it does not carry over automatically. Re-run `npm run ingest:sops`
against the production `MONGODB_URI` to both seed the SOP data and get the
index JSON printed again.

## What this project does NOT include

Being upfront about scope so you don't assume it's handled:
- No CI/CD pipeline
- No Docker setup
- No automated database backups
- No monitoring/alerting integration (logs go to console via Winston only)
- No horizontal scaling considerations for the agent pipeline (it runs
  in-process on whatever server handles the request)

These are reasonable things to add before this becomes a real production
service handling actual emergencies — this project is scoped as a functional
demo/learning build, not a hardened production system.
