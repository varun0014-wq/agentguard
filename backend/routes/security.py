"""
Security Policy API routes for AgentGuard.
Allows viewing and updating global and merchant authorization rules.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import SecurityPolicy, User, AuditLog
from backend.schemas import SecurityPolicyResponse, SecurityPolicyUpdate

router = APIRouter(prefix="/security", tags=["Security Policies"])


@router.get("/rules", response_model=SecurityPolicyResponse, summary="Get current security rules and policies")
def get_security_rules(db: Session = Depends(get_db)):
    """
    Returns the active financial limits and merchant authorization policies.
    """
    policy = db.query(SecurityPolicy).first()
    if not policy:
        # Create default policy if none exists
        user = db.query(User).first()
        if not user:
            user = User(name="Default Admin", email="admin@agentguard.dev")
            db.add(user)
            db.commit()
            db.refresh(user)

        policy = SecurityPolicy(
            user_id=user.id,
            daily_limit=200.00,
            max_transaction=100.00,
            auto_approval_limit=50.00,
            allowed_merchants=["TrustedStore", "TechStore", "VerifiedShop", "OfficeSuppliesCo"],
            restricted_merchants=["ShadyMarket", "BannedVendor"],
            allowed_currencies=["USD"],
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy


@router.put("/rules", response_model=SecurityPolicyResponse, summary="Update security rules (Admin only)")
def update_security_rules(
    payload: SecurityPolicyUpdate,
    x_actor_role: Optional[str] = Header(None, description="Role of the caller, e.g. 'admin'"),
    db: Session = Depends(get_db),
):
    """
    Updates spending limits, merchant whitelists/blacklists, and thresholds.
    NOTE: Agent A (purchasing agent) is strictly prohibited from modifying security policies.
    """
    if x_actor_role and x_actor_role.lower() in ("agent", "buyer_agent", "shopping_agent"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Autonomous agents are prohibited from modifying financial security policies.",
        )

    policy = db.query(SecurityPolicy).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Security policy not initialized")

    # Validate logical hierarchy if limits are updated
    new_daily = payload.daily_limit if payload.daily_limit is not None else policy.daily_limit
    new_max = payload.max_transaction if payload.max_transaction is not None else policy.max_transaction
    new_auto = payload.auto_approval_limit if payload.auto_approval_limit is not None else policy.auto_approval_limit

    if new_max > new_daily:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid configuration: max_transaction (${new_max}) cannot exceed daily_limit (${new_daily})",
        )
    if new_auto > new_max:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid configuration: auto_approval_limit (${new_auto}) cannot exceed max_transaction (${new_max})",
        )

    if payload.daily_limit is not None:
        policy.daily_limit = payload.daily_limit
    if payload.max_transaction is not None:
        policy.max_transaction = payload.max_transaction
    if payload.auto_approval_limit is not None:
        policy.auto_approval_limit = payload.auto_approval_limit
    if payload.allowed_merchants is not None:
        policy.allowed_merchants = payload.allowed_merchants
    if payload.restricted_merchants is not None:
        policy.restricted_merchants = payload.restricted_merchants
    if payload.allowed_currencies is not None:
        policy.allowed_currencies = [c.upper() for c in payload.allowed_currencies]

    # Audit policy change
    db.add(
        AuditLog(
            action="SECURITY_POLICY_UPDATED",
            reason=f"Security rules updated by actor '{x_actor_role or 'admin'}'",
            metadata_json=payload.model_dump(exclude_unset=True),
        )
    )

    db.commit()
    db.refresh(policy)
    return policy
