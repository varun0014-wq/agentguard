"""
International Phone Number API routes for AgentGuard.
Feature 7: International country phone codes and E.164 standardization.
"""

from fastapi import APIRouter, status
from backend.services.phone_service import phone_service
from backend.schemas import (
    PhoneCountriesResponse,
    CountryPhoneInfo,
    PhoneValidateRequest,
    PhoneValidateResponse,
)

router = APIRouter(prefix="/phone", tags=["International Phone Numbers"])


@router.get("/countries", response_model=PhoneCountriesResponse, summary="Get list of supported countries and dialing codes")
def get_supported_countries():
    """
    Returns supported international country dialing codes (e.g. +91, +1, +44, +971, +61).
    """
    countries = phone_service.get_supported_countries()
    items = [CountryPhoneInfo(**c) for c in countries]
    return PhoneCountriesResponse(count=len(items), countries=items)


@router.post("/validate", response_model=PhoneValidateResponse, status_code=status.HTTP_200_OK, summary="Validate and normalize phone number to E.164")
def validate_phone_number(payload: PhoneValidateRequest):
    """
    Validates international phone numbers using Google's libphonenumber,
    and returns normalized E.164, national, and international formats with region data.
    """
    result = phone_service.validate_and_normalize(
        phone_number=payload.phone_number,
        default_country=payload.default_country or "US",
    )
    return PhoneValidateResponse(**result)
