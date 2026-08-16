"""Run with: python -m scripts.ingest_knowledge_base"""

import asyncio

from config.database import connect_db, disconnect_db
from config.event_loop import configure_asyncio_event_loop
from rag.ingestion import ingest_knowledge_base


async def main() -> None:
    await connect_db()
    try:
        summary = await ingest_knowledge_base()
        print(f"Knowledge-base ingestion complete: {summary}")
    finally:
        await disconnect_db()


if __name__ == "__main__":
    configure_asyncio_event_loop()
    asyncio.run(main())
