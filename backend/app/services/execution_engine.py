"""
ProcessFlow Studio — Workflow Execution Engine

Core orchestrator that runs a workflow node-by-node.
Follows edges to determine execution order, calls the
matching node runner for each step, and tracks results.
"""
