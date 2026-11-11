"""
Pytest configuration and fixtures for AgentGuard test suite.
Uses an in-memory SQLite database with StaticPool for test isolation.
"""

import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.database import Base, get_db
from backend.main import app
from backend.models import User, Agent, SecurityPolicy

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Creates a fresh in-memory database schema for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed baseline fixtures
    user = User(id="test_user_001", name="Test Admin", email="admin@test.com")
    session.add(user)
    session.flush()

    policy = SecurityPolicy(
        id="test_policy_001",
        user_id=user.id,
        daily_limit=Decimal("200.00"),
        max_transaction=Decimal("100.00"),
        auto_approval_limit=Decimal("50.00"),
        allowed_merchants=["TrustedStore", "TechStore", "VerifiedShop"],
        restricted_merchants=["ShadyMarket", "BannedVendor"],
        allowed_currencies=["USD"],
    )
    session.add(policy)
    session.flush()

    active_agent = Agent(
        id="test_agent_active",
        user_id=user.id,
        name="Active Shopping Agent",
        status="active",
        daily_limit=None,
        max_transaction=None,
        auto_approval_limit=None,
    )
    session.add(active_agent)

    paused_agent = Agent(
        id="test_agent_paused",
        user_id=user.id,
        name="Paused Shopping Agent",
        status="paused",
        daily_limit=None,
        max_transaction=None,
        auto_approval_limit=None,
    )
    session.add(paused_agent)

    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
