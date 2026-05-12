from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    topic: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    task_id: str
    message: str

class CancelResponse(BaseModel):
    task_id: str
    status: str
