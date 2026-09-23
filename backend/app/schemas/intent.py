from pydantic import BaseModel


class IntentResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None

    model_config = {
        "from_attributes": True
    }
