"""
Application entrypoint.
Exposes the FastAPI instance from backend.app.server for ASGI runners.
"""
from backend.app.server import app

__all__ = ["app"]
