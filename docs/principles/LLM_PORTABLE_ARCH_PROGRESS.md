# LLM Core + Adapter Split (Progress Tracker)

This document tracks execution progress against the portable LLM architecture plan. Update only when a phase or task is started/completed.

---

## Docs

- [x] Update `docs/principles/README.md` with new architecture + tracker links

## Phase 0 — Create structure (no behavior change)

- [x] Create `src/worker/llm-core/` directories
- [x] Create `src/worker/llm-adapters/hvacops/` directories
- [x] Add adapter index exports (temporary)

## Phase 1 — Move pure logic into core

- [x] Move prompt builder + versions
- [x] Move response parser
- [x] Move config types/defaults
- [x] Update imports to core

## Phase 2 — Refactor orchestrator to core contracts

- [x] Orchestrator accepts `CopilotRequest`
- [x] Orchestrator returns `CopilotResponse`
- [x] Add core `types.ts` for orchestration

## Phase 3 — Adapterize model + retrieval

- [x] Move OpenAI provider into adapter
- [x] Move Vectorize helpers into adapter
- [x] Implement core `ModelProvider` in adapter
- [x] Implement core `Retriever` in adapter

## Phase 4 — Move context + persistence into adapter

- [x] Move job context builder
- [x] Move evidence builder
- [x] Move conversation/message stores

## Phase 5 — Thin HTTP route

- [x] Move chat route to adapter
- [x] Update server route to call adapter

## Phase 6 — Tests

- [x] Prompt snapshot tests
- [x] Parser tests
- [x] Orchestrator tests (fakes)
- [x] Adapter integration tests (D1/Vectorize mocks)
