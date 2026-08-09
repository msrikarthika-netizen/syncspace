import json
import re
import httpx
from loguru import logger
from config.settings import settings


def _inference_error_message(error: Exception) -> str:
    if isinstance(error, httpx.HTTPStatusError) and error.response.status_code == 403:
        return (
            "Hugging Face rejected the API token (403). Create a fine-grained token with "
            "the 'Make calls to Inference Providers' permission, replace HUGGINGFACE_API_KEY "
            "in ai/.env, and restart the AI service."
        )
    return f"AI inference is unavailable: {error}"


async def call_hf(prompt: str, max_tokens: int = 1024, temperature: float = 0.4) -> str:
    """Make a chat-completion request through Hugging Face Inference Providers."""
    if not settings.huggingface_api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY is not configured")

    payload = {
        "model": settings.hf_model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {settings.huggingface_api_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(settings.hf_router_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices", []) if isinstance(data, dict) else []
        if choices:
            generated_text = str(choices[0].get("message", {}).get("content", "")).strip()
            if generated_text:
                return generated_text
            raise ValueError("Hugging Face returned an empty chat completion")
        raise ValueError(f"Unexpected HF response format: {data}")
    except Exception as e:
        logger.error(f"HuggingFace inference failed: {e}")
        raise RuntimeError(_inference_error_message(e)) from e


async def break_task_into_subtasks(task_title: str, task_description: str) -> list[dict]:
    """
    Use the LLM to decompose a task into typed subtasks for specialist agents.
    Returns a list of subtask dicts with keys: title, description, agent_type, order.
    """
    prompt = f"""You are an expert project manager AI. Break down the following task into exactly 4 specific subtasks, one for each specialist AI agent: research, analysis, coding, and writing.

Task title: {task_title}
Task description: {task_description}

Respond ONLY with a valid JSON array (no markdown, no explanation). Each item must have:
- "title": short subtask title (max 60 chars)
- "description": clear instructions for the agent (2-3 sentences)
- "agent_type": one of "research", "coding", "writing", "analysis"
- "order": integer starting at 1

Example format:
[
  {{"title": "...", "description": "...", "agent_type": "research", "order": 1}},
  {{"title": "...", "description": "...", "agent_type": "analysis", "order": 2}},
  {{"title": "...", "description": "...", "agent_type": "coding", "order": 3}},
  {{"title": "...", "description": "...", "agent_type": "writing", "order": 4}}
]
"""

    try:
        raw = await call_hf(prompt, max_tokens=600, temperature=0.3)
        logger.info(f"Orchestrator raw output: {raw[:300]}")
    except Exception as exc:
        logger.error(f"HF call failed: {exc}. Using default subtasks.")
        return _default_subtasks(task_title)

    # Extract JSON array robustly
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not match:
        logger.warning("No JSON array found; falling back to default subtask plan")
        return _default_subtasks(task_title)

    try:
        subtasks = json.loads(match.group())
        if not isinstance(subtasks, list) or not subtasks:
            raise ValueError("Empty list")
        # Validate & clamp
        valid = []
        for i, s in enumerate(subtasks[:5]):
            valid.append({
                "title": str(s.get("title", f"Subtask {i+1}"))[:100],
                "description": str(s.get("description", "")),
                "agent_type": s.get("agent_type", "general") if s.get("agent_type") in
                              ("research", "coding", "writing", "analysis") else "general",
                "order": int(s.get("order", i + 1)),
            })
        return _ensure_all_specialists(valid, task_title)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error(f"JSON parse error: {exc}. Using default subtasks.")
        return _default_subtasks(task_title)


def _ensure_all_specialists(subtasks: list[dict], task_title: str) -> list[dict]:
    """Guarantee the live monitor has one assignment for every specialist agent."""
    specialist_order = ["research", "analysis", "coding", "writing"]
    by_agent = {}
    for subtask in subtasks:
        agent_type = subtask.get("agent_type")
        if agent_type in specialist_order and agent_type not in by_agent:
            by_agent[agent_type] = subtask

    defaults = {subtask["agent_type"]: subtask for subtask in _default_subtasks(task_title)}
    normalized = []
    for order, agent_type in enumerate(specialist_order, start=1):
        subtask = by_agent.get(agent_type, defaults[agent_type])
        normalized.append({
            **subtask,
            "agent_type": agent_type,
            "order": order,
        })
    return normalized


def _default_subtasks(task_title: str) -> list[dict]:
    return [
        {
            "title": "Research & gather context",
            "description": f"Research background information and context for: {task_title}",
            "agent_type": "research",
            "order": 1,
        },
        {
            "title": "Analyze requirements",
            "description": f"Analyze all requirements and constraints for: {task_title}",
            "agent_type": "analysis",
            "order": 2,
        },
        {
            "title": "Design implementation approach",
            "description": f"Create a practical implementation strategy, architecture, or code-oriented plan for: {task_title}",
            "agent_type": "coding",
            "order": 3,
        },
        {
            "title": "Produce final output",
            "description": f"Write the final structured output and recommendations for: {task_title}",
            "agent_type": "writing",
            "order": 4,
        },
    ]


async def run_agent_task(agent_type: str, agent_name: str, task_title: str,
                         subtask_title: str, subtask_description: str) -> str:
    """Execute a specific agent's work using an agent-tailored prompt."""
    system_prompts = {
        "research": "You are a meticulous Research Agent. You gather facts, references, and contextual information with precision. Cite key points clearly.",
        "coding": "You are an expert Coding Agent. You write clean, commented, production-ready code. Include explanations and usage examples.",
        "writing": "You are a skilled Writing Agent. You produce clear, structured, professional written content with proper headings and logical flow.",
        "analysis": "You are an analytical Analysis Agent. You evaluate data, identify patterns, assess risks, and provide actionable insights.",
        "general": "You are a capable General Agent. You complete tasks thoroughly and present results in a clear, structured manner.",
    }
    system = system_prompts.get(agent_type, system_prompts["general"])

    prompt = f"""{system}

Main project: {task_title}
Your assigned subtask: {subtask_title}
Instructions: {subtask_description}

Complete this subtask thoroughly. Structure your response with clear sections. Be specific and detailed."""

    result = await call_hf(prompt, max_tokens=800, temperature=0.5)
    return result.strip()


async def generate_report_summary(task_title: str, subtask_results: list[dict]) -> str:
    """Generate an executive summary from all agent results."""
    results_text = "\n\n".join(
        [f"--- {r['agent_name']} ({r['agent_type']}) ---\n{r['result'][:400]}"
         for r in subtask_results]
    )
    prompt = f"""You are a senior report writer. Based on the following AI agent outputs for the task "{task_title}", write a concise executive summary (3-5 sentences) that captures the key findings, outcomes, and recommendations.

Agent outputs:
{results_text}

Write only the executive summary, no preamble:"""

    try:
        return await call_hf(prompt, max_tokens=300, temperature=0.4)
    except Exception as exc:
        logger.error(f"HF call failed during summary generation: {exc}")
        return "Executive summary generation failed due to an AI service error. Please review the individual subtask results."
