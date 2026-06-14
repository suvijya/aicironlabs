import ast
import asyncio
import json
import os
import re

# Xiaomi MiMo — OpenAI-compatible API
# Docs: https://mimo.mi.com/docs/en-US/quick-start/first-api-call
MODEL = "mimo-v2.5"           # fast; swap to "mimo-v2-pro" for best quality
OPENROUTER_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1"
MAX_STEPS = 1
CONCURRENT_REQUESTS = 5
DEPENDENCIES = ["openai"]

SYSTEM_PROMPT = (
    "You are an expert financial analyst and investment banker with deep expertise in "
    "SEC filings, financial modeling, equity research, and capital markets.\n"
    "Rules:\n"
    "- Answer comprehensively, addressing every component of the multi-part question\n"
    "- Include EXACT numeric values: dollar amounts, percentages, basis points, share counts, "
    "multiples — never round or approximate\n"
    "- For calculations, show all intermediate steps explicitly and state the final answer clearly\n"
    "- For multi-part questions label each part: (i), (ii), (iii), …\n"
    "- For comparisons, rank all requested companies and state conclusions clearly\n"
    "- For qualitative analysis, name the specific line items or disclosures cited\n"
    "- Always end with a direct conclusion that answers the question asked"
)

# ── Training data for few-shot prompting ─────────────────────────────────────

_TRAIN_EXAMPLES: list[dict] = []


def _load_train(path: str) -> None:
    global _TRAIN_EXAMPLES
    if _TRAIN_EXAMPLES or not os.path.exists(path):
        return
    with open(path) as f:
        _TRAIN_EXAMPLES = json.load(f)


def _keyword_score(query: str, example_input: str) -> int:
    q = set(re.findall(r"\b[a-z]{4,}\b", query.lower()))
    e = set(re.findall(r"\b[a-z]{4,}\b", example_input.lower()))
    return len(q & e)


def _criteria_to_answer(answer_json: str) -> str:
    try:
        rubric = json.loads(answer_json)
        seen: set[str] = set()
        facts: list[str] = []
        for item in rubric:
            c = item.get("criteria", "")
            if c and c not in seen:
                seen.add(c)
                facts.append(c)
        return " | ".join(facts)
    except Exception:
        return answer_json


def _build_prompt(query: str, k: int = 3) -> str:
    if not _TRAIN_EXAMPLES:
        return query
    ranked = sorted(
        _TRAIN_EXAMPLES,
        key=lambda ex: _keyword_score(query, ex["input"]),
        reverse=True,
    )
    top = [ex for ex in ranked[:k] if _keyword_score(query, ex["input"]) > 1]
    if not top:
        return query
    header = (
        "The following examples show the level of numeric precision and completeness required. "
        "They are for format reference only — do not treat their figures as facts about the current question.\n\n"
    )
    shots = ""
    for ex in top:
        ref = _criteria_to_answer(ex.get("answer", ""))
        shots += f"Example: {ex['input']}\nKey facts needed: {ref}\n\n"
    return f"{header}{shots}Now answer with the same precision:\n{query}"


# ── Safe calculator ───────────────────────────────────────────────────────────

_ALLOWED_FUNCS = {"abs", "round", "min", "max", "sum", "pow", "int", "float"}
_ALLOWED_NODES = (
    ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant, ast.Call,
    ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.FloorDiv, ast.Mod,
    ast.USub, ast.UAdd, ast.Load, ast.Name, ast.Tuple, ast.List,
)


def _safe_calculate(expression: str) -> str:
    if not expression.strip():
        return "Error: empty expression"
    try:
        tree = ast.parse(expression.strip(), mode="eval")
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if not (isinstance(node.func, ast.Name) and node.func.id in _ALLOWED_FUNCS):
                    return "Error: function not allowed"
            elif not isinstance(node, _ALLOWED_NODES):
                return "Error: unsupported operation"
        result = eval(compile(tree, "<calc>", "eval"))  # noqa: S307 — whitelist-validated
        return str(result)
    except ZeroDivisionError:
        return "Error: division by zero"
    except Exception as exc:
        return f"Error: {exc}"


# ── Agentic loop with tool calling ───────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": (
                "Evaluate a mathematical expression and return the exact numeric result. "
                "Use for CAGR, basis points, EV multiples, IRR, MOIC, percentage changes. "
                "Supports: + - * / ** // % abs() round() min() max() sum() pow() int() float(). "
                "Example: (2865507/1905871)**(1/2)-1"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression to evaluate."}
                },
                "required": ["expression"],
            },
        },
    }
]


async def _call(client, inp: str) -> str:
    prompt = _build_prompt(inp)
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return (response.choices[0].message.content or "").strip() or "unknown"
    except Exception as exc:
        import sys
        print(f"[ERROR] {exc}", file=sys.stderr)
        return "unknown"


# ── Public entry point ────────────────────────────────────────────────────────

async def run_batch(inputs: list[str], api_key: str) -> list[str]:
    if not api_key:
        api_key = (
            os.environ.get("MIMO_API_KEY")
            or os.environ.get("OPENROUTER_API_KEY")
            or os.environ.get("IRONAAI_API_KEY")
            or os.environ.get("IronLabs_API_KEY")
            or ""
        )
    if not api_key:
        import sys
        print("[ERROR] No API key. Set MIMO_API_KEY, IRONAAI_API_KEY, or IronLabs_API_KEY in .env", file=sys.stderr)
        return ["unknown"] * len(inputs)

    train_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "train.json")
    _load_train(train_path)

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)

    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

    async def _bounded(inp: str) -> str:
        async with semaphore:
            return await _call(client, inp)

    return list(await asyncio.gather(*(_bounded(inp) for inp in inputs)))


def _load_env(path: str = ".env") -> None:
    """Load key=value pairs from a .env file into os.environ."""
    here = os.path.dirname(os.path.abspath(__file__))
    dotenv = os.path.join(here, path)
    if not os.path.exists(dotenv):
        return
    with open(dotenv) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


if __name__ == "__main__":
    import sys

    _load_env()

    inputs_file = sys.argv[1] if len(sys.argv) > 1 else "test.json"
    with open(inputs_file) as f:
        raw = json.load(f)

    inputs = [item["input"] if isinstance(item, dict) else item for item in raw]
    api_key = (
        os.environ.get("MIMO_API_KEY")
        or os.environ.get("OPENROUTER_API_KEY")
        or os.environ.get("IRONAAI_API_KEY")
        or os.environ.get("IronLabs_API_KEY")
        or ""
    )
    predictions = asyncio.run(run_batch(inputs, api_key))
    print(json.dumps(predictions))
