# Copilot Session Notes

Date: 2026-01-21

## What we completed

- **D1 schema + migrations**
  - Added core tables for copilot data: tenants, users, clients, properties, equipment, jobs, job_events, notes.
  - Files:
    - `db/migrations/0001_copilot_core.sql`
    - `db/migrations/0002_seed_copilot_sample.sql`

- **Worker scaffolding**
  - Created Worker entry at `src/worker.ts`.
  - Routes implemented:
    - `GET /api/jobs/:jobId/ai/context`
    - `POST /api/jobs/:jobId/ai/session` (stub)
    - `POST /api/jobs/:jobId/ai/chat` (OpenAI integration)
    - `POST /api/vectorize/reindex/job/:jobId`

- **Job context snapshot**
  - Implemented D1 query helper: `src/server/copilot/jobContext.ts`.

- **Evidence and citations**
  - Added job evidence pipeline with scope expansion:
    - Job-level first, then property-level if sparse, then client-level notes.
  - File: `src/server/copilot/jobEvidence.ts`.

- **OpenAI chat integration**
  - Chat endpoint calls OpenAI and parses JSON output.
  - Uses `gpt-4o-mini` and `text-embedding-3-small`.

- **Vectorize integration**
  - Added Vectorize binding in `wrangler.toml`:
    - `VECTORIZE_INDEX` → `hvacops-copilot`
  - Vectorize query in chat pipeline (optional; gated by binding).
  - Added embeddings + upsert pipeline:
    - `src/server/copilot/indexing.ts`
    - Endpoint: `POST /api/vectorize/reindex/job/:jobId`
    - Script: `scripts/vectorizeSeed.js`

- **Security update**
  - Reindex endpoint secured by `VECTORIZE_ADMIN_TOKEN` (separate from OpenAI key).
  - Doc: `docs/vectorize-setup.md`.

- **Developer docs**
  - `docs/copilot-dev.md` added with step-by-step local/remote setup.

- **Debugging support**
  - Added `x-debug: 1` header support in chat:
    - Returns vectorize enabled state, match count, filters, and unfiltered matches.
  - Added fallback logic: if Vectorize filtered query returns 0, fetch unfiltered and filter locally by tenant/job.

## 2026-01-24 Updates

- **Vectorize filtering fixed**
  - Added metadata indexes for `tenant_id` + `job_id` in Vectorize.
  - Filtered queries now work; fallback remains as safety with warning log.
  - Debug fields show `vectorFilterUsed` and `vectorFilterFallbackUsed`.

- **Production-grade error handling**
  - Added `JobNotFoundError` and returned `404` for missing jobs.
  - Updated `/ai/context`, `/ai/chat`, `/ai/session`, `/vectorize/reindex` to use 404s vs 500s.

- **Cloudflare Access auth**
  - New D1 table: `access_identities` (`db/migrations/0003_access_identities.sql`).
  - Access JWT middleware in `src/server/copilot/auth/access.ts`.
  - Copilot routes now use Access JWT; dev-only fallback behind `ALLOW_DEV_AUTH=1`.
  - Service token support: `common_name` used when `sub` is empty.

- **Cloudflare-first MVP doc**
  - Added `docs/COPILOT_PRODUCTION_MVP.md` with auth architecture + required env vars.

## Current state (verified)

- Browser login (Access OTP) works and returns context JSON.
- Service token access works via `CF-Access-Client-Id` + `CF-Access-Client-Secret`.
- Access identity mapping required in D1 to resolve tenant/user.

## What remains to do (next session)

1. Add `access_identities` seed mapping for real users/tenants.
2. Add UI + API wiring for real data ingestion (jobs/clients/notes).
3. Add rate limiting + observability for production hardening.

## Current state (verified)

- `/ai/chat` returns answers with citations from D1 evidence.
- Vectorize index contains data (confirmed via unfiltered matches).
- Filtered Vectorize query returns 0; fallback retrieves matches.
- Debug output confirms filter mismatch but metadata shows correct tenant/job values.

## What remains to do

1. **Fix Vectorize filter query**
   - Determine correct filter syntax for Cloudflare Vectorize.
   - Remove fallback once filters work.

2. **Add ingestion pipeline for all new notes/events**
   - Decide on a queue-based indexing pipeline (Cloudflare Queues).
   - Trigger reindex on note/job_event updates (not just manual endpoint).

3. **Session persistence**
   - Add tables for ai_sessions + ai_messages (optional D1 logging).
   - Wire session endpoint to store/retrieve session metadata.

4. **Caching**
   - Optional KV cache for job context snapshot (to reduce repeated queries).

5. **UI integration**
   - Tie Worker endpoints to the Jobs “Get AI Help” UI.

## Commands we used today

- Local D1 schema:
  - `wrangler d1 execute hvacops --local --file db/migrations/0001_copilot_core.sql`
  - `wrangler d1 execute hvacops --local --file db/migrations/0002_seed_copilot_sample.sql`

- Remote D1 schema + seed:
  - `wrangler d1 execute hvacops --remote --file db/migrations/0001_copilot_core.sql`
  - `wrangler d1 execute hvacops --remote --file db/migrations/0002_seed_copilot_sample.sql`

- Vectorize index:
  - `wrangler vectorize create hvacops-copilot --dimensions 1536 --metric cosine`

- Start Worker:
  - `wrangler dev --remote`

- Seed Vectorize:
  - `node scripts/vectorizeSeed.js --tenant=tenant_demo --job=job_demo`

- Test chat:
  - `curl -X POST -H "x-tenant-id: tenant_demo" -H "content-type: application/json" -d '{"message":"Any notes about rattling?"}' http://localhost:8787/api/jobs/job_demo/ai/chat`

- Debug chat:
  - `curl -X POST -H "x-tenant-id: tenant_demo" -H "content-type: application/json" -H "x-debug: 1" -d '{"message":"Any notes about rattling?"}' http://localhost:8787/api/jobs/job_demo/ai/chat`

## Open questions

- Confirm correct Vectorize filter syntax for metadata fields (tenant_id, job_id).
- Should Vectorize results include property/client scope (same rules as evidence)?
- Should chat logs be persisted in D1 or stored in R2?
