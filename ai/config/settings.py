from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_port: int = 8000
    node_env: str = "development"
    huggingface_api_key: str = ""
    hf_model: str = "Qwen/Qwen2.5-7B-Instruct:fastest"
    hf_router_url: str = "https://router.huggingface.co/v1/chat/completions"
    redis_url: str = "redis://localhost:6379"
    redis_api_token: str = ""
    frontend_url: str = ""
    backend_url: str = ""
    backend_hostport: str = ""
    internal_webhook_secret: str = ""
    log_level: str = "INFO"
    database_url: str = ""
    rag_enabled: bool = True
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dimensions: int = 384
    embedding_version: str = "1"
    embedding_allow_download: bool = True
    rag_chunk_size: int = 1200
    rag_chunk_overlap: int = 160
    rag_retrieval_limit: int = 6
    rag_min_similarity: float = 0.35

    @property
    def webhook_secret(self) -> str:
        if self.internal_webhook_secret:
            return self.internal_webhook_secret
        if self.node_env != "production":
            return "syncspace_dev_internal_webhook_secret"
        return ""

    @property
    def backend_base_url(self) -> str:
        if self.backend_url:
            return self.backend_url.rstrip("/")
        if self.backend_hostport:
            return f"http://{self.backend_hostport}".rstrip("/")
        return "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        origins = ["http://localhost:3000", "http://localhost:5173"]
        if self.frontend_url:
            origins.append(self.frontend_url.rstrip("/"))
        return origins

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
