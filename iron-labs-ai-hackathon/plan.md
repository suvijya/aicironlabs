# Implementation Plan — Agent Optimization (Risk-Mitigated)

## Scope

Rewrite `agent.py` within the single-file constraint.
No new files. No new dependencies beyond `openai` (already required).
Every identified risk has a built-in guard — no mitigation is left to documentation alone.

---

## Architecture

```
agent.py
├── _TRAIN_EXAMPLES          # module-level list, populated once at process start
├── _safe_calculate(expr)    # AST-safe calculator — always returns a string
├── TOOLS                    # OpenAI tool schema for the calculator
├── _load_train(path)        # guards: checks path exists before open
├── _keyword_score(q, ex)    # pure function, no side effects
├── _criteria_to_answer(j)   # wraps json.loads in try/except
├── _build_prompt(query, k)  # returns bare query if no good examples found
├── _call(inp)               # agentic loop with per-step exception handling
└── run_batch(inputs, key)   # public signature unchanged from original
```

---

## Components with built-in mitigations

### 1. `_safe_calculate(expression: str) → str`

Uses `ast.parse` + a whitelist visitor. Raises `ValueError` on anything outside
the whitelist. All exceptions are caught internally — the function **always**
returns a string, never raises.

**Whitelist**
- Nodes: `Expression BinOp UnaryOp Num Constant Call`
- Operators: `Add Sub Mul Div Pow FloorDiv Mod USub UAdd`
- Functions: `abs round min max sum pow int float`

**Error path**: any exception → returns `"Error: <message>"`.
The model receives the error string, sees it failed, and either retries with a
corrected expression or abandons the tool call and reasons in text.
No crash. No infinite loop.

```
(2865507 / 1905871) ** (1/2) - 1   →  "0.22634..."   CAGR
(14.1 - 13.7) * 100                →  "40.0"         basis points
open("secrets.txt")                →  "Error: ..."   blocked by whitelist
__import__("os")                   →  "Error: ..."   blocked by whitelist
```

---

### 2. `TOOLS` constant

Single tool `calculate`. Passed on every LLM call.

**Risk: endpoint ignores `tools`**
Guard: the agentic loop checks `message.tool_calls` before processing.
If `None` or empty → loop exits immediately, returns the model's text.
No extra round-trips, no error, no empty output.

---

### 3. `_load_train(path)` + `_TRAIN_EXAMPLES`

Called once at the start of `run_batch`.

**Risk: `train.json` absent on Kaggle**
Guard: `if not os.path.exists(path): return` before any file I/O.
Result: `_TRAIN_EXAMPLES` stays `[]`. `_build_prompt` detects the empty list
and returns the bare query. Few-shot silently disabled — submission format
is unaffected.

---

### 4. `_build_prompt(query, k=3) → str`

Scores every training example by keyword overlap (words ≥ 4 chars, stdlib `re`).

**Risk: low-relevance examples inject wrong financial facts**
Guards:
- Only examples with overlap score **> 1** qualify (at least 2 shared meaningful words)
- Cap at `k = 3` maximum
- Each example is prefixed *"Example question / Expected key facts"* — framed as
  a demonstration of format, not as facts about the current ticker
- If no example clears the threshold → returns the bare query (zero token overhead)

Token overhead when examples are found: ~400–700 tokens per request.
Across all 23 test questions worst-case: ~16k extra tokens total.

---

### 5. `_call(inp) → str` — Agentic loop

```
messages = [system, user(_build_prompt(inp))]
last_text = ""
for step in range(MAX_STEPS):           # hard cap = 6
    try:
        response = await LLM(messages, tools=TOOLS)
    except Exception:
        break                            # network/API error → return what we have
    msg = response.choices[0].message
    if msg.content:
        last_text = msg.content
    if not msg.tool_calls:
        return last_text                 # normal exit
    messages.append(msg)
    for tc in msg.tool_calls:
        try:
            args = json.loads(tc.function.arguments)
        except Exception:
            args = {}
        result = _safe_calculate(args.get("expression", ""))
        messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})
return last_text or "unknown"            # MAX_STEPS fallback
```

**Risk: MAX_STEPS exceeded without a final answer**
Guard: `last_text` always holds the last non-empty assistant content.
If the loop hits the cap it returns that, never an empty string.

**Risk: `json.loads` fails on malformed tool arguments**
Guard: inner `try/except` + `.get("expression", "")` default.
Empty expression → `_safe_calculate` returns `"Error: empty"` → model self-corrects.

**Risk: LLM API error mid-loop**
Guard: outer `try/except` breaks the loop, returns `last_text or "unknown"`.
`run_batch` always gets a string for every input.

---

## Implementation steps (ordered — no step depends on a later one)

| # | What changes | Guard added in this step |
|---|---|---|
| 1 | `MAX_STEPS = 6` | Hard iteration cap |
| 2 | Add `_safe_calculate()` | AST whitelist + catch-all except |
| 3 | Add `TOOLS` constant | — |
| 4 | Add `_TRAIN_EXAMPLES = []` + `_load_train()` | `os.path.exists` guard |
| 5 | Add `_keyword_score()`, `_criteria_to_answer()`, `_build_prompt()` | Threshold > 1; try/except in criteria parser |
| 6 | Rewrite `_call()` as agentic loop | try/except on LLM + tool args; `last_text` fallback |
| 7 | Wire `_load_train()` + `_build_prompt()` into `run_batch` | — |
| 8 | Expand `SYSTEM_PROMPT` | Instructs model to use calculator + label sub-parts |

Total: ~130 new/changed lines. Final file: ~180 lines, well under 500.

---

## Failure mode table

| Failure | Where it surfaces | Built-in guard | Worst outcome |
|---|---|---|---|
| `train.json` missing | `_load_train` | `os.path.exists` | Few-shot disabled; bare query sent |
| No matching train examples | `_build_prompt` | overlap threshold > 1 | Bare query, zero overhead |
| Wrong ticker in few-shot | `_build_prompt` | framed as example, not assertion | Model may slightly anchor; overlap filter limits this |
| Endpoint rejects `tools` | `_call` loop | checks `tool_calls is None` | Exits step 1; returns plain text answer |
| Model sends bad expression | `_safe_calculate` | AST whitelist + except | Returns `"Error:"`, model self-corrects or skips |
| Loop exceeds MAX_STEPS | `_call` loop | `last_text` accumulator | Returns last partial answer, not empty string |
| LLM API error mid-loop | `_call` loop | outer try/except | Returns `last_text or "unknown"` |
| Malformed tool call JSON | `_call` loop | inner try/except + `.get` default | Empty expression → `"Error:"` back to model |

---

## Success criteria

| Check | How to verify |
|---|---|
| `eval.py` score on train set improves | Run agent on train inputs, score each with `eval.score()` |
| All test questions return a non-empty string | `assert all(isinstance(p, str) and p for p in predictions)` |
| No unhandled exceptions | Run with `IronLabs_API_KEY=""` — must return `["unknown"] * N` cleanly |
| File under 500 lines | Check line count after rewrite |

---

## Non-goals

- Web search / live data retrieval — requires external API key, violates single-file constraint
- Fine-tuning — not possible at inference time
- Caching SEC filing data — out of scope for this submission
