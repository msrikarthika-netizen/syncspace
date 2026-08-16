import os
import sys
import unittest
from unittest.mock import AsyncMock, patch


AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_ROOT not in sys.path:
    sys.path.insert(0, AI_ROOT)

from agents import orchestrator
from rag.chunking import chunk_markdown
from rag.retriever import format_context


class RagTests(unittest.IsolatedAsyncioTestCase):
    def test_router_sends_factual_question_to_simple_route(self):
        self.assertEqual(orchestrator.classify_request("What is the capital of France?"), "simple")

    def test_router_sends_planning_request_to_complex_route(self):
        self.assertEqual(
            orchestrator.classify_request("Create a phased database migration and rollout plan."),
            "complex",
        )

    def test_router_sends_small_programming_request_to_coding_route(self):
        self.assertEqual(
            orchestrator.classify_request("Write a Python function to reverse a string."),
            "coding",
        )

    async def test_simple_route_answers_greeting_without_model_or_agents(self):
        state = {"task_title": "Hello", "task_description": "", "task_id": "task-1"}
        with patch.object(orchestrator, "generate_direct_answer", AsyncMock()) as direct_answer:
            result = await orchestrator.answer_simple_node(state)

        self.assertEqual(result["summary"], "Hello! How can I help you?")
        direct_answer.assert_not_awaited()

    async def test_simple_route_uses_one_short_direct_answer_call(self):
        state = {"task_title": "What is the capital of France?", "task_description": "", "task_id": "task-1"}
        with patch.object(orchestrator, "generate_direct_answer", AsyncMock(return_value="Paris is the capital of France.")) as direct_answer:
            result = await orchestrator.answer_simple_node(state)

        self.assertEqual(result["summary"], "Paris is the capital of France.")
        direct_answer.assert_awaited_once()

    async def test_focused_coding_route_invokes_only_coding_agent(self):
        state = {
            "task_id": "task-1",
            "task_title": "Write a Python function to reverse a string.",
            "task_description": "",
        }
        coding_agent = type("CodingAgent", (), {"agent_type": "coding", "agent_name": "Coding Agent"})()
        coding_agent.run = AsyncMock(return_value={
            "title": "Implement requested code",
            "description": state["task_title"],
            "agent_type": "coding",
            "agent_name": "Coding Agent",
            "status": "completed",
            "result": "def reverse(value): return value[::-1]",
            "order": 1,
        })
        notify = AsyncMock(return_value={"success": True})

        with patch.object(orchestrator, "get_agent", return_value=coding_agent) as get_agent, patch.object(
            orchestrator, "_notify_backend", notify
        ):
            result = await orchestrator.execute_focused_coding_node(state)

        get_agent.assert_called_once_with("coding")
        coding_agent.run.assert_awaited_once()
        self.assertEqual(len(result["completed_results"]), 1)

    def test_chunking_preserves_headings_and_respects_size(self):
        content = "# Design\n\n" + "A useful paragraph. " * 40 + "\n\n## Testing\n\n" + "Tests matter. " * 40
        chunks = chunk_markdown(content, max_chars=240, overlap_chars=40)

        self.assertGreater(len(chunks), 2)
        self.assertTrue(all(len(chunk) <= 300 for chunk in chunks))
        self.assertTrue(any("# Design" in chunk for chunk in chunks))
        self.assertTrue(any("## Testing" in chunk for chunk in chunks))

    def test_context_format_includes_stable_citation_labels(self):
        context = format_context([
            {
                "title": "Coding Guide",
                "category": "coding",
                "similarity": 0.91,
                "content": "Use parameterized queries.",
            }
        ])

        self.assertIn("[K1] Coding Guide", context)
        self.assertIn("Use parameterized queries.", context)

    async def test_retrieval_node_passes_context_to_later_graph_nodes(self):
        source = {
            "source_key": "coding-guide",
            "title": "Coding Guide",
            "category": "coding",
            "chunk_index": 0,
            "similarity": 0.88,
            "content": "Validate untrusted input.",
        }
        state = {"task_id": "task-1", "task_title": "Build an API", "task_description": "Validate input", "tags": []}

        with patch("rag.retriever.retrieve_context", AsyncMock(return_value=[source])):
            result = await orchestrator.retrieve_knowledge_node(state)

        self.assertEqual(result["retrieved_sources"], [source])
        self.assertIn("Validate untrusted input.", result["knowledge_context"])

    async def test_report_records_retrieved_sources(self):
        source = {
            "source_key": "coding-guide",
            "title": "Coding Guide",
            "category": "coding",
            "chunk_index": 0,
            "similarity": 0.88,
            "content": "Validate untrusted input.",
        }
        state = {
            "task_id": "task-1",
            "task_title": "Build an API",
            "summary": "A plan is ready.",
            "user_id": "user-1",
            "completed_results": [],
            "retrieved_sources": [source],
        }
        notify = AsyncMock(return_value={"success": True, "data": {"_id": "report-1"}})

        with patch.object(orchestrator, "_notify_backend", notify):
            result = await orchestrator.build_report_node(state)

        self.assertEqual(result["final_status"], "completed")
        self.assertEqual(notify.await_args.args[1]["stats"]["ragSources"][0]["sourceKey"], "coding-guide")


if __name__ == "__main__":
    unittest.main()
