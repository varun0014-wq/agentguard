"""
Schemes & Offers API routes for AgentGuard.
Feature 6: Promotional discounts, cashbacks, terms, and purchase eligibility evaluation.
"""

from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.schemes_service import schemes_service
from backend.schemas import (
    SchemeCreate,
    SchemeUpdate,
    SchemeStatusUpdate,
    SchemeResponse,
    SchemeEligibilityCheckRequest,
    SchemeEligibilityResponse,
)

router = APIRouter(prefix="/schemes", tags=["Schemes & Promotional Offers"])


@router.get("", response_model=List[SchemeResponse], summary="List all promotional schemes")
def list_all_schemes(db: Session = Depends(get_db)):
    """
    Returns all stored promotional schemes, including expired or inactive ones.
    """
    return schemes_service.list_schemes(db, active_only=False)


@router.get("/active", response_model=List[SchemeResponse], summary="List active & unexpired schemes")
def list_active_schemes(db: Session = Depends(get_db)):
    """
    Returns currently active, unexpired promotional offers and cashbacks.
    """
    return schemes_service.list_schemes(db, active_only=True)


@router.get("/eligible", response_model=SchemeEligibilityResponse, summary="Check scheme eligibility for a purchase")
def check_scheme_eligibility(
    amount: Decimal = Query(..., gt=0, description="Purchase amount"),
    category: str = Query("Shopping", description="Product category"),
    merchant: Optional[str] = Query(None, description="Target merchant"),
    db: Session = Depends(get_db),
):
    """
    Evaluates whether an intended purchase is eligible for promotional discounts or cashbacks
    and calculates total potential savings.
    """
    return schemes_service.evaluate_eligibility(db, amount=amount, category=category, merchant=merchant)


@router.get("/{scheme_id}", response_model=SchemeResponse, summary="Get scheme details by ID")
def get_scheme(scheme_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full details, validity dates, and terms for a scheme.
    """
    scheme = schemes_service.get_scheme(db, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@router.post("", response_model=SchemeResponse, status_code=status.HTTP_201_CREATED, summary="Create a new promotional scheme")
def create_scheme(payload: SchemeCreate, db: Session = Depends(get_db)):
    """
    Adds a new promotional offer with discount terms, cashback ceilings, and category filters.
    """
    return schemes_service.create_scheme(db, payload)


@router.put("/{scheme_id}", response_model=SchemeResponse, summary="Update an existing scheme")
def update_scheme(scheme_id: str, payload: SchemeUpdate, db: Session = Depends(get_db)):
    """
    Updates scheme discount values, categories, or validity dates.
    """
    return schemes_service.update_scheme(db, scheme_id, payload)


@router.patch("/{scheme_id}/status", response_model=SchemeResponse, summary="Activate or deactivate a scheme")
def update_scheme_status(scheme_id: str, payload: SchemeStatusUpdate, db: Session = Depends(get_db)):
    """
    Toggles the active status of a promotional scheme.
    """
    return schemes_service.update_status(db, scheme_id, payload.is_active)
