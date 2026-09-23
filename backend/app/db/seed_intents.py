from app.db.db import SessionLocal
from app.models.intent import Intent


intents = [
    Intent(
        name="Calm",
        slug="calm",
        description="Cultivate calmness and collectedness.",
    ),
    Intent(
        name="Stability",
        slug="stability",
        description="Cultivate steadiness and stability of mind.",
    ),
    Intent(
        name="Clarity",
        slug="clarity",
        description="Cultivate clarity and clear awareness.",
    ),
    Intent(
        name="Kindness",
        slug="kindness",
        description="Cultivate kindness and goodwill.",
    ),
    Intent(
        name="Joy",
        slug="joy",
        description="Cultivate joy and appreciation.",
    ),
    Intent(
        name="Presence",
        slug="presence",
        description="Cultivate present-moment awareness.",
    ),
    Intent(
        name="Gratitude",
        slug="gratitude",
        description="Cultivate appreciation and gratitude.",
    ),
]


def seed():
    with SessionLocal() as db:
        existing_slugs = {
            slug
            for (slug,) in db.query(Intent.slug).all()
        }

        new_intents = [
            intent
            for intent in intents
            if intent.slug not in existing_slugs
        ]

        db.add_all(new_intents)
        db.commit()

        print(f"Added {len(new_intents)} intents.")


if __name__ == "__main__":
    seed()