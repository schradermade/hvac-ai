# Copilot Dev Flow

Quick commands to run the Job Copilot locally and remotely.

## Local setup

1. Start the Worker:

```bash
wrangler dev
```

2. Apply D1 schema locally:

```bash
wrangler d1 execute hvacops --local --file db/migrations/0001_copilot_core.sql
```

3. Seed local sample data:

```bash
wrangler d1 execute hvacops --local --file db/migrations/0002_seed_copilot_sample.sql
```

4. (Optional) Create Vectorize index (Cloudflare):

```bash
wrangler vectorize create hvacops-copilot --dimensions 1536 --metric cosine
```

## Remote setup (needed for Vectorize)

1. Run Worker remotely for Vectorize:

```bash
wrangler dev --remote
```

2. Apply schema + seed remotely:

```bash
wrangler d1 execute hvacops --remote --file db/migrations/0001_copilot_core.sql
wrangler d1 execute hvacops --remote --file db/migrations/0002_seed_copilot_sample.sql
```

3. Set secrets:

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put VECTORIZE_ADMIN_TOKEN
```

4. Reindex a job into Vectorize:

```bash
node scripts/vectorizeSeed.js --tenant=tenant_demo --job=job_demo
```

## Test endpoints

Context snapshot:

```bash
curl -H "x-tenant-id: tenant_demo" \
  http://localhost:8787/api/jobs/job_demo/ai/context
```

Chat:

```bash
curl -X POST \
  -H "x-tenant-id: tenant_demo" \
  -H "content-type: application/json" \
  -d '{"message":"Any notes about rattling?"}' \
  http://localhost:8787/api/jobs/job_demo/ai/chat
```

Reindex endpoint:

```bash
curl -X POST \
  -H "x-tenant-id: tenant_demo" \
  -H "x-api-key: <VECTORIZE_ADMIN_TOKEN>" \
  http://localhost:8787/api/vectorize/reindex/job/job_demo
```

## Ingestion endpoints

Create client:

```bash
curl -X POST \
  -H "content-type: application/json" \
  -H "x-tenant-id: tenant_demo" \
  -H "x-user-id: user_demo" \
  -d '{"name":"Acme HVAC","type":"commercial","primaryPhone":"555-0100","email":"ops@acme.com"}' \
  http://localhost:8787/api/ingest/clients
```

Create property:

```bash
curl -X POST \
  -H "content-type: application/json" \
  -H "x-tenant-id: tenant_demo" \
  -H "x-user-id: user_demo" \
  -d '{"clientId":"client_demo","addressLine1":"500 Main St","city":"Austin","state":"TX","zip":"78701"}' \
  http://localhost:8787/api/ingest/properties
```

Create job:

```bash
curl -X POST \
  -H "content-type: application/json" \
  -H "x-tenant-id: tenant_demo" \
  -H "x-user-id: user_demo" \
  -d '{"jobType":"maintenance","clientId":"client_demo","propertyId":"property_demo","scheduledAt":"2025-02-10T14:00:00Z","summary":"Seasonal maintenance"}' \
  http://localhost:8787/api/ingest/jobs
```

Create note (triggers reindex):

```bash
curl -X POST \
  -H "content-type: application/json" \
  -H "x-tenant-id: tenant_demo" \
  -H "x-user-id: user_demo" \
  -d '{"entityType":"job","entityId":"job_demo","content":"Customer reports rattling.","jobId":"job_demo"}' \
  http://localhost:8787/api/ingest/notes
```

Notes:

- `x-tenant-id`/`x-user-id` headers only work when `ALLOW_DEV_AUTH=1`.
- For Access/service tokens, use `CF-Access-Client-Id` and `CF-Access-Client-Secret` instead.
