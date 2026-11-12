"""
Dashboard Data API routes for AgentGuard.
Provides summary statistics and activity audit feeds for frontend integration.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import Transaction, Agent, SecurityPolicy, AuditLog
from backend.schemas import (
    DashboardStatsResponse,
    DashboardActivityResponse,
    ActivityLogItem,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard Data"])


@router.get("/stats", response_model=DashboardStatsResponse, summary="Get summary statistics for dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes key performance metrics and security statistics for the frontend dashboard.
    """
    total_tx = db.query(func.count(Transaction.id)).scalar() or 0
    auto_approved = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.decision == "APPROVE")
        .scalar()
        or 0
    )
    pending_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.payment_status == "REQUIRES_APPROVAL")
        .scalar()
        or 0
    )
    blocked_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.decision == "BLOCK")
        .scalar()
        or 0
    )
    completed_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.payment_status == "COMPLETED")
        .scalar()
        or 0
    )

    # Today's spend calculation (use naive UTC to match SQLite storage)
    _now = datetime.utcnow()
    today_start = _now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_spend_raw = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.created_at >= today_start,
            Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
        )
        .scalar()
    )
    today_spend = Decimal(str(today_spend_raw))

    # Daily limit from active policy
    policy = db.query(SecurityPolicy).first()
    daily_limit = Decimal(str(policy.daily_limit)) if policy else Decimal("200.00")
    remaining_budget = max(Decimal("0.00"), daily_limit - today_spend)

    # Active agents count
    active_agents = (
        db.query(func.count(Agent.id))
        .filter(Agent.status == "active")
        .scalar()
        or 0
    )

    # Average risk score
    avg_risk_raw = db.query(func.avg(Transaction.risk_score)).scalar()
    avg_risk = float(avg_risk_raw) if avg_risk_raw is not None else 0.0

    # Month's spend calculation
    month_start = _now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_spend_raw = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.created_at >= month_start,
            Transaction.payment_status.in_(["APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED"]),
        )
        .scalar()
    )
    month_spend = Decimal(str(month_spend_raw))

    return DashboardStatsResponse(
        total_transactions=total_tx,
        auto_approved_count=auto_approved,
        pending_approval_count=pending_count,
        blocked_count=blocked_count,
        completed_payments_count=completed_count,
        total_spend_today=today_spend,
        total_spend_month=month_spend,
        remaining_daily_budget=remaining_budget,
        active_agents_count=active_agents,
        average_risk_score=round(avg_risk, 1),
    )


@router.get("/activity", response_model=DashboardActivityResponse, summary="Get recent audit log activity")
def get_dashboard_activity(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns an chronological audit log stream of security and payment events.
    """
    total = db.query(func.count(AuditLog.id)).scalar() or 0
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        ActivityLogItem(
            id=log.id,
            transaction_id=log.transaction_id,
            agent_id=log.agent_id,
            action=log.action,
            reason=log.reason,
            timestamp=log.timestamp,
            metadata=log.metadata_json or {},
        )
        for log in logs
    ]

    return DashboardActivityResponse(count=total, activities=items)
