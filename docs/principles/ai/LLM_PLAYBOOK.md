# HVACOps LLM Playbook

This playbook is a practical, end-to-end guide for designing, building, and operating LLM-powered features in HVACOps. It is written for real-world constraints: noisy data, safety risks, latency budgets, and the need for trust. The goal is not just “get answers from a model,” but to build a system that consistently produces safe, accurate, useful outcomes.

---

## 1) Product Framing: What the LLM Is Actually For

### Define the job to be done

Every LLM feature must have a sharply defined outcome. “Answer questions” is too vague. Instead, define the _decision_ the user is trying to make and the _action_ that follows. This clarifies what context is needed, what the output must look like, and how to evaluate success.

Examples in HVACOps:

- “What should I check next for a rattling air handler?” → Decision support for diagnosis.
- “Summarize the last three visits and recommended actions.” → Synthesis for quick context.
- “Draft a customer update with parts and ETA.” → Drafting, not final output.

If the job-to-be-done is clear, the system can enforce guardrails and abstain when necessary.

### Determine the risk profile

LLM errors have different consequences depending on user and scenario:

- **Low risk:** summarizing notes, drafting messages.
- **Medium risk:** troubleshooting suggestions, workflow reminders.
- **High risk:** safety-critical steps (electrical, gas, refrigerant).

For high-risk scenarios, the LLM must be advisory and constrained by evidence and standard procedures. It should never invent steps. In some cases, the LLM should refuse or escalate to a safety checklist instead of answering.

### Identify where the model should abstain

Build a list of cases where the model must say “I don’t know” or defer:

- No evidence found.
- Safety-critical steps with insufficient context.
- Requests outside HVAC scope.
- Conflicting evidence or missing core details (model number, error codes, observed symptoms).

Abstention is not a policy feature; it is a product feature that preserves trust.

### Define success criteria

Avoid ambiguous success metrics. For each LLM feature, define:

- **Accuracy targets** (e.g., “Answers grounded in evidence 95% of the time”).
- **Latency target** (e.g., “P95 under 2.5s”).
- **Adoption target** (e.g., “50% of techs use Copilot weekly”).
- **Safety target** (e.g., “Zero unsafe suggestions in eval set”).

Without explicit targets, it’s easy to “optimize” the wrong thing (fast but unsafe, or accurate but unusable).

---

## 2) System Architecture: The Mental Model

An enterprise LLM system is not just “call the model.” It is a pipeline:

1. **User Input** → 2) **Context Assembly** → 3) **Retrieval (RAG)** → 4) **Prompt Construction** → 5) **Model Inference** → 6) **Post-processing** → 7) **UI Rendering & Logging**

You want determinism where possible, and controlled variability where helpful. The architecture should be modular so you can swap models, change retrieval strategy, or adjust prompts without breaking the whole system.

### Architectural components

- **Context builder**: Pulls structured data (job details, client, property, equipment). It should be deterministic and validated.
- **Retrieval system**: Finds relevant notes/events via semantic and/or keyword search. It must be tenant-scoped.
- **Prompt layer**: Defines system instructions, schema, and constraints. This is effectively policy code.
- **Tool layer**: Structured functions for writing notes, scheduling, or retrieving live system data.
- **Post-processor**: Validates JSON, enforces formatting, handles fallback.
- **Audit & observability**: Logs data used, outputs given, and reasons for fallback.

### Why this structure matters

Without clear separation:

- You can’t test or improve components independently.
- It becomes impossible to understand why an answer is bad.
- Small changes cause regressions across the system.

A clean architecture keeps changes localized and debuggable.

### Architecture tradeoffs

- **End-to-end simplicity** vs **control**: A single model call is easy but brittle. The pipeline adds complexity but makes behavior predictable.
- **Pre-compute context** vs **on-demand**: Pre-compute saves latency but risks staleness. On-demand is accurate but slower.

---

## 3) Determinism & Reliability

LLMs are probabilistic; enterprise systems need predictability.

### Parameters that affect determinism

- **Temperature**: Lower temperature produces more deterministic output. Use ~0.1–0.3 for factual, evidence-based responses.
- **Top-p**: Controls token sampling. If you want stable responses, keep this low or default it and lower temperature.
- **Seeded generation**: If your provider supports seeds, use them for repeatable outputs in evaluation pipelines.

### Structured responses for reliability

Whenever downstream code depends on specific structure, require JSON output with a schema. Example:

```
{
  "answer": "...",
  "citations": [{ "doc_id": "...", "snippet": "..." }],
  "confidence": "low|medium|high",
  "follow_ups": ["...", "..."]
}
```

Strict parsing prevents UI breakage. Parsing failures should trigger:

1. A retry with stricter instructions.
2. A fallback response if the retry fails.

### Fallback strategy

LLM responses should never be the only path. Define fallbacks for:

- **Empty retrieval** → return a safe “no evidence found” response.
- **Bad output format** → retry or return a template response.
- **Latency spikes** → return minimal response + prompt user to retry.

### Why determinism matters

- Allows repeatable tests and regression detection.
- Reduces trust erosion from inconsistent answers.
- Enables explainability and audit trails.

---

## 4) Context Windows & Retrieval (RAG)

### Token budgeting

Every model has a context limit. You must allocate tokens intentionally.

Example budget:

- System prompt: 500–800 tokens
- Instructions + schema: 300–600 tokens
- Retrieved context: 2k–6k tokens
- User query: 50–200 tokens
- Model response: 300–800 tokens

If you exceed the context limit, you lose important data or truncate output. Prioritize the most relevant, most recent, most high-signal evidence. Summarize older notes instead of removing them entirely.

### Retrieval architecture

- **Vector search** for semantic similarity (notes, events, summaries).
- **Keyword search** for exact terms (model numbers, parts).
- **Hybrid** is often best: vector for meaning + keyword for exact identifiers.

A hybrid approach prevents missing exact strings and improves recall for technical parts.

### Chunking strategy

How you chunk data changes recall:

- Too small → context fragmentation and low signal.
- Too large → irrelevant data mixed with relevant data.

Best practice: 200–600 tokens per chunk with overlap for continuity. Chunk boundaries should respect note boundaries or paragraph breaks when possible.

### Metadata filters

Always filter by tenant_id and job_id, property_id, or client_id. This prevents cross-tenant leakage and increases relevance. This should be enforced in retrieval queries, not trusted to the model.

### Query rewriting

User queries are often vague. Add a query rewrite step that expands with domain-specific synonyms:

- “AC not cooling” → “air conditioner not cooling, low refrigerant, airflow restriction”.

Query rewriting should be optional and auditable; never silently change user intent. Log original query and rewritten query so you can debug drift.

### When to bypass retrieval

If the user asks for structured job data (scheduled time, client info), pull it from the database directly. RAG is not a replacement for structured data access.

### Retrieval tradeoffs

- **Recall vs precision**: High recall surfaces more results but risks noise. Precision reduces noise but can miss critical notes.
- **Latency vs depth**: More retrieval steps (reranking, hybrid) improves quality but adds latency.

---

## 5) Guardrails and Safety

### Evidence-based answering

Require the model to cite evidence. If evidence isn’t found, it should say so. This is critical for technician trust.

### Safety critical constraints

For electrical, gas, and refrigerant workflows:

- The model should prioritize safety reminders.
- If risk is high and evidence is weak, it should stop and ask for confirmation.

### Refusal and escalation logic

Create a list of prohibited or risky instructions. If a request triggers a red flag, the model should refuse and suggest the safe next step. Example: “Bypass a safety switch” should always be refused.

### Tenant isolation

Every step must enforce tenant scoping. Retrieval and indexing must never allow cross-tenant results.

### Guardrail tradeoffs

- **Over-restriction** can reduce usefulness.
- **Under-restriction** can create unsafe guidance.

The correct balance is achieved by continuous monitoring and targeted policy refinement.

---

## 6) Response Quality & UX

### Output format is UX

A correct answer presented poorly is still a bad answer. Standardize response format:

- Clear steps
- Short paragraphs
- Bullet lists for procedures
- Source citations per claim

### Confidence indicators

Provide a confidence label derived from:

- Retrieval quality (topK score)
- Amount of evidence
- Consistency across sources

Confidence should not be arbitrary. It should be tied to measurable signals.

### Follow-up suggestions

Great Copilot UX keeps techs engaged. Provide 2–3 follow-up questions when helpful.

### UX tradeoffs

- Too many citations can clutter the UI.
- Too few citations can reduce trust.

The best balance is compact, collapsible sources that are accessible but not overwhelming.

---

## 7) Evaluation & Testing

### Golden datasets

Collect real notes + expected outcomes. Keep them stable for regression testing. These should include both “easy” and “hard” cases:

- Routine maintenance
- Uncommon faults
- Safety-sensitive scenarios

### Evaluation categories

- **Groundedness**: Does the answer match evidence?
- **Completeness**: Did it cover key steps?
- **Safety**: Did it avoid unsafe advice?
- **Tone**: Professional, concise.

### Offline evals

Run before deploy:

- Same prompt, same dataset, compare output versions.
- Detect regressions when prompts or models change.

### Online evals

Log real usage, sample outputs, and review periodically. Track drift.

### Evals tradeoffs

- Too many evals slow iteration.
- Too few evals cause regressions.

Use a tiered approach: a small “smoke” set for rapid testing, and a larger set before release.

---

## 8) Observability & Operations

### What to log

- Request ID
- User ID / tenant ID
- Retrieval IDs used
- Prompt version
- Model version
- Latency and token usage
- Output success/failure

### Why this matters

Without logs, you cannot debug hallucinations or understand failures. Logging is essential for enterprise support.

### Alerts

- Spike in fallback rate
- Retrieval returning empty
- High latency or token use

### Ops tradeoffs

- More logging increases cost but improves traceability.
- Less logging reduces cost but makes incidents harder to debug.

---

## 9) Cost & Scaling

### Cost control

- Cache retrieval results for repeated queries.
- Use smaller models for simple tasks.
- Truncate responses when unnecessary.

### Throughput

- Batch embeddings and indexing.
- Queue writes for high-volume updates.

### Model tiering

For low-risk tasks, use cheaper models. For diagnostic guidance, use more capable models.

### Cost tradeoffs

- Cheaper models reduce cost but may miss nuance.
- Larger models improve reasoning but cost more and increase latency.

---

## 10) Change Management

### Prompt versioning

Treat prompts like code. Every change should be versioned and logged. This allows:

- Regression analysis
- Rollback
- Controlled experimentation

### Rollouts

- Use feature flags.
- Gradual rollouts to small groups.
- Monitor metrics before full release.

### Change management tradeoffs

- Strict rollouts reduce risk but slow iteration.
- Fast rollouts increase speed but can destabilize production.

---

## 11) Mapping to HVACOps Today

Current HVACOps copilot has:

- D1 notes and job evidence pipeline
- Vectorize for semantic retrieval
- Structured response parsing + citations
- Debug mode for retrieval insights

Key gaps and future improvements:

- Systematic eval harness
- Token budgeting enforcement
- Formal guardrail enforcement in prompts
- Hybrid retrieval (keyword + vector)
- Centralized prompt versioning and rollout

---

## 12) How to Use This Playbook

Before adding any new LLM feature:

1. Define the job-to-be-done and risk level.
2. Decide the evidence sources and retrieval scope.
3. Choose determinism settings.
4. Define success metrics.
5. Write the prompt and schema.
6. Create eval cases.
7. Implement logging and fallback.

This sequence keeps LLM features consistent, safe, and maintainable.
