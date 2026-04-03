from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Requête pour le chat simple."""

    message: str


class ChatResponse(BaseModel):
    """Réponse du chat."""

    reply: str
