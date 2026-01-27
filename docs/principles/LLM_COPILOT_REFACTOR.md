# HVACOps Copilot Refactor Plan (97–98 Modularity Target)

## Summary

This document defines a full refactor plan to raise the HVACOps Copilot architecture to a **97–98 modularity score**. The goal is to make model swaps, retrieval changes, and prompt adjustments _predictable and low‑risk_, while improving reliability, testing, and observability. The plan is intentionally comprehensive and explicit so implementation can be executed in phases without breaking behavior.

---

## Why This Refactor Is Needed

Today, the Copilot pipeline works, but core orchestration logic is tightly coupled inside the API route. Model configuration, retrieval strategy, prompt construction, response parsing, and streaming logic are interwoven. This makes changes risky:

- Swapping models requires editing route code.
- Retrieval changes require changes to unrelated sections.
- Streaming and non‑streaming paths duplicate parsing logic.
- Prompt versions and response schema are scattered across files.

For enterprise‑grade reliability, the pipeline must be decomposed into stable modules with clear interfaces. Each module should be testable and replaceable without cascading edits.

---

## Design Principles

1. **Single Responsibility**: each module owns one concept and only one.
2. **Stable Interfaces**: use explicit interfaces for models, retrieval, and parsing so implementations can be swapped.
3. **Config‑Driven**: model names, prompt versions, and retrieval mode should be centralized in configuration.
4. **DRY**: avoid duplicate parsing logic between streaming and non‑streaming.
5. **Separation of Concerns**: data access, retrieval, prompting, inference, parsing, persistence, and transport should be separable layers.
6. **Testability First**: every module should be independently testable and have at least one deterministic fixture.

---

## Target Architecture (High‑Level)

**Pipeline:**

```
User Input
  → Orchestrator
      → Context Builder
      → Retriever
      → Prompt Builder
      → Model Provider
      → Response Parser
      → Persistence & Logging
  → API Response
```

### Modules & Responsibilities

- **Context Builder**: fetches structured job context.
- **Retriever**: returns evidence (vector, keyword, hybrid).
- **Prompt Builder**: constructs system + context + evidence + history.
- **Model Provider**: calls the LLM (streaming or non‑streaming).
- **Response Parser**: validates structured output, normalizes citations, handles fallbacks.
- **Orchestrator**: coordinates the pipeline.

These modules are intentionally isolated and reusable.

---

## Planned File Structure

```
src/server/copilot/
  config/
    copilotConfig.ts
  orchestrator/
    copilotOrchestrator.ts
  retrieval/
    types.ts
    vectorRetriever.ts
    keywordRetriever.ts
    hybridRetriever.ts
  prompts/
    promptVersions.ts
    promptBuilder.ts
  models/
    modelProvider.ts
    openaiProvider.ts
  parsing/
    responseParser.ts
    citationNormalizer.ts
  persistence/
    conversationStore.ts
    messageStore.ts
  routes/
    chat.ts (thin)
```

This structure ensures each layer has a single reason to change.

---

## Detailed Refactor Roadmap

### Phase 1: Configuration Layer

**Goal:** Centralize all model, retrieval, and prompt settings.

**Create:** `src/server/copilot/config/copilotConfig.ts`

Defines:

- `model`: `gpt-4o` (or any other model)
- `embeddingModel`: `text-embedding-3-small`
- `promptVersion`: `copilot.v1`
- `retrievalMode`: `vector | keyword | hybrid`
- `temperature`, `topP`, `maxTokens`
- `historyLimit`, `retrievalTopK`

**Why:** This eliminates hard‑coded parameters spread across files. Changing models or prompt versions becomes a config edit, not a route edit.

---

### Phase 2: Retrieval Abstraction

**Goal:** Swap retrieval strategies without touching chat logic.

**Create:** `src/server/copilot/retrieval/types.ts`

Defines:

```ts
interface Retriever {
  retrieve(input: { query: string; tenantId: string; jobId: string }): Promise<RetrieverResult>;
  debug?: () => DebugInfo;
}
```

**Implementations:**

- `vectorRetriever.ts` (existing Vectorize code moved here)
- `keywordRetriever.ts` (new keyword search over D1 for exact IDs/parts)
- `hybridRetriever.ts` (merges + re‑ranks)

**Why:** Vectorize logic is currently intertwined with route logic. Extraction enables experimentation with retrieval strategies safely.

---

### Phase 3: Prompt Builder + Versioning

**Goal:** Isolate prompt construction, enforce versioning.

**Create:**

- `promptVersions.ts`: contains versioned prompt templates.
- `promptBuilder.ts`: builds prompt from context + evidence + history.

**Why:** Today, prompt assembly is embedded in the route. This makes prompt updates risky and untestable. A builder allows prompt evolution and A/B testing.

---

### Phase 4: Model Provider Layer

**Goal:** Swap LLM providers without touching orchestration.

**Create:**

- `modelProvider.ts` interface
- `openaiProvider.ts` implementation

`ModelProvider` handles:

- Request construction
- Streaming vs non‑streaming
- Error normalization

**Why:** This removes OpenAI‑specific logic from the route and creates a single integration layer.

---

### Phase 5: Response Parsing + Normalization

**Goal:** Eliminate duplication and enforce schema.

**Create:**

- `responseParser.ts` (JSON parsing, schema validation)
- `citationNormalizer.ts` (merge citations with evidence)

**Why:** Both streaming and non‑streaming paths currently duplicate parsing. Centralizing this is key to reliability.

---

### Phase 6: Orchestrator

**Goal:** Centralize pipeline flow.

**Create:** `copilotOrchestrator.ts`

Handles:

- context loading
- retrieval
- prompt building
- model invocation
- response parsing
- returning structured output to route

**Why:** The route should not be the orchestrator. It should only handle HTTP details.

---

### Phase 7: Persistence Layer

**Goal:** Separate data storage from inference logic.

**Create:**

- `conversationStore.ts`
- `messageStore.ts`

These modules handle D1 reads/writes for conversations and messages.

---

### Phase 8: Thin Route

**Goal:** Reduce `chat.ts` to:

- input validation
- orchestrator invocation
- persistence
- HTTP response

This makes the route stable even as internal components evolve.

---

### Phase 9: Tests & Fixtures

**Goal:** Ensure changes are safe and deterministic.

Add tests for:

- Prompt building (snapshot tests)
- Response parsing (schema, fallback cases)
- Retrieval adapters (mocked)
- Orchestrator flow (integration tests)

---

## Expected Outcomes

After this refactor:

- Model swaps are config‑only.
- Retrieval strategy is selectable at runtime.
- Prompt changes are versioned and testable.
- Streaming + non‑streaming share a single parser.
- Routes are thin and stable.
- Regression risk is minimized by tests and modular interfaces.

This meets the target **97–98 modularity score** by removing tight coupling and reducing cross‑file dependencies.

---

## Implementation Notes (non‑exhaustive)

- Avoid duplication between streaming/non‑streaming.
- Use explicit types for each interface.
- Keep functions pure where possible.
- Maintain backward compatibility with current API response shape.
- Add feature flags for retrieval mode when needed.

---

## Status

Plan documented. Implementation has not started.
