from agents.base_agent import BaseAgent


class ResearchAgent(BaseAgent):
    agent_type = "research"
    agent_name = "Research Agent"
    emoji = "🔍"


class CodingAgent(BaseAgent):
    agent_type = "coding"
    agent_name = "Coding Agent"
    emoji = "💻"


class WritingAgent(BaseAgent):
    agent_type = "writing"
    agent_name = "Writing Agent"
    emoji = "✍️"


class AnalysisAgent(BaseAgent):
    agent_type = "analysis"
    agent_name = "Analysis Agent"
    emoji = "📊"


class GeneralAgent(BaseAgent):
    agent_type = "general"
    agent_name = "General Agent"
    emoji = "🤖"


# Registry — maps agent_type string to agent instance
AGENT_REGISTRY: dict[str, BaseAgent] = {
    "research": ResearchAgent(),
    "coding": CodingAgent(),
    "writing": WritingAgent(),
    "analysis": AnalysisAgent(),
    "general": GeneralAgent(),
}


def get_agent(agent_type: str) -> BaseAgent:
    return AGENT_REGISTRY.get(agent_type, AGENT_REGISTRY["general"])
