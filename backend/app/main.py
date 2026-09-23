# Libs
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from sqlalchemy import text

# Database
from app.db.db import engine, Base

# Data Model
from app.models import (
    Domain,
    MeditationElement,
    Intent,
    MeditationSession,
    SessionElement,
)

# Routers
from app.api.intent import router as intents_router
from app.api.meditation_element import router as elements_router
from app.api.meditation_session import router as session_router
from app.api.auth import router as auth_router


app = FastAPI(title="Breather API")

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intents_router)
app.include_router(elements_router)
app.include_router(session_router)
# temp user router at /api/auth/me
app.include_router(auth_router)

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