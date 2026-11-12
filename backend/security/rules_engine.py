"""
Deterministic Security Rules Engine for AgentGuard.
Evaluates transactions against strict financial and security policies.
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models import Agent, SecurityPolicy, Transaction


class PolicyCheckResult:
    def __init__(
        self,
        passed: bool,
        is_hard_violation: bool,
        rule_name: str,
        reason: str,
        risk_penalty: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.passed = passed
        self.is_hard_violation = is_hard_violation
        self.rule_name = rule_name
        self.reason = reason
        self.risk_penalty = risk_penalty
        self.metadata = metadata or {}


class RulesEngine:
    """
    Executes independent, deterministic policy checks.
    Independent Python code is the final authority.
    """

    @staticmethod
    def get_effective_limits(agent: Agent, policy: SecurityPolicy) -> Tuple[Decimal, Decimal, Decimal, Decimal]:
        """
        Calculates effective limits for the agent.
        Agent-specific restrictions override global policy limits if set.
        """
        daily_limit = agent.daily_limit if agent.daily_limit is not None else policy.daily_limit
        monthly_limit = agent.monthly_limit if agent.monthly_limit is not None else getattr(policy, "monthly_limit", Decimal("500.00"))
        max_tx = agent.max_transaction if agent.max_transaction is not None else policy.max_transaction
        auto_limit = agent.auto_approval_limit if agent.auto_approval_limit is not None else policy.auto_approval_limit
        return Decimal(str(daily_limit)), Decimal(str(monthly_limit)), Decimal(str(max_tx)), Decimal(str(auto_limit))

    @staticmethod
    def get_today_spent(db: Session, agent_id: str) -> Decimal:
        """
        Concurrency-safe calculation of today's total spending by the agent.
        Includes completed and active approved transactions.
        """
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        total = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.agent_id == agent_id,
                Transaction.created_at >= today_start,
                Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
            )
            .scalar()
        )
        return Decimal(str(total))

    @staticmethod
    def get_this_month_spent(db: Session, agent_id: str) -> Decimal:
        """
        Concurrency-safe calculation of current month's total spending by the agent.
        """
        month_start = datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        total = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.agent_id == agent_id,
                Transaction.created_at >= month_start,
                Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
            )
            .scalar()
        )
        return Decimal(str(total))

    @classmethod
    def check_monthly_budget(
        cls, amount: Decimal, month_spent: Decimal, monthly_limit: Decimal
    ) -> PolicyCheckResult:
        projected = month_spent + amount
        if projected > monthly_limit:
            remaining = max(Decimal("0.00"), monthly_limit - month_spent)
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="MONTHLY_BUDGET_LIMIT",
                reason=(
                    f"Requested ${amount:.2f} pushes this month's spend to ${projected:.2f}, "
                    f"exceeding monthly limit ${monthly_limit:.2f} (remaining: ${remaining:.2f})"
                ),
                risk_penalty=60,
            )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="MONTHLY_BUDGET_LIMIT",
            reason=f"Monthly spend ${projected:.2f} is within budget ${monthly_limit:.2f}",
        )

    @classmethod
    def check_agent_active(cls, agent: Optional[Agent]) -> PolicyCheckResult:
        if not agent:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="AGENT_EXISTS",
                reason="Agent not found in registry",
                risk_penalty=100,
            )
        if agent.status.lower() != "active":
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="AGENT_ACTIVE",
                reason=f"Agent '{agent.name}' is currently {agent.status.upper()}",
                risk_penalty=100,
            )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="AGENT_ACTIVE",
            reason="Agent is active",
        )

    @classmethod
    def check_max_transaction(cls, amount: Decimal, max_tx: Decimal) -> PolicyCheckResult:
        if amount > max_tx:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="MAX_TRANSACTION_LIMIT",
                reason=f"Transaction amount ${amount:.2f} exceeds maximum allowed limit ${max_tx:.2f}",
                risk_penalty=60,
            )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="MAX_TRANSACTION_LIMIT",
            reason=f"Amount ${amount:.2f} is within max transaction limit ${max_tx:.2f}",
        )

    @classmethod
    def check_daily_budget(
        cls, amount: Decimal, today_spent: Decimal, daily_limit: Decimal
    ) -> PolicyCheckResult:
        projected = today_spent + amount
        if projected > daily_limit:
            remaining = max(Decimal("0.00"), daily_limit - today_spent)
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="DAILY_BUDGET_LIMIT",
                reason=(
                    f"Requested ${amount:.2f} pushes today's spend to ${projected:.2f}, "
                    f"exceeding daily limit ${daily_limit:.2f} (remaining: ${remaining:.2f})"
                ),
                risk_penalty=60,
            )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="DAILY_BUDGET_LIMIT",
            reason=f"Daily spend ${projected:.2f} is within budget ${daily_limit:.2f}",
        )

    @classmethod
    def check_merchant_policy(
        cls, merchant: str, policy: SecurityPolicy
    ) -> PolicyCheckResult:
        allowed = [m.lower() for m in (policy.allowed_merchants or [])]
        restricted = [m.lower() for m in (policy.restricted_merchants or [])]
        merchant_clean = merchant.strip().lower()

        # Hard block if merchant is restricted
        if merchant_clean in restricted:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="MERCHANT_RESTRICTED",
                reason=f"Merchant '{merchant}' is explicitly restricted by security policy",
                risk_penalty=100,
            )

        # Soft flag if merchant is new / not in pre-approved list
        if allowed and merchant_clean not in allowed:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=False,  # Not hard violation, but triggers review (+30 risk)
                rule_name="MERCHANT_UNAPPROVED",
                reason=f"Merchant '{merchant}' is not in approved merchants list (New Merchant)",
                risk_penalty=30,
            )

        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="MERCHANT_APPROVED",
            reason=f"Merchant '{merchant}' is approved",
        )

    @classmethod
    def check_price_verification(
        cls, submitted_amount: Decimal, verified_price: Optional[Decimal]
    ) -> PolicyCheckResult:
        """
        Validates that submitted amount matches the verified catalog/offer price.
        """
        if verified_price is not None:
            sub_dec = Decimal(str(submitted_amount))
            ver_dec = Decimal(str(verified_price))
            diff = abs(sub_dec - ver_dec)
            if diff > Decimal("0.01"):
                return PolicyCheckResult(
                    passed=False,
                    is_hard_violation=True,
                    rule_name="PRICE_VERIFICATION",
                    reason=(
                        f"Product price does not match verified offer: "
                        f"submitted ${sub_dec:.2f} vs verified ${ver_dec:.2f}"
                    ),
                    risk_penalty=40,
                )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="PRICE_VERIFICATION",
            reason="Price matches verified offer or catalog reference",
        )

    @classmethod
    def check_currency(cls, currency: str, policy: SecurityPolicy) -> PolicyCheckResult:
        allowed = [c.upper() for c in (policy.allowed_currencies or ["USD"])]
        if currency.upper() not in allowed:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="CURRENCY_PERMITTED",
                reason=f"Currency '{currency}' is not permitted. Allowed: {allowed}",
                risk_penalty=70,
            )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="CURRENCY_PERMITTED",
            reason=f"Currency '{currency}' is permitted",
        )

    @classmethod
    def check_idempotency_and_duplicates(
        cls,
        db: Session,
        agent_id: str,
        idempotency_key: str,
        product_name: str,
        merchant: str,
        amount: Decimal,
    ) -> PolicyCheckResult:
        # Check 1: Idempotency key must be provided
        if not idempotency_key or not idempotency_key.strip():
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="IDEMPOTENCY_KEY_MISSING",
                reason="Transaction must have a valid idempotency key",
                risk_penalty=100,
            )

        # Check 2: Idempotency key already used
        existing_idem = (
            db.query(Transaction)
            .filter(Transaction.idempotency_key == idempotency_key)
            .first()
        )
        if existing_idem:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=True,
                rule_name="DUPLICATE_IDEMPOTENCY_KEY",
                reason=f"Duplicate request detected: idempotency key '{idempotency_key}' already processed in transaction {existing_idem.id}",
                risk_penalty=100,
                metadata={"duplicate_transaction_id": existing_idem.id},
            )

        # Check 3: Suspicious identical transaction submitted in last 5 minutes
        recent_threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
        recent_duplicate = (
            db.query(Transaction)
            .filter(
                Transaction.agent_id == agent_id,
                Transaction.product_name == product_name,
                Transaction.merchant == merchant,
                Transaction.amount == amount,
                Transaction.created_at >= recent_threshold,
                Transaction.payment_status.in_(["APPROVED", "COMPLETED", "REQUIRES_APPROVAL", "PAYPAL_CREATED"]),
            )
            .first()
        )
        if recent_duplicate:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=False,
                rule_name="SUSPICIOUS_DUPLICATE_ORDER",
                reason=f"Duplicate order: identical request was submitted {recent_duplicate.created_at.strftime('%H:%M:%S UTC')}",
                risk_penalty=50,
                metadata={"original_transaction_id": recent_duplicate.id},
            )

        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="DUPLICATE_CHECK",
            reason="Idempotency key valid and no duplicate detected",
        )

    @classmethod
    def check_unusual_velocity(cls, db: Session, agent_id: str) -> PolicyCheckResult:
        """
        Detects unusual purchasing patterns (e.g. >3 transactions in last 5 minutes).
        """
        recent_threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
        count = (
            db.query(func.count(Transaction.id))
            .filter(
                Transaction.agent_id == agent_id,
                Transaction.created_at >= recent_threshold,
            )
            .scalar()
        )
        if count >= 3:
            return PolicyCheckResult(
                passed=False,
                is_hard_violation=False,
                rule_name="UNUSUAL_VELOCITY",
                reason=f"Unusual purchasing velocity: {count} transactions submitted in the past 5 minutes",
                risk_penalty=20,
            )
        return PolicyCheckResult(
            passed=True,
            is_hard_violation=False,
            rule_name="UNUSUAL_VELOCITY",
            reason="Purchasing velocity is normal",
        )
