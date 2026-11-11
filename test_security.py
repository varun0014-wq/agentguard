"""
Security and Policy Engine Tests for AgentGuard.
Validates deterministic policy checks, risk scoring, and hard violation overrides.
"""

from decimal import Decimal
import uuid
import pytest
from backend.models import Transaction, Agent, SecurityPolicy
from backend.security.rules_engine import RulesEngine
from backend.security.risk_engine import RiskEngine
from backend.security.decision_engine import DecisionEngine
from backend.agents.auditor_agent import auditor_agent


def test_scenario_1_auto_approval(db_session, client):
    """
    SCENARIO 1: AUTO APPROVAL
    Product: Wireless Keyboard ($20)
    Merchant: TrustedStore
    Threshold: $50
    Expected: APPROVE (risk score < 25)
    """
    payload = {
        "agent_id": "test_agent_active",
        "product_name": "Wireless Keyboard",
        "merchant": "TrustedStore",
        "amount": "20.00",
        "currency": "USD",
        "product_reference": "prod_kb_001",
        "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
    }
    response = client.post("/payments/request", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["decision"] == "APPROVE"
    assert data["risk_score"] < 25
    assert data["payment_status"] in ("APPROVED", "PAYPAL_CREATED")
    assert data["paypal_order_id"] is not None


def test_scenario_2_human_approval(db_session, client):
    """
    SCENARIO 2: HUMAN APPROVAL REQUIRED
    Product: Wireless Headphones ($80)
    Merchant: NewStore (Unapproved merchant: +30, Amount > $50 auto-threshold: +25)
    Expected: REVIEW (Risk score 55), Status: REQUIRES_APPROVAL
    """
    payload = {
        "agent_id": "test_agent_active",
        "product_name": "Wireless Headphones",
        "merchant": "NewStore",
        "amount": "80.00",
        "currency": "USD",
        "product_reference": "prod_hp_002",
        "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
    }
    response = client.post("/payments/request", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["decision"] == "REVIEW"
    assert 25 <= data["risk_score"] < 60
    assert data["payment_status"] == "REQUIRES_APPROVAL"
    # Blocked from creating PayPal order until approved
    assert data["paypal_order_id"] is None


def test_scenario_3_manipulated_price_blocked(db_session, client):
    """
    SCENARIO 3: MANIPULATED PAYMENT
    Product: Laptop
    Verified Price: $500
    Submitted Amount: $900
    Expected: BLOCKED (Hard policy violation: Price does not match verified offer)
    """
    payload = {
        "agent_id": "test_agent_active",
        "product_name": "Laptop",
        "merchant": "TechStore",
        "amount": "900.00",  # Manipulated price! Verified is 500.00
        "currency": "USD",
        "product_reference": "prod_lp_003",
        "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
    }
    response = client.post("/payments/request", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["decision"] == "BLOCK"
    assert data["payment_status"] == "BLOCKED"
    assert data["paypal_order_id"] is None
    # Verify reasons mention price mismatch
    assert any("price" in r.lower() for r in data["risk_reasons"])


def test_max_transaction_limit_exceeded(db_session, client):
    """
    Tests that transactions exceeding the max limit ($100) are hard BLOCKED.
    """
    payload = {
        "agent_id": "test_agent_active",
        "product_name": "Pro Monitor",
        "merchant": "TrustedStore",
        "amount": "150.00",  # Max transaction is 100.00
        "currency": "USD",
        "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
    }
    response = client.post("/payments/request", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["decision"] == "BLOCK"
    assert data["payment_status"] == "BLOCKED"
    assert any("exceeds maximum allowed limit" in r for r in data["risk_reasons"])


def test_daily_budget_limit_exceeded(db_session, client):
    """
    Tests that cumulative spending exceeding the daily budget ($200) is BLOCKED.
    """
    # First transaction: $90 (approved)
    res1 = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Office Chair Part 1",
            "merchant": "TrustedStore",
            "amount": "40.00",
            "currency": "USD",
            "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
        },
    )
    assert res1.json()["decision"] == "APPROVE"

    # Second transaction: $40 (approved)
    res2 = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Office Chair Part 2",
            "merchant": "TrustedStore",
            "amount": "40.00",
            "currency": "USD",
            "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
        },
    )
    assert res2.json()["decision"] == "APPROVE"

    # Third transaction: $40 (approved)
    res3 = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Office Chair Part 3",
            "merchant": "TrustedStore",
            "amount": "40.00",
            "currency": "USD",
            "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
        },
    )
    assert res3.json()["decision"] == "APPROVE"

    # Fourth transaction: $95 -> 40+40+40+95 = 215 > 200 daily limit -> MUST BE BLOCKED!
    res4 = client.post(
        "/payments/request",
        json={
            "agent_id": "test_agent_active",
            "product_name": "Extra Item",
            "merchant": "TrustedStore",
            "amount": "95.00",
            "currency": "USD",
            "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
        },
    )
    data4 = res4.json()
    assert data4["decision"] == "BLOCK"
    assert any("daily limit" in r.lower() for r in data4["risk_reasons"])


def test_restricted_merchant_blocked(db_session, client):
    """
    Tests that transactions to blacklisted merchants are immediately BLOCKED.
    """
    payload = {
        "agent_id": "test_agent_active",
        "product_name": "USB Gadget",
        "merchant": "ShadyMarket",  # Explicitly in restricted list
        "amount": "10.00",
        "currency": "USD",
        "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
    }
    response = client.post("/payments/request", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["decision"] == "BLOCK"
    assert any("restricted" in r.lower() for r in data["risk_reasons"])


def test_inactive_agent_blocked(db_session, client):
    """
    Tests that paused or inactive agents cannot execute payments.
    """
    payload = {
        "agent_id": "test_agent_paused",
        "product_name": "Mousepad",
        "merchant": "TrustedStore",
        "amount": "15.00",
        "currency": "USD",
        "idempotency_key": f"test_idem_{uuid.uuid4().hex[:12]}",
    }
    response = client.post("/payments/request", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["decision"] == "BLOCK"
    assert any("paused" in r.lower() for r in data["risk_reasons"])


def test_duplicate_idempotency_key_blocked(db_session, client):
    """
    Tests that duplicate requests with the same idempotency key are rejected.
    """
    idem_key = f"fixed_idem_{uuid.uuid4().hex[:8]}"
    payload = {
        "agent_id": "test_agent_active",
        "product_name": "Cable",
        "merchant": "TrustedStore",
        "amount": "12.00",
        "currency": "USD",
        "idempotency_key": idem_key,
    }

    # First submission
    res1 = client.post("/payments/request", json=payload)
    assert res1.status_code == 201
    assert res1.json()["decision"] == "APPROVE"

    # Second submission with exact same idempotency key
    res2 = client.post("/payments/request", json=payload)
    assert res2.status_code == 201
    assert res2.json()["decision"] == "BLOCK"
    assert any("duplicate" in r.lower() for r in res2.json()["risk_reasons"])


def test_agent_cannot_modify_security_policies(client):
    """
    Ensures Agent A (purchasing agent) is strictly prohibited from modifying financial rules.
    """
    update_payload = {
        "daily_limit": "5000.00",
        "max_transaction": "2000.00",
    }
    response = client.put(
        "/security/rules",
        json=update_payload,
        headers={"x-actor-role": "buyer_agent"},
    )
    assert response.status_code == 403
    assert "prohibited" in response.json()["detail"].lower()
