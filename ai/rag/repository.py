"""Parameterized pgvector persistence and similarity search."""

from __future__ import annotations

import json
from typing import Any

from config.database import get_pool


def vector_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in vector) + "]"


async def document_is_current(source_key: str, checksum: str) -> bool:
    """Check the source checksum before loading the embedding model."""
    pool = await get_pool()
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(
                "SELECT 1 FROM rag_documents WHERE source_key = %s AND checksum = %s",
                (source_key, checksum),
            )
            return await cursor.fetchone() is not None


async def upsert_document(
    *,
    source_key: str,
    title: str,
    category: str,
    content: str,
    checksum: str,
    metadata: dict[str, Any],
    chunks: list[str],
    embeddings: list[list[float]],
    embedding_model: str,
    embedding_version: str,
) -> str:
    """Replace changed document chunks atomically; return inserted/updated/skipped."""
    if len(chunks) != len(embeddings):
        raise ValueError("Every chunk must have exactly one embedding")
    pool = await get_pool()
    async with pool.connection() as connection:
        async with connection.transaction():
            async with connection.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, checksum FROM rag_documents WHERE source_key = %s",
                    (source_key,),
                )
                existing = await cursor.fetchone()
                if existing and existing[1] == checksum:
                    return "skipped"

                if existing:
                    document_id = existing[0]
                    await cursor.execute(
                        """
                        UPDATE rag_documents
                        SET title = %s, category = %s, content = %s, checksum = %s,
                            metadata = %s::jsonb, is_active = TRUE
                        WHERE id = %s
                        """,
                        (title, category, content, checksum, json.dumps(metadata), document_id),
                    )
                    await cursor.execute("DELETE FROM rag_chunks WHERE document_id = %s", (document_id,))
                    action = "updated"
                else:
                    await cursor.execute(
                        """
                        INSERT INTO rag_documents (source_key, title, category, content, checksum, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                        RETURNING id
                        """,
                        (source_key, title, category, content, checksum, json.dumps(metadata)),
                    )
                    document_id = (await cursor.fetchone())[0]
                    action = "inserted"

                rows = [
                    (
                        document_id,
                        index,
                        chunk,
                        max(1, (len(chunk) + 3) // 4),
                        vector_literal(embedding),
                        embedding_model,
                        embedding_version,
                        json.dumps({"chunk_index": index}),
                    )
                    for index, (chunk, embedding) in enumerate(zip(chunks, embeddings))
                ]
                await cursor.executemany(
                    """
                    INSERT INTO rag_chunks (
                        document_id, chunk_index, content, token_count, embedding,
                        embedding_model, embedding_version, metadata
                    ) VALUES (%s, %s, %s, %s, %s::vector, %s, %s, %s::jsonb)
                    """,
                    rows,
                )
    return action


async def search_chunks(
    query_embedding: list[float], *, limit: int, min_similarity: float, category: str | None = None
) -> list[dict[str, Any]]:
    pool = await get_pool()
    where_category = "AND d.category = %s" if category else ""
    sql = f"""
        SELECT d.source_key, d.title, d.category, c.chunk_index, c.content,
               1 - (c.embedding <=> %s::vector) AS similarity
        FROM rag_chunks c
        JOIN rag_documents d ON d.id = c.document_id
        WHERE d.is_active = TRUE {where_category}
          AND 1 - (c.embedding <=> %s::vector) >= %s
        ORDER BY c.embedding <=> %s::vector
        LIMIT %s
    """
    # The embedding is supplied for each similarity expression; all values remain parameterized.
    params = [vector_literal(query_embedding)] + ([category] if category else []) + [
        vector_literal(query_embedding),
        min_similarity,
        vector_literal(query_embedding),
        limit,
    ]
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(sql, params)
            rows = await cursor.fetchall()
    return [
        {
            "source_key": row[0],
            "title": row[1],
            "category": row[2],
            "chunk_index": row[3],
            "content": row[4],
            "similarity": round(float(row[5]), 4),
        }
        for row in rows
    ]
