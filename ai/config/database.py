from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger
from config.settings import settings

_client: AsyncIOMotorClient | None = None


async def connect_db():
    # The AI workflow persists state through the backend webhook, not Motor.
    # Do not resolve a cloud MongoDB SRV record during API startup.
    logger.info("AI service database client is deferred until it is needed")


async def disconnect_db():
    if _client:
        _client.close()


def get_db():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.database_url)
    return _client.get_default_database()
