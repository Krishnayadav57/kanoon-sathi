from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionOut(BaseModel):
    id: str
    title: str
    legal_category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionDetailOut(ChatSessionOut):
    messages: List[ChatMessageOut] = []


class SendMessageRequest(BaseModel):
    session_id: Optional[str] = None  # if omitted, a new session is created
    message: str = Field(min_length=1, max_length=4000)
    language: str = Field(default="ne", pattern="^(ne|en)$")


class SendMessageResponse(BaseModel):
    session_id: str
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut
    legal_category: Optional[str] = None
    disclaimer: str
    messages_remaining_today: Optional[int] = None
