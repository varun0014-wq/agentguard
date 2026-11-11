"""
Pydantic schemas for AgentGuard API request validation and response serialization.
Covers all 8 features + Core Payment Security Firewall.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


# ---------------------------------------------------------------------------
# Common / System Schemas
# ---------------------------------------------------------------------------

class StandardErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    errors: Optional[List[Dict[str, Any]]] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "2.0.0"
    environment: str
    timestamp: datetime


class ServiceStatus(BaseModel):
    name: str
    configured: bool
    status: str
    mode: str
    details: Optional[str] = None


class IntegrationStatusResponse(BaseModel):
    paypal: ServiceStatus
    channel3: ServiceStatus
    ai_provider: ServiceStatus
    database: ServiceStatus
    currency_provider: ServiceStatus


# ---------------------------------------------------------------------------
# Feature 8: Agent Schemas & Permissions
# ---------------------------------------------------------------------------

class AgentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    daily_limit: Optional[Decimal] = Field(None, ge=0)
    monthly_limit: Optional[Decimal] = Field(None, ge=0)
    max_transaction: Optional[Decimal] = Field(None, ge=0)
    auto_approval_limit: Optional[Decimal] = Field(None, ge=0)


class AgentCreate(AgentBase):
    user_id: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    daily_limit: Optional[Decimal] = Field(None, ge=0)
    monthly_limit: Optional[Decimal] = Field(None, ge=0)
    max_transaction: Optional[Decimal] = Field(None, ge=0)
    auto_approval_limit: Optional[Decimal] = Field(None, ge=0)


class AgentResponse(AgentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: datetime


class AgentPermissionUpdate(BaseModel):
    allowed_categories: Optional[List[str]] = None
    allowed_merchants: Optional[List[str]] = None
    restricted_merchants: Optional[List[str]] = None
    daily_limit: Optional[Decimal] = Field(None, ge=0)
    monthly_limit: Optional[Decimal] = Field(None, ge=0)
    max_transaction: Optional[Decimal] = Field(None, ge=0)
    auto_approval_limit: Optional[Decimal] = Field(None, ge=0)


class AgentPermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    allowed_categories: List[str]
    allowed_merchants: List[str]
    restricted_merchants: List[str]
    daily_limit: Optional[Decimal] = None
    monthly_limit: Optional[Decimal] = None
    max_transaction: Optional[Decimal] = None
    auto_approval_limit: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime


class AgentActivityResponse(BaseModel):
    agent_id: str
    name: str
    status: str
    total_transactions: int
    total_spent_today: Decimal
    total_spent_month: Decimal
    recent_transactions: List[Dict[str, Any]]


class PurchaseInstructionRequest(BaseModel):
    agent_id: str
    instruction: str = Field(
        ..., min_length=3, description="Natural language purchasing instruction, e.g. 'Find wireless headphones under $100'"
    )


class PurchaseInstructionResponse(BaseModel):
    agent_id: str
    instruction: str
    selected_product: Optional[Dict[str, Any]] = None
    payment_request: Optional[Dict[str, Any]] = None
    evaluation: Optional[Dict[str, Any]] = None
    transaction_id: Optional[str] = None
    message: str


# ---------------------------------------------------------------------------
# Feature 1: Monthly Spending Tracker Schemas
# ---------------------------------------------------------------------------

class CategoryBreakdownItem(BaseModel):
    category: str
    amount: Decimal
    percentage: float
    count: int


class CategoryBreakdownResponse(BaseModel):
    month: str
    total_spending: Decimal
    categories: List[CategoryBreakdownItem]


class MonthlySpendingResponse(BaseModel):
    month: str
    total_spending: Decimal
    total_incoming: Decimal
    net_savings: Decimal
    transaction_count: int
    budget_limit: Optional[Decimal] = None
    budget_used_percentage: Optional[float] = None
    categories: List[CategoryBreakdownItem]
    ai_summary: Optional[str] = None


class SpendingTrendItem(BaseModel):
    month: str
    spending: Decimal
    incoming: Decimal
    top_category: str


class SpendingTrendsResponse(BaseModel):
    trends: List[SpendingTrendItem]
    average_monthly_spending: Decimal
    unusual_increase_detected: bool
    insight: str


class BudgetCreate(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Month in YYYY-MM format")
    budget_amount: Decimal = Field(..., gt=0)
    alert_threshold_pct: Decimal = Field(Decimal("80.00"), ge=1, le=100)


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    month: str
    budget_amount: Decimal
    alert_threshold_pct: Decimal
    created_at: datetime
    updated_at: datetime


class SpendingAlertResponse(BaseModel):
    has_alert: bool
    month: str
    budget_amount: Decimal
    current_spending: Decimal
    percentage_used: float
    alert_level: str  # "NORMAL", "WARNING", "EXCEEDED"
    message: str


# ---------------------------------------------------------------------------
# Feature 2: Bill Splitting Schemas
# ---------------------------------------------------------------------------

class ParticipantInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    share_amount: Optional[Decimal] = Field(None, ge=0)
    percentage: Optional[Decimal] = Field(None, ge=0, le=100)


class BillCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    total_amount: Decimal = Field(..., gt=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    split_type: str = Field("EQUAL", description="EQUAL, CUSTOM, or PERCENTAGE")
    participants: List[ParticipantInput] = Field(..., min_length=1)


class BillParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    bill_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    share_amount: Decimal
    percentage: Optional[Decimal] = None
    paid_amount: Decimal
    status: str
    payment_request_id: Optional[str] = None
    paid_at: Optional[datetime] = None


class BillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    total_amount: Decimal
    currency: str
    split_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    participants: List[BillParticipantResponse] = []


class BillSplitRequest(BaseModel):
    split_type: str = Field(..., description="EQUAL, CUSTOM, or PERCENTAGE")
    shares: Optional[Dict[str, Decimal]] = None  # participant_id -> share_amount or percentage


class BillPaymentRecordCreate(BaseModel):
    participant_id: str
    paid_amount: Optional[Decimal] = Field(None, gt=0)
    payment_reference: Optional[str] = None


class BillStatusResponse(BaseModel):
    bill_id: str
    title: str
    total_amount: Decimal
    paid_total: Decimal
    unpaid_total: Decimal
    currency: str
    status: str
    participants: List[BillParticipantResponse]


# ---------------------------------------------------------------------------
# Feature 3: Currency Conversion Schemas
# ---------------------------------------------------------------------------

class CurrencySupportedResponse(BaseModel):
    base_currency: str = "USD"
    supported_currencies: List[str]
    provider: str
    timestamp: datetime


class CurrencyRatesResponse(BaseModel):
    base: str
    rates: Dict[str, Decimal]
    timestamp: datetime
    disclaimer: str


class CurrencyConvertRequest(BaseModel):
    from_currency: str = Field(..., min_length=3, max_length=3)
    to_currency: str = Field(..., min_length=3, max_length=3)
    amount: Decimal = Field(..., gt=0)


class CurrencyConvertResponse(BaseModel):
    from_currency: str
    to_currency: str
    original_amount: Decimal
    exchange_rate: Decimal
    converted_amount: Decimal
    timestamp: datetime
    provider: str
    disclaimer: str


# ---------------------------------------------------------------------------
# Feature 4: Smart Scanner Schemas
# ---------------------------------------------------------------------------

class ReceiptItemExtracted(BaseModel):
    name: str
    price: Optional[Decimal] = None
    quantity: Optional[int] = 1


class ReceiptScanResponse(BaseModel):
    scan_id: str
    merchant: Optional[str] = None
    total_amount: Optional[Decimal] = None
    currency: str = "USD"
    date: Optional[str] = None
    items: List[ReceiptItemExtracted] = []
    raw_text: str
    status: str
    requires_confirmation: bool = True
    message: str


class ReceiptConfirmRequest(BaseModel):
    merchant: Optional[str] = None
    total_amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = "USD"
    category: Optional[str] = "Shopping"


class QRScanResponse(BaseModel):
    scan_id: str
    raw_data: str
    qr_type: str  # "PAYPAL_INTENT", "PAYPAL_ME", "URL", "PLAIN_TEXT"
    is_valid_payment: bool
    payment_details: Optional[Dict[str, Any]] = None
    validation_notes: str


# ---------------------------------------------------------------------------
# Feature 5: AI Financial Chatbot Schemas
# ---------------------------------------------------------------------------

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatMessageResponse(BaseModel):
    reply: str
    intent_detected: str
    suggested_actions: List[str] = []
    metadata: Optional[Dict[str, Any]] = None


class ChatMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    intent_detected: Optional[str] = None
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    count: int
    messages: List[ChatMessageItem]


# ---------------------------------------------------------------------------
# Feature 6: Schemes & Promotional Offers Schemas
# ---------------------------------------------------------------------------

class SchemeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5)
    discount_type: str = Field("PERCENTAGE", description="PERCENTAGE or FLAT")
    discount_value: Decimal = Field(..., gt=0)
    max_cashback: Optional[Decimal] = Field(None, ge=0)
    min_purchase: Decimal = Field(Decimal("0.00"), ge=0)
    eligible_categories: List[str] = ["Shopping", "Food", "Travel"]
    valid_from: Optional[datetime] = None
    valid_to: datetime
    terms: Optional[str] = None


class SchemeCreate(SchemeBase):
    pass


class SchemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    max_cashback: Optional[Decimal] = None
    min_purchase: Optional[Decimal] = None
    eligible_categories: Optional[List[str]] = None
    valid_to: Optional[datetime] = None
    is_active: Optional[bool] = None
    terms: Optional[str] = None


class SchemeStatusUpdate(BaseModel):
    is_active: bool


class SchemeResponse(SchemeBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    is_expired: bool = False
    created_at: datetime
    updated_at: datetime


class SchemeEligibilityCheckRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    category: str = Field("Shopping")
    merchant: Optional[str] = None


class SchemeEligibilityResponse(BaseModel):
    purchase_amount: Decimal
    category: str
    eligible_schemes: List[SchemeResponse]
    total_potential_savings: Decimal
    best_offer_explanation: str


# ---------------------------------------------------------------------------
# Feature 7: International Phone Number Support Schemas
# ---------------------------------------------------------------------------

class CountryPhoneInfo(BaseModel):
    name: str
    iso_code: str
    dialing_code: str
    example_number: str


class PhoneCountriesResponse(BaseModel):
    count: int
    countries: List[CountryPhoneInfo]


class PhoneValidateRequest(BaseModel):
    phone_number: str = Field(..., min_length=4, max_length=30)
    default_country: Optional[str] = Field("US", description="Two-letter ISO country code (e.g. IN, US, GB, AE)")


class PhoneValidateResponse(BaseModel):
    is_valid: bool
    raw_number: str
    e164_format: Optional[str] = None
    international_format: Optional[str] = None
    national_format: Optional[str] = None
    country_code: Optional[str] = None
    dialing_code: Optional[int] = None
    carrier_or_region: Optional[str] = None
    error_message: Optional[str] = None


# ---------------------------------------------------------------------------
# Core: Product Discovery Schemas
# ---------------------------------------------------------------------------

class ProductItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    merchant: str
    price: Decimal
    currency: str = "USD"
    in_stock: bool = True
    category: Optional[str] = None
    image_url: Optional[str] = None
    source: str = "channel3"


class ProductSearchResponse(BaseModel):
    query: str
    count: int
    source: str
    products: List[ProductItem]


# ---------------------------------------------------------------------------
# Core: Security Policy Schemas
# ---------------------------------------------------------------------------

class SecurityPolicyBase(BaseModel):
    daily_limit: Decimal = Field(..., ge=0)
    monthly_limit: Decimal = Field(..., ge=0)
    max_transaction: Decimal = Field(..., ge=0)
    auto_approval_limit: Decimal = Field(..., ge=0)
    allowed_merchants: List[str]
    restricted_merchants: List[str]
    allowed_currencies: List[str] = ["USD"]

    @field_validator("max_transaction")
    @classmethod
    def max_transaction_lte_daily(cls, v: Decimal, info):
        daily = info.data.get("daily_limit")
        if daily is not None and v > daily:
            raise ValueError("max_transaction cannot exceed daily_limit")
        return v

    @field_validator("auto_approval_limit")
    @classmethod
    def auto_approval_lte_max(cls, v: Decimal, info):
        max_tx = info.data.get("max_transaction")
        if max_tx is not None and v > max_tx:
            raise ValueError("auto_approval_limit cannot exceed max_transaction")
        return v


class SecurityPolicyUpdate(BaseModel):
    daily_limit: Optional[Decimal] = Field(None, ge=0)
    monthly_limit: Optional[Decimal] = Field(None, ge=0)
    max_transaction: Optional[Decimal] = Field(None, ge=0)
    auto_approval_limit: Optional[Decimal] = Field(None, ge=0)
    allowed_merchants: Optional[List[str]] = None
    restricted_merchants: Optional[List[str]] = None
    allowed_currencies: Optional[List[str]] = None


class SecurityPolicyResponse(SecurityPolicyBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Core: Payment & Authorization Schemas
# ---------------------------------------------------------------------------

class PaymentRequestCreate(BaseModel):
    agent_id: str
    product_name: str = Field(..., min_length=1, max_length=255)
    merchant: str = Field(..., min_length=1, max_length=150)
    category: Optional[str] = "Shopping"
    amount: Decimal = Field(..., gt=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    product_reference: Optional[str] = None
    idempotency_key: str = Field(..., min_length=8, max_length=128)


class SecurityEvaluationResult(BaseModel):
    decision: str  # "APPROVE", "REVIEW", "BLOCK"
    risk_score: int  # 0 to 100
    reasons: List[str]
    policy_violations: List[str] = []
    auditor_commentary: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    product_name: str
    product_reference: Optional[str] = None
    merchant: str
    category: str = "Shopping"
    direction: str = "OUTGOING"
    amount: Decimal
    verified_price: Optional[Decimal] = None
    currency: str
    risk_score: int
    decision: str
    payment_status: str
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    paypal_approval_url: Optional[str] = None
    idempotency_key: str
    risk_reasons: List[str] = []
    created_at: datetime
    updated_at: datetime


class ApprovalActionRequest(BaseModel):
    reviewer_notes: Optional[str] = Field(None, max_length=500)


class ApprovalResponse(BaseModel):
    transaction_id: str
    status: str
    payment_status: str
    paypal_order_id: Optional[str] = None
    paypal_approval_url: Optional[str] = None
    message: str


# ---------------------------------------------------------------------------
# Dashboard Schemas
# ---------------------------------------------------------------------------

class DashboardStatsResponse(BaseModel):
    total_transactions: int
    auto_approved_count: int
    pending_approval_count: int
    blocked_count: int
    completed_payments_count: int
    total_spend_today: Decimal
    total_spend_month: Decimal
    remaining_daily_budget: Decimal
    active_agents_count: int
    average_risk_score: float


class ActivityLogItem(BaseModel):
    id: str
    transaction_id: Optional[str]
    agent_id: Optional[str]
    action: str
    reason: Optional[str]
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class DashboardActivityResponse(BaseModel):
    count: int
    activities: List[ActivityLogItem]


# ---------------------------------------------------------------------------
# Webhook Schemas
# ---------------------------------------------------------------------------

class PayPalWebhookResponse(BaseModel):
    status: str
    event_type: str
    message: str
