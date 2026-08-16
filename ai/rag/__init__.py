"""RAG ingestion, embedding, and retrieval services.

Modules are deliberately not imported here: loading sentence-transformers is
expensive and should happen only when the complex RAG route needs embeddings.
"""
