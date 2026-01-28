# LLM Portability Master Lesson Plan

This lesson is a comprehensive, beginner‑friendly guide to the **LLM portability architecture** we built. It is written to teach someone with a basic software background how the system works, why it was designed this way, and how to extend it safely. The focus is _only_ on the LLM subsystem (core + adapter), not the rest of the HVACOps app.

If you want to grow toward FDE‑level understanding, treat this as a long‑form course: read it carefully, implement examples, and return to sections as you build or refactor. This document is intentionally detailed so it can be studied for weeks.

---

## 1) Orientation: What You’re Learning

You are learning a **portable LLM architecture** that separates stable, reusable logic from app‑specific infrastructure. This design makes it possible to move the LLM subsystem into new applications without rewriting the core, while still allowing each app to integrate its own database, auth, and APIs.

**Why this matters:**

- **Portability creates leverage.** Improvements to prompts, parsing, or orchestration can be reused across projects instead of rebuilt from scratch.
- **Reliability builds trust.** A system that consistently produces safe, explainable results is more valuable than a system that is occasionally brilliant.
- **Maintainability reduces cost.** Clear boundaries prevent “everything depends on everything” which is the fastest path to expensive regressions.
- **Enterprise readiness.** Auditable, deterministic systems are easier to certify, onboard, and scale.

By the end of this lesson, you should be able to:

- Explain the difference between the **core** and **adapter** layers
- Describe how prompts, parsing, orchestration, retrieval, and persistence work together
- Implement a basic version of this architecture in another app
- Understand the design tradeoffs and how to evolve the system safely

---

## 2) System Overview (Big Picture)

At the highest level, the architecture is split into two main layers:

1. **LLM Core** — portable logic: prompts, parsing, orchestration, config
2. **LLM Adapter** — app‑specific logic: context, evidence, persistence, retrieval, routes

### Conceptual diagram

```
User Request
   │
   ▼
HTTP Route (Adapter)
   │   ├─ fetches context/evidence (Adapter)
   │   ├─ loads history/persistence (Adapter)
   │   └─ calls Orchestrator (Core)
   ▼
LLM Orchestrator (Core)
   │   ├─ builds prompt (Core)
   │   ├─ calls model provider (Adapter)
   │   └─ parses response (Core)
   ▼
Response → Persistence → UI
```

### Core principles embedded in the architecture

- **Separation of concerns**: each module has a single reason to change. This prevents accidental regressions and makes refactors scoped and predictable.
- **Stable interfaces**: core contracts are predictable, so adapters can evolve without breaking downstream logic. This is crucial for long‑term maintainability.
- **Determinism when possible**: structured prompts and outputs reduce chaos. Enterprises pay for reliability, not surprises.
- **Observability and auditability**: evidence + citations make answers traceable. This builds user trust and compliance readiness.

If you’re new to architecture, think of it like this:

- The **core** is like the _engine_ of a car.
- The **adapter** is like the _body, wheels, and controls_ that connect the engine to the road.

Different cars can share the same engine, but each car needs its own controls and fittings. That’s why the adapter exists.

---

## 3) Core Architecture (What belongs in `llm-core`)

The core is the **brain and contract** of the system. It contains only reusable, environment‑agnostic logic. For a client, this is the part that carries the most long‑term value because it can be reused in multiple products or teams.

### Core responsibilities explained

1. **Prompt versioning**
   - Prompts are the system’s policy and instruction set.
   - Versioning makes it safe to change prompts without guessing what changed.
   - **Business value**: prompt changes can be rolled out confidently, reducing risk of regressions that damage user trust.

2. **Prompt building**
   - The core turns context + evidence into a standard message sequence.
   - This ensures the model always receives inputs in the same format.
   - **Business value**: consistent input structure improves response quality and makes outcomes more predictable.

3. **Parsing**
   - LLMs can return invalid JSON or unexpected formats.
   - A parser converts output into structured, safe data.
   - **Business value**: prevents runtime failures and avoids exposing broken responses to end users.

4. **Orchestration**
   - The core runs the pipeline: build prompt → call model → parse output.
   - This prevents business logic from leaking into routes or adapters.
   - **Business value**: makes the system testable and maintainable across teams.

5. **Configuration types**
   - The core defines _what configuration exists_, not how it’s stored.
   - This makes it easy to swap defaults per environment without breaking contracts.
   - **Business value**: flexible deployment across products, regions, or customer segments without code changes.

### Why the core must be clean

The core is the part you want to reuse. If it contains app‑specific details, it becomes harder to move and test. A portable core means:

- You can drop it into other projects.
- You can upgrade or improve it once and benefit everywhere.
- You can maintain a consistent, auditable LLM policy across your organization.

---

## 4) Adapter Architecture (What belongs in `llm-adapters`)

The adapter is the **bridge** between the core and the real app environment. It handles everything that depends on your runtime, your data, and your infrastructure.

### Adapter responsibilities explained

1. **Context builders**
   - Pull structured data from the database (job, client, property, equipment).
   - This becomes the “fact base” for the prompt.
   - **Business value**: keeps answers tied to real operational data, reducing hallucinations.

2. **Evidence builders**
   - Collect and normalize historical notes + job events.
   - This is the grounding evidence used for citations.
   - **Business value**: increases user trust by allowing answers to be traced back to real records.

3. **Retrieval**
   - Performs vector similarity search via embeddings and Vectorize.
   - Adds relevant evidence beyond structured tables.
   - **Business value**: surfaces hidden knowledge from past work, improving first‑response quality.

4. **Model provider**
   - Handles the actual API call to the LLM provider.
   - Encapsulates vendor‑specific details (payload shape, streaming responses).
   - **Business value**: avoids vendor lock‑in and reduces switching costs.

5. **Persistence**
   - Saves conversations and messages to storage.
   - Ensures auditability and continuity across user sessions.
   - **Business value**: allows compliance reporting and supports long‑term analytics.

6. **HTTP routes**
   - Accept requests, invoke orchestrator, return responses.
   - Keep route logic thin and predictable.
   - **Business value**: routes become stable integration points for product teams.

### Why adapters own infrastructure

The adapter layer **must** contain infrastructure logic because it is the only place that knows:

- How your database is structured
- How to retrieve data for a given user
- How your API routes are defined
- Which model provider your app uses

By isolating these concerns here, the rest of the system stays portable and you minimize the cost of adapting the system to new products.

---

## 5) Configuration Strategy

Configuration is the **control panel** of the LLM system. We split it into two pieces:

- **Types** (`config/types.ts`): the contract
- **Defaults** (`config/defaults.ts`): the standard settings

### Why split types from defaults?

- **Types** define _what must exist_ in any environment.
- **Defaults** define _what we use here_.

In a new app, you can override defaults without changing the types.

### Business value

- You can run safer, low‑temperature settings in production while experimenting with higher‑temperature settings in labs.
- You can centralize policy decisions (like prompt version) without rewriting code.
- You can support multiple clients or tiers with different model settings.

### Example config contract

```ts
export interface CopilotConfig {
  model: {
    model: string;
    temperature: number;
    responseFormat: 'json_object';
  };
  retrieval: {
    mode: 'vector' | 'keyword' | 'hybrid';
    topK: number;
  };
  prompt: {
    version: string;
  };
}
```

---

## 6) Prompts & Output Contracts

Prompts are not just “text you send to the model.” They are **policy documents** that instruct the model how to behave. In enterprise systems, prompts are treated like code.

### Prompt versioning

Versioning means every change is explicit and auditable. This enables:

- A/B testing across versions
- Safe rollbacks
- Precise debugging when outputs regress

**Business value:** You can safely iterate on model behavior without risking production stability.

### Prompt building

The prompt builder ensures the input structure is consistent:

```ts
export function buildPrompt(version, context) {
  return [
    { role: 'system', content: promptVersions[version].system },
    {
      role: 'system',
      content: `Structured context:\n${JSON.stringify(context.snapshot)}\n\nEvidence:\n${context.evidenceText}`,
    },
    ...context.history,
    { role: 'user', content: context.userMessage },
  ];
}
```

**Business value:** This consistency means users can trust that the model always considers the same evidence structure, making results more predictable.

### Output contracts (JSON schema)

The model is required to return JSON with keys like:

- `answer`
- `citations`
- `follow_ups`

A parser then enforces this and falls back to safe behavior when output is malformed.

**Business value:** Structured outputs allow downstream systems (UI, analytics, compliance) to work reliably and reduce production incidents.

---

## 7) Orchestration Layer

The orchestrator is the **engine** of the core. It controls the flow from input to output.

### Inputs and outputs

The orchestrator receives a `CopilotRequest`:

```ts
export interface CopilotRequest {
  requestId: string;
  userInput: string;
  context: Record<string, unknown>;
  evidenceText: string;
  history: ChatMessage[];
  config: CopilotConfig;
}
```

And returns a `CopilotResponse`:

```ts
export interface CopilotResponse {
  answer: string;
  citations: Array<Record<string, unknown>>;
  followUps: string[];
}
```

### Core flow

1. Build prompt using the prompt builder
2. Call the model provider
3. Parse output into structured response

**Business value:** One orchestration path means fewer inconsistencies, easier testing, and simpler debugging when issues arise.

---

## 8) Retrieval Layer (Adapter)

The retrieval layer is responsible for finding **relevant evidence** to ground the model’s answer. It belongs in the adapter because it depends on runtime infrastructure (Vectorize, embeddings, tenant scoping, etc.). If you remove retrieval, you risk two things: the model answers without evidence, and you lose the ability to justify decisions to users. Retrieval fixes that by turning unstructured history into **evidence slices** the model can cite.

At a granular level, the retrieval flow looks like this:

1. **Embed the user query**  
   The query is transformed into a vector embedding using the embedding model (e.g., `text-embedding-3-small`).  
   This enables semantic similarity search instead of brittle keyword matching.

2. **Query the vector index with filters**  
   The embedding is sent to Vectorize, along with **tenant/job filters**.  
   Filters are critical for privacy and relevance: you don’t want to pull notes from other tenants or unrelated jobs.

3. **Filter‑candidate fallback strategy**  
   Real data is messy. Sometimes metadata types are inconsistent (string vs number).  
   The retriever tries a list of filter candidates (tenant_id as string, job_id as string, etc.).  
   This prevents “false empty” results caused by type mismatches.

4. **Fallback to unfiltered retrieval (with strict in‑code filtering)**  
   If filtered retrieval returns zero matches, the system performs a broader query and then filters in code.  
   This is a controlled safety net: you still enforce tenant/job boundaries, but avoid losing evidence due to filter mismatches.

5. **Normalize evidence**  
   Vector matches are normalized into a consistent `EvidenceChunk` format:  
   `docId`, `type`, `date`, `text`, `score`, etc.  
   This allows the prompt builder and citation logic to work consistently.

6. **Attach debug metadata (optional)**  
   Debug data tells you what filters were used, which fallback was triggered, and how many matches were found.  
   This is essential for trust and troubleshooting.

Here’s a conceptual snapshot of the adapter retriever (simplified):

```ts
const embedding = await embed(query);
const filtered = await vectorize.query(embedding, { filter: { tenant_id, job_id } });
if (filtered.matches.length === 0) {
  const fallback = await vectorize.query(embedding, { topK: fallbackTopK });
  matches = fallback.matches.filter((m) => m.metadata.tenant_id === tenantId);
} else {
  matches = filtered.matches;
}
return normalize(matches);
```

### Business value

- **Tenant isolation** protects privacy and compliance boundaries.
- **Relevance** improves answer quality and reduces technician time.
- **Auditability** enables confidence and regulatory readiness.

Retrieval isn’t “nice to have.” It is the system’s **grounding mechanism** — the backbone of trust.

---

## 9) Model Provider Layer

The model provider is the adapter’s **interface to the LLM vendor**. It isolates vendor‑specific details and presents a stable contract to the core.

### Provider interface

```ts
export interface ModelProvider {
  name: string;
  complete: (request: ChatRequest) => Promise<ChatCompletion>;
  stream?: (request: ChatRequest) => AsyncIterable<ChatStreamChunk>;
}
```

### Why this abstraction matters

- You can swap model vendors without touching the core.
- You can add streaming without breaking existing interfaces.
- You can test the core by mocking the provider.

### Business value

- **Vendor flexibility** reduces long‑term cost and risk.
- **Performance options** (streaming vs non‑streaming) improve UX.
- **Operational reliability** increases by isolating vendor errors.

---

## 10) Context & Evidence Builders

Context and evidence are the **ground truth** of your system.

### Context snapshot

The context snapshot is a structured, deterministic object that summarizes the current job, client, property, and equipment state. It is built from trusted database sources.

**Business value:** It gives the model a stable fact base and reduces hallucinations, which protects customer trust and reduces support escalations.

### Evidence builder

The evidence builder collects historical notes and events, then normalizes them into a consistent format. This becomes the raw material for citations.

**Business value:** It ensures transparency and makes answers defensible. In high‑stakes environments, this is essential.

---

## 11) Persistence Layer

Persistence stores **conversation history** and **message metadata**.

### Key ideas

- **Conversations** represent a thread across multiple turns.
- **Messages** capture user and assistant outputs.
- **Metadata** stores citations, evidence references, model versions, and prompt versions.

**Business value:** Persistence enables audit trails, analytics, and long‑term trust. It also allows users to resume work with full context.

---

## 12) HTTP Integration (Thin Routes)

Routes should do only three things:

1. Validate the request
2. Assemble context and evidence
3. Call the orchestrator and persist results

A route should not be the “brain” of the system. That belongs in the core.

The adapter exposes a single entrypoint:

```ts
export function registerLLMRoutes(app) {
  registerChatRoutes(app);
}
```

**Business value:** Thin routes are stable integration points. Product teams can build features on top of them without needing to understand internals.

---

## 13) Testing Strategy

LLM systems are brittle without tests. We built a **dedicated test configuration** so LLM tests don’t depend on Expo runtime behavior.

### What we test

- **Prompt snapshots**: verify the prompt shape doesn’t change accidentally.
- **Parser behavior**: ensure invalid JSON is handled safely.
- **Orchestrator fakes**: validate the core flow without real APIs.
- **Adapter integration mocks**: ensure retrieval/persistence behavior is correct.

**Business value:** Testing protects production quality and prevents regressions that could undermine user confidence or create safety risks.

---

## 14) Portability Guidelines

To reuse this architecture in a new app:

1. Copy `llm-core` as‑is.
2. Rebuild the adapter to match your app’s database, auth, and APIs.
3. Keep the core untouched to preserve reliability.

**Business value:** You can launch new LLM‑powered products faster by reusing the core.

---

## 15) Design Tradeoffs

This architecture balances portability and practicality:

- We **standardized** the core to keep it stable and reusable.
- We **left the adapter flexible** because every app is different.
- We **did not over‑abstract** domain concepts, because abstraction too early slows progress.

**Business value:** You get the benefits of reuse without sacrificing speed or clarity.

---

## 16) Summary & Next Steps

You now understand:

- The portable LLM core and its responsibilities
- The adapter boundary and why it exists
- How prompts, parsing, orchestration, retrieval, and persistence fit together
- How to test and extend the system safely

**Next steps to deepen mastery:**

- Add schema validation for citations
- Add telemetry hooks to the orchestrator
- Package `llm-core` as a standalone library
- Build a minimal adapter in a new project to practice portability

---

This lesson is meant to be a living guide. As the system evolves, update it so the architecture remains clear, teachable, and robust.
