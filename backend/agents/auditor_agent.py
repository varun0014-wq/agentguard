"""
Agent B: Independent Financial Auditor.
Evaluates purchase requests submitted by AI agents.
Performs independent policy verification and risk evaluation.

CRITICAL SECURITY PRINCIPLE:
The auditor NEVER trusts Agent A's explanations or self-reported status.
Independent Python policy checks in the DecisionEngine are the final authority.
An LLM can explain a decision but CANNOT override a security rule.
"""

from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from backend.models import Agent, SecurityPolicy
from backend.schemas import SecurityEvaluationResult
from backend.security.decision_engine import DecisionEngine
from backend.services.channel3_service import channel3_service
from backend.agents.ai_provider import AIProvider


class AuditorAgent:
    """
    Independent financial auditor agent for verifying and explaining transactions.
    """

    @classmethod
    def audit_transaction(
        cls,
        db: Session,
        agent: Optional[Agent],
        policy: SecurityPolicy,
        amount: Decimal,
        merchant: str,
        currency: str,
        idempotency_key: str,
        product_name: str,
        product_reference: Optional[str] = None,
    ) -> SecurityEvaluationResult:
        """
        Conducts independent audit of a purchase request:
        1. Independently verify the catalog price via Channel3 service
        2. Run deterministic decision engine (final authority)
        3. Generate auditor explanation for human reviewers and logs
        """
        # Step 1: Independently lookup verified price
        verified_price = channel3_service.get_verified_price(
            product_reference=product_reference,
            product_name=product_name,
        )

        # Step 2: Deterministic evaluation (Python rules are final authority!)
        evaluation = DecisionEngine.evaluate(
            db=db,
            agent=agent,
            policy=policy,
            amount=amount,
            merchant=merchant,
            currency=currency,
            idempotency_key=idempotency_key,
            product_name=product_name,
            verified_price=verified_price,
        )

        # Step 3: Generate human-readable explanation
        commentary = AIProvider.generate_auditor_explanation(
            decision=evaluation.decision,
            risk_score=evaluation.risk_score,
            reasons=evaluation.reasons,
            policy_violations=evaluation.policy_violations,
            product_name=product_name,
            merchant=merchant,
            amount=str(amount),
        )

        evaluation.auditor_commentary = commentary
        return evaluation


auditor_agent = AuditorAgent()
