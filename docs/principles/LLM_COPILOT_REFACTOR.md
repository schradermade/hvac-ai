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

**Status:** **Complete.** Config module added and wired into chat + embeddings.

---

### Phase 2: Retrieval, Prompt, Model, Parser, Orchestrator Scaffolding

**Goal:** Establish stable interfaces and module boundaries without changing runtime behavior.

**Created:**

- `models/modelProvider.ts` + `models/openaiProvider.ts`
- `retrieval/types.ts` + `retrieval/vectorRetriever.ts` + placeholders for keyword/hybrid
- `prompts/promptVersions.ts` + `prompts/promptBuilder.ts`
- `parsing/responseParser.ts`
- `orchestrator/copilotOrchestrator.ts`
- `persistence/conversationStore.ts` + `persistence/messageStore.ts`

**Why:** This provides the foundation for future refactors with minimal risk.

**Status:** **Complete.** Interfaces and scaffolding committed.

---

### Phase 3: Centralize Parsing

**Goal:** Eliminate duplicate JSON parsing logic in streaming and non‑streaming paths.

**Change:** Use `parsing/responseParser.ts` in `routes/chat.ts`.

**Status:** **Complete.** Chat route now uses the shared parser.

---

### Phase 4: Retrieval Abstraction Wiring

**Goal:** Replace inline Vectorize logic in `chat.ts` with the `Retriever` interface.

**Work:**

- Move Vectorize retrieval into `vectorRetriever`
- Use `config.retrieval.mode` to select retriever
- Route uses retriever output instead of direct Vectorize calls

**Status:** **Pending.**

---

### Phase 5: Prompt Builder Wiring

**Goal:** Replace inline prompt assembly with `buildPrompt`.

**Work:**

- Use prompt builder in chat route
- Remove system prompt logic from route

**Status:** **Pending.**

---

### Phase 6: Model Provider Wiring

**Goal:** Replace direct OpenAI calls in `chat.ts` with the provider interface.

**Work:**

- Call `openAIProvider.complete(...)`
- Use config for model and temperature

**Status:** **Pending.**

---

### Phase 7: Persistence Wiring

**Goal:** Use conversation/message store helpers instead of inline SQL.

**Work:**

- Replace raw SQL writes with store calls
- Keep schema identical

**Status:** **Pending.**

---

### Phase 8: Thin Route

**Goal:** Reduce `chat.ts` to input validation + orchestration + response.

**Status:** **Pending.**

---

### Phase 9: Tests & Fixtures

**Goal:** Ensure changes are safe and deterministic.

Add tests for:

- Prompt building (snapshot tests)
- Response parsing (schema, fallback cases)
- Retrieval adapters (mocked)
- Orchestrator flow (integration tests)

**Status:** **Pending.**

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

Step 1–3 completed. Remaining phases are staged and ready for execution.
