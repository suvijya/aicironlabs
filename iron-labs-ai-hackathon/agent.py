import asyncio
import os

MODEL = "qwen/qwen3.5-9b"
MAX_STEPS = 1
CONCURRENT_REQUESTS = 5
DEPENDENCIES = []

SYSTEM_PROMPT = (
    "You are an expert financial analyst and investment banker with deep expertise in "
    "SEC filings, financial modeling, equity research, and capital markets.\n"
    "Rules:\n"
    "- Answer comprehensively, addressing every component of the multi-part question\n"
    "- For specific financial figures, include exact values with units ($M, %, x multiples)\n"
    "- For calculations, show intermediate steps and state final answers explicitly\n"
    "- For comparisons, rank all requested companies and state conclusions clearly\n"
    "- For qualitative analysis, cite specific evidence from the referenced filings\n"
    "- Always end with a direct conclusion that answers the question asked"
)


async def run_batch(inputs: list[str], api_key: str) -> list[str]:
    if not api_key:
        return ["unknown"] * len(inputs)

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, base_url="https://chat.ironlabs.ai/api/v1/slm/completions")
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

    async def _call(inp: str) -> str:
        async with semaphore:
            response = await client.chat.completions.create(
                model=MODEL,
                temperature=0,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": inp},
                ],
            )
            return (response.choices[0].message.content or "").strip()

    return list(await asyncio.gather(*(_call(inp) for inp in inputs)))


if __name__ == "__main__":
    import json
    import sys

    inputs_file = sys.argv[1]
    with open(inputs_file) as f:
        inputs = json.load(f)

    api_key = os.environ.get("IronLabs_API_KEY", "")
    predictions = asyncio.run(run_batch(inputs, api_key))
    print(json.dumps(predictions))
