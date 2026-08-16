"""Curated Markdown knowledge-base ingestion with checksum-based updates."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

from config.settings import settings
from rag.chunking import chunk_markdown
from rag.embeddings import embed_texts
from rag.repository import document_is_current, upsert_document


@dataclass(frozen=True)
class KnowledgeDocument:
    source_key: str
    title: str
    category: str
    content: str
    metadata: dict[str, str]


def _parse_markdown(path: Path) -> KnowledgeDocument:
    raw = path.read_text(encoding="utf-8").strip()
    metadata: dict[str, str] = {}
    body = raw
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.DOTALL)
    if match:
        for line in match.group(1).splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                metadata[key.strip()] = value.strip()
        body = match.group(2).strip()
    title_match = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
    title = metadata.get("title") or (title_match.group(1).strip() if title_match else path.stem)
    category = metadata.get("category", "general")
    return KnowledgeDocument(
        source_key=metadata.get("source_key", path.stem),
        title=title,
        category=category,
        content=body,
        metadata={**metadata, "path": path.name},
    )


def load_knowledge_documents(directory: Path | None = None) -> list[KnowledgeDocument]:
    directory = directory or Path(__file__).resolve().parents[1] / "knowledge_base"
    if not directory.exists():
        raise FileNotFoundError(f"Knowledge-base directory does not exist: {directory}")
    documents = [_parse_markdown(path) for path in sorted(directory.glob("*.md"))]
    if not documents:
        raise ValueError(f"No Markdown knowledge documents found in {directory}")
    return documents


async def ingest_knowledge_base(directory: Path | None = None) -> dict[str, int]:
    """Ingest documents and only regenerate embeddings for changed source files."""
    summary = {"inserted": 0, "updated": 0, "skipped": 0, "chunks": 0}
    for document in load_knowledge_documents(directory):
        checksum = hashlib.sha256(document.content.encode("utf-8")).hexdigest()
        if await document_is_current(document.source_key, checksum):
            summary["skipped"] += 1
            continue
        chunks = chunk_markdown(
            document.content,
            max_chars=settings.rag_chunk_size,
            overlap_chars=settings.rag_chunk_overlap,
        )
        embeddings = await embed_texts(chunks)
        action = await upsert_document(
            source_key=document.source_key,
            title=document.title,
            category=document.category,
            content=document.content,
            checksum=checksum,
            metadata=document.metadata,
            chunks=chunks,
            embeddings=embeddings,
            embedding_model=settings.embedding_model,
            embedding_version=settings.embedding_version,
        )
        summary[action] += 1
        if action != "skipped":
            summary["chunks"] += len(chunks)
    return summary
