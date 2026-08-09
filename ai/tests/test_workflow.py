import os
import sys
import unittest
from unittest.mock import AsyncMock, patch
import httpx


AI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_ROOT not in sys.path:
    sys.path.insert(0, AI_ROOT)

from agents import orchestrator
from services import llm_service


class _FakeResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {"choices": [{"message": {"content": "router reachable"}}]}


class _FakeClient:
    request_url = None
    request_payload = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def post(self, url, headers, json):
        self.request_url = url
        self.request_payload = json
        return _FakeResponse()


def _completed_result():
    return {
        "title": "Research requirements",
        "description": "Gather requirements.",
        "agent_type": "research",
        "agent_name": "Research Agent",
        "status": "completed",
        "result": "Requirements gathered.",
        "order": 1,
        "duration_ms": 10,
    }


class WorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def test_model_calls_current_hugging_face_router(self):
        fake_client = _FakeClient()
        with patch.object(llm_service.settings, "huggingface_api_key", "test-token"):
            with patch.object(llm_service.httpx, "AsyncClient", return_value=fake_client):
                response = await llm_service.call_hf("Hello", max_tokens=12, temperature=0)

        self.assertEqual(response, "router reachable")
        self.assertEqual(fake_client.request_url, llm_service.settings.hf_router_url)
        self.assertEqual(fake_client.request_payload["messages"], [{"role": "user", "content": "Hello"}])
        self.assertEqual(fake_client.request_payload["model"], llm_service.settings.hf_model)

    async def test_completed_workflow_requires_saved_report(self):
        state = {
            "task_id": "task-1",
            "task_title": "Prepare plan",
            "summary": "A complete plan is ready.",
            "user_id": "user-1",
            "completed_results": [_completed_result()],
        }
        notify = AsyncMock(return_value={"success": True, "data": {"_id": "report-1"}})

        with patch.object(orchestrator, "_notify_backend", notify):
            result = await orchestrator.build_report_node(state)

        self.assertEqual(result["final_status"], "completed")
        self.assertEqual(result["report_id"], "report-1")
        self.assertEqual(notify.await_count, 1)

    async def test_failed_agent_produces_failed_report_status(self):
        failed_result = {**_completed_result(), "status": "failed", "result": "", "error": "Inference unavailable"}
        state = {
            "task_id": "task-2",
            "task_title": "Prepare plan",
            "summary": "The workflow failed.",
            "user_id": "user-1",
            "completed_results": [failed_result],
        }
        notify = AsyncMock(return_value={"success": True, "data": {"_id": "report-2"}})

        with patch.object(orchestrator, "_notify_backend", notify):
            result = await orchestrator.build_report_node(state)

        self.assertEqual(result["final_status"], "failed")
        self.assertEqual(notify.await_args.args[1]["task_status"], "failed")

    async def test_missing_model_key_is_not_reported_as_success(self):
        with patch.object(llm_service.settings, "huggingface_api_key", ""):
            with self.assertRaisesRegex(RuntimeError, "HUGGINGFACE_API_KEY"):
                await llm_service.call_hf("test")

    def test_forbidden_provider_error_explains_token_remediation(self):
        request = httpx.Request("POST", "https://router.huggingface.co/v1/chat/completions")
        response = httpx.Response(403, request=request)
        error = httpx.HTTPStatusError("403 Forbidden", request=request, response=response)

        message = llm_service._inference_error_message(error)

        self.assertIn("Make calls to Inference Providers", message)


if __name__ == "__main__":
    unittest.main()
