from loguru import logger


async def connect_db():
    logger.info("AI service persists workflow state through backend PostgreSQL webhooks")


async def disconnect_db():
    logger.info("AI service database cleanup complete")
