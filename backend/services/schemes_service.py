"""
Schemes and Promotional Offers Service for AgentGuard.
Manages promotional cashback/discount schemes, validity periods,
and eligibility evaluation for agentic purchases.
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import Scheme
from backend.schemas import (
    SchemeCreate,
    SchemeUpdate,
    SchemeStatusUpdate,
    SchemeResponse,
    SchemeEligibilityCheckRequest,
    SchemeEligibilityResponse,
)


# Default verified promotional schemes
DEFAULT_DEMO_SCHEMES = [
    {
        "name": "PayPal Agentic Shopping Cashback",
        "description": "5% instant cashback on all verified electronics and computer accessories purchases.",
        "discount_type": "PERCENTAGE",
        "discount_value": Decimal("5.00"),
        "max_cashback": Decimal("10.00"),
        "min_purchase": Decimal("20.00"),
        "eligible_categories": ["Shopping", "Electronics"],
        "valid_days": 60,
        "terms": "Valid for purchases authorized via AgentGuard on verified PayPal Sandbox merchants.",
    },
    {
        "name": "Cloud Computing Infrastructure Credit",
        "description": "Flat $15 discount on enterprise SaaS and cloud subscriptions over $50.",
        "discount_type": "FLAT",
        "discount_value": Decimal("15.00"),
        "max_cashback": Decimal("15.00"),
        "min_purchase": Decimal("50.00"),
        "eligible_categories": ["Subscriptions", "Bills"],
        "valid_days": 30,
        "terms": "Requires valid recurring subscription contract on file.",
    },
    {
        "name": "Corporate Travel Welcome Rebate",
        "description": "8% cashback on approved employee travel bookings up to $25.",
        "discount_type": "PERCENTAGE",
        "discount_value": Decimal("8.00"),
        "max_cashback": Decimal("25.00"),
        "min_purchase": Decimal("100.00"),
        "eligible_categories": ["Travel"],
        "valid_days": 45,
        "terms": "Applies to verified airline and hotel merchant categories.",
    },
]


class SchemesService:
    @classmethod
    def seed_default_schemes(cls, db: Session):
        count = db.query(Scheme).count()
        if count == 0:
            now = datetime.now(timezone.utc)
            for s in DEFAULT_DEMO_SCHEMES:
                scheme = Scheme(
                    name=s["name"],
                    description=s["description"],
                    discount_type=s["discount_type"],
                    discount_value=s["discount_value"],
                    max_cashback=s.get("max_cashback"),
                    min_purchase=s.get("min_purchase", Decimal("0.00")),
                    eligible_categories=s.get("eligible_categories", []),
                    valid_from=now,
                    valid_to=now + timedelta(days=s.get("valid_days", 30)),
                    is_active=True,
                    terms=s.get("terms"),
                )
                db.add(scheme)
            db.commit()

    @classmethod
    def list_schemes(cls, db: Session, active_only: bool = False) -> List[SchemeResponse]:
        query = db.query(Scheme)
        if active_only:
            now_naive = datetime.utcnow()
            query = query.filter(Scheme.is_active == True, Scheme.valid_to >= now_naive)
        schemes = query.order_by(Scheme.created_at.desc()).all()
        now_naive = datetime.utcnow()

        results = []
        for s in schemes:
            is_expired = s.valid_to < now_naive if s.valid_to else False
            resp = SchemeResponse.model_validate(s)
            resp.is_expired = is_expired
            results.append(resp)
        return results

    @classmethod
    def get_scheme(cls, db: Session, scheme_id: str) -> Optional[SchemeResponse]:
        s = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not s:
            return None
        now_naive = datetime.utcnow()
        resp = SchemeResponse.model_validate(s)
        resp.is_expired = s.valid_to < now_naive if s.valid_to else False
        return resp

    @classmethod
    def create_scheme(cls, db: Session, payload: SchemeCreate) -> SchemeResponse:
        now = datetime.now(timezone.utc)
        scheme = Scheme(
            name=payload.name,
            description=payload.description,
            discount_type=payload.discount_type.upper(),
            discount_value=payload.discount_value,
            max_cashback=payload.max_cashback,
            min_purchase=payload.min_purchase,
            eligible_categories=payload.eligible_categories,
            valid_from=payload.valid_from or now,
            valid_to=payload.valid_to,
            is_active=True,
            terms=payload.terms,
        )
        db.add(scheme)
        db.commit()
        db.refresh(scheme)
        return SchemeResponse.model_validate(scheme)

    @classmethod
    def update_scheme(cls, db: Session, scheme_id: str, payload: SchemeUpdate) -> SchemeResponse:
        s = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Scheme not found")

        for field, val in payload.model_dump(exclude_unset=True).items():
            setattr(s, field, val)

        db.commit()
        db.refresh(s)
        return SchemeResponse.model_validate(s)

    @classmethod
    def update_status(cls, db: Session, scheme_id: str, is_active: bool) -> SchemeResponse:
        s = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Scheme not found")
        s.is_active = is_active
        db.commit()
        db.refresh(s)
        return SchemeResponse.model_validate(s)

    @classmethod
    def evaluate_eligibility(
        cls, db: Session, amount: Decimal, category: str, merchant: Optional[str] = None
    ) -> SchemeEligibilityResponse:
        now_naive = datetime.utcnow()
        active_schemes = (
            db.query(Scheme)
            .filter(Scheme.is_active == True, Scheme.valid_to >= now_naive)
            .all()
        )

        eligible = []
        total_potential_savings = Decimal("0.00")
        best_offer_text = "No promotional schemes apply to this purchase."

        for s in active_schemes:
            if amount < s.min_purchase:
                continue
            cat_match = False
            for c in s.eligible_categories or []:
                if c.lower() in category.lower() or category.lower() in c.lower():
                    cat_match = True
                    break
            if not cat_match:
                continue

            # Calculate savings
            if s.discount_type == "PERCENTAGE":
                calc = (amount * (s.discount_value / Decimal("100.00")))
                if s.max_cashback:
                    calc = min(calc, s.max_cashback)
            else:  # FLAT
                calc = s.discount_value

            if calc > 0:
                eligible.append(SchemeResponse.model_validate(s))
                total_potential_savings = max(total_potential_savings, calc)
                best_offer_text = (
                    f"Eligible for '{s.name}': Save ${calc:.2f} "
                    f"({s.discount_value}% discount" if s.discount_type == "PERCENTAGE" else f"(${s.discount_value} flat rebate)"
                    f" on {category})."
                )

        return SchemeEligibilityResponse(
            purchase_amount=amount,
            category=category,
            eligible_schemes=eligible,
            total_potential_savings=round(total_potential_savings, 2),
            best_offer_explanation=best_offer_text,
        )


schemes_service = SchemesService()
