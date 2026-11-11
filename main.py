"""
AgentGuard - Independent Financial Authorization Layer for AI Agents.
Main FastAPI application entrypoint with all 8 features mounted.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import os

from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import User, Agent, SecurityPolicy, AgentPermission
from backend.schemas import (
    HealthResponse,
    IntegrationStatusResponse,
    ServiceStatus,
    StandardErrorResponse,
)
from backend.routes import (
    agents_router,
    products_router,
    payments_router,
    security_router,
    dashboard_router,
    webhooks_router,
    spending_router,
    bills_router,
    currency_router,
    scanner_router,
    chatbot_router,
    schemes_router,
    phone_router,
    compat_router,
)
from backend.services.channel3_service import channel3_service
from backend.services.paypal_service import paypal_service
from backend.services.currency_service import currency_service
from backend.services.schemes_service import schemes_service
from backend.agents.ai_provider import AIProvider

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agentguard")


def seed_initial_data():
    """
    Ensures default admin user, default shopping agent, permissions, policies,
    and promotional schemes exist on startup.
    """
    db = SessionLocal()
    try:
        # Check or create default user
        user = db.query(User).first()
        if not user:
            user = User(
                id="user_admin_001",
                name="Hackathon Admin",
                email="admin@agentguard.dev",
            )
            db.add(user)
            db.flush()

        # Check or create default security policy
        policy = db.query(SecurityPolicy).first()
        if not policy:
            policy = SecurityPolicy(
                id="policy_default_001",
                user_id=user.id,
                daily_limit=settings.DEFAULT_DAILY_LIMIT,
                monthly_limit=Decimal("500.00"),
                max_transaction=settings.DEFAULT_MAX_TRANSACTION,
                auto_approval_limit=settings.DEFAULT_AUTO_APPROVAL_LIMIT,
                allowed_merchants=settings.DEFAULT_ALLOWED_MERCHANTS,
                restricted_merchants=["ShadyMarket", "BannedVendor", "FraudStore"],
                allowed_currencies=["USD"],
            )
            db.add(policy)
            db.flush()

        # Check or create default shopping agent
        agent = db.query(Agent).filter(Agent.id == "shopping_agent").first()
        if not agent:
            agent = Agent(
                id="shopping_agent",
                user_id=user.id,
                name="Autonomous Shopping Agent",
                status="active",
                daily_limit=None,
                monthly_limit=None,
                max_transaction=None,
                auto_approval_limit=None,
            )
            db.add(agent)
            db.flush()

            # Default agent permissions
            perm = AgentPermission(
                agent_id=agent.id,
                allowed_categories=["Shopping", "Food", "Travel", "Entertainment", "Bills", "Subscriptions", "Other"],
                allowed_merchants=["TrustedStore", "TechStore", "VerifiedShop", "OfficeSuppliesCo"],
                restricted_merchants=["ShadyMarket", "BannedVendor"],
            )
            db.add(perm)

        # Seed promotional schemes
        schemes_service.seed_default_schemes(db)

        db.commit()
        logger.info("Database initialized and seed data verified successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database initialization/seeding: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default models
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    logger.info(f"AgentGuard Backend started in {settings.ENVIRONMENT} mode.")
    yield
    # Shutdown
    logger.info("AgentGuard Backend shutting down.")


app = FastAPI(
    title="AgentGuard API",
    description=(
        "Independent Financial Authorization Layer & AI Assistant for PayPal.\n\n"
        "Core Philosophy: 'AI agents can make purchases. "
        "AgentGuard makes sure they only spend what they're allowed to.'"
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for independent frontend developers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Request validation failed",
            "error_code": "VALIDATION_ERROR",
            "errors": exc.errors(),
        },
    )


# System & Health Endpoints
@app.get("/health", response_model=HealthResponse, tags=["System"], summary="Health check endpoint")
def health_check():
    """
    Returns server health, current version, environment, and server timestamp.
    """
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
    )


@app.get(
    "/integrations/status",
    response_model=IntegrationStatusResponse,
    tags=["System"],
    summary="Get status of external integrations (PayPal, Channel3, AI, Currency)",
)
def get_integration_status():
    """
    Reports live vs demo status for PayPal Sandbox, Channel3, AI Provider, Currency, and SQLite.
    Never exposes credentials or secrets.
    """
    paypal_mode = "live_sandbox" if paypal_service.is_configured else "offline_simulation"
    paypal_status = "connected" if paypal_service.is_configured else "demo_ready"

    channel3_mode = "live" if channel3_service.is_configured else "demo_catalog"
    channel3_status = "connected" if channel3_service.is_configured else "catalog_active"

    ai_configured = settings.is_gemini_configured or settings.is_openai_configured
    ai_mode = AIProvider.get_provider_name()
    ai_status = "connected" if ai_configured else "deterministic_fallback"

    return IntegrationStatusResponse(
        paypal=ServiceStatus(
            name="PayPal REST API (Sandbox)",
            configured=paypal_service.is_configured,
            status=paypal_status,
            mode=paypal_mode,
            details="Orders API v2 & Webhook verification ready",
        ),
        channel3=ServiceStatus(
            name="Channel3 Product Discovery",
            configured=channel3_service.is_configured,
            status=channel3_status,
            mode=channel3_mode,
            details="Product search & verified price catalog active",
        ),
        ai_provider=ServiceStatus(
            name="AI Intelligence Layer",
            configured=ai_configured,
            status=ai_status,
            mode=ai_mode,
            details="Independent policy rules remain final authority",
        ),
        database=ServiceStatus(
            name="Relational Database",
            configured=True,
            status="connected",
            mode="sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
            details="ACID transactions & concurrency-safe spending calculations active",
        ),
        currency_provider=ServiceStatus(
            name="Currency Exchange Rate Provider",
            configured=True,
            status="connected",
            mode=currency_service.provider_name,
            details="Live spot corridor with fallback data",
        ),
    )


# Mount all 8 feature routers + Core firewall + Frontend compatibility layer
app.include_router(agents_router)
app.include_router(products_router)
app.include_router(payments_router)
app.include_router(security_router)
app.include_router(dashboard_router)
app.include_router(webhooks_router)
app.include_router(spending_router)
app.include_router(bills_router)
app.include_router(currency_router)
app.include_router(scanner_router)
app.include_router(chatbot_router)
app.include_router(schemes_router)
app.include_router(phone_router)
app.include_router(compat_router)

# Serve frontend static files — must come AFTER all API routers
_FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.isdir(_FRONTEND_DIR):
    # Mount sub-directories so relative JS imports resolve correctly
    for _sub in ["views", "components", "services", "data", "utils"]:
        _sub_path = os.path.join(_FRONTEND_DIR, _sub)
        if os.path.isdir(_sub_path):
            app.mount(f"/{_sub}", StaticFiles(directory=_sub_path), name=f"static_{_sub}")
    # Root mount — serves index.html at "/"
    app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="static_root")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
