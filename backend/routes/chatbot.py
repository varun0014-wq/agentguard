"""
AI Financial Chatbot API routes for AgentGuard.
Feature 5: Natural language financial assistant, spend queries, explanations, and conversation history.
"""

from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.chatbot_service import chatbot_service
from backend.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    ChatMessageItem,
)

router = APIRouter(prefix="/chat", tags=["AI Financial Assistant"])


@router.post("/message", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK, summary="Send message to AI assistant")
async def send_chat_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
):
    """
    Submits a user query to the AI Financial Assistant.
    Understands spending questions, highest category, debts, currency conversions,
    pending reviews, budget status, and security blocks.
    """
    result = await chatbot_service.process_user_message(
        db, user_id="default_user", message=payload.message
    )
    return ChatMessageResponse(**result)


@router.get("/history", response_model=ChatHistoryResponse, summary="Get conversation history")
def get_chat_history(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Retrieves chronological chat conversation history for the current user.
    """
    messages = chatbot_service.get_chat_history(db, user_id="default_user", limit=limit)
    items = [
        ChatMessageItem(
            id=m.id,
            role=m.role,
            content=m.content,
            intent_detected=m.intent_detected,
            created_at=m.created_at,
        )
        for m in messages
    ]
    return ChatHistoryResponse(count=len(items), messages=items)


@router.delete("/history", summary="Clear conversation history")
def clear_chat_history(db: Session = Depends(get_db)):
    """
    Clears all saved chat history for the user session.
    """
    deleted_count = chatbot_service.clear_chat_history(db, user_id="default_user")
    return {"message": f"Successfully deleted {deleted_count} messages from history."}
