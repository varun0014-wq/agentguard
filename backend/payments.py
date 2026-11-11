"""
Payments API routes for AgentGuard.
Handles payment requests, pending approvals, human decision actions, and PayPal order completion.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Transaction
from backend.schemas import (
    PaymentRequestCreate,
    PaymentResponse,
    ApprovalActionRequest,
    ApprovalResponse,
)
from backend.services.transaction_service import transaction_service
from backend.services.approval_service import approval_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/request",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an agent payment request for financial security evaluation",
)
async def submit_payment_request(
    payload: PaymentRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Primary financial authorization gate.
    Autonomous agents submit structured payment requests here.
    Evaluates:
      - Agent authorization
      - Max transaction limit
      - Daily budget
      - Merchant authorization
      - Verified offer price matching
      - Duplicate idempotency check
      - Dynamic risk score
    Decisions:
      - APPROVE -> PayPal order created automatically
      - REVIEW -> Pending human authorization
      - BLOCK -> Terminated immediately without touching PayPal
    """
    transaction = await transaction_service.process_payment_request(db, payload)
    return transaction


@router.get("", response_model=List[PaymentResponse], summary="List all transactions")
def list_payments(
    status: Optional[str] = Query(None, description="Filter by payment status (e.g. COMPLETED, BLOCKED, REQUIRES_APPROVAL)"),
    decision: Optional[str] = Query(None, description="Filter by decision (APPROVE, REVIEW, BLOCK)"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return transaction_service.get_all_transactions(
        db, status=status, decision=decision, agent_id=agent_id, limit=limit, offset=offset
    )


@router.get("/pending", response_model=List[PaymentResponse], summary="List transactions awaiting human review")
def list_pending_payments(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns transactions in REQUIRES_APPROVAL state waiting for human reviewer action.
    """
    return transaction_service.get_all_transactions(
        db, status="REQUIRES_APPROVAL", limit=limit, offset=offset
    )


@router.get("/{id}", response_model=PaymentResponse, summary="Get payment transaction details by ID")
def get_payment_details(id: str, db: Session = Depends(get_db)):
    tx = transaction_service.get_transaction_by_id(db, id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.post(
    "/{id}/approve",
    response_model=ApprovalResponse,
    summary="Approve a pending payment (Human reviewer)",
)
async def approve_payment(
    id: str,
    action: Optional[ApprovalActionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Approves a transaction in REQUIRES_APPROVAL status.
    Initializes the PayPal Checkout order and returns the PayPal buyer approval URL.
    """
    reviewer_notes = action.reviewer_notes if action else None
    tx = await approval_service.approve_transaction(
        db, transaction_id=id, reviewer_notes=reviewer_notes
    )
    return ApprovalResponse(
        transaction_id=tx.id,
        status="APPROVED",
        payment_status=tx.payment_status,
        paypal_order_id=tx.paypal_order_id,
        paypal_approval_url=tx.paypal_approval_url,
        message="Transaction approved. PayPal checkout order initialized.",
    )


@router.post(
    "/{id}/reject",
    response_model=ApprovalResponse,
    summary="Reject a pending payment (Human reviewer)",
)
def reject_payment(
    id: str,
    action: Optional[ApprovalActionRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Rejects a transaction in REQUIRES_APPROVAL status.
    Permanently stops the payment from reaching PayPal.
    """
    reviewer_notes = action.reviewer_notes if action else None
    tx = approval_service.reject_transaction(
        db, transaction_id=id, reviewer_notes=reviewer_notes
    )
    return ApprovalResponse(
        transaction_id=tx.id,
        status="REJECTED",
        payment_status=tx.payment_status,
        paypal_order_id=None,
        paypal_approval_url=None,
        message="Transaction rejected. No payment will be executed.",
    )


@router.post(
    "/{id}/capture",
    response_model=PaymentResponse,
    summary="Capture an approved PayPal order after buyer completion",
)
async def capture_payment(
    id: str,
    db: Session = Depends(get_db),
):
    """
    Captures authorized PayPal funds after the buyer has approved the payment on PayPal.
    Transitions status to COMPLETED upon PayPal confirmation.
    """
    tx = await approval_service.capture_approved_order(db, transaction_id=id)
    return tx
