# LLM Core + Adapter Split (Portable Architecture Plan)

This document defines the **target architecture and file mapping** to make the LLM subsystem portable across projects. It should only be updated when the architecture or file mapping changes.

---

## Goal

Create a portable, enterprise‑grade LLM subsystem that can be lifted into other projects with minimal glue. The core must be domain‑agnostic and infrastructure‑agnostic; all app‑specific coupling is isolated in adapters.

---

## Target Split

### Core (portable)

- **Location:** `src/worker/llm-core/`
- **Scope:** Orchestration, prompts, parsing, schemas, core contracts, config types/defaults.
- **Constraints:** No D1, Vectorize, Cloudflare, Hono, or HVAC domain types.

### Adapter (HVACOps)

- **Location:** `src/worker/llm-adapters/hvacops/`
- **Scope:** Data access, infra SDKs, tenancy/auth, HTTP wiring, model provider implementation, retrieval implementation, persistence.

---

## Portability Contract (Non‑Negotiables)

- Core must not import any app, infra, or framework code (D1, Vectorize, Cloudflare, Hono, HVAC domain types).
- Adapter owns all IO (network, database, embeddings, vendor SDKs).
- Core interfaces must be stable and versioned; breaking changes require a major version bump of the core package.
- Prompts, parsing, and orchestration live in core; they are the portable value.

---

## Target Directory Layout

```
src/
  llm-core/
    config/
      types.ts
      defaults.ts
    orchestration/
      orchestrator.ts
      types.ts
    prompts/
      versions.ts
      buildPrompt.ts
      types.ts
    parsing/
      responseParser.ts
      schema.ts
      types.ts
    retrieval/
      types.ts
    models/
      types.ts
    persistence/
      types.ts
    telemetry/
      types.ts
    utils/
      errors.ts
      ids.ts

  llm-adapters/
    hvacops/
      context/
        buildContext.ts
        types.ts
      retrieval/
        vectorizeClient.ts
        vectorRetriever.ts
        keywordRetriever.ts
        hybridRetriever.ts
        indexing.ts
      models/
        openaiProvider.ts
      persistence/
        conversationStore.ts
        messageStore.ts
      telemetry/
        logger.ts
      routes/
        chatRoute.ts
      config/
        fromEnv.ts
```

---

## Core Interface Surface (Stable API)

Core defines:

- `CopilotRequest` and `CopilotResponse` (orchestration boundary)
- `ModelProvider`, `Retriever`, `ConversationStore`, `MessageStore`, `Telemetry`
- `EvidenceChunk`, `ChatMessage`, and config types

Adapters must implement these interfaces without changing core semantics.

---

## File Mapping (Current → Target)

### Core (portable)

- `src/server/copilot/config/copilotConfig.ts`
  → `src/worker/llm-core/config/types.ts` + `src/worker/llm-core/config/defaults.ts`
- `src/server/copilot/prompts/promptBuilder.ts`
  → `src/worker/llm-core/prompts/buildPrompt.ts`
- `src/server/copilot/prompts/promptVersions.ts`
  → `src/worker/llm-core/prompts/versions.ts`
- `src/server/copilot/parsing/responseParser.ts`
  → `src/worker/llm-core/parsing/responseParser.ts`
- `src/server/copilot/models/modelProvider.ts`
  → `src/worker/llm-core/models/types.ts`
- `src/server/copilot/retrieval/types.ts`
  → `src/worker/llm-core/retrieval/types.ts`
- `src/server/copilot/orchestrator/copilotOrchestrator.ts`
  → `src/worker/llm-core/orchestration/orchestrator.ts`

### Adapter (HVACOps)

- `src/server/copilot/routes/chat.ts`
  → `src/worker/llm-adapters/hvacops/routes/chatRoute.ts`
- `src/server/copilot/jobContext.ts`
  → `src/worker/llm-adapters/hvacops/context/buildContext.ts`
- `src/server/copilot/jobEvidence.ts`
  → `src/worker/llm-adapters/hvacops/context/buildEvidence.ts`
- `src/server/copilot/vectorize.ts`
  → `src/worker/llm-adapters/hvacops/retrieval/vectorizeClient.ts`
- `src/server/copilot/retrieval/vectorRetriever.ts`
  → `src/worker/llm-adapters/hvacops/retrieval/vectorRetriever.ts`
- `src/server/copilot/retrieval/keywordRetriever.ts`
  → `src/worker/llm-adapters/hvacops/retrieval/keywordRetriever.ts`
- `src/server/copilot/retrieval/hybridRetriever.ts`
  → `src/worker/llm-adapters/hvacops/retrieval/hybridRetriever.ts`
- `src/server/copilot/models/openaiProvider.ts`
  → `src/worker/llm-adapters/hvacops/models/openaiProvider.ts`
- `src/server/copilot/services/ai.ts`
  → split:
  - system prompt → `src/worker/llm-core/prompts/versions.ts`
  - `callOpenAI` → `src/worker/llm-adapters/hvacops/models/openaiProvider.ts`
- `src/server/copilot/persistence/conversationStore.ts`
  → `src/worker/llm-adapters/hvacops/persistence/conversationStore.ts`
- `src/server/copilot/persistence/messageStore.ts`
  → `src/worker/llm-adapters/hvacops/persistence/messageStore.ts`
- `src/server/copilot/indexing.ts`
  → `src/worker/llm-adapters/hvacops/retrieval/indexing.ts`

### App‑specific (stays outside core)

- `src/server/copilot/auth/*`
- `src/server/copilot/search/*`
- `src/server/copilot/routes/*` (non‑LLM endpoints)
- `src/server/copilot/workerTypes.ts`

---

## Core Contract Changes Required

- Orchestrator input becomes `CopilotRequest` with normalized `context`, `evidence`, `history`.
- `ModelProvider.complete` accepts `{ messages, config }`; API keys remain in adapter.
- `Retriever.retrieve` accepts `{ query, context, config }` (or `scope` for adapter only).
- Persistence becomes interfaces in core; D1 implementation lives in adapter.

---

## Packaging Options

1. **Monorepo folder** (`src/worker/llm-core/`) with path imports.
2. **Internal package** (publishable): `packages/llm-core/` to allow reuse across repos.

Both options keep the adapter in the app repo and the core isolated for portability.

---

## Migration Plan (High‑Level)

1. Create new `llm-core/` and `llm-adapters/hvacops/` structure.
2. Move pure logic (prompts, parsing, config types/defaults) into core.
3. Refactor orchestrator to core contracts.
4. Adapterize model + retrieval (OpenAI + Vectorize).
5. Move context + persistence into adapter.
6. Thin HTTP route to call core with adapter inputs.
7. Add tests (prompt snapshots, parser cases, orchestrator with fakes, adapter integration).
