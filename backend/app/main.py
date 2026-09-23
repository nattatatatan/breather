# Libs
from pathlib import Path

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.circle import router as circle_router

# Routers
from app.api.intent import router as intents_router
from app.api.me import router as me_router
from app.api.meditation_element import router as elements_router
from app.api.sessions import router as session_router
from app.config.config import settings

# Database
from app.db.db import engine

app = FastAPI(title="Stay API")

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intents_router)
app.include_router(elements_router)
app.include_router(session_router)
app.include_router(me_router)
app.include_router(circle_router)

@app.get("/health")
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"status": "ok", "database": "connected"}

@app.get("/ui-docs")
def ui_docs():
    # 1. Resolve the path relative to this script's directory
    parent_dir = Path(__file__).resolve().parent.parent.parent
    file_path = parent_dir / "docs" / "ui-design.html"

    # 2. Read the HTML file content
    with open(file_path, "r", encoding="utf-8") as file:
        data = file.read()

    # 3. Return the content with the correct HTML media type
    return Response(content=data, media_type="text/html")
