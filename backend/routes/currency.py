"""
Currency Conversion API routes for AgentGuard.
Feature 3: Supported currencies, spot exchange rates, and instant conversions.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.currency_service import currency_service
from backend.schemas import (
    CurrencySupportedResponse,
    CurrencyRatesResponse,
    CurrencyConvertRequest,
    CurrencyConvertResponse,
)

router = APIRouter(prefix="/currency", tags=["Currency Conversion"])


@router.get("/supported", response_model=CurrencySupportedResponse, summary="Get list of supported currencies")
def get_supported_currencies():
    """
    Returns supported international currency codes (USD, INR, EUR, GBP, AED, JPY, CAD, etc.).
    """
    return CurrencySupportedResponse(
        base_currency="USD",
        supported_currencies=currency_service.supported_currencies,
        provider=currency_service.provider_name,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/rates", response_model=CurrencyRatesResponse, summary="Get exchange rates against base currency")
async def get_exchange_rates(
    base: str = Query("USD", min_length=3, max_length=3, description="Base currency code"),
):
    """
    Fetches latest foreign exchange rates from the configured rate provider.
    """
    rates = await currency_service.get_latest_rates(base=base.upper())
    return CurrencyRatesResponse(
        base=base.upper(),
        rates=rates,
        timestamp=datetime.now(timezone.utc),
        disclaimer="Indicative market rate. Final PayPal conversion rates may vary.",
    )


@router.post("/convert", response_model=CurrencyConvertResponse, summary="Convert currency amounts")
async def convert_currency(
    payload: CurrencyConvertRequest,
    db: Session = Depends(get_db),
):
    """
    Calculates the converted amount using verified exchange rates and records an audit trail.
    """
    result = await currency_service.convert_currency(
        from_curr=payload.from_currency,
        to_curr=payload.to_currency,
        amount=payload.amount,
        db=db,
        user_id="default_user",
    )
    return CurrencyConvertResponse(**result)
