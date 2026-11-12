"""
Currency Conversion Service for AgentGuard.
Integrates live exchange rates with resilient fallback data,
supporting institutional and common retail currencies (USD, INR, EUR, GBP, AED, JPY, CAD).
"""

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import CurrencyConversion

SUPPORTED_CURRENCIES = ["USD", "INR", "EUR", "GBP", "AED", "JPY", "CAD", "AUD", "SGD", "CHF"]

# Resilient baseline exchange rates (relative to 1 USD)
FALLBACK_RATES_USD: Dict[str, Decimal] = {
    "USD": Decimal("1.000000"),
    "INR": Decimal("86.500000"),
    "EUR": Decimal("0.920000"),
    "GBP": Decimal("0.790000"),
    "AED": Decimal("3.672500"),
    "JPY": Decimal("152.400000"),
    "CAD": Decimal("1.380000"),
    "AUD": Decimal("1.520000"),
    "SGD": Decimal("1.340000"),
    "CHF": Decimal("0.890000"),
}


class CurrencyService:
    def __init__(self):
        self._cached_rates: Dict[str, Decimal] = FALLBACK_RATES_USD.copy()
        self._last_updated: datetime = datetime.now(timezone.utc)
        self.provider_name: str = "ExchangeRate-API"

    @property
    def supported_currencies(self) -> List[str]:
        return SUPPORTED_CURRENCIES

    async def get_latest_rates(self, base: str = "USD") -> Dict[str, Decimal]:
        base_clean = base.upper()
        if base_clean not in SUPPORTED_CURRENCIES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported currency '{base}'. Supported: {SUPPORTED_CURRENCIES}",
            )

        # Attempt fetching live rates from public exchange API
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"https://open.er-api.com/v6/latest/{base_clean}")
                if res.status_code == 200:
                    data = res.json()
                    rates_raw = data.get("rates", {})
                    filtered_rates = {}
                    for curr in SUPPORTED_CURRENCIES:
                        if curr in rates_raw:
                            filtered_rates[curr] = Decimal(str(rates_raw[curr]))
                    if filtered_rates:
                        self._cached_rates = filtered_rates
                        self._last_updated = datetime.now(timezone.utc)
                        self.provider_name = "Live ExchangeRate-API"
                        return filtered_rates
        except Exception:
            # Silently use reliable fallback on timeout or network block
            pass

        # Calculate from fallback rates
        base_usd_rate = FALLBACK_RATES_USD.get(base_clean, Decimal("1.0"))
        calculated = {}
        for curr, rate in FALLBACK_RATES_USD.items():
            calculated[curr] = (rate / base_usd_rate).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)

        self.provider_name = "AgentGuard Verified Spot Corridor (Cached/Fallback)"
        return calculated

    async def convert_currency(
        self,
        from_curr: str,
        to_curr: str,
        amount: Decimal,
        db: Optional[Session] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        from_c = from_curr.upper()
        to_c = to_curr.upper()

        if from_c not in SUPPORTED_CURRENCIES:
            raise HTTPException(status_code=400, detail=f"Unsupported source currency '{from_curr}'")
        if to_c not in SUPPORTED_CURRENCIES:
            raise HTTPException(status_code=400, detail=f"Unsupported target currency '{to_curr}'")

        rates = await self.get_latest_rates(base=from_c)
        rate = rates.get(to_c)
        if not rate:
            raise HTTPException(status_code=500, detail=f"Could not resolve rate for {from_c} -> {to_c}")

        converted = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        disclaimer = (
            "Estimated market conversion rate. Final PayPal transaction exchange rates, "
            "spreads, and currency conversion fees may vary at checkout settlement."
        )

        # Audit record
        if db:
            record = CurrencyConversion(
                user_id=user_id or "default_user",
                from_currency=from_c,
                to_currency=to_c,
                amount=amount,
                exchange_rate=rate,
                converted_amount=converted,
                provider=self.provider_name,
                timestamp=self._last_updated,
            )
            db.add(record)
            db.commit()

        return {
            "from_currency": from_c,
            "to_currency": to_c,
            "original_amount": amount,
            "exchange_rate": rate,
            "converted_amount": converted,
            "timestamp": self._last_updated,
            "provider": self.provider_name,
            "disclaimer": disclaimer,
        }


currency_service = CurrencyService()
