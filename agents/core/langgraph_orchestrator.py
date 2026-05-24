"""
Core Multi-Agent Orchestrator
Simple sequential pipeline to align with the functional spec.
"""

from typing import TypedDict, List, Dict, Any
from enum import Enum
import logging
from pathlib import Path

from agents.parsing_agent.agent import ParsingAgent
from agents.analysis_agent.agent import AnalysisAgent
from agents.qa_agent.agent import QAAgent
from agents.test_generator_agent.agent import TestGeneratorAgent
from agents.citation_agent.agent import CitationAgent
from agents.export_agent.agent import ExportAgent, ExportFormat

logger = logging.getLogger(__name__)


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"


class ProjectState(TypedDict):
    document_id: str
    document_path: str
    extracted_text: str
    tables: List[Dict[str, Any]]
    requirements: List[Dict[str, Any]]
    questions: List[str]
    answers: List[Dict[str, Any]]
    test_cases: List[Dict[str, Any]]
    citations: List[Dict[str, Any]]
    agent_status: Dict[str, AgentStatus]
    errors: List[Dict[str, Any]]
    metadata: Dict[str, Any]


def run_workflow(document_id: str, document_path: str, workflow_type: str = "full") -> ProjectState:
    """Pipeline synchrone parse -> analyse -> index -> QA/Test -> export."""
    state: ProjectState = {
        "document_id": document_id,
        "document_path": document_path,
        "extracted_text": "",
        "tables": [],
        "requirements": [],
        "questions": [],
        "answers": [],
        "test_cases": [],
        "citations": [],
        "agent_status": {},
        "errors": [],
        "metadata": {},
    }

    parsing = ParsingAgent()
    analysis = AnalysisAgent()
    qa = QAAgent()
    testgen = TestGeneratorAgent()
    citation = CitationAgent()
    export = ExportAgent()

    try:
        state["agent_status"]["parsing"] = AgentStatus.RUNNING
        parsed = _run_sync(parsing.ingest_and_index(document_id, document_path))
        state["agent_status"]["parsing"] = AgentStatus.COMPLETED
        state["metadata"] = parsed.get("metadata", {})

        text_path = Path("data/processed") / f"{document_id}.txt"
        text = text_path.read_text(encoding="utf-8") if text_path.exists() else ""
        state["extracted_text"] = text

        state["agent_status"]["analysis"] = AgentStatus.RUNNING
        analysis_result = _run_sync(analysis.analyze(text, document_id))
        state["requirements"] = analysis_result.get("requirements", [])
        state["agent_status"]["analysis"] = AgentStatus.COMPLETED

        state["agent_status"]["testgen"] = AgentStatus.RUNNING
        test_cases = _run_sync(testgen.generate_test_cases(state["requirements"]))
        trace = _run_sync(testgen.create_traceability_matrix(state["requirements"], test_cases))
        state["test_cases"] = test_cases
        state["agent_status"]["testgen"] = AgentStatus.COMPLETED

        # Example QA: reuse first requirement as seed question if none provided
        if workflow_type == "full" and state["requirements"]:
            q = f"Quel est l'objectif principal de {state['requirements'][0]['id']} ?"
            state["questions"].append(q)
            state["agent_status"]["qa"] = AgentStatus.RUNNING
            answer = _run_sync(qa.answer_question(q, document_id))
            state["answers"].append(answer)
            state["citations"] = answer.get("citations", [])
            state["agent_status"]["qa"] = AgentStatus.COMPLETED

        # Export JSON + Excel in data/exports
        export_dir = Path("data/exports")
        export_dir.mkdir(parents=True, exist_ok=True)
        payload = {
            "requirements": state["requirements"],
            "test_cases": state["test_cases"],
            "traceability": trace,
            "answers": state["answers"],
            "citations": state.get("citations", []),
            "metadata": state.get("metadata", {}),
        }
        _run_sync(export.export(payload, ExportFormat.JSON, str(export_dir / f"{document_id}.json")))
        _run_sync(export.export(payload, ExportFormat.EXCEL, str(export_dir / f"{document_id}.xlsx")))

    except Exception as exc:
        logger.error("Workflow error: %s", exc)
        state["errors"].append({"step": "workflow", "message": str(exc)})
        state["agent_status"]["workflow"] = AgentStatus.ERROR
    return state


def _run_sync(awaitable):
    import asyncio

    # AnyIO worker threads (FastAPI background tasks) don't have a running loop by default.
    # Create a dedicated loop when none exists to avoid "There is no current event loop" errors.
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        # If we're already inside an event loop (unlikely here), schedule and wait.
        return asyncio.run_coroutine_threadsafe(awaitable, loop).result()

    try:
        return loop.run_until_complete(awaitable)
    finally:
        # Cleanly close the loop we created to avoid warnings/leaks.
        if not loop.is_running():
            loop.close()


if __name__ == "__main__":
    result = run_workflow("demo", "/tmp/demo.pdf")
    print("Workflow finished", result.get("agent_status"))
