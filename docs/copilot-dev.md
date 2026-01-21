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
