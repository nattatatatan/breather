from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int
    auth_provider_id: str