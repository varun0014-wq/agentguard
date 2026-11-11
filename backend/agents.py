"""
Agents API routes for AgentGuard.
Manages AI agent lifecycle, status (active/paused), and natural language purchasing.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Agent, User, Transaction, AgentPermission
from backend.schemas import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    PurchaseInstructionRequest,
    PurchaseInstructionResponse,
    AgentActivityResponse,
    AgentPermissionResponse,
    AgentPermissionUpdate,
    PaymentRequestCreate,
)
from backend.agents.buyer_agent import buyer_agent
from backend.services.transaction_service import transaction_service

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("", response_model=List[AgentResponse], summary="List all registered agents")
def list_agents(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Agent)
    if status:
        query = query.filter(Agent.status == status.lower())
    return query.order_by(Agent.created_at.desc()).all()


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED, summary="Register a new agent")
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
):
    # Ensure user exists or use default
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        user = db.query(User).first()
        if not user:
            user = User(name="Default Merchant Admin", email="admin@agentguard.dev")
            db.add(user)
            db.commit()
            db.refresh(user)

    agent = Agent(
        user_id=user.id,
        name=payload.name,
        status="active",
        daily_limit=payload.daily_limit,
        max_transaction=payload.max_transaction,
        auto_approval_limit=payload.auto_approval_limit,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/{id}", response_model=AgentResponse, summary="Get agent details by ID")
def get_agent(id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/{id}/pause", response_model=AgentResponse, summary="Pause an agent (blocks future transactions)")
def pause_agent(id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = "paused"
    db.commit()
    db.refresh(agent)
    return agent


@router.post("/{id}/activate", response_model=AgentResponse, summary="Activate a paused agent")
def activate_agent(id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = "active"
    db.commit()
    db.refresh(agent)
    return agent


@router.post(
    "/purchase-instruction",
    response_model=PurchaseInstructionResponse,
    summary="Process natural-language purchasing instruction via Agent A",
)
async def process_purchase_instruction(
    payload: PurchaseInstructionRequest,
    execute_payment_request: bool = False,
    db: Session = Depends(get_db),
):
    """
    Submits a natural-language purchasing instruction to Agent A (Purchasing Agent).
    Agent A searches Channel3, selects the product, and formats a structured payment request.
    If execute_payment_request=True, it submits the request to AgentGuard for independent audit.
    """
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{payload.agent_id}' not found")

    result = await buyer_agent.process_instruction(payload.instruction)
    if not result.get("success"):
        return PurchaseInstructionResponse(
            agent_id=payload.agent_id,
            instruction=payload.instruction,
            selected_product=None,
            payment_request=None,
            evaluation=None,
            transaction_id=None,
            message=result.get("message", "Could not find matching product."),
        )

    selected = result["selected_product"]
    payment_req_dict = result["payment_request"]
    payment_req_dict["agent_id"] = payload.agent_id

    evaluation_dict = None
    transaction_id = None

    if execute_payment_request:
        payment_obj = PaymentRequestCreate(**payment_req_dict)
        tx = await transaction_service.process_payment_request(db, payment_obj)
        transaction_id = tx.id
        evaluation_dict = {
            "decision": tx.decision,
            "risk_score": tx.risk_score,
            "payment_status": tx.payment_status,
            "paypal_order_id": tx.paypal_order_id,
            "paypal_approval_url": tx.paypal_approval_url,
            "reasons": tx.risk_reasons,
        }

    return PurchaseInstructionResponse(
        agent_id=payload.agent_id,
        instruction=payload.instruction,
        selected_product=selected,
        payment_request=payment_req_dict,
        evaluation=evaluation_dict,
        transaction_id=transaction_id,
        message=result["message"],
    )


@router.get("/{id}/activity", response_model=AgentActivityResponse, summary="Get agent activity and recent transaction stream")
def get_agent_activity(id: str, db: Session = Depends(get_db)):
    """
    Returns agent performance metrics, daily spend, monthly spend, and historical transactions.
    """
    agent = db.query(Agent).filter(Agent.id == id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    from backend.security.rules_engine import RulesEngine
    today_spent = RulesEngine.get_today_spent(db, agent.id)
    month_spent = RulesEngine.get_this_month_spent(db, agent.id)

    from backend.models import Transaction
    txs = (
        db.query(Transaction)
        .filter(Transaction.agent_id == id)
        .order_by(Transaction.created_at.desc())
        .limit(20)
        .all()
    )

    recent = [
        {
            "id": t.id,
            "product_name": t.product_name,
            "merchant": t.merchant,
            "category": getattr(t, "category", "Shopping"),
            "amount": float(t.amount),
            "decision": t.decision,
            "payment_status": t.payment_status,
            "created_at": t.created_at.isoformat(),
        }
        for t in txs
    ]

    return AgentActivityResponse(
        agent_id=agent.id,
        name=agent.name,
        status=agent.status,
        total_transactions=len(txs),
        total_spent_today=today_spent,
        total_spent_month=month_spent,
        recent_transactions=recent,
    )


@router.get("/{id}/permissions", response_model=AgentPermissionResponse, summary="Get agent security permissions and limits")
def get_agent_permissions(id: str, db: Session = Depends(get_db)):
    """
    Retrieves agent-specific spending caps, merchant allowlists, and category restrictions.
    """
    agent = db.query(Agent).filter(Agent.id == id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    from backend.models import AgentPermission
    perm = db.query(AgentPermission).filter(AgentPermission.agent_id == id).first()
    if not perm:
        perm = AgentPermission(
            agent_id=id,
            allowed_categories=["Shopping", "Food", "Travel", "Entertainment", "Bills", "Subscriptions", "Other"],
            allowed_merchants=[],
            restricted_merchants=[],
            daily_limit=agent.daily_limit,
            monthly_limit=agent.monthly_limit,
            max_transaction=agent.max_transaction,
            auto_approval_limit=agent.auto_approval_limit,
        )
        db.add(perm)
        db.commit()
        db.refresh(perm)

    return perm


@router.put("/{id}/permissions", response_model=AgentPermissionResponse, summary="Update agent security permissions (Supervisor only)")
def update_agent_permissions(
    id: str,
    payload: AgentPermissionUpdate,
    x_actor_role: Optional[str] = Header(None, description="Role of the caller"),
    db: Session = Depends(get_db),
):
    """
    Updates agent spending limits and permissions.
    Agent A is prohibited from updating its own permissions!
    """
    if x_actor_role and x_actor_role.lower() in ("agent", "buyer_agent", "shopping_agent"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Autonomous agents are prohibited from modifying their own security permissions.",
        )

    agent = db.query(Agent).filter(Agent.id == id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    from backend.models import AgentPermission
    perm = db.query(AgentPermission).filter(AgentPermission.agent_id == id).first()
    if not perm:
        perm = AgentPermission(agent_id=id)
        db.add(perm)

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(perm, field, val)

    # Sync back to agent model
    if payload.daily_limit is not None:
        agent.daily_limit = payload.daily_limit
    if payload.monthly_limit is not None:
        agent.monthly_limit = payload.monthly_limit
    if payload.max_transaction is not None:
        agent.max_transaction = payload.max_transaction
    if payload.auto_approval_limit is not None:
        agent.auto_approval_limit = payload.auto_approval_limit

    db.commit()
    db.refresh(perm)
    return perm

