# IronLabs AI Hackathon — Financial Q&A Agent

## Overview

A single-file LLM agent (`agent.py`) that answers complex financial analyst questions sourced from SEC filings, earnings calls, and capital markets data. Submitted as a Kaggle competition entry.

---

## File Structure

```
iron-labs-ai-hackathon/
├── agent.py              # Submission file — only this is evaluated
├── eval.py               # Scoring rubric (FABv2)
├── train.json            # Labeled examples: input + answer rubric
├── test.json             # Unlabeled inputs for submission
└── submission_example.json  # Expected output format
```

---

## How Evaluation Works (`eval.py`)

Each expected answer is a JSON array of rubric criteria:

```json
[
  {"operator": "correctness", "criteria": "3 year revenue CAGR: 14.56%"},
  {"operator": "contradiction", "criteria": "2024: 2,865,507 ..."}
]
```

The scorer checks each criterion against the model's output:

| Criterion type | Pass condition |
|---|---|
| **Numeric** | Exact number string (e.g. `14.56%`, `$1.261`) appears anywhere in output |
| **Qualitative** | ≥ 50% of significant words (> 5 chars) appear in output |

**Score** = fraction of criteria matched (0.0 – 1.0 per question).

### Key implications

- Never round or reformat a number — `14.56%` must appear verbatim, not `~15%`
- Every sub-part of a multi-part question must be addressed
- Named line items and financial terms matter for qualitative scoring

---

## Submission Format

Output is a flat JSON array of strings, one per test question, in the same order as `test.json`:

```json
["Answer to question 1.", "Answer to question 2.", ...]
```

Run the agent:

```bash
IronLabs_API_KEY=<your_key> python agent.py test.json > submission1.json
```

---

## Agent Design (`agent.py`)

### Model

`qwen/qwen3.5-9b` via the IronLabs OpenAI-compatible endpoint.

### Optimization strategy

#### 1. Few-shot prompting from `train.json`

For each test question, the top-3 most similar training examples are selected by keyword overlap (stdlib `re`, no dependencies). Their rubric criteria are synthesized into compact reference answers and prepended as few-shot context. This teaches the model the required level of numeric precision and term specificity.

#### 2. In-process calculator tool

A safe Python calculator (uses `ast`, no `eval()`) is exposed as an OpenAI function tool. The model calls it for any arithmetic — CAGR, basis point deltas, EV multiples, IRR/MOIC — and copies the exact computed value into its answer. This eliminates rounding errors that would fail numeric criteria checks.

Supported operations: `+ - * / ** // %`, `abs()`, `round()`, `min()`, `max()`, `sum()`.

Example tool calls the model makes:

```
calculate("(2865507 / 1905871) ** (1/2) - 1")   → CAGR
calculate("(14.1 - 13.7) * 100")                 → basis points
calculate("42.4 / 1250 * 100")                   → % of revenue
```

#### 3. Agentic loop (`MAX_STEPS = 6`)

The model iterates: reason → call tool → receive result → reason → … → final answer. The loop exits as soon as the model produces a non-tool-call response.

#### 4. System prompt

Instructs the model to:
- Use the calculator for all arithmetic
- Report exact numbers, never approximate
- Label every sub-part of multi-part questions explicitly as (i), (ii), …
- Name specific line items when citing SEC filing evidence

---

## Question Types in `test.json`

| Type | Example | Key challenge |
|---|---|---|
| Single fact lookup | CFO name, retention metric definition | Term recall |
| Single calculation | Inventory turnover, MSCI lease total | Exact arithmetic |
| CAGR / multi-period | CRWD vs PANW 2-year CAGR | Chain of calculations |
| Beat/miss in bps | AMD gross profit, MU gross margin | Exact delta math |
| Multi-part analysis | BKR/GTLS acquisition (i–iv) | Cover all sub-parts |
| Comparative ranking | MAR vs WH loyalty %, LULU vs VSCO EV | Rank order + exact values |

---

## Environment

| Variable | Description |
|---|---|
| `IronLabs_API_KEY` | API key for the IronLabs LLM endpoint |

Never commit this key.

---

## Dependencies

```
openai>=1.0
```

All other code uses Python stdlib (`asyncio`, `json`, `os`, `re`, `ast`).
