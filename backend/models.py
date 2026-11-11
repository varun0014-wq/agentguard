"""
SQLAlchemy ORM models for AgentGuard.
Includes Users, Agents, AgentPermissions, SecurityPolicies, Transactions,
ApprovalRequests, AuditLogs, SpendingBudgets, Bills, BillParticipants,
CurrencyConversions, ScannedReceipts, ScannedQRs, ChatMessages, and Schemes.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Numeric,
    Integer,
    Boolean,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_uuid() -> str:
    return uuid.uuid4().hex


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    policies = relationship("SecurityPolicy", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("SpendingBudget", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    status = Column(String(20), default="active", nullable=False)  # "active", "paused", "revoked"
    daily_limit = Column(Numeric(10, 2), nullable=True)
    monthly_limit = Column(Numeric(10, 2), nullable=True)
    max_transaction = Column(Numeric(10, 2), nullable=True)
    auto_approval_limit = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="agents")
    transactions = relationship("Transaction", back_populates="agent")
    permissions = relationship("AgentPermission", back_populates="agent", uselist=False, cascade="all, delete-orphan")


class AgentPermission(Base):
    __tablename__ = "agent_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, unique=True, index=True)
    allowed_categories = Column(JSON, default=lambda: ["Shopping", "Food", "Travel", "Entertainment", "Bills", "Subscriptions", "Other"])
    allowed_merchants = Column(JSON, default=list)
    restricted_merchants = Column(JSON, default=list)
    daily_limit = Column(Numeric(10, 2), nullable=True)
    monthly_limit = Column(Numeric(10, 2), nullable=True)
    max_transaction = Column(Numeric(10, 2), nullable=True)
    auto_approval_limit = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    agent = relationship("Agent", back_populates="permissions")


class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    daily_limit = Column(Numeric(10, 2), nullable=False, default=Decimal("200.00"))
    monthly_limit = Column(Numeric(10, 2), nullable=False, default=Decimal("500.00"))
    max_transaction = Column(Numeric(10, 2), nullable=False, default=Decimal("100.00"))
    auto_approval_limit = Column(Numeric(10, 2), nullable=False, default=Decimal("50.00"))
    allowed_merchants = Column(JSON, default=list)
    restricted_merchants = Column(JSON, default=list)
    allowed_currencies = Column(JSON, default=lambda: ["USD"])
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="policies")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    product_reference = Column(String(100), nullable=True)
    merchant = Column(String(150), nullable=False, index=True)
    category = Column(String(50), default="Shopping", nullable=False, index=True)
    direction = Column(String(20), default="OUTGOING", nullable=False, index=True)  # "OUTGOING", "INCOMING"
    amount = Column(Numeric(10, 2), nullable=False)
    verified_price = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    risk_score = Column(Integer, default=0, nullable=False)
    decision = Column(String(20), nullable=False)  # "APPROVE", "REVIEW", "BLOCK"
    payment_status = Column(
        String(30), default="PENDING_EVALUATION", nullable=False
    )  # "PENDING_EVALUATION", "REQUIRES_APPROVAL", "APPROVED", "PAYPAL_CREATED", "PAYPAL_APPROVED", "COMPLETED", "REJECTED", "BLOCKED", "FAILED"
    paypal_order_id = Column(String(100), nullable=True, index=True)
    paypal_capture_id = Column(String(100), nullable=True, index=True)
    paypal_approval_url = Column(String(500), nullable=True)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=False)
    risk_reasons = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    agent = relationship("Agent", back_populates="transactions")
    approval_request = relationship(
        "ApprovalRequest", back_populates="transaction", uselist=False, cascade="all, delete-orphan"
    )
    audit_logs = relationship(
        "AuditLog", back_populates="transaction", cascade="all, delete-orphan"
    )


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_id = Column(
        String(36), ForeignKey("transactions.id"), nullable=False, unique=True, index=True
    )
    status = Column(String(20), default="PENDING", nullable=False)  # "PENDING", "APPROVED", "REJECTED"
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)

    transaction = relationship("Transaction", back_populates="approval_request")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=True, index=True)
    agent_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)

    transaction = relationship("Transaction", back_populates="audit_logs")


# ===========================================================================
# Feature 1: Spending Budget Model
# ===========================================================================

class SpendingBudget(Base):
    __tablename__ = "spending_budgets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False, index=True)  # Format: "YYYY-MM"
    budget_amount = Column(Numeric(10, 2), nullable=False)
    alert_threshold_pct = Column(Numeric(5, 2), default=Decimal("80.00"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="budgets")


# ===========================================================================
# Feature 2: Bill Splitting Models
# ===========================================================================

class Bill(Base):
    __tablename__ = "bills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    split_type = Column(String(20), default="EQUAL", nullable=False)  # "EQUAL", "CUSTOM", "PERCENTAGE"
    status = Column(String(20), default="PENDING", nullable=False)  # "PENDING", "PARTIALLY_PAID", "PAID"
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="bills")
    participants = relationship("BillParticipant", back_populates="bill", cascade="all, delete-orphan")


class BillParticipant(Base):
    __tablename__ = "bill_participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bill_id = Column(String(36), ForeignKey("bills.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(30), nullable=True)
    share_amount = Column(Numeric(10, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=True)
    paid_amount = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    status = Column(String(20), default="UNPAID", nullable=False)  # "UNPAID", "PAID"
    payment_request_id = Column(String(64), nullable=True, unique=True, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    bill = relationship("Bill", back_populates="participants")


# ===========================================================================
# Feature 3: Currency Conversion Audit
# ===========================================================================

class CurrencyConversion(Base):
    __tablename__ = "currency_conversions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    from_currency = Column(String(10), nullable=False)
    to_currency = Column(String(10), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    exchange_rate = Column(Numeric(12, 6), nullable=False)
    converted_amount = Column(Numeric(12, 2), nullable=False)
    provider = Column(String(50), default="ExchangeRateProvider", nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)


# ===========================================================================
# Feature 4: Smart Scanner Models
# ===========================================================================

class ScannedReceipt(Base):
    __tablename__ = "scanned_receipts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    merchant = Column(String(150), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    date = Column(String(50), nullable=True)
    items_json = Column(JSON, default=list)
    raw_text = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING_CONFIRMATION", nullable=False)  # "PENDING_CONFIRMATION", "CONFIRMED", "DISCARDED"
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ScannedQR(Base):
    __tablename__ = "scanned_qrs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    raw_data = Column(Text, nullable=False)
    parsed_payload_json = Column(JSON, default=dict)
    qr_type = Column(String(50), default="UNKNOWN")  # "PAYPAL_INTENT", "URL", "PLAIN_TEXT"
    is_valid_payment = Column(Boolean, default=False)
    validation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ===========================================================================
# Feature 5: AI Financial Chatbot Message History
# ===========================================================================

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), default="default_user", nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    intent_detected = Column(String(50), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


# ===========================================================================
# Feature 6: Schemes & Offers Management
# ===========================================================================

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    discount_type = Column(String(20), default="PERCENTAGE", nullable=False)  # "PERCENTAGE", "FLAT"
    discount_value = Column(Numeric(10, 2), nullable=False)
    max_cashback = Column(Numeric(10, 2), nullable=True)
    min_purchase = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    eligible_categories = Column(JSON, default=lambda: ["Shopping", "Food", "Travel"])
    valid_from = Column(DateTime(timezone=True), default=utc_now)
    valid_to = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    terms = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
