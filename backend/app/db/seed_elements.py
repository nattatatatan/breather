from app.db.db import SessionLocal
from app.models.domain import Domain
from app.models.meditation_element import MeditationElement

elements = [
    # Attention / recollection
    MeditationElement(
        name="Chant",
        slug="chant",
        domain=Domain.NAMA,
        description="Repetition or recollection of a word or phrase.",
    ),
    MeditationElement(
        name="Buddha Recollection",
        slug="buddha-recollection",
        domain=Domain.NAMA,
        description="Recollection of the Buddha.",
    ),
    MeditationElement(
            name="Death Recollection",
            slug="death-recollection",
            domain=Domain.NAMA,
            description="Recollection of the death.",
    ),

    # Body / material objects
    MeditationElement(
        name="Breath",
        slug="breath",
        domain=Domain.RUPA,
        description="Mindfulness of breathing.",
    ),
    MeditationElement(
        name="Light",
        slug="light",
        domain=Domain.RUPA,
        description="Light as a meditation object.",
    ),
    MeditationElement(
        name="Fire",
        slug="fire",
        domain=Domain.RUPA,
        description="Fire as a meditation object.",
    ),
    MeditationElement(
        name="Earth",
        slug="earth",
        domain=Domain.RUPA,
        description="Earth as a meditation object.",
    ),
    MeditationElement(
        name="Water",
        slug="water",
        domain=Domain.RUPA,
        description="Water as a meditation object.",
    ),
    MeditationElement(
        name="Air",
        slug="air",
        domain=Domain.RUPA,
        description="Air as a meditation object.",
    ),
    MeditationElement(
        name="Blue",
        slug="blue",
        domain=Domain.RUPA,
        description="Blue as a meditation object.",
    ),
    MeditationElement(
        name="Yellow",
        slug="yellow",
        domain=Domain.RUPA,
        description="Yellow as a meditation object.",
    ),
    MeditationElement(
        name="Red",
        slug="red",
        domain=Domain.RUPA,
        description="Red as a meditation object.",
    ),
    MeditationElement(
        name="White",
        slug="white",
        domain=Domain.RUPA,
        description="White as a meditation object.",
    ),
    MeditationElement(
        name="Space",
        slug="space",
        domain=Domain.RUPA,
        description="Space as a meditation object.",
    ),

    # Mental qualities
    MeditationElement(
        name="Loving-kindness",
        slug="loving-kindness",
        domain=Domain.NAMA,
        description="Cultivation of loving-kindness.",
    ),

    # Satipaṭṭhāna
    MeditationElement(
        name="Body",
        slug="body",
        domain=Domain.RUPA,
        description="Contemplation of the body.",
    ),
    MeditationElement(
        name="Feeling",
        slug="feeling",
        domain=Domain.NAMA,
        description="Contemplation of feeling.",
    ),
    MeditationElement(
        name="Mind",
        slug="mind",
        domain=Domain.NAMA,
        description="Contemplation of the mind.",
    ),
    MeditationElement(
        name="Dhamma",
        slug="dhamma",
        domain=Domain.NAMA,
        description="Contemplation of dhammas.",
    ),

    # Postures
    MeditationElement(
        name="Walking",
        slug="walking",
        domain=Domain.RUPA,
        description="Meditation while walking.",
    ),
    MeditationElement(
        name="Sitting",
        slug="sitting",
        domain=Domain.RUPA,
        description="Meditation while sitting.",
    ),
    MeditationElement(
        name="Standing",
        slug="standing",
        domain=Domain.RUPA,
        description="Meditation while standing.",
    ),
    MeditationElement(
        name="Reclining",
        slug="reclining",
        domain=Domain.RUPA,
        description="Meditation while reclining.",
    ),
]

def seed():
    with SessionLocal() as db:
        existing_slugs = {
            slug for (slug,) in db.query(
                MeditationElement.slug
            ).all()
        }

        new_elements = [
            element
            for element in elements
            if element.slug not in existing_slugs
        ]

        db.add_all(new_elements)
        db.commit()

        print(f"Added {len(new_elements)} meditation elements.")


if __name__ == "__main__":
    seed()
