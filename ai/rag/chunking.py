"""Deterministic Markdown-aware chunking for the curated knowledge base."""

from __future__ import annotations

import re


def estimate_tokens(text: str) -> int:
    """A stable, tokenizer-independent estimate suitable for chunk metadata."""
    return max(1, (len(text) + 3) // 4)


def chunk_markdown(content: str, max_chars: int, overlap_chars: int) -> list[str]:
    """Split Markdown at headings/paragraphs, retaining a small text overlap."""
    if max_chars <= 0 or overlap_chars < 0 or overlap_chars >= max_chars:
        raise ValueError("Chunk size must be positive and overlap must be smaller than chunk size")

    blocks = [block.strip() for block in re.split(r"\n\s*\n", content.strip()) if block.strip()]
    chunks: list[str] = []
    current = ""
    heading = ""

    def flush() -> None:
        nonlocal current
        if current.strip():
            chunks.append(current.strip())
        current = ""

    for block in blocks:
        if block.startswith("#"):
            flush()
            heading = block
            continue
        candidate = f"{current}\n\n{block}".strip() if current else f"{heading}\n\n{block}".strip()
        if len(candidate) <= max_chars:
            current = candidate
            continue

        previous = current
        flush()
        seed = previous[-overlap_chars:].strip() if previous and overlap_chars else ""
        current = f"{heading}\n\n{seed}\n\n{block}".strip()
        while len(current) > max_chars:
            split_at = current.rfind(" ", 0, max_chars)
            split_at = split_at if split_at > max_chars // 2 else max_chars
            chunks.append(current[:split_at].strip())
            remainder = current[split_at:].strip()
            seed = chunks[-1][-overlap_chars:].strip() if overlap_chars else ""
            current = f"{heading}\n\n{seed}\n\n{remainder}".strip()
    flush()
    return chunks
