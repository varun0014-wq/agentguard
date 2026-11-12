"""
Transaction Management Service for AgentGuard.
Orchestrates payment requests, audit logs, and lifecycle state transitions.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import Transaction, Agent, SecurityPolicy, ApprovalRequest, AuditLog
from backend.schemas import PaymentRequestCreate, PaymentResponse
from backend.agents.auditor_agent import auditor_agent
from backend.services.paypal_service import paypal_service
from backend.services.channel3_service import channel3_service


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TransactionService:
    @classmethod
    async def process_payment_request(
        cls, db: Session, req: PaymentRequestCreate
    ) -> Transaction:
        """
        Processes an incoming payment request through the complete AgentGuard firewall.
        """
        # Lookup agent
        agent = db.query(Agent).filter(Agent.id == req.agent_id).first()

        # Lookup policy (use agent's user policy or default policy)
        user_id = agent.user_id if agent else "default_user"
        policy = db.query(SecurityPolicy).filter(SecurityPolicy.user_id == user_id).first()
        if not policy:
            # Fallback to any existing policy or create default
            policy = db.query(SecurityPolicy).first()
            if not policy:
                policy = SecurityPolicy(
                    user_id=user_id,
                    daily_limit=Decimal("200.00"),
                    max_transaction=Decimal("100.00"),
                    auto_approval_limit=Decimal("50.00"),
                    allowed_merchants=["TrustedStore", "TechStore", "VerifiedShop", "OfficeSuppliesCo"],
                    restricted_merchants=["ShadyMarket", "BannedVendor"],
                    allowed_currencies=["USD"],
                )
                db.add(policy)
                db.flush()

        # Step 1: Independent Auditor Evaluation
        eval_result = auditor_agent.audit_transaction(
            db=db,
            agent=agent,
            policy=policy,
            amount=req.amount,
            merchant=req.merchant,
            currency=req.currency,
            idempotency_key=req.idempotency_key,
            product_name=req.product_name,
            product_reference=req.product_reference,
        )

        # Lookup verified price for recording
        verified_price = channel3_service.get_verified_price(
            product_reference=req.product_reference,
            product_name=req.product_name,
        )

        # Determine initial payment status based on security decision
        if eval_result.decision == "APPROVE":
            payment_status = "APPROVED"
        elif eval_result.decision == "REVIEW":
            payment_status = "REQUIRES_APPROVAL"
        else:
            payment_status = "BLOCKED"

        # Handle duplicate idempotency key gracefully for blocked audit trail
        stored_idem_key = req.idempotency_key
        existing_tx = db.query(Transaction).filter(Transaction.idempotency_key == req.idempotency_key).first()
        if existing_tx:
            stored_idem_key = f"{req.idempotency_key}_rejected_dup_{uuid.uuid4().hex[:8]}"

        # Create Transaction record
        transaction = Transaction(
            agent_id=req.agent_id,
            product_name=req.product_name,
            product_reference=req.product_reference,
            merchant=req.merchant,
            category=getattr(req, "category", "Shopping") or "Shopping",
            direction="OUTGOING",
            amount=req.amount,
            verified_price=verified_price,
            currency=req.currency.upper(),
            risk_score=eval_result.risk_score,
            decision=eval_result.decision,
            payment_status=payment_status,
            idempotency_key=stored_idem_key,
            risk_reasons=eval_result.reasons,
        )
        db.add(transaction)
        db.flush()

        # Create initial audit log
        audit_log = AuditLog(
            transaction_id=transaction.id,
            agent_id=req.agent_id,
            action=f"SECURITY_EVALUATION_{eval_result.decision}",
            reason=eval_result.auditor_commentary or "; ".join(eval_result.reasons),
            metadata_json={
                "risk_score": eval_result.risk_score,
                "policy_violations": eval_result.policy_violations,
                "reasons": eval_result.reasons,
            },
        )
        db.add(audit_log)

        # Handle Decision Actions:
        if eval_result.decision == "APPROVE":
            # Auto-approved: initiate PayPal Order creation
            try:
                order_data = await paypal_service.create_order(
                    reference_id=transaction.id,
                    amount=transaction.amount,
                    currency=transaction.currency,
                    description=f"Purchase of {transaction.product_name} from {transaction.merchant}",
                )
                transaction.paypal_order_id = order_data.get("id")
                transaction.paypal_approval_url = order_data.get("approval_url")
                transaction.payment_status = "PAYPAL_CREATED"

                db.add(
                    AuditLog(
                        transaction_id=transaction.id,
                        agent_id=req.agent_id,
                        action="PAYPAL_ORDER_CREATED",
                        reason="Auto-approved purchase order created in PayPal",
                        metadata_json={"paypal_order_id": order_data.get("id")},
                    )
                )
            except Exception as e:
                transaction.payment_status = "FAILED"
                db.add(
                    AuditLog(
                        transaction_id=transaction.id,
                        agent_id=req.agent_id,
                        action="PAYPAL_ORDER_FAILED",
                        reason=f"Failed to create PayPal order: {str(e)}",
                    )
                )

        elif eval_result.decision == "REVIEW":
            # Human review required: create approval request
            approval_req = ApprovalRequest(
                transaction_id=transaction.id,
                status="PENDING",
            )
            db.add(approval_req)

        elif eval_result.decision == "BLOCK":
            # Blocked: NEVER reach PayPal
            pass

        db.commit()
        db.refresh(transaction)
        return transaction

    @classmethod
    def get_all_transactions(
        cls,
        db: Session,
        status: Optional[str] = None,
        decision: Optional[str] = None,
        agent_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Transaction]:
        query = db.query(Transaction)
        if status:
            query = query.filter(Transaction.payment_status == status)
        if decision:
            query = query.filter(Transaction.decision == decision)
        if agent_id:
            query = query.filter(Transaction.agent_id == agent_id)
        return (
            query.order_by(Transaction.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @classmethod
    def get_transaction_by_id(cls, db: Session, transaction_id: str) -> Optional[Transaction]:
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()


transaction_service = TransactionService()
