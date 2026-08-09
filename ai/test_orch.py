import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from agents.orchestrator import orchestrate

async def main():
    res = await orchestrate(
        task_id="test_id_123",
        task_title="Test Task",
        task_description="Test Description",
        user_id="user_1",
        priority="high"
    )
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(main())
