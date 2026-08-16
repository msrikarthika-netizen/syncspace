"""Windows event-loop compatibility for psycopg's asynchronous driver."""

import asyncio
import sys


def configure_asyncio_event_loop() -> None:
    """Use the selector loop required by psycopg async connections on Windows.

    This must run before Uvicorn or asyncio.run creates its first event loop.
    It has no effect on Linux containers or other supported platforms.
    """
    selector_policy = getattr(asyncio, "WindowsSelectorEventLoopPolicy", None)
    if sys.platform == "win32" and selector_policy is not None:
        asyncio.set_event_loop_policy(selector_policy())
