"""
Spending API routes for AgentGuard.
Feature 1: Monthly spending tracker, category breakdowns, trends, and budget alerts.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.spending_service import spending_service
from backend.schemas import (
    MonthlySpendingResponse,
    CategoryBreakdownResponse,
    SpendingTrendsResponse,
    BudgetCreate,
    BudgetResponse,
    SpendingAlertResponse,
)

router = APIRouter(prefix="/spending", tags=["Monthly Spending Tracker"])


@router.get("/monthly", response_model=MonthlySpendingResponse, summary="Get total monthly spending and breakdown")
def get_monthly_spending(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Month in YYYY-MM format (defaults to current)"),
    db: Session = Depends(get_db),
):
    """
    Retrieves total monthly spending, incoming funds, net savings, transaction counts,
    category breakdown, and AI spending summary.
    """
    return spending_service.get_monthly_spending(db, month=month)


@router.get("/category-breakdown", response_model=CategoryBreakdownResponse, summary="Get spending breakdown by category")
def get_category_breakdown(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
):
    """
    Returns spending aggregated by category (Shopping, Food, Travel, Entertainment, Bills, Subscriptions, Other).
    """
    return spending_service.get_category_breakdown(db, month=month)


@router.get("/trends", response_model=SpendingTrendsResponse, summary="Compare spending trends across months")
def get_spending_trends(db: Session = Depends(get_db)):
    """
    Compares spending between consecutive months, calculates average monthly spending,
    and identifies unusual spending increases (>1.5x average).
    """
    return spending_service.get_spending_trends(db)


@router.post("/budget", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, summary="Set monthly spending budget")
def set_monthly_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
):
    """
    Sets a monthly budget ceiling and alert warning threshold (default 80%).
    """
    return spending_service.set_budget(db, user_id="default_user", payload=payload)


@router.get("/budget", response_model=Optional[BudgetResponse], summary="Get current monthly budget")
def get_monthly_budget(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
):
    """
    Returns the budget and alert threshold configured for the requested month.
    """
    return spending_service.get_budget(db, user_id="default_user", month=month)


@router.get("/alerts", response_model=SpendingAlertResponse, summary="Get budget alerts and threshold status")
def get_spending_alerts(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
):
    """
    Evaluates whether spending has reached the warning threshold (e.g. 80%)
    or exceeded the monthly budget ceiling.
    """
    return spending_service.check_spending_alerts(db, month=month)
