"""Async PostgreSQL resources shared by RAG retrieval and LangGraph.

The service owns a pool for RAG reads and LangGraph checkpointing. Application
table writes still use the existing authenticated backend webhooks.
"""

import asyncio
from typing import Any

from loguru import logger

from config.settings import settings

try:
    from psycopg_pool import AsyncConnectionPool
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
except ImportError:  # Lets non-RAG unit tests run before dependencies are installed.
    AsyncConnectionPool = None
    AsyncPostgresSaver = None


_pool: Any = None
_checkpointer: Any = None
_checkpointer_context: Any = None
_initialization_lock = asyncio.Lock()


def _require_database_url() -> str:
    if not settings.database_url:
        raise RuntimeError(
            "DATABASE_URL is required for RAG. Configure it in ai/.env or docker-compose."
        )
    return settings.database_url


async def connect_db():
    """Open the retrieval pool and verify that pgvector is installed."""
    global _pool
    if _pool is not None:
        return
    if AsyncConnectionPool is None:
        raise RuntimeError(
            "RAG dependencies are missing. Run pip install -r ai/requirements.txt."
        )

    async with _initialization_lock:
        if _pool is not None:
            return
        _pool = AsyncConnectionPool(conninfo=_require_database_url(), open=False)
        await _pool.open(wait=True)
        try:
            async with _pool.connection() as connection:
                async with connection.cursor() as cursor:
                    await cursor.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
                    extension = await cursor.fetchone()
            if not extension:
                raise RuntimeError("pgvector is not enabled; run CREATE EXTENSION IF NOT EXISTS vector")
            logger.info(f"PostgreSQL RAG connection ready (pgvector {extension[0]})")
        except Exception:
            await _pool.close()
            _pool = None
            raise


async def get_pool():
    if _pool is None:
        await connect_db()
    return _pool


async def get_checkpointer():
    """Return the singleton async LangGraph Postgres checkpointer."""
    global _checkpointer, _checkpointer_context
    if _checkpointer is not None:
        return _checkpointer
    if AsyncPostgresSaver is None:
        raise RuntimeError(
            "LangGraph PostgreSQL checkpoint dependencies are missing. "
            "Run pip install -r ai/requirements.txt."
        )

    async with _initialization_lock:
        if _checkpointer is None:
            context = AsyncPostgresSaver.from_conn_string(_require_database_url())
            checkpointer = await context.__aenter__()
            try:
                await checkpointer.setup()
            except Exception:
                await context.__aexit__(None, None, None)
                raise
            _checkpointer_context = context
            _checkpointer = checkpointer
            logger.info("LangGraph PostgreSQL checkpointer ready")
    return _checkpointer


async def disconnect_db():
    """Close all resources during FastAPI shutdown."""
    global _pool, _checkpointer, _checkpointer_context
    if _checkpointer_context is not None:
        await _checkpointer_context.__aexit__(None, None, None)
        _checkpointer_context = None
        _checkpointer = None
    if _pool is not None:
        await _pool.close()
        _pool = None
    logger.info("AI service PostgreSQL resources closed")
