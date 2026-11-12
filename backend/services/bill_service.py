"""
Bill Splitting Service for AgentGuard.
Manages multi-party bill division (equal, custom, percentage),
payment request generation, and verified settlement status tracking.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import Bill, BillParticipant, User
from backend.schemas import (
    BillCreate,
    BillResponse,
    BillSplitRequest,
    BillPaymentRecordCreate,
    BillStatusResponse,
)


def round_cents(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class BillService:
    @classmethod
    def create_bill(cls, db: Session, user_id: str, payload: BillCreate) -> Bill:
        total = round_cents(payload.total_amount)
        n = len(payload.participants)
        if n == 0:
            raise HTTPException(status_code=400, detail="Bill must have at least one participant.")

        bill = Bill(
            user_id=user_id,
            title=payload.title,
            total_amount=total,
            currency=payload.currency.upper(),
            split_type=payload.split_type.upper(),
            status="PENDING",
        )
        db.add(bill)
        db.flush()

        # Calculate initial shares based on split_type
        if bill.split_type == "EQUAL":
            base_share = round_cents(total / Decimal(n))
            # Adjust last participant for penny rounding discrepancies
            running_sum = Decimal("0.00")
            for i, p_in in enumerate(payload.participants):
                if i == n - 1:
                    share = total - running_sum
                else:
                    share = base_share
                    running_sum += share

                part = BillParticipant(
                    bill_id=bill.id,
                    name=p_in.name,
                    email=p_in.email,
                    phone=p_in.phone,
                    share_amount=share,
                    percentage=round_cents((share / total) * Decimal("100.00")),
                    status="UNPAID",
                    payment_request_id=f"payreq_{uuid.uuid4().hex[:12]}",
                )
                db.add(part)

        elif bill.split_type == "PERCENTAGE":
            total_pct = sum(p.percentage or Decimal("0") for p in payload.participants)
            if abs(total_pct - Decimal("100.00")) > Decimal("0.01"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Sum of participant percentages must equal 100%. Got {total_pct}%",
                )
            running_sum = Decimal("0.00")
            for i, p_in in enumerate(payload.participants):
                pct = p_in.percentage or Decimal("0")
                if i == n - 1:
                    share = total - running_sum
                else:
                    share = round_cents((pct / Decimal("100.00")) * total)
                    running_sum += share

                part = BillParticipant(
                    bill_id=bill.id,
                    name=p_in.name,
                    email=p_in.email,
                    phone=p_in.phone,
                    share_amount=share,
                    percentage=pct,
                    status="UNPAID",
                    payment_request_id=f"payreq_{uuid.uuid4().hex[:12]}",
                )
                db.add(part)

        else:  # CUSTOM
            total_shares = sum(p.share_amount or Decimal("0") for p in payload.participants)
            if abs(total_shares - total) > Decimal("0.01"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Sum of custom shares (${total_shares:.2f}) must match bill total (${total:.2f})",
                )
            for p_in in payload.participants:
                share = round_cents(p_in.share_amount or Decimal("0"))
                part = BillParticipant(
                    bill_id=bill.id,
                    name=p_in.name,
                    email=p_in.email,
                    phone=p_in.phone,
                    share_amount=share,
                    percentage=round_cents((share / total) * Decimal("100.00")),
                    status="UNPAID",
                    payment_request_id=f"payreq_{uuid.uuid4().hex[:12]}",
                )
                db.add(part)

        db.commit()
        db.refresh(bill)
        return bill

    @classmethod
    def get_bill(cls, db: Session, bill_id: str) -> Optional[Bill]:
        return db.query(Bill).filter(Bill.id == bill_id).first()

    @classmethod
    def list_bills(cls, db: Session, user_id: str = "default_user") -> List[Bill]:
        return db.query(Bill).order_by(Bill.created_at.desc()).all()

    @classmethod
    def split_bill(cls, db: Session, bill_id: str, payload: BillSplitRequest) -> Bill:
        bill = cls.get_bill(db, bill_id)
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")

        parts = db.query(BillParticipant).filter(BillParticipant.bill_id == bill_id).all()
        n = len(parts)
        if n == 0:
            raise HTTPException(status_code=400, detail="Bill has no participants")

        total = Decimal(str(bill.total_amount))
        bill.split_type = payload.split_type.upper()

        if bill.split_type == "EQUAL":
            base_share = round_cents(total / Decimal(n))
            running_sum = Decimal("0.00")
            for i, p in enumerate(parts):
                if i == n - 1:
                    p.share_amount = total - running_sum
                else:
                    p.share_amount = base_share
                    running_sum += base_share
                p.percentage = round_cents((p.share_amount / total) * Decimal("100.00"))

        elif bill.split_type == "CUSTOM":
            if not payload.shares:
                raise HTTPException(status_code=400, detail="Custom shares map required")
            sum_shares = sum(payload.shares.values())
            if abs(sum_shares - total) > Decimal("0.01"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Sum of custom shares (${sum_shares:.2f}) does not match total (${total:.2f})",
                )
            for p in parts:
                if p.id in payload.shares:
                    p.share_amount = round_cents(payload.shares[p.id])
                    p.percentage = round_cents((p.share_amount / total) * Decimal("100.00"))

        db.commit()
        db.refresh(bill)
        return bill

    @classmethod
    def create_payment_request(cls, db: Session, bill_id: str, participant_id: str) -> Dict[str, Any]:
        part = (
            db.query(BillParticipant)
            .filter(BillParticipant.bill_id == bill_id, BillParticipant.id == participant_id)
            .first()
        )
        if not part:
            raise HTTPException(status_code=404, detail="Participant not found on this bill")

        bill = part.bill
        if not part.payment_request_id:
            part.payment_request_id = f"payreq_{uuid.uuid4().hex[:12]}"
            db.commit()

        return {
            "payment_request_id": part.payment_request_id,
            "bill_id": bill.id,
            "title": bill.title,
            "participant_name": part.name,
            "share_amount": part.share_amount,
            "currency": bill.currency,
            "status": part.status,
            "payment_link": f"https://www.sandbox.paypal.com/pay/{part.payment_request_id}",
        }

    @classmethod
    def record_payment(cls, db: Session, bill_id: str, payload: BillPaymentRecordCreate) -> BillParticipant:
        part = (
            db.query(BillParticipant)
            .filter(BillParticipant.bill_id == bill_id, BillParticipant.id == payload.participant_id)
            .first()
        )
        if not part:
            raise HTTPException(status_code=404, detail="Participant not found on this bill")

        # Idempotency check: don't double count if already fully paid
        if part.status == "PAID":
            return part

        amount = payload.paid_amount or part.share_amount
        part.paid_amount = Decimal(str(amount))
        part.status = "PAID"
        part.paid_at = datetime.now(timezone.utc)

        # Update parent Bill status
        bill = part.bill
        all_parts = bill.participants
        paid_count = sum(1 for p in all_parts if p.status == "PAID")

        if paid_count == len(all_parts):
            bill.status = "PAID"
        elif paid_count > 0:
            bill.status = "PARTIALLY_PAID"

        db.commit()
        db.refresh(part)
        return part

    @classmethod
    def get_bill_status(cls, db: Session, bill_id: str) -> BillStatusResponse:
        bill = cls.get_bill(db, bill_id)
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")

        paid_total = sum(Decimal(str(p.paid_amount)) for p in bill.participants if p.status == "PAID")
        unpaid_total = Decimal(str(bill.total_amount)) - paid_total

        return BillStatusResponse(
            bill_id=bill.id,
            title=bill.title,
            total_amount=bill.total_amount,
            paid_total=paid_total,
            unpaid_total=max(Decimal("0.00"), unpaid_total),
            currency=bill.currency,
            status=bill.status,
            participants=bill.participants,
        )


bill_service = BillService()
