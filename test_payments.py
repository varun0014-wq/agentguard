"""
Payments and Approval Flow Tests for AgentGuard.
Validates state transitions, human reviewer workflows, and PayPal integration.
"""

import uuid
import pytest
from backend.models import Transaction, ApprovalRequest


def test_payment_approval_workflow(db_session, client):
    """
    Tests full human approval workflow:
    1. Transaction triggers human review (REQUIRES_APPROVAL)
    2. Listed in /payments/pending
    3. Human reviewer approves via /payments/{id}/approve
    4. State transitions to APPROVED/PAYPAL_CREATED with PayPal approval link
    """
    # 1. Create a transaction that requires review
    idem_key = f"review_idem_{uuid.uuid4().hex[:8]}"
    create_res = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Wireless Headphones",
            "merchant": "NewStore",
            "amount": "80.00",
            "currency": "USD",
            "product_reference": "prod_hp_002",
            "idempotency_key": idem_key,
        },
    )
    assert create_res.status_code == 201
    tx_data = create_res.json()
    tx_id = tx_data["id"]
    assert tx_data["payment_status"] == "REQUIRES_APPROVAL"

    # 2. Check pending list
    pending_res = client.get("/payments/pending")
    assert pending_res.status_code == 200
    pending_ids = [item["id"] for item in pending_res.json()]
    assert tx_id in pending_ids

    # 3. Approve transaction
    approve_res = client.post(
        f"/payments/{tx_id}/approve",
        json={"reviewer_notes": "Manager verified legitimate purchase."},
    )
    assert approve_res.status_code == 200
    approve_data = approve_res.json()
    assert approve_data["status"] == "APPROVED"
    assert approve_data["paypal_order_id"] is not None
    assert "paypal.com" in approve_data["paypal_approval_url"]

    # 4. Verify transaction details reflect approval
    detail_res = client.get(f"/payments/{tx_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["payment_status"] == "PAYPAL_CREATED"

    # 5. Verify pending list is now empty of this transaction
    pending_res_after = client.get("/payments/pending")
    pending_ids_after = [item["id"] for item in pending_res_after.json()]
    assert tx_id not in pending_ids_after


def test_payment_rejection_workflow(db_session, client):
    """
    Tests human reviewer rejection workflow:
    1. Transaction triggers review
    2. Reviewer rejects via /payments/{id}/reject
    3. State transitions to REJECTED, no PayPal order created
    """
    idem_key = f"reject_idem_{uuid.uuid4().hex[:8]}"
    create_res = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Premium Speaker",
            "merchant": "NewStore",
            "amount": "85.00",
            "currency": "USD",
            "idempotency_key": idem_key,
        },
    )
    assert create_res.status_code == 201
    tx_id = create_res.json()["id"]

    reject_res = client.post(
        f"/payments/{tx_id}/reject",
        json={"reviewer_notes": "Budget exceeded for discretionary items."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    detail_res = client.get(f"/payments/{tx_id}")
    assert detail_res.json()["payment_status"] == "REJECTED"


def test_payment_capture_workflow(db_session, client):
    """
    Tests capturing an order after approval.
    """
    # Create auto-approved order
    idem_key = f"capture_idem_{uuid.uuid4().hex[:8]}"
    create_res = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Wireless Keyboard",
            "merchant": "TrustedStore",
            "amount": "20.00",
            "currency": "USD",
            "product_reference": "prod_kb_001",
            "idempotency_key": idem_key,
        },
    )
    tx_id = create_res.json()["id"]

    # Capture payment
    capture_res = client.post(f"/payments/{tx_id}/capture")
    assert capture_res.status_code == 200
    capture_data = capture_res.json()
    assert capture_data["payment_status"] == "COMPLETED"
    assert capture_data["paypal_capture_id"] is not None


def test_paypal_webhook_processing(db_session, client):
    """
    Tests PayPal Webhook signature check and event handling.
    """
    # 1. Create an order to receive webhooks for
    idem_key = f"wh_idem_{uuid.uuid4().hex[:8]}"
    create_res = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Wireless Keyboard",
            "merchant": "TrustedStore",
            "amount": "20.00",
            "currency": "USD",
            "product_reference": "prod_kb_001",
            "idempotency_key": idem_key,
        },
    )
    order_id = create_res.json()["paypal_order_id"]

    # 2. Simulate valid webhook
    webhook_payload = {
        "id": "WH-EVT-001",
        "event_type": "CHECKOUT.ORDER.APPROVED",
        "resource": {
            "id": order_id,
            "status": "APPROVED",
        },
    }
    headers = {
        "paypal-transmission-id": "trans_12345",
        "paypal-transmission-time": "2026-11-09T12:00:00Z",
        "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-transmission-sig": "valid_signature_string",
    }
    response = client.post("/webhooks/paypal", json=webhook_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "processed"
