from app.db.db import Base, engine

# Import models so SQLAlchemy knows about them
from app.models.meditation_element import MeditationElement
from app.models.intent import Intent
from app.models.meditation_session import MeditationSession
from app.models.session_element import SessionElement

Base.metadata.create_all(bind=engine)

print("Database tables created.")