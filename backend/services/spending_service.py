"""
Monthly Spending Tracker Service for AgentGuard.
Handles transaction aggregation, category breakdowns, trends,
budget creation, and threshold alert calculations.
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from backend.models import Transaction, SpendingBudget, User
from backend.schemas import (
    MonthlySpendingResponse,
    CategoryBreakdownResponse,
    CategoryBreakdownItem,
    SpendingTrendsResponse,
    SpendingTrendItem,
    SpendingAlertResponse,
    BudgetCreate,
    BudgetResponse,
)
from backend.agents.ai_provider import AIProvider


class SpendingService:
    @classmethod
    def get_month_str(cls, dt: Optional[datetime] = None) -> str:
        d = dt or datetime.now(timezone.utc)
        return d.strftime("%Y-%m")

    @classmethod
    def get_monthly_spending(
        cls, db: Session, user_id: str = "default_user", month: Optional[str] = None
    ) -> MonthlySpendingResponse:
        target_month = month or cls.get_month_str()
        year, m = map(int, target_month.split("-"))

        # Outgoing completed/approved transactions
        outgoing_query = (
            db.query(
                func.coalesce(func.sum(Transaction.amount), 0),
                func.count(Transaction.id),
            )
            .filter(
                extract("year", Transaction.created_at) == year,
                extract("month", Transaction.created_at) == m,
                Transaction.direction == "OUTGOING",
                Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
            )
            .first()
        )
        total_spending = Decimal(str(outgoing_query[0]))
        tx_count = outgoing_query[1]

        # Incoming payments
        incoming_raw = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                extract("year", Transaction.created_at) == year,
                extract("month", Transaction.created_at) == m,
                Transaction.direction == "INCOMING",
                Transaction.payment_status.in_(["APPROVED", "COMPLETED"]),
            )
            .scalar()
        )
        total_incoming = Decimal(str(incoming_raw))

        # Category breakdown
        cat_items = cls.get_category_breakdown(db, user_id, target_month).categories

        # Budget check
        budget = (
            db.query(SpendingBudget)
            .filter(SpendingBudget.month == target_month)
            .first()
        )
        budget_limit = Decimal(str(budget.budget_amount)) if budget else None
        budget_pct = None
        if budget_limit and budget_limit > 0:
            budget_pct = round(float((total_spending / budget_limit) * 100), 1)

        # AI summary
        ai_summary = (
            f"In {target_month}, total spending reached ${total_spending:.2f} across {tx_count} transactions. "
        )
        if budget_limit:
            ai_summary += f"Budget utilization is at {budget_pct}% of ${budget_limit:.2f}."
        if cat_items:
            ai_summary += f" Top spending category is '{cat_items[0].category}' with ${cat_items[0].amount:.2f}."

        return MonthlySpendingResponse(
            month=target_month,
            total_spending=total_spending,
            total_incoming=total_incoming,
            net_savings=total_incoming - total_spending,
            transaction_count=tx_count,
            budget_limit=budget_limit,
            budget_used_percentage=budget_pct,
            categories=cat_items,
            ai_summary=ai_summary,
        )

    @classmethod
    def get_category_breakdown(
        cls, db: Session, user_id: str = "default_user", month: Optional[str] = None
    ) -> CategoryBreakdownResponse:
        target_month = month or cls.get_month_str()
        year, m = map(int, target_month.split("-"))

        rows = (
            db.query(
                Transaction.category,
                func.coalesce(func.sum(Transaction.amount), 0),
                func.count(Transaction.id),
            )
            .filter(
                extract("year", Transaction.created_at) == year,
                extract("month", Transaction.created_at) == m,
                Transaction.direction == "OUTGOING",
                Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
            )
            .group_by(Transaction.category)
            .all()
        )

        total = sum(Decimal(str(r[1])) for r in rows) if rows else Decimal("0.00")
        items = []
        for cat, amt, cnt in rows:
            amt_dec = Decimal(str(amt))
            pct = round(float((amt_dec / total) * 100), 1) if total > 0 else 0.0
            items.append(
                CategoryBreakdownItem(
                    category=cat or "Other",
                    amount=amt_dec,
                    percentage=pct,
                    count=cnt,
                )
            )

        # Sort descending by amount
        items.sort(key=lambda x: x.amount, reverse=True)

        return CategoryBreakdownResponse(
            month=target_month,
            total_spending=total,
            categories=items,
        )

    @classmethod
    def get_spending_trends(
        cls, db: Session, user_id: str = "default_user"
    ) -> SpendingTrendsResponse:
        now = datetime.now(timezone.utc)
        trends = []

        # Check last 4 months
        for i in range(3, -1, -1):
            ref_date = now - timedelta(days=i * 30)
            m_str = ref_date.strftime("%Y-%m")
            y, m = map(int, m_str.split("-"))

            spend = (
                db.query(func.coalesce(func.sum(Transaction.amount), 0))
                .filter(
                    extract("year", Transaction.created_at) == y,
                    extract("month", Transaction.created_at) == m,
                    Transaction.direction == "OUTGOING",
                    Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
                )
                .scalar()
            )
            inc = (
                db.query(func.coalesce(func.sum(Transaction.amount), 0))
                .filter(
                    extract("year", Transaction.created_at) == y,
                    extract("month", Transaction.created_at) == m,
                    Transaction.direction == "INCOMING",
                    Transaction.payment_status.in_(["APPROVED", "COMPLETED"]),
                )
                .scalar()
            )

            # Top category
            top_cat_row = (
                db.query(Transaction.category)
                .filter(
                    extract("year", Transaction.created_at) == y,
                    extract("month", Transaction.created_at) == m,
                    Transaction.direction == "OUTGOING",
                )
                .group_by(Transaction.category)
                .order_by(func.sum(Transaction.amount).desc())
                .first()
            )
            top_cat = top_cat_row[0] if top_cat_row else "Shopping"

            trends.append(
                SpendingTrendItem(
                    month=m_str,
                    spending=Decimal(str(spend)),
                    incoming=Decimal(str(inc)),
                    top_category=top_cat,
                )
            )

        total_sum = sum(t.spending for t in trends)
        avg = total_sum / len(trends) if trends else Decimal("0.00")

        # Detect unusual surge: if current month spend is > 1.5x average of previous months
        unusual = False
        if len(trends) >= 2 and avg > 0:
            current_spend = trends[-1].spending
            if current_spend > (avg * Decimal("1.50")):
                unusual = True

        insight = (
            "Monthly spending is within healthy historical bounds."
            if not unusual
            else f"Unusual spending surge detected! Current month spending is higher than average (${avg:.2f})."
        )

        return SpendingTrendsResponse(
            trends=trends,
            average_monthly_spending=round(avg, 2),
            unusual_increase_detected=unusual,
            insight=insight,
        )

    @classmethod
    def set_budget(cls, db: Session, user_id: str, payload: BudgetCreate) -> SpendingBudget:
        budget = (
            db.query(SpendingBudget)
            .filter(SpendingBudget.month == payload.month)
            .first()
        )
        if budget:
            budget.budget_amount = payload.budget_amount
            budget.alert_threshold_pct = payload.alert_threshold_pct
        else:
            budget = SpendingBudget(
                user_id=user_id,
                month=payload.month,
                budget_amount=payload.budget_amount,
                alert_threshold_pct=payload.alert_threshold_pct,
            )
            db.add(budget)

        db.commit()
        db.refresh(budget)
        return budget

    @classmethod
    def get_budget(cls, db: Session, user_id: str, month: Optional[str] = None) -> Optional[SpendingBudget]:
        target_month = month or cls.get_month_str()
        return (
            db.query(SpendingBudget)
            .filter(SpendingBudget.month == target_month)
            .first()
        )

    @classmethod
    def check_spending_alerts(
        cls, db: Session, user_id: str = "default_user", month: Optional[str] = None
    ) -> SpendingAlertResponse:
        target_month = month or cls.get_month_str()
        budget = cls.get_budget(db, user_id, target_month)

        if not budget:
            return SpendingAlertResponse(
                has_alert=False,
                month=target_month,
                budget_amount=Decimal("0.00"),
                current_spending=Decimal("0.00"),
                percentage_used=0.0,
                alert_level="NORMAL",
                message=f"No budget set for month {target_month}.",
            )

        spending_resp = cls.get_monthly_spending(db, user_id, target_month)
        curr_spend = spending_resp.total_spending
        limit = Decimal(str(budget.budget_amount))
        pct_used = round(float((curr_spend / limit) * 100), 1) if limit > 0 else 0.0
        threshold = float(budget.alert_threshold_pct)

        if curr_spend >= limit:
            return SpendingAlertResponse(
                has_alert=True,
                month=target_month,
                budget_amount=limit,
                current_spending=curr_spend,
                percentage_used=pct_used,
                alert_level="EXCEEDED",
                message=f"ALERT: Monthly budget exceeded! Spent ${curr_spend:.2f} of ${limit:.2f} ({pct_used}%).",
            )
        elif pct_used >= threshold:
            return SpendingAlertResponse(
                has_alert=True,
                month=target_month,
                budget_amount=limit,
                current_spending=curr_spend,
                percentage_used=pct_used,
                alert_level="WARNING",
                message=f"WARNING: Approaching monthly budget limit! Spent ${curr_spend:.2f} of ${limit:.2f} ({pct_used}% >= {threshold}% threshold).",
            )
        else:
            return SpendingAlertResponse(
                has_alert=False,
                month=target_month,
                budget_amount=limit,
                current_spending=curr_spend,
                percentage_used=pct_used,
                alert_level="NORMAL",
                message=f"Healthy: ${curr_spend:.2f} spent of ${limit:.2f} budget ({pct_used}%).",
            )


spending_service = SpendingService()
