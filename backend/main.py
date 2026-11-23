"""
Entry point shortcut agar server ASGI Uvicorn dapat dijalankan langsung
dengan:
    uvicorn main:app --reload --port 8000
maupun:
    python main.py
dari dalam direktori `backend/`.
"""
import os
import sys

# Memastikan direktori backend berada di sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
