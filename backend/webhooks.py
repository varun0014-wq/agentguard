"""
PayPal Webhook Receiver for AgentGuard.
Validates webhook signatures and updates transaction statuses asynchronously.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Transaction, AuditLog
from backend.schemas import PayPalWebhookResponse
from backend.services.paypal_service import paypal_service

logger = logging.getLogger("agentguard.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/paypal", response_model=PayPalWebhookResponse, summary="Receive PayPal Webhook events")
async def receive_paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
    paypal_transmission_id: Optional[str] = Header(None, alias="paypal-transmission-id"),
    paypal_transmission_time: Optional[str] = Header(None, alias="paypal-transmission-time"),
    paypal_cert_url: Optional[str] = Header(None, alias="paypal-cert-url"),
    paypal_auth_algo: Optional[str] = Header(None, alias="paypal-auth-algo"),
    paypal_transmission_sig: Optional[str] = Header(None, alias="paypal-transmission-sig"),
):
    """
    Receives and verifies PayPal webhook events.
    Verifies signature before updating transaction state.
    """
    try:
        body_json: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = body_json.get("event_type", "UNKNOWN")

    # Step 1: Verify webhook signature
    is_valid = await paypal_service.verify_webhook_signature(
        transmission_id=paypal_transmission_id or "",
        transmission_time=paypal_transmission_time or "",
        cert_url=paypal_cert_url or "",
        auth_algo=paypal_auth_algo or "",
        transmission_sig=paypal_transmission_sig or "",
        webhook_body=body_json,
    )

    if not is_valid:
        logger.warning(f"PayPal webhook signature verification failed for event: {event_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PayPal webhook signature",
        )

    # Step 2: Handle event types
    resource = body_json.get("resource", {})
    order_id = resource.get("id") or resource.get("supplementary_data", {}).get("related_ids", {}).get("order_id")

    tx = None
    if order_id:
        tx = db.query(Transaction).filter(Transaction.paypal_order_id == order_id).first()

    if tx:
        if event_type == "CHECKOUT.ORDER.APPROVED":
            tx.payment_status = "PAYPAL_APPROVED"
            db.add(
                AuditLog(
                    transaction_id=tx.id,
                    agent_id=tx.agent_id,
                    action="WEBHOOK_BUYER_APPROVED",
                    reason="Buyer approved order on PayPal checkout interface",
                    metadata_json=resource,
                )
            )
        elif event_type == "PAYMENT.CAPTURE.COMPLETED":
            tx.payment_status = "COMPLETED"
            capture_id = resource.get("id")
            if capture_id:
                tx.paypal_capture_id = capture_id
            db.add(
                AuditLog(
                    transaction_id=tx.id,
                    agent_id=tx.agent_id,
                    action="WEBHOOK_PAYMENT_CAPTURED",
                    reason=f"Payment capture confirmed by PayPal webhook: {capture_id}",
                    metadata_json=resource,
                )
            )
        elif event_type in ("PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.DECLINED"):
            tx.payment_status = "FAILED"
            db.add(
                AuditLog(
                    transaction_id=tx.id,
                    agent_id=tx.agent_id,
                    action="WEBHOOK_PAYMENT_FAILED",
                    reason=f"Payment denied by PayPal webhook: {event_type}",
                    metadata_json=resource,
                )
            )
        db.commit()

    return PayPalWebhookResponse(
        status="processed",
        event_type=event_type,
        message=f"Webhook event {event_type} processed successfully",
    )
