"""Temporary runner: loads .env and executes agent.py against test.json"""
import asyncio
import json
import os
import sys


def load_env(path=".env"):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


load_env()

sys.path.insert(0, os.path.dirname(__file__))
from agent import run_batch

inputs_file = sys.argv[1] if len(sys.argv) > 1 else "test.json"
with open(inputs_file) as f:
    raw = json.load(f)

inputs = [item["input"] if isinstance(item, dict) else item for item in raw]
api_key = os.environ.get("IRONAAI_API_KEY") or os.environ.get("IronLabs_API_KEY", "")

predictions = asyncio.run(run_batch(inputs, api_key))
print(json.dumps(predictions, indent=2))
