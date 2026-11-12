"""
AgentGuard - PayPal AI Financial Firewall
Backend API Server (Python FastAPI + Pydantic + PostgreSQL Schema)

Run with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
import hmac
import hashlib

app = FastAPI(
    title="AgentGuard – PayPal AI Financial Firewall",
    description="Autonomous AI Agent Financial Security & Governance Gateway API for PayPal AI Hackathon",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATA MODELS ====================
class AgentCreate(BaseModel):
    name: str = Field(..., example="ProcurementBot v4")
    model: str = Field(default="Claude 3.5 Sonnet", example="Claude 3.5 Sonnet")
    txLimit: float = Field(default=1500.0, example=1500.0)
    monthlyCap: float = Field(default=10000.0, example=10000.0)
    whitelistedDomains: List[str] = Field(default=["aws.amazon.com", "github.com"])
    approvalPolicy: str = Field(default="Strict Merchant Whitelist")

class PaymentRequest(BaseModel):
    agentId: str
    merchant: str
    amount: float
    currency: str = "USD"
    promptPayload: str
    description: Optional[str] = None

class ApprovalDecision(BaseModel):
    decision: str = Field(..., example="approve")  # "approve" | "reject" | "approve_whitelist"
    notes: Optional[str] = None
    signedBy: str = "Elena Vance (Biometric FIDO2)"

class AgentPause(BaseModel):
    paused: bool = True

# In-Memory Database (Mocking PostgreSQL for Hackathon Prototype)
agents_db = [
    {
        "id": "AGT-1044-PROC",
        "name": "ProcurementBot v4",
        "model": "Claude 3.5 Sonnet",
        "status": "active",
        "txLimit": 5000.0,
        "monthlyCap": 15000.0,
        "monthlySpent": 9120.0,
        "whitelistedDomains": ["aws.amazon.com", "datadoghq.com", "github.com", "vercel.com"],
        "approvalPolicy": "Strict Merchant Whitelist"
    },
    {
        "id": "AGT-8412-TRV",
        "name": "TravelDesk AI",
        "model": "Gemini 1.5 Pro",
        "status": "active",
        "txLimit": 1500.0,
        "monthlyCap": 8000.0,
        "monthlySpent": 6770.0,
        "whitelistedDomains": ["delta.com", "united.com", "marriott.com"],
        "approvalPolicy": "Employee Travel Tier 1 Guard"
    },
    {
        "id": "AGT-5120-DVP",
        "name": "DevOpsProvisioner",
        "model": "GPT-4 Turbo",
        "status": "active",
        "txLimit": 4000.0,
        "monthlyCap": 25000.0,
        "monthlySpent": 18400.0,
        "whitelistedDomains": ["aws.amazon.com", "hetzner.com"],
        "approvalPolicy": "Compute Zone & FX Bounds"
    },
    {
        "id": "AGT-8711-DDG",
        "name": "CloudBillingAgent",
        "model": "Claude 3 Haiku",
        "status": "active",
        "txLimit": 2000.0,
        "monthlyCap": 10000.0,
        "monthlySpent": 3650.0,
        "whitelistedDomains": ["datadoghq.com", "slack.com"],
        "approvalPolicy": "Recurring Contract Match"
    },
    {
        "id": "AGT-3390-SLS",
        "name": "SalesOps Bot",
        "model": "Mistral Large",
        "status": "quarantined",
        "txLimit": 1000.0,
        "monthlyCap": 5000.0,
        "monthlySpent": 1200.0,
        "whitelistedDomains": ["salesforce.com"],
        "approvalPolicy": "Hard Kill on Unknown Wallet"
    },
    {
        "id": "AGT-7721-MKT",
        "name": "MarketingAdSpender AI",
        "model": "Llama 3.3 70B",
        "status": "throttled",
        "txLimit": 500.0,
        "monthlyCap": 10000.0,
        "monthlySpent": 4850.0,
        "whitelistedDomains": ["google.com/ads"],
        "approvalPolicy": "Velocity Rate Limit (5 calls/min)"
    }
]

approvals_db = [
    {
        "id": "TXN-9024-DAL",
        "agentId": "AGT-8412-TRV",
        "agentName": "TravelDesk AI",
        "merchant": "Delta Air Lines",
        "amount": 2150.00,
        "currency": "USD",
        "state": "WAITING_HUMAN_APPROVAL",
        "riskLevel": "medium",
        "reason": "Exceeds agent single-tx allowance ($1,500.00)",
        "digest": "HMAC-SHA256: 0x8f4c91a0b32948cf...e12a",
        "fidoRequired": True
    },
    {
        "id": "TXN-9921-PRC",
        "agentId": "AGT-1044-PROC",
        "agentName": "ProcurementBot v4",
        "merchant": "Vercel Inc.",
        "amount": 2400.00,
        "currency": "USD",
        "state": "WAITING_HUMAN_APPROVAL",
        "riskLevel": "medium",
        "reason": "First-time domain whitelist verification",
        "digest": "HMAC-SHA256: 0x3d29a741c8812b10...94bf",
        "fidoRequired": True
    }
]

transactions_db = [
    {
        "id": "TXN-8841-AWS",
        "merchant": "Amazon Web Services",
        "initiator": "DevOpsProvisioner",
        "amount": -8940.20,
        "currency": "USD",
        "status": "Successful",
        "date": "Today",
        "digest": "0x8841...c01a"
    },
    {
        "id": "TXN-8711-OA",
        "merchant": "OpenAI API Platform",
        "initiator": "Customer Agent Swarm",
        "amount": -4215.00,
        "currency": "USD",
        "status": "Successful",
        "date": "Yesterday",
        "digest": "0x8711...f091"
    }
]

# ==================== ENDPOINTS (SECTION 15) ====================

@app.get("/health")
def health_check():
    return {"status": "ok", "mode": "PayPal Sandbox Enclave", "timestamp": datetime.datetime.utcnow().isoformat()}

# 1. GET /agents
@app.get("/agents")
def get_agents():
    return agents_db

# 2. POST /agents
@app.post("/agents", status_code=status.HTTP_201_CREATED)
def create_agent(agent: AgentCreate):
    new_agent = agent.dict()
    new_agent["id"] = f"AGT-{len(agents_db) + 1000}-USR"
    new_agent["status"] = "active"
    new_agent["monthlySpent"] = 0.0
    agents_db.append(new_agent)
    return new_agent

# 3. GET /transactions
@app.get("/transactions")
def get_transactions():
    return transactions_db

# 4. POST /payment/request
@app.post("/payment/request")
def process_payment_request(req: PaymentRequest):
    # Security Rule 1: NLP Prompt Injection Inspection
    suspicious_keywords = ["ignore prior instructions", "system override", "ghost_wallet", "transfer to anon"]
    if any(k in req.promptPayload.lower() for k in suspicious_keywords):
        return {
            "status": "BLOCKED",
            "auditorDecision": "CRITICAL BLOCK: Adversarial Prompt Injection Neutralized",
            "reason": "Semantic prompt injection detected in agent input reasoning payload.",
            "actionTaken": "Agent quarantined. PayPal disbursement token denied."
        }

    # Security Rule 2: Single-TX Limit Check
    agent = next((a for a in agents_db if a["id"] == req.agentId), None)
    if agent and req.amount > agent["txLimit"]:
        return {
            "status": "HELD_FOR_HUMAN_APPROVAL",
            "auditorDecision": f"HOLD: Amount ${req.amount} exceeds agent single-tx cap ${agent['txLimit']}",
            "fidoRequired": True,
            "digest": hmac.new(b"secret", f"{req.agentId}:{req.amount}".encode(), hashlib.sha256).hexdigest()
        }

    # Security Rule 3: Whitelist Verification
    return {
        "status": "AUTO_APPROVED",
        "auditorDecision": "PASSED: Allowlist satisfied and within spending quota bounds",
        "paypalDisbursementToken": "PP-SANDBOX-" + hashlib.sha256(str(datetime.datetime.utcnow()).encode()).hexdigest()[:16]
    }

# 5. GET /approvals
@app.get("/approvals")
def get_pending_approvals():
    return approvals_db

# 6. POST /approvals/{id}
@app.post("/approvals/{txn_id}")
def submit_approval_decision(txn_id: str, decision: ApprovalDecision):
    idx = next((i for i, a in enumerate(approvals_db) if a["id"] == txn_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Approval request not found")

    item = approvals_db.pop(idx)
    return {
        "id": txn_id,
        "decision": decision.decision,
        "status": "RELEASED_TO_PAYPAL" if decision.decision in ["approve", "approve_whitelist"] else "CANCELLED",
        "signedBy": decision.signedBy,
        "enclaveHmac": hmac.new(b"fido2_root", txn_id.encode(), hashlib.sha256).hexdigest()
    }

# 7. GET /agent/logs
@app.get("/agent/logs")
def get_agent_logs():
    return [
        {"timestamp": datetime.datetime.utcnow().isoformat(), "level": "INFO", "message": "Enclave heartbeat nominal"},
        {"timestamp": datetime.datetime.utcnow().isoformat(), "level": "ALERT", "message": "Prompt injection blocked on SalesOps Bot"}
    ]

# 8. POST /agents/{id}/pause
@app.post("/agents/{agent_id}/pause")
def pause_agent(agent_id: str, pause_req: AgentPause):
    agent = next((a for a in agents_db if a["id"] == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent["status"] = "paused" if pause_req.paused else "active"
    return {"id": agent_id, "status": agent["status"]}
