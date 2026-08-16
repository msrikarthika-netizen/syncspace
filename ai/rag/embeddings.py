"""Local, versioned sentence-transformer embeddings."""

from __future__ import annotations

import asyncio
from typing import Sequence

from config.settings import settings

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # Delayed runtime error keeps the non-RAG test suite importable.
    SentenceTransformer = None


_model = None
_model_lock = asyncio.Lock()


async def _get_model():
    global _model
    if _model is not None:
        return _model
    if SentenceTransformer is None:
        raise RuntimeError(
            "Embedding dependencies are missing. Run pip install -r ai/requirements.txt."
        )
    async with _model_lock:
        if _model is None:
            try:
                # Prefer the local cache. This avoids a Hugging Face network check
                # every time the AI service starts and keeps retrieval available
                # in offline or firewalled environments after first download.
                _model = await asyncio.to_thread(
                    SentenceTransformer, settings.embedding_model, local_files_only=True
                )
            except OSError as cache_error:
                if not settings.embedding_allow_download:
                    raise RuntimeError(
                        f"Embedding model '{settings.embedding_model}' is not available in the local cache. "
                        "Set EMBEDDING_ALLOW_DOWNLOAD=true once, with access to huggingface.co, "
                        "or point EMBEDDING_MODEL at a local model directory."
                    ) from cache_error
                try:
                    _model = await asyncio.to_thread(
                        SentenceTransformer, settings.embedding_model, local_files_only=False
                    )
                except OSError as exc:
                    raise RuntimeError(
                        f"Unable to download embedding model '{settings.embedding_model}'. "
                        "Allow one-time access to huggingface.co so the model can be cached, "
                        "or set EMBEDDING_MODEL to an already-downloaded local model path."
                    ) from exc
    return _model


def _validate(vector: Sequence[float]) -> list[float]:
    values = [float(value) for value in vector]
    if len(values) != settings.embedding_dimensions:
        raise ValueError(
            f"Embedding model returned {len(values)} dimensions; expected "
            f"{settings.embedding_dimensions}. Update EMBEDDING_DIMENSIONS or use a compatible model."
        )
    return values


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = await _get_model()
    vectors = await asyncio.to_thread(
        model.encode,
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return [_validate(vector) for vector in vectors]


async def embed_query(query: str) -> list[float]:
    vectors = await embed_texts([query])
    return vectors[0]
