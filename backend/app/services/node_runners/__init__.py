"""
ProcessFlow Studio — Node Runners Package

Defines the shared ExecutionContext and recursive template interpolation helpers
used by all individual node type runners.
"""

from datetime import datetime, timezone
import re
import uuid
from typing import Any


class ExecutionContext:
    """Carries output data and logs between nodes during workflow execution."""

    def __init__(self, run_id: uuid.UUID):
        self.run_id = run_id
        self.data = {}  # Map of node_id -> output dict
        self.logs = []  # List of log dicts: [{"id", "timestamp", "nodeId", "level", "message"}]
        self.cancel_flag = False

    def add_log(self, message: str, node_id: str | None = None, level: str = "info"):
        """Add a formatted log line to the context."""
        self.logs.append({
            "id": str(uuid.uuid4())[:8],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "nodeId": node_id,
            "level": level,
            "message": message,
        })


def interpolate_value(val: str, context_data: dict) -> Any:
    """
    Interpolates {{data.node_id.field}} style templates within strings.
    If the string is exactly a template (e.g. "{{path}}"), returns the raw object.
    """
    if not isinstance(val, str):
        return val

    # Check if the string is exactly a single template like "{{some.path}}"
    exact_match = re.match(r'^\{\{\s*(.*?)\s*\}\}$', val)
    if exact_match:
        path = exact_match.group(1).strip()
        parts = path.split('.')
        current = context_data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            elif (isinstance(current, list) or isinstance(current, dict)) and part == "length":
                current = len(current)
            else:
                return val  # Return original string if path not found
        return current

    # Otherwise do standard substring regex replacement
    def replacer(match):
        path = match.group(1).strip()
        parts = path.split('.')
        current = context_data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            elif (isinstance(current, list) or isinstance(current, dict)) and part == "length":
                current = len(current)
            else:
                return match.group(0)
        return str(current)

    return re.sub(r'\{\{(.*?)\}\}', replacer, val)


def interpolate_object(obj, context_data: dict):
    """
    Recursively interpolates string templates inside dicts, lists, and strings.
    """
    if isinstance(obj, str):
        return interpolate_value(obj, context_data)
    elif isinstance(obj, dict):
        return {k: interpolate_object(v, context_data) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [interpolate_object(item, context_data) for item in obj]
    return obj
