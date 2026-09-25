# Static data export (for GitHub Pages)

GitHub Pages only serves static files — it cannot run the Postgres
database or the Express backend. Because almost all of the public pages
(`/municipios`, city details, indicators, methodology) only ever *read*
data, this project ships a pre-generated snapshot of that data as JSON
files under `frontend/public/data/`, and a small fetch shim
(`frontend/src/lib/staticApi.js`) that serves those files instead of
hitting `/api/...` when the app runs with no backend attached.

Screens that genuinely need a live backend — prefeitura login, forms,
account admin, the AI assistant — are **not** part of this export. In the
static build they fail with a clear "not available in this static demo"
message instead of hanging, because there is no server to talk to.

## Regenerating the snapshot

Whenever the underlying database changes and you want the static site to
reflect it:

1. Restore `database/*` (or your current DB dump) into a local Postgres
   instance.
2. Start the real backend against it:
   ```
   cd backend
   npm install
   # set PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD/AUTH_SECRET in .env
   node src/server.js
   ```
3. From this folder, point the two scripts at your local backend and the
   frontend's `public/data` folder (edit the `API` / `OUT_DIR` constants
   at the top of each file if your paths differ), then run:
   ```
   node generate.mjs   # queries the backend for every município (~5,600)
   node shrink.js       # de-duplicates indicator metadata across cities
   ```
4. Rebuild the frontend (`cd ../../frontend && npm run build`) or just
   push — the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`
   rebuilds automatically on every push to `main`.

## Performance note

`backend/src/repositories/municipiosRepository.js` was patched to cache
the (expensive, full-table) candidate pool used by
"municípios semelhantes" and "resumo por dimensão" per indicator set,
instead of recomputing it from scratch on every request. Same results,
much faster — this is what makes generating ~5,600 × 15 requests
practical (minutes instead of many hours). It's a safe change to keep
even if you later run the backend live instead of statically.
