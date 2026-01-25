# HVACOps — Job Copilot (AI Help) Architecture (Cloudflare-first)

This document describes a production-grade, Cloudflare-centric design for an **LLM-powered “Get AI Help” chat** inside the **Jobs** view of HVACOps.

The goal is a **job-scoped AI copilot** that can answer questions like:

- “When was the last time the client replaced the furnace filter?”
- “When was this AC installed, and who did the install?”
- “Any repeat issues with this unit?”
- “Summarize the service history for me”
- “What should I check first based on past problems?”

…and later, deeper technical questions grounded in manuals/specs.

---

## 1) Product Goal: A Job-Scoped AI Copilot

When a technician is inside a specific Job and opens **Get AI Help**, the assistant should behave like:

> “I know this client, this job, this equipment, and the full service history. Ask me anything about THIS job.”

Key properties:

- **Context-aware** (job/client/equipment scoped)
- **Grounded** (answers based on HVACOps data + retrieved notes/manuals)
- **Trustworthy** (citations, and honest “not found” responses)
- **Fast** (mobile-friendly performance)
- **Secure** (tenant isolation, PII controls, audit logging)

---

## 2) Cloudflare-First System Overview

### Primary Cloudflare components

- **Cloudflare Workers**: API + orchestration (chat, context building, retrieval)
  - Example: when a tech asks “Any repeat issues?”, the Worker loads job facts from D1, retrieves notes from Vectorize, and calls the LLM.
- **Cloudflare D1**: relational system-of-record (jobs, clients, equipment, visits)
  - Example: the job’s client, property, and equipment details come straight from D1 tables.
- **Cloudflare Vectorize**: embeddings / semantic retrieval for notes + history + manuals
  - Example: “filter replacement” pulls the most relevant past notes across job history.
- **Cloudflare R2**: file storage (photos, PDFs/manuals, attachments, transcripts)
  - Example: service manuals and photo attachments live in R2 and are linked by IDs in D1.
- **Cloudflare Queues**: async indexing pipelines (new notes → embed → upsert)
  - Example: a new tech note triggers a queue job to embed and upsert into Vectorize.
- **Cloudflare Durable Objects**: optional chat session state, rate-limit, streaming coordination
  - Example: a DO tracks a single live session so multiple messages stream in order.
- **Workers KV**: low-latency caching of “job context snapshots” (optional)
  - Example: cache the latest job summary so the first AI response is instant.
- **Cloudflare AI Gateway**: model routing, logging, retries, caching for LLM calls
  - Example: route calls to the chosen LLM, log tokens/cost, and retry on failures.
- **Cloudflare Access / Zero Trust** (optional): internal admin routes, back-office tooling
  - Example: only admins can view audit logs or run re-indexing tools.
- **Workers Analytics Engine** (optional): request telemetry + feature analytics
  - Example: track how many AI sessions start per day and completion rates.
- **R2 Lifecycle Rules** (optional): retention + auto-expire long chat transcripts
  - Example: auto-delete transcripts after 90 days unless legal hold is enabled.

> You can run the full experience in Workers. D1 for structured data, Vectorize for semantic retrieval, R2 for binaries, and AI Gateway for safe LLM operations.

### Cloudflare Product Mapping (Requirements → Services)

- **API + orchestration** → Workers
- **Relational data** → D1
- **Semantic retrieval** → Vectorize
- **File storage (manuals/photos/transcripts)** → R2
- **Async pipelines** → Queues
- **Chat session state** → Durable Objects (optional)
- **Low-latency caching** → Workers KV / Cache API
- **LLM routing + safety** → AI Gateway
- **Feature analytics** → Analytics Engine
- **Admin access controls** → Cloudflare Access / Zero Trust

---

## 3) Data Model (D1)

Model the domain in a way that cleanly supports “job-scoped answers.”

### Core tables (minimum viable)

- `tenants`
- `users` (techs, office staff)
- `clients` (customer/company)
- `properties` (service locations; address, geo, access notes)
- `jobs` (scheduled visit/work order)
- `equipment` (per property; brand/model/serial/install info)
- `job_events` (service history entries; issues, resolutions)
- `notes` (tech notes, office notes, call notes; unstructured)
- `install_records` (optional; can be part of job_events)
- `invoices` / `payments` (optional for AI context)

### Suggested fields (examples)

**clients**

- `id`, `tenant_id`
- `name`, `type` (residential/commercial)
- `primary_phone`, `email`
- `tags` (json), `created_at`

**properties**

- `id`, `tenant_id`, `client_id`
- `address_line1`, `city`, `state`, `zip`
- `lat`, `lng` (optional)
- `access_notes` (text)
- `created_at`

**equipment**

- `id`, `tenant_id`, `property_id`
- `type` (furnace/heat_pump/rtu/etc)
- `brand`, `model`, `serial`
- `installed_at` (date), `installed_by` (company/user)
- `warranty_expires_at` (date)
- `metadata` (json) — tonnage, refrigerant, filter size, etc.

**jobs**

- `id`, `tenant_id`, `property_id`, `client_id`
- `job_type` (no_cooling/maintenance/installation/etc)
- `scheduled_at`, `status`
- `assigned_user_id`
- `summary` (text)
- `created_at`

**job_events** (service history)

- `id`, `tenant_id`
- `job_id`, `property_id`, `client_id`
- `equipment_id` (nullable)
- `event_type` (diagnosis/repair/maintenance/install)
- `issue`, `resolution`, `parts_used` (json)
- `created_at`

**notes**

- `id`, `tenant_id`
- `entity_type` (job/client/property/equipment)
- `entity_id`
- `note_type` (tech/office/call)
- `content` (text)
- `author_user_id`
- `idempotency_key` (optional; prevents duplicate note inserts on retries)
- `created_at`

---

## 4) “AI Help” Chat: Request Flow

### High-level flow

1. Tech opens a Job → taps **Get AI Help**
2. App creates/joins a single ongoing chat session per job/user (no new chat creation)
3. Tech asks a question
4. Backend:
   - loads structured job context
   - retrieves relevant unstructured chunks (Vectorize)
   - builds a grounded prompt
   - calls LLM via AI Gateway
   - returns answer + citations + optionally “suggested follow-ups”

### API endpoints (Workers)

- `POST /api/jobs/:jobId/ai/session`
  - Creates or returns the single ongoing AI session for this job/user
- `POST /api/jobs/:jobId/ai/chat`
  - Accepts message, returns AI response (streaming recommended)
- `POST /api/jobs/:jobId/ai/feedback`
  - Stores thumbs up/down + notes (improves prompts + retrieval)

> Use SSE streaming or chunked responses for a good mobile UX.

---

## 4.1) Follow-Up Visits (Return Jobs)

When a customer calls back after a job is completed, create a **new follow-up job** rather than reopening the original. This preserves clean timelines for audit, scheduling, and billing.

Guidelines:

- Create a new job with `related_job_id` pointing to the original.
- Mark billing as **no‑charge** or **warranty/return visit** if applicable.
- Keep the original job and its chat immutable once completed.
- The follow-up job gets its own single chat (per-job rule).
- UI can link to prior job chats for context (“View prior chat”).

This approach keeps audit history clear while still supporting free return visits.

---

## 5) Context Strategy: Hybrid (Structured + Semantic RAG)

Do **not** dump everything into the prompt. Use a two-layer approach:

### Layer A: Structured “Facts” (always included)

This includes:

- Job metadata (type, scheduled, status)
- Client + property basics
- Equipment inventory summary (install dates, models, serials, warranty)
- Key “recent history” summary (e.g., last 3 visits/events)

This is cheap, compact, and highly reliable.

### Layer B: Semantic retrieval (Vectorize) for long text

This includes:

- Notes (tech/office)
- Detailed job events
- Call logs / chat transcripts
- Manuals/spec documents (later)
- Photo annotations (later)

When the tech asks a question, retrieve only the relevant chunks and inject those.

> This is the key to: accuracy, speed, and reduced hallucinations.

---

## 6) Vectorize Design (Embeddings)

### What to embed

Embed “searchable documents” that represent:

- Notes
- Job events (service history)
- Install records
- Equipment summaries
- Manual chunks (PDF → chunk → embed)
- Optional: property access notes

### Recommended pattern: “Search Document” per entity item

For each item you embed, store:

- `doc_id`
- `tenant_id`
- `job_id` (if relevant)
- `client_id`, `property_id`, `equipment_id` (if relevant)
- `type` (note/job_event/manual/etc)
- `created_at`
- `text` (the content that was embedded)
- `metadata` (json; used for filtering + citations)

#### Example embedded text (job_event)

Service event on 2025-06-10:
Maintenance visit. Filter was dirty; homeowner advised quarterly replacement.
Upstairs airflow reported weak.
Equipment: Trane XR16 heat pump (model XR16, installed 2021-05-14).

### Retrieval filters (important)

When chatting within a job, prefer job-scoped retrieval first:

- Filter by `tenant_id`
- Prefer `job_id = current job`
- Expand to `property_id` history for “when was it installed?” or “repeat issues?”
- Expand to `client_id` if needed

This prevents returning irrelevant data from other customers/jobs.

---

## 7) Indexing Pipeline (Queues + Workers)

### When to index

Whenever these change:

- A new note is created/updated
- A new job_event is created
- Equipment is added/updated
- A manual/PDF is uploaded + processed

### Cloudflare Queues pipeline

1. App writes note/event to D1
2. Worker enqueues indexing task to Queue:
   - `{ tenant_id, entity_type, entity_id, job_id/property_id/etc }`
3. Consumer Worker:
   - loads record from D1
   - builds canonical embedded text
   - creates embedding (via AI Gateway)
   - upserts to Vectorize
4. Optional: R2 ingestion jobs enqueue chunking tasks (manual PDFs)

This keeps your primary API fast and your embeddings always fresh.

---

## 8) Chat Prompting (Grounded + Trustworthy)

### System instructions (example)

- You are HVACOps Copilot helping an HVAC technician on a specific job.
- Only answer using provided structured context and retrieved documents.
- If you do not see evidence, say: “I don’t see that information in the job history.”
- Be concise and field-oriented.
- Provide citations referencing source documents (date + type).

### Prompt structure

1. System message (rules)
2. Structured facts block (compact JSON or bullet summary)
3. Retrieved “evidence” chunks (top N) with IDs
4. User question
5. Output format request:
   - `answer`
   - `citations[]` (doc_id, date, type, snippet)
   - `follow_ups[]` (optional)

### Response format (recommended)

Return structured JSON from the model (then render nicely in UI):

```json
{
  "answer": "Filter was last discussed during the maintenance visit on June 10, 2025...",
  "citations": [
    {
      "doc_id": "note_123",
      "date": "2025-06-10",
      "type": "job_event",
      "snippet": "Filter was dirty; advised quarterly replacement."
    }
  ],
  "follow_ups": [
    "Want me to summarize the full service history for this property?",
    "Do you want filter size and recommended interval for this equipment?"
  ]
}
```

## 9) UX Features That Make This Feel “Premium”

### A) Suggested questions (prompt chips)

When chat opens, show quick prompts:

- Summarize service history
- Any repeat issues?
- When was equipment installed?
- Is it under warranty?
- Any access notes or hazards?
- What should I check first today?

### B) Job insights (auto-generated)

Before the tech asks anything, show an “Insights” card:

- Install date + installer
- Recent issues
- Repeat flags (e.g., capacitor replaced twice)
- Last maintenance date
- Known access/pet notes

These insights can be computed server-side using:

- Simple rules + D1 queries
- An LLM “summary” step cached per job (preferred)

### C) Citations in the UI

Always show citations subtly:

> Source: Maintenance visit — 2025-06-10

This builds trust and prevents “random AI” vibes.

### D) “Action buttons” from answers

Example: AI says “Installed May 2021” → show:

- Open install record
- View equipment details
- Create note
- Add part used

This turns AI into a workflow accelerator.

## 10) Handling “Deeper Technical” Questions (Equipment + Manuals)

There are two categories:

- Customer-specific (grounded in your data)
- General technical (needs manuals/specs)

Add a Knowledge Base layer:

- Store manuals/spec PDFs in R2
- Chunk and embed into Vectorize
- Retrieve chunks by:
  - equipment brand/model
  - manual type (install/service/wiring)
  - query embedding

Retrieval strategy:

- If question looks like “spec/how-to/error code”:
  - retrieve from manuals first
  - then blend with job history (“based on past issues…”)

Safety / compliance guardrails:

- Encourage safe practices: “Shut off power before…”
- Verify with manufacturer service manual
- Avoid risky step-by-step instructions without context
- Use disclaimers lightly but consistently

## 11) Performance & Caching (Mobile-First)

Key performance goals:

- Retrieval + response start < ~500ms
- Stream tokens ASAP (perceived speed)
- Keep prompt small and focused

Caching options:

- Cache “Job Context Snapshot” in KV:
  - derived structured facts + recent history summary
  - keyed by tenant_id:job_id:version
- Use Workers Cache API for short-lived responses (e.g., suggested prompts)
- Cache embeddings results for repeated questions (optional)
- Use AI Gateway caching for identical requests (where appropriate)

Durable Objects (optional):

- Use a DO per job_id:user_id to:
  - maintain chat transcript state server-side
  - throttle/rate-limit
  - coordinate streaming and retries

You can also keep state client-side and send the last N messages to the API to reduce infra complexity.

## 12) Security, Tenancy, and PII

Mandatory controls:

- Every query must be filtered by tenant_id
- Vectorize searches must include tenant filter metadata
- LLM prompt must never include data from other tenants

Auditing:

- Store chat messages + model outputs in D1 (or R2 for long logs)
- Log:
  - user_id, job_id, timestamp
  - retrieval doc_ids used
  - model used and cost tokens (from AI Gateway if available)

PII minimization:

- Keep addresses/phones in structured context only when needed
- Avoid sending entire invoices/payment details unless the user asks

## 13) Observability & Reliability

Logging:

- Worker logs: request_id, user_id, job_id
- Retrieval logs: top doc_ids + scores
- Model logs: latency, tokens, error reasons
- Analytics Engine: feature usage (sessions started, messages sent, thumbs up/down)

Failure modes:

- Vectorize unavailable:
  - fall back to structured facts only
  - respond: “I can answer from job summary; detailed notes retrieval is temporarily unavailable.”
- LLM failure:
  - retry via AI Gateway
  - degrade gracefully with partial context

## 14) Implementation Checklist (MVP)

MVP Phase 1 (Job-scoped Q&A):

- D1 schema for jobs/clients/properties/equipment/job_events/notes
- Workers endpoints for session + chat (SSE)
- Queue-based indexing for notes + job events into Vectorize
- Hybrid prompt (structured facts + retrieved chunks)
- Citations returned and displayed
- Suggested prompt chips
- Basic insights (rule-based)

Phase 2 (Manuals + deeper technical):

- Upload manuals to R2
- Chunk + embed into Vectorize (async pipeline)
- Retrieval blending (manual + job history)
- Safety guardrails tuned for field use

Phase 3 (Workflow automation):

- Create note from this
- Log part used
- Suggest next steps checklist
- Generate customer explanation summary

## 15) Example: End-to-End Question Handling

Question: “When was the last time the client replaced the furnace filter?”

Backend steps:

- Load structured facts (job/client/property/equipment + last N events)
- Retrieve semantic chunks:
  - filter by tenant
  - prioritize property_id + equipment_id
  - top 6 chunks
- Build prompt with:
  - structured facts
  - retrieved chunks with ids/dates
- Call LLM via AI Gateway
- Return:
  - concise answer
  - citations (doc_id/date/type)
  - optional follow-ups

Expected response behavior:

- If notes explicitly mention replacement date: return it.
- If notes only mention “filter dirty, advised replace”: say:
  - “I see it was discussed/flagged on X date, but I don’t see confirmation that it was replaced.”

## 16) Notes on Model Choice (Pragmatic)

- Use a strong general model for reasoning + summarization.
- Use embeddings model suitable for semantic retrieval.
- Use AI Gateway for:
  - routing
  - retries
  - logging/cost control
  - consistent headers and policies
- Keep the system flexible so you can swap models without changing app logic.

## 17) Summary

This design makes AI genuinely useful because it is:

- Job-scoped (technician context)
- Grounded (structured facts + semantic retrieval from HVACOps records)
- Trustworthy (citations + “not found” honesty)
- Cloudflare-native (Workers + D1 + Vectorize + R2 + Queues + AI Gateway)

The result is not “a chat window,” but a technician copilot that improves speed, confidence, and quality on every service call.

---

## Additions & Clarifications

### A) Tenant-Level Opt-In (Rollout Strategy)

**Tenant** = a single HVACOps customer account/company. All users and data belong to a tenant.

**Opt-in** means the Copilot feature is enabled only for selected tenants.

Benefits:

- Controlled rollout with a small cohort
- Lower risk during early model/prompt tuning
- Easier support and debugging

Implementation:

- Feature flag per tenant in D1 (e.g., `tenants.features.copilot_enabled`)
- Gate UI entry points (“Get AI Help”) and API endpoints by tenant
- Default to off, enable for pilot customers

### B) Job Insights (LLM Summary Step)

Preferred approach: generate a short LLM summary per job and cache it.

Flow:

1. Build structured facts + top N recent events
2. Ask model for a concise summary (1–3 sentences) + key bullets
3. Store summary in D1 with a revision key (job_id + updated_at)
4. Recompute when relevant data changes (events/notes/equipment)

This produces a high-value, immediate “at-a-glance” experience.

### C) Retrieval Scope Expansion Rules

Define a strict expansion order to control relevance + cost:

1. Job-level (`job_id`)
2. Property-level (`property_id`)
3. Client-level (`client_id`)

Rules:

- Always filter by `tenant_id`
- Only expand scope if results are sparse
- Hard cap total chunks and token budget

### D) Embedding and Chunking Guidelines

Baseline:

- Chunk size: 300–500 tokens
- Overlap: 10–15%
- Store metadata for filtering: `tenant_id`, `job_id`, `property_id`, `client_id`, `equipment_id`, `type`, `created_at`
- Handle updates and deletes (idempotent upserts, tombstones on delete)

### E) Prompt Budget & Truncation

Suggested budgeting:

- Structured facts: 15–25% of context
- Retrieval chunks: 60–70%
- Recent user messages: 10–20%

Truncation:

- Always keep latest user question
- Keep highest-score chunks
- Drop oldest chat turns first

### F) Logging, Retention, and Storage

Recommended storage split:

- D1: session metadata, retrieval doc_ids, short rolling transcript window
- R2: full chat transcripts (JSON blobs) for long sessions

Retention:

- Set TTL for transcripts (e.g., 30–90 days) unless customer opts in to longer
- Support redaction of sensitive notes on request
- Apply R2 lifecycle rules to auto-expire transcript objects

### H) Audit Logging & Legal Hold (Security and Compliance)

Legal-grade auditability requires immutable, verifiable chat records tied to each job.

Audit requirements:

- Capture every user message and AI response (including citations and retrieved doc IDs).
- Timestamp every message for clear audit timelines.
- Record technician identity and presence for multi-tech sessions (who joined/left).
- Maintain a tamper-evident audit trail.
- Support legal hold and long-term retention policies.

Recommended design:

- **Append-only audit log in D1**
  - Table: `ai_chat_audit_log`
  - Fields: `id`, `tenant_id`, `job_id`, `session_id`, `user_id`, `technician_id`, `role`, `content`, `citations_json`, `retrieval_doc_ids_json`, `model_id`, `request_id`, `created_at`
  - No updates or deletes; insert-only for legal traceability.
- **Session presence log in D1**
  - Table: `ai_chat_participants`
  - Fields: `id`, `tenant_id`, `job_id`, `session_id`, `technician_id`, `joined_at`, `left_at`, `created_by_user_id`
  - Write a record when a tech joins; update `left_at` on leave/disconnect.
- **Full transcript in R2**
  - Store the canonical transcript as JSON in R2 (`transcripts/{tenant_id}/{job_id}/{session_id}.json`)
  - Use R2 versioning or object lock policies where appropriate.
- **Integrity proof**
  - Compute a SHA-256 hash of each full transcript on write.
  - Store the hash in D1 with the transcript metadata.
  - Optionally log the hash to an append-only audit ledger table.
- **Legal hold**
  - Add a `legal_hold` flag in D1 for transcript records.
  - When enabled, skip TTL deletion and prevent redaction or modification.
- **Access control**
  - Gate audit endpoints using Cloudflare Access / Zero Trust.
  - Require elevated roles for viewing or exporting audit logs.

Cloudflare-specific usage:

- **Workers** enforce append-only writes and audit logging policy.
- **D1** stores immutable audit metadata and hashes.
- **R2** stores full transcripts with lifecycle rules for retention.
- **AI Gateway** provides request IDs, model metadata, and logging for correlation.
- **Analytics Engine** tracks audit access events for compliance monitoring.

### G) Testing & QA

Before launch:

- Golden question set per tenant
- Retrieval hit-rate validation
- Hallucination checks (should say “not found”)
- Manual review workflow for flagged answers

### I) Call Recording & Transcription (Future Phase)

Goal: capture customer calls (scheduling, follow-ups, escalations), transcribe them, and make them searchable for the job copilot.

Scope:

- Record inbound/outbound calls with consent.
- Store audio in R2 and transcripts in D1/R2.
- Embed transcript chunks into Vectorize for semantic retrieval.

Call capture & consent:

- Require explicit consent in applicable jurisdictions.
- Store consent status and call metadata in D1.
- Provide opt-out and retention controls per tenant.

Ingestion pipeline:

1. Call is recorded and uploaded to R2 (`calls/{tenant_id}/{call_id}.mp3`)
2. Worker enqueues a transcription job to Queues
3. Transcription worker generates text + timestamps
4. Store transcript metadata in D1 and full transcript in R2
5. Chunk transcript by time window or speaker turns
6. Embed chunks and upsert to Vectorize with metadata filters

Data model additions (D1):

- `calls`: `id`, `tenant_id`, `job_id` (nullable), `client_id`, `started_at`, `ended_at`, `direction`, `phone_numbers`, `consent_status`, `r2_audio_key`
- `call_transcripts`: `id`, `call_id`, `tenant_id`, `r2_transcript_key`, `summary`, `created_at`
- `call_transcript_chunks`: `id`, `call_id`, `chunk_index`, `start_ms`, `end_ms`, `speaker_label`, `text`, `vector_id`

Retrieval strategy:

- Prefer job-linked calls first (`job_id`)
- Expand to client-level calls when needed
- Use speaker labels and timestamps for precise citations

UX implications:

- Show “Call History” as a tab or link in the job context.
- AI answers should cite call snippets with time ranges and date.
- Provide a “Play audio at timestamp” action from citations.

Security & compliance:

- Store call audio in R2 with strict access controls.
- Apply retention policies and legal hold.
- Log transcript access in Analytics Engine.
