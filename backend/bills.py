"""
Bill Splitting API routes for AgentGuard.
Feature 2: Multi-party shared bills, split division, payment requests, and settlement tracking.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.bill_service import bill_service
from backend.schemas import (
    BillCreate,
    BillResponse,
    BillSplitRequest,
    BillPaymentRecordCreate,
    BillStatusResponse,
    BillParticipantResponse,
    ParticipantInput,
)
from backend.models import Bill, BillParticipant

router = APIRouter(prefix="/bills", tags=["Bill Splitting"])


@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED, summary="Create a new bill")
def create_bill(payload: BillCreate, db: Session = Depends(get_db)):
    """
    Creates a new shared bill and calculates initial participant shares
    according to the specified split_type (EQUAL, CUSTOM, or PERCENTAGE).
    """
    return bill_service.create_bill(db, user_id="default_user", payload=payload)


@router.get("", response_model=List[BillResponse], summary="List all bills")
def list_bills(db: Session = Depends(get_db)):
    """
    Returns all shared bills for the authenticated user.
    """
    return bill_service.list_bills(db, user_id="default_user")


@router.get("/{bill_id}", response_model=BillResponse, summary="Get bill details by ID")
def get_bill(bill_id: str, db: Session = Depends(get_db)):
    """
    Retrieves bill details and participant status breakdown.
    """
    bill = bill_service.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.post("/{bill_id}/participants", response_model=BillResponse, summary="Add participant to bill")
def add_participant(bill_id: str, payload: ParticipantInput, db: Session = Depends(get_db)):
    """
    Adds a new participant to an existing bill and recalculates shares.
    """
    bill = bill_service.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    new_part = BillParticipant(
        bill_id=bill.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        share_amount=payload.share_amount or 0,
        status="UNPAID",
    )
    db.add(new_part)
    db.commit()

    # Recalculate if equal
    if bill.split_type == "EQUAL":
        bill_service.split_bill(db, bill_id, BillSplitRequest(split_type="EQUAL"))

    return bill_service.get_bill(db, bill_id)


@router.post("/{bill_id}/split", response_model=BillResponse, summary="Recalculate or change split division")
def split_bill(bill_id: str, payload: BillSplitRequest, db: Session = Depends(get_db)):
    """
    Re-splits an existing bill using EQUAL, CUSTOM, or PERCENTAGE methods.
    """
    return bill_service.split_bill(db, bill_id, payload)


@router.post("/{bill_id}/payment-request", summary="Generate a payment request for a participant")
def generate_payment_request(bill_id: str, participant_id: str, db: Session = Depends(get_db)):
    """
    Creates an official payment request identifier and payment link for a participant.
    """
    return bill_service.create_payment_request(db, bill_id, participant_id)


@router.post("/{bill_id}/payments", response_model=BillParticipantResponse, summary="Record a verified payment")
def record_bill_payment(bill_id: str, payload: BillPaymentRecordCreate, db: Session = Depends(get_db)):
    """
    Records a verified payment against a participant's share.
    Idempotent: prevents duplicate payment entries.
    """
    return bill_service.record_payment(db, bill_id, payload)


@router.get("/{bill_id}/status", response_model=BillStatusResponse, summary="Get payment settlement status")
def get_bill_status(bill_id: str, db: Session = Depends(get_db)):
    """
    Returns settlement statistics: total amount, paid total, unpaid total,
    and individual participant settlement statuses.
    """
    return bill_service.get_bill_status(db, bill_id)
