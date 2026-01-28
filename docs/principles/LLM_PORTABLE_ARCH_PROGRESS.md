# LLM Core + Adapter Split (Progress Tracker)

This document tracks execution progress against the portable LLM architecture plan. Update only when a phase or task is started/completed.

---

## Docs

- [x] Update `docs/principles/README.md` with new architecture + tracker links

## Phase 0 — Create structure (no behavior change)

- [x] Create `src/llm-core/` directories
- [x] Create `src/llm-adapters/hvacops/` directories
- [ ] Add adapter index exports (temporary)

## Phase 1 — Move pure logic into core

- [x] Move prompt builder + versions
- [x] Move response parser
- [x] Move config types/defaults
- [x] Update imports to core

## Phase 2 — Refactor orchestrator to core contracts

- [ ] Orchestrator accepts `CopilotRequest`
- [ ] Orchestrator returns `CopilotResponse`
- [ ] Add core `types.ts` for orchestration

## Phase 3 — Adapterize model + retrieval

- [ ] Move OpenAI provider into adapter
- [ ] Move Vectorize helpers into adapter
- [ ] Implement core `ModelProvider` in adapter
- [ ] Implement core `Retriever` in adapter

## Phase 4 — Move context + persistence into adapter

- [ ] Move job context builder
- [ ] Move evidence builder
- [ ] Move conversation/message stores

## Phase 5 — Thin HTTP route

- [ ] Move chat route to adapter
- [ ] Update server route to call adapter

## Phase 6 — Tests

- [ ] Prompt snapshot tests
- [ ] Parser tests
- [ ] Orchestrator tests (fakes)
- [ ] Adapter integration tests (D1/Vectorize mocks)
