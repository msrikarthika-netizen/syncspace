from config.event_loop import configure_asyncio_event_loop

# Psycopg async pools are incompatible with Windows' default Proactor loop.
# Configure this before Uvicorn creates the application's event loop.
configure_asyncio_event_loop()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from config.settings import settings
from config.database import connect_db, disconnect_db
from routes.task_routes import router as task_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SyncSpace AI Service starting...")
    await connect_db()
    logger.info(f"   Model : {settings.hf_model}")
    logger.info(f"   Port  : {settings.ai_port}")
    yield
    await disconnect_db()
    logger.info("SyncSpace AI Service stopped")


app = FastAPI(
    title="SyncSpace AI Service",
    description="AI orchestrator + specialist agents for SyncSpace task platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "SyncSpace AI Service is running",
        "data": {
            "service": "syncspace-ai",
            "health": "/health",
            "api": "/api/tasks",
            "model": settings.hf_model,
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "syncspace-ai",
        "model": settings.hf_model,
    }


app.include_router(task_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.ai_port, reload=True)
