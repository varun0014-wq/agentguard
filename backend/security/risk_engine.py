"""
Risk Engine for AgentGuard.
Calculates dynamic transaction risk scores and risk categories based on behavioral and policy factors.
"""

from decimal import Decimal
from typing import List, Dict, Any, Tuple


class RiskEngine:
    """
    Computes risk score (0 - 100) and risk level.
    Deterministic weights:
      - New merchant: +30
      - Amount above auto-approval threshold: +25
      - Price mismatch: +40
      - Unusual purchasing pattern: +20
      - Duplicate request: +50
    """

    @classmethod
    def calculate_risk(
        cls,
        amount: Decimal,
        auto_approval_limit: Decimal,
        is_new_merchant: bool,
        is_price_mismatch: bool,
        is_unusual_pattern: bool,
        is_duplicate: bool,
        additional_penalty: int = 0,
    ) -> Tuple[int, List[str]]:
        score = 0
        reasons: List[str] = []

        if is_new_merchant:
            score += 30
            reasons.append("Merchant is not approved (New merchant: +30 risk)")

        if amount > auto_approval_limit:
            score += 25
            reasons.append(
                f"Amount ${amount:.2f} exceeds auto-approval threshold ${auto_approval_limit:.2f} (+25 risk)"
            )

        if is_price_mismatch:
            score += 40
            reasons.append("Product price does not match verified offer (+40 risk)")

        if is_unusual_pattern:
            score += 20
            reasons.append("Unusual purchasing pattern or velocity detected (+20 risk)")

        if is_duplicate:
            score += 50
            reasons.append("Duplicate transaction pattern detected (+50 risk)")

        if additional_penalty > 0:
            score += additional_penalty

        # Cap score between 0 and 100
        final_score = min(100, max(0, score))
        return final_score, reasons

    @classmethod
    def score_to_category(cls, score: int) -> str:
        """
        0–24: Potential auto approval
        25–59: Human review
        60–100: Block
        """
        if score < 25:
            return "AUTO_APPROVE"
        elif score < 60:
            return "REVIEW"
        else:
            return "BLOCK"
