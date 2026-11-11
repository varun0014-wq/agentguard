"""
AI Agent Tests for AgentGuard.
Validates Buyer Agent (Agent A) parsing and Auditor Agent (Agent B) independent verification.
"""

import pytest
from backend.agents.buyer_agent import buyer_agent
from backend.agents.auditor_agent import auditor_agent
from backend.agents.ai_provider import AIProvider
from backend.models import SecurityPolicy, Agent


import asyncio
from decimal import Decimal


def test_buyer_agent_instruction_processing():
    """
    Tests Agent A processing natural-language instruction:
    'Find wireless headphones under $100'
    """
    res = asyncio.run(buyer_agent.process_instruction("Find wireless headphones under $100"))
    assert res["success"] is True
    assert res["selected_product"] is not None
    assert "Headphones" in res["selected_product"]["name"]
    assert res["payment_request"] is not None
    assert res["payment_request"]["merchant"] == "NewStore"
    assert Decimal(str(res["payment_request"]["amount"])) == Decimal("80.00")
    assert res["payment_request"]["idempotency_key"] is not None


def test_buyer_agent_isolation():
    """
    Critical Security Test:
    Ensures Buyer Agent (Agent A) does not possess PayPal credentials or direct payment authority.
    """
    assert not hasattr(buyer_agent, "paypal_client_secret")
    assert not hasattr(buyer_agent, "execute_payment")


def test_independent_auditor_authority(db_session):
    """
    Critical Security Test:
    Verifies that Auditor Agent uses independent Python policy checks as the final authority,
    and cannot be tricked or overridden.
    """
    policy = db_session.query(SecurityPolicy).first()
    agent = db_session.query(Agent).filter(Agent.id == "test_agent_active").first()

    # Manipulated price test: submitted $900 vs verified $500
    audit_res = auditor_agent.audit_transaction(
        db=db_session,
        agent=agent,
        policy=policy,
        amount=Decimal("900.00"),
        merchant="TechStore",
        currency="USD",
        idempotency_key="audit_test_key_001",
        product_name="Laptop",
        product_reference="prod_lp_003",
    )

    # Must be BLOCKED regardless of any reasoning
    assert audit_res.decision == "BLOCK"
    assert audit_res.auditor_commentary is not None
    assert "BLOCKED" in audit_res.auditor_commentary or "violation" in audit_res.auditor_commentary.lower()


def test_purchase_instruction_endpoint(client):
    """
    Tests the API endpoint POST /agents/purchase-instruction.
    """
    response = client.post(
        "/agents/purchase-instruction",
        json={
            "agent_id": "test_agent_active",
            "instruction": "Find wireless keyboard under $50",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["selected_product"] is not None
    assert "Keyboard" in data["selected_product"]["name"]
    assert data["payment_request"] is not None


def test_dashboard_stats_and_activity(client):
    """
    Tests GET /dashboard/stats and GET /dashboard/activity.
    """
    stats_res = client.get("/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_transactions" in stats
    assert "remaining_daily_budget" in stats
    assert "active_agents_count" in stats

    activity_res = client.get("/dashboard/activity")
    assert activity_res.status_code == 200
    activity = activity_res.json()
    assert "count" in activity
    assert "activities" in activity
