"""
Approval Service for AgentGuard.
Manages human review decisions (approve/reject) and the subsequent PayPal authorization workflow.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import Transaction, ApprovalRequest, AuditLog
from backend.services.paypal_service import paypal_service


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ApprovalService:
    @classmethod
    async def approve_transaction(
        cls, db: Session, transaction_id: str, reviewer_notes: Optional[str] = None
    ) -> Transaction:
        """
        Processes human approval for a pending transaction.
        Transitions state: REQUIRES_APPROVAL -> APPROVED -> PAYPAL_CREATED.
        Creates an authorized PayPal Checkout Order for buyer approval.
        """
        transaction = (
            db.query(Transaction).filter(Transaction.id == transaction_id).first()
        )
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        if transaction.payment_status != "REQUIRES_APPROVAL":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve transaction with status '{transaction.payment_status}'. Only 'REQUIRES_APPROVAL' can be approved.",
            )

        # Update ApprovalRequest
        approval_req = (
            db.query(ApprovalRequest)
            .filter(ApprovalRequest.transaction_id == transaction_id)
            .first()
        )
        if approval_req:
            approval_req.status = "APPROVED"
            approval_req.approved_at = utc_now()
            approval_req.reviewer_notes = reviewer_notes

        # Transition application approval state
        transaction.payment_status = "APPROVED"

        # Record human approval audit log
        db.add(
            AuditLog(
                transaction_id=transaction.id,
                agent_id=transaction.agent_id,
                action="HUMAN_APPROVAL_GRANTED",
                reason=reviewer_notes or "Transaction manually approved by authorized reviewer.",
                metadata_json={"reviewer_notes": reviewer_notes},
            )
        )

        # Initiate PayPal Order Creation
        try:
            order_data = await paypal_service.create_order(
                reference_id=transaction.id,
                amount=transaction.amount,
                currency=transaction.currency,
                description=f"Purchase of {transaction.product_name} from {transaction.merchant} (Reviewed)",
            )
            transaction.paypal_order_id = order_data.get("id")
            transaction.paypal_approval_url = order_data.get("approval_url")
            transaction.payment_status = "PAYPAL_CREATED"

            db.add(
                AuditLog(
                    transaction_id=transaction.id,
                    agent_id=transaction.agent_id,
                    action="PAYPAL_ORDER_CREATED",
                    reason="Order initialized in PayPal for buyer checkout",
                    metadata_json={"paypal_order_id": order_data.get("id")},
                )
            )
        except Exception as e:
            transaction.payment_status = "FAILED"
            db.add(
                AuditLog(
                    transaction_id=transaction.id,
                    agent_id=transaction.agent_id,
                    action="PAYPAL_ORDER_FAILED",
                    reason=f"Failed to create PayPal order after human approval: {str(e)}",
                )
            )

        db.commit()
        db.refresh(transaction)
        return transaction

    @classmethod
    def reject_transaction(
        cls, db: Session, transaction_id: str, reviewer_notes: Optional[str] = None
    ) -> Transaction:
        """
        Rejects a pending transaction.
        Transitions state: REQUIRES_APPROVAL -> REJECTED.
        """
        transaction = (
            db.query(Transaction).filter(Transaction.id == transaction_id).first()
        )
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        if transaction.payment_status != "REQUIRES_APPROVAL":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reject transaction with status '{transaction.payment_status}'. Only 'REQUIRES_APPROVAL' can be rejected.",
            )

        # Update ApprovalRequest
        approval_req = (
            db.query(ApprovalRequest)
            .filter(ApprovalRequest.transaction_id == transaction_id)
            .first()
        )
        if approval_req:
            approval_req.status = "REJECTED"
            approval_req.rejected_at = utc_now()
            approval_req.reviewer_notes = reviewer_notes

        transaction.payment_status = "REJECTED"

        # Record rejection audit log
        db.add(
            AuditLog(
                transaction_id=transaction.id,
                agent_id=transaction.agent_id,
                action="HUMAN_APPROVAL_REJECTED",
                reason=reviewer_notes or "Transaction rejected by reviewer.",
                metadata_json={"reviewer_notes": reviewer_notes},
            )
        )

        db.commit()
        db.refresh(transaction)
        return transaction

    @classmethod
    async def capture_approved_order(cls, db: Session, transaction_id: str) -> Transaction:
        """
        Captures the PayPal order once the buyer has approved the payment on PayPal.
        """
        transaction = (
            db.query(Transaction).filter(Transaction.id == transaction_id).first()
        )
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        if not transaction.paypal_order_id:
            raise HTTPException(status_code=400, detail="Transaction does not have an active PayPal Order ID")

        if transaction.payment_status not in ("PAYPAL_CREATED", "PAYPAL_APPROVED", "APPROVED"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot capture order in status '{transaction.payment_status}'. Must be PAYPAL_CREATED or PAYPAL_APPROVED.",
            )

        try:
            capture_data = await paypal_service.capture_order(transaction.paypal_order_id)
            if capture_data.get("status") in ("COMPLETED", "APPROVED"):
                transaction.payment_status = "COMPLETED"
                transaction.paypal_capture_id = capture_data.get("capture_id")

                db.add(
                    AuditLog(
                        transaction_id=transaction.id,
                        agent_id=transaction.agent_id,
                        action="PAYPAL_PAYMENT_CAPTURED",
                        reason=f"Payment captured successfully. Capture ID: {transaction.paypal_capture_id}",
                        metadata_json=capture_data,
                    )
                )
            else:
                transaction.payment_status = "FAILED"
                db.add(
                    AuditLog(
                        transaction_id=transaction.id,
                        agent_id=transaction.agent_id,
                        action="PAYPAL_CAPTURE_FAILED",
                        reason=f"Payment capture returned status: {capture_data.get('status')}",
                        metadata_json=capture_data,
                    )
                )
        except Exception as e:
            transaction.payment_status = "FAILED"
            db.add(
                AuditLog(
                    transaction_id=transaction.id,
                    agent_id=transaction.agent_id,
                    action="PAYPAL_CAPTURE_EXCEPTION",
                    reason=f"Exception during payment capture: {str(e)}",
                )
            )
            db.commit()
            raise HTTPException(status_code=502, detail=f"PayPal Capture failed: {str(e)}")

        db.commit()
        db.refresh(transaction)
        return transaction


approval_service = ApprovalService()
