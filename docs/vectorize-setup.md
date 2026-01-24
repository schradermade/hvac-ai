# Vectorize Setup

This project uses Cloudflare Vectorize for semantic retrieval.

## 1) Create the index

```bash
wrangler vectorize create hvacops-copilot --dimensions 1536 --metric cosine
```

## 2) Configure the binding

`wrangler.toml`:

```toml
[[vectorize]]
binding = "VECTORIZE_INDEX"
index_name = "hvacops-copilot"
```

If you want to use Vectorize while running `wrangler dev`, add:

```toml
remote = true
```

## 3) Admin token (required for reindex)

Set a token used only for reindexing:

```bash
wrangler secret put VECTORIZE_ADMIN_TOKEN
```

For local dev, add to `.dev.vars`:

```
VECTORIZE_ADMIN_TOKEN=your-token
```

## 4) Reindex job evidence

Run the Worker and seed Vectorize:

```bash
wrangler dev --remote
node scripts/vectorizeSeed.js --tenant=tenant_demo --job=job_demo
```

## 5) Enable metadata filtering (required for tenant/job filters)

Create metadata indexes so Vectorize can filter by tenant and job:

```bash
wrangler vectorize create-metadata-index hvacops-copilot --propertyName tenant_id --type string
wrangler vectorize create-metadata-index hvacops-copilot --propertyName job_id --type string
```

Confirm they exist:

```bash
wrangler vectorize list-metadata-index hvacops-copilot
```

Then reindex:

```bash
node scripts/vectorizeSeed.js --tenant=tenant_demo --job=job_demo
```

The reindex endpoint:

```
POST /api/vectorize/reindex/job/:jobId
```

Headers:

- `x-tenant-id`
- `x-api-key: <VECTORIZE_ADMIN_TOKEN>`

## Notes

- The Worker uses OpenAI embeddings (`text-embedding-3-small`).
- Keep `VECTORIZE_ADMIN_TOKEN` separate from the OpenAI API key.
