"""
Decision Engine for AgentGuard.
Combines deterministic policy checks and risk scoring to produce the final financial authorization decision:
  1. APPROVE
  2. REVIEW (HUMAN APPROVAL REQUIRED)
  3. BLOCK
"""

from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session

from backend.models import Agent, SecurityPolicy
from backend.schemas import SecurityEvaluationResult
from backend.security.rules_engine import RulesEngine
from backend.security.risk_engine import RiskEngine


class DecisionEngine:
    @classmethod
    def evaluate(
        cls,
        db: Session,
        agent: Optional[Agent],
        policy: SecurityPolicy,
        amount: Decimal,
        merchant: str,
        currency: str,
        idempotency_key: str,
        product_name: str,
        verified_price: Optional[Decimal] = None,
    ) -> SecurityEvaluationResult:
        """
        Runs all deterministic checks and risk scoring.
        Independent Python policy checks are the final authority.
        """
        hard_violations: List[str] = []
        all_reasons: List[str] = []
        amount = Decimal(str(amount))

        # 1. Agent Active Check
        agent_res = RulesEngine.check_agent_active(agent)
        if not agent_res.passed:
            hard_violations.append(agent_res.reason)
            all_reasons.append(agent_res.reason)

        if not agent:
            return SecurityEvaluationResult(
                decision="BLOCK",
                risk_score=100,
                reasons=all_reasons,
                policy_violations=hard_violations,
                auditor_commentary="Evaluation blocked: Agent not registered in system.",
            )

        daily_limit, monthly_limit, max_tx, auto_limit = RulesEngine.get_effective_limits(agent, policy)

        # 2. Maximum Transaction Limit Check
        max_tx_res = RulesEngine.check_max_transaction(amount, max_tx)
        if not max_tx_res.passed:
            hard_violations.append(max_tx_res.reason)
            all_reasons.append(max_tx_res.reason)

        # 3. Daily Spending Budget Check
        today_spent = RulesEngine.get_today_spent(db, agent.id)
        budget_res = RulesEngine.check_daily_budget(amount, today_spent, daily_limit)
        if not budget_res.passed:
            hard_violations.append(budget_res.reason)
            all_reasons.append(budget_res.reason)

        # 3b. Monthly Spending Budget Check
        month_spent = RulesEngine.get_this_month_spent(db, agent.id)
        month_res = RulesEngine.check_monthly_budget(amount, month_spent, monthly_limit)
        if not month_res.passed:
            hard_violations.append(month_res.reason)
            all_reasons.append(month_res.reason)

        # 4. Merchant Policy Check
        merchant_res = RulesEngine.check_merchant_policy(merchant, policy)
        is_new_merchant = False
        if not merchant_res.passed:
            if merchant_res.is_hard_violation:
                hard_violations.append(merchant_res.reason)
                all_reasons.append(merchant_res.reason)
            else:
                is_new_merchant = True

        # 5. Product Price Verification
        price_res = RulesEngine.check_price_verification(amount, verified_price)
        is_price_mismatch = False
        if not price_res.passed:
            hard_violations.append(price_res.reason)
            all_reasons.append(price_res.reason)
            is_price_mismatch = True

        # 6. Currency Permitted Check
        currency_res = RulesEngine.check_currency(currency, policy)
        if not currency_res.passed:
            hard_violations.append(currency_res.reason)
            all_reasons.append(currency_res.reason)

        # 7. Idempotency and Duplicates Check
        idem_res = RulesEngine.check_idempotency_and_duplicates(
            db, agent.id, idempotency_key, product_name, merchant, amount
        )
        is_duplicate = False
        if not idem_res.passed:
            if idem_res.is_hard_violation:
                hard_violations.append(idem_res.reason)
                all_reasons.append(idem_res.reason)
            else:
                is_duplicate = True

        # 8. Velocity check
        velocity_res = RulesEngine.check_unusual_velocity(db, agent.id)
        is_unusual_pattern = not velocity_res.passed

        # Calculate dynamic risk score
        risk_score, risk_reasons = RiskEngine.calculate_risk(
            amount=amount,
            auto_approval_limit=auto_limit,
            is_new_merchant=is_new_merchant,
            is_price_mismatch=is_price_mismatch,
            is_unusual_pattern=is_unusual_pattern,
            is_duplicate=is_duplicate,
        )

        for r in risk_reasons:
            if r not in all_reasons:
                all_reasons.append(r)

        # Rule: Hard policy violations ALWAYS override risk scores
        if hard_violations:
            final_decision = "BLOCK"
            final_risk = max(risk_score, 80)
            if not all_reasons:
                all_reasons.extend(hard_violations)
        else:
            if risk_score < 25:
                final_decision = "APPROVE"
                final_risk = risk_score
                if not all_reasons:
                    all_reasons.append("All security rules satisfied. Below auto-approval threshold.")
            elif risk_score < 60:
                final_decision = "REVIEW"
                final_risk = risk_score
            else:
                final_decision = "BLOCK"
                final_risk = risk_score

        return SecurityEvaluationResult(
            decision=final_decision,
            risk_score=final_risk,
            reasons=all_reasons,
            policy_violations=hard_violations,
        )
