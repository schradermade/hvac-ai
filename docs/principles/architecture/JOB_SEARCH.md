# Job Search (Server-Side Indexed Search)

## Summary

We implemented a server-side, indexed search for Jobs that matches across _all_ job-related data: job fields, client info, property address, equipment identifiers, assigned technician, dates, notes, and job events. The search is exposed via the Jobs API and is designed to scale to thousands of jobs without pushing large datasets to the client.

---

## Problem Statement

The existing Jobs search was client-side and only matched a handful of fields. It failed to return expected results (e.g., when searching notes or address), and it could not scale:

- Notes/events lived on separate tables and were not loaded into the list view.
- Client data (name, phone, address) was only partially present on the job list.
- The search ran after date and scope filters, so matches outside the active window never surfaced.
- With hundreds/thousands of jobs, client-side filtering becomes slow and memory-heavy.

We needed an enterprise-grade, scalable search that returns correct results across every job-related field and remains performant as data grows.

---

## Goals

**Functional goals**

- Search across all job-related content:
  - Job: type, status, summary, scheduled date
  - Client: name, phone, email
  - Property: address, access notes
  - Equipment: type, brand, model, serial
  - Assignment: technician name/email, assignment date
  - Notes and job events: content, issue, resolution, parts
- Support scoped filtering (date ranges, assignment, status, type) alongside search.
- Return results deterministically and efficiently.

**Non-functional goals**

- Scale to thousands of jobs per tenant with minimal latency.
- Keep client light; avoid fetching notes/events per job just to search.
- Maintain security + tenant isolation.
- Keep search index consistent with source-of-truth tables.

---

## Approach Overview

We added a server-side search index and a search-enabled API endpoint. The index is built from job + related entities and queried using FTS (full-text search). This yields fast, ranked, tenant-scoped results, and avoids client-side heavy joins.

Key elements:

1. **Search index table (FTS)**
   - Denormalized, text-only view of job-related content.
   - One row per job, containing a concatenated searchable document.

2. **Write-through indexing**
   - Index updates whenever jobs, notes, or related entities change.
   - Optional background reindex for bulk operations.

3. **Search-aware Jobs API**
   - `/api/jobs?q=...` returns the same Job list response, filtered + ranked by search.
   - Supports query params for date range, status, type, assignee.

4. **Client changes**
   - The Jobs screen sends the search string to the API (debounced).
   - Client no longer filters locally for search; it receives already-matched jobs.

---

## Architecture

### Data Model

We added a search index for jobs. Example conceptual schema:

```
job_search_index
- job_id (PK)
- tenant_id
- content (FTS indexed text)
- updated_at
```

The `content` field is a concatenation of all search-relevant fields:

- Job fields: type, status, summary, scheduled_at
- Client fields: name, phone, email
- Property fields: address, city, state, zip, access notes
- Equipment fields: type, brand, model, serial
- Assignment fields: technician name/email
- Notes + job events: free text content

### Query Flow

```
Client Search Input
    ↓
Jobs API with q=<text>
    ↓
FTS search (tenant scoped)
    ↓
Ranked Job IDs
    ↓
Fetch full job rows
    ↓
Return Job list to client
```

### Indexing Flow

```
Job/Note/Event/Client/Property/Equipment update
    ↓
Search index updater
    ↓
Upsert job_search_index
```

---

## Implementation Details

### 1) Search Index Creation

- Added a D1 table (FTS) for job search.
- Index is tenant-scoped and keyed by job id.

**Why FTS**: SQLite FTS provides fast substring/token matching, ranking, and prefix queries. It’s efficient for text-heavy workloads at this scale.

### 2) Index Population

We build the search document by joining all relevant entities for a job:

- Jobs → Clients (customer name, phone, email)
- Jobs → Properties (address, access notes)
- Jobs → Equipment (model/serial)
- Jobs → Users (assigned technician)
- Jobs → Notes / Job events (free text)

This content is normalized (lowercase, whitespace collapsed) to improve search consistency.

### 3) Search Query

The API accepts `q` as a search term. If `q` is present:

- We query `job_search_index` via FTS and retrieve ranked job IDs.
- We then fetch the full job rows for those IDs.
- We apply existing filters (status/type/date/assigned) after narrowing by search IDs.

### 4) API Contract

The API remains consistent:

```
GET /api/jobs?q=...&status=...&type=...&start=...&end=...

Response:
{
  items: [Job],
  total: number
}
```

This keeps the UI logic simple and backwards compatible.

---

## Scaling Considerations

- **Search happens server-side**: avoids pulling large datasets into the client.
- **FTS index**: O(log n) style search with ranking.
- **Denormalization**: avoids expensive multi-join queries per search.
- **Index updates**: performed on writes or batched async if needed.
- **Tenant isolation**: search queries always scoped by tenant_id.

For larger tenants (10k+ jobs), the index can be sharded by tenant if needed, or expanded to a dedicated search service (e.g., Typesense, Elasticsearch). The current design keeps that migration simple.

---

## Tradeoffs & Rationale

**Why not client-side search?**

- Requires loading notes/events/clients/equipment into the device.
- Increases memory and network usage.
- Non-deterministic results across filters.

**Why not live joins on every query?**

- Complex multi-join queries per keystroke are slow and expensive.
- FTS index reduces query cost and is stable under load.

**Why FTS vs Vector search?**

- This is deterministic keyword search, not semantic matching.
- FTS gives predictable behavior and ranking.
- Vector search remains available for AI copilot separately.

---

## Observability & Debugging

We include lightweight metrics/logging at the API layer:

- Search query length + latency
- Result count
- Fallback behavior if no matches

This helps identify slow queries and empty-result bugs.

---

## Security

- Search is scoped by `tenant_id` at every query.
- No cross-tenant data leakage is possible.
- Only authenticated API calls can execute search.

---

## Future Extensions

- Highlight matched terms in UI (snippet generation)
- Add simple ranking boosts (e.g., status=scheduled, most recent jobs)
- Add synonyms/normalization (e.g., “AC” vs “air conditioner”)
- Support prefix matching for faster type-ahead

---

## Status

Implemented. Use the search reindex endpoint for initial backfills or large data updates.
