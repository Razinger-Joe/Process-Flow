"""
ProcessFlow Studio — Node Runners

Each module implements a runner for a specific node type.
All runners share the same interface:
    async def run(config: dict, context: ExecutionContext) -> dict
"""
