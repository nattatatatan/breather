from pydantic import BaseModel

from app.models.domain import Domain


class MeditationElementResponse(BaseModel):
    id: int
    name: str
    slug: str
    domain: Domain | None
    description: str | None
    image_url: str | None

    model_config = {
        "from_attributes": True,
    }
