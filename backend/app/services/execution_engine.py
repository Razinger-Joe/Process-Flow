"""
ProcessFlow Studio — Workflow Execution Engine

Orchestrates the running of a workflow. Traverses the node graph,
invokes matching runners, manages execution state, and logs results.
"""

import asyncio
from datetime import datetime, timezone
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.run import RunRecord
from app.models.workflow import Workflow
from app.services.node_runners import ExecutionContext
from app.services.node_runners import (
    condition,
    data_transform,
    http_request,
    log_result,
    scheduler,
    send_email,
)

# Mock runner for triggers that don't need external operations during execution
async def run_trigger_node(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    context.add_log("Trigger activated successfully", node_id, "success")
    return config.get("mock_payload") or {"triggered": True}

# Node type/label mapping to runners
RUNNERS = {
    "HTTP request": http_request,
    "Send email": send_email,
    "Condition": condition,
    "Data transform": data_transform,
    "Log result": log_result,
    "Scheduler trigger": scheduler,
    "Manual trigger": run_trigger_node,
    "Webhook trigger": run_trigger_node,
}


class WorkflowEngine:
    """Core engine to execute workflow definitions node-by-node."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute(self, run_id: uuid.UUID | str) -> None:
        """Loads a run record, executes its workflow graph, and writes progress."""
        # Normalize run_id to UUID object (API may pass string)
        if isinstance(run_id, str):
            run_id = uuid.UUID(run_id)

        # 1. Fetch RunRecord and associated Workflow
        result = await self.db.execute(select(RunRecord).where(RunRecord.id == run_id))
        run_record = result.scalar_one_or_none()
        if not run_record:
            print(f"Engine Error: RunRecord {run_id} not found.")
            return

        # Fetch the workflow
        wf_result = await self.db.execute(select(Workflow).where(Workflow.id == run_record.workflow_id))
        workflow = wf_result.scalar_one_or_none()
        if not workflow or not workflow.is_active:
            run_record.status = "error"
            run_record.completed_at = datetime.now(timezone.utc)
            run_record.logs = [{
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "nodeId": "system",
                "level": "error",
                "message": "Workflow definition not found or deactivated.",
            }]
            await self.db.commit()
            return

        # 2. Update status to running
        run_record.status = "running"
        run_record.started_at = datetime.now(timezone.utc)
        await self.db.commit()

        # Initialize context
        context = ExecutionContext(run_id)
        context.add_log(f"⚡ Starting execution for workflow: '{workflow.name}'", "system", "info")

        try:
            # 3. Parse graph structure
            definition = workflow.definition or {}
            nodes = definition.get("nodes", [])
            edges = definition.get("edges", [])

            if not nodes:
                raise ValueError("Workflow contains no nodes.")

            # Find the trigger/root node
            trigger_node = None
            for node in nodes:
                if node.get("type") == "trigger":
                    trigger_node = node
                    break
            
            if not trigger_node:
                # Fallback: look for a node with no incoming edges
                targets = {edge.get("target") for edge in edges}
                for node in nodes:
                    if node.get("id") not in targets:
                        trigger_node = node
                        break

            if not trigger_node:
                raise ValueError("Could not determine a trigger/starting node for the workflow.")

            # Construct graph adjacency list
            # adj_list: { source_id: [{"target": target_id, "sourceHandle": handle_name}] }
            adj_list = {node["id"]: [] for node in nodes}
            for edge in edges:
                source = edge.get("source")
                target = edge.get("target")
                source_handle = edge.get("sourceHandle")
                if source in adj_list:
                    adj_list[source].append({"target": target, "sourceHandle": source_handle})

            node_map = {node["id"]: node for node in nodes}

            # 4. BFS Traversal & Execution loop
            queue = [trigger_node["id"]]
            visited = set()
            last_output = {}

            while queue:
                # Check cancellation flag (re-query DB or check context)
                await self.db.refresh(run_record)
                if run_record.status == "cancelled":
                    context.add_log("Workflow execution cancelled by user.", "system", "warning")
                    context.cancel_flag = True
                    break

                curr_id = queue.pop(0)
                if curr_id in visited:
                    continue

                node = node_map.get(curr_id)
                if not node:
                    continue

                node_label = node.get("label", "")
                node_type = node.get("type", "")
                config = node.get("config", {})

                # Find correct runner by matching prefix
                runner_module = None
                for runner_name, module in RUNNERS.items():
                    if node_label.startswith(runner_name):
                        runner_module = module
                        break
                if not runner_module:
                    context.add_log(f"Warning: No runner found for node '{node_label}' (type: {node_type}). Using stub.", curr_id, "warning")
                    runner_module = run_trigger_node

                # Execute Node
                context.add_log(f"Executing step '{node_label}'...", curr_id, "info")
                
                # Simulate a tiny execution latency (100ms) to mirror production workflow engines
                await asyncio.sleep(0.1)

                try:
                    # Run node logic
                    if hasattr(runner_module, "run"):
                        output = await runner_module.run(curr_id, config, context)
                    else:
                        output = await runner_module(curr_id, config, context)
                    context.data[curr_id] = output
                    last_output = output
                except Exception as node_err:
                    context.add_log(f"Execution failed on step '{node_label}': {node_err}", curr_id, "error")
                    raise node_err

                visited.add(curr_id)

                # Process downstream edges
                outgoing_edges = adj_list.get(curr_id, [])
                
                # Special handling for condition branching
                if node_label.startswith("Condition"):
                    result_val = output.get("result", False)
                    target_handle = "true" if result_val else "false"
                    context.add_log(f"Branching: following '{target_handle}' path", curr_id, "info")
                    
                    for edge in outgoing_edges:
                        # React Flow edge handle match
                        if str(edge.get("sourceHandle")).lower() == target_handle:
                            queue.append(edge["target"])
                else:
                    # Standard nodes: proceed to all targets
                    for edge in outgoing_edges:
                        queue.append(edge["target"])

                # Periodically write logs to database during run for real-time SSE updates
                run_record.logs = context.logs
                await self.db.commit()

            # 5. Success completion
            if not context.cancel_flag:
                run_record.status = "success"
                context.add_log("✅ Workflow completed successfully.", "system", "success")
                run_record.result = last_output
            else:
                run_record.status = "error"  # or cancelled

        except Exception as err:
            # 6. Error handling
            run_record.status = "error"
            context.add_log(f"❌ Workflow execution aborted due to error: {err}", "system", "error")
        
        finally:
            run_record.logs = context.logs
            run_record.completed_at = datetime.now(timezone.utc)
            await self.db.commit()
