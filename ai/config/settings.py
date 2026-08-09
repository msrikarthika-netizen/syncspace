from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_port: int = 8000
    huggingface_api_key: str = ""
    hf_model: str = "Qwen/Qwen2.5-7B-Instruct:fastest"
    hf_router_url: str = "https://router.huggingface.co/v1/chat/completions"
    mongo_uri: str = ""
    mongo_url: str = "mongodb://localhost:27017/syncspace_dev"
    redis_url: str = "redis://localhost:6379"
    redis_api_token: str = ""
    backend_url: str = "http://localhost:3000"
    internal_webhook_secret: str = ""
    log_level: str = "INFO"

    @property
    def database_url(self) -> str:
        return self.mongo_uri or self.mongo_url

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
