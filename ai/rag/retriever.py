"""RAG query embedding, retrieval, and prompt-ready source formatting."""

from __future__ import annotations

from config.settings import settings
from rag.embeddings import embed_query
from rag.repository import search_chunks


async def retrieve_context(query: str, *, category: str | None = None) -> list[dict]:
    if not settings.rag_enabled or not query.strip():
        return []
    embedding = await embed_query(query)
    return await search_chunks(
        embedding,
        limit=settings.rag_retrieval_limit,
        min_similarity=settings.rag_min_similarity,
        category=category,
    )


def format_context(sources: list[dict]) -> str:
    if not sources:
        return "No relevant curated knowledge was retrieved. Use established engineering judgment."
    entries = []
    for index, source in enumerate(sources, start=1):
        entries.append(
            f"[K{index}] {source['title']} ({source['category']}, similarity {source['similarity']})\n"
            f"{source['content']}"
        )
    return "Use the following curated knowledge when it is relevant. Do not invent citations.\n\n" + "\n\n".join(entries)
