"""
International Phone Number Validation and Formatting Service for AgentGuard.
Utilizes Google's libphonenumber (via python-phonenumbers) for E.164 normalization,
country code parsing, and validity verification.
"""

from typing import Dict, Any, List, Optional
import phonenumbers
from phonenumbers import geocoder, carrier

# Supported international jurisdictions
SUPPORTED_COUNTRIES = [
    {"name": "United States", "iso_code": "US", "dialing_code": "+1", "example_number": "+14155552671"},
    {"name": "India", "iso_code": "IN", "dialing_code": "+91", "example_number": "+919876543210"},
    {"name": "United Kingdom", "iso_code": "GB", "dialing_code": "+44", "example_number": "+447911123456"},
    {"name": "United Arab Emirates", "iso_code": "AE", "dialing_code": "+971", "example_number": "+971501234567"},
    {"name": "Canada", "iso_code": "CA", "dialing_code": "+1", "example_number": "+14165551234"},
    {"name": "Australia", "iso_code": "AU", "dialing_code": "+61", "example_number": "+61412345678"},
    {"name": "Germany", "iso_code": "DE", "dialing_code": "+49", "example_number": "+4915123456789"},
    {"name": "Singapore", "iso_code": "SG", "dialing_code": "+65", "example_number": "+6591234567"},
    {"name": "Japan", "iso_code": "JP", "dialing_code": "+81", "example_number": "+819012345678"},
]


class PhoneService:
    @classmethod
    def get_supported_countries(cls) -> List[Dict[str, str]]:
        return SUPPORTED_COUNTRIES

    @classmethod
    def validate_and_normalize(
        cls, phone_number: str, default_country: Optional[str] = "US"
    ) -> Dict[str, Any]:
        num_clean = phone_number.strip()
        default_region = (default_country or "US").upper()

        try:
            parsed = phonenumbers.parse(num_clean, default_region)
            is_valid = phonenumbers.is_valid_number(parsed)

            if not is_valid:
                return {
                    "is_valid": False,
                    "raw_number": num_clean,
                    "e164_format": None,
                    "international_format": None,
                    "national_format": None,
                    "country_code": None,
                    "dialing_code": None,
                    "carrier_or_region": None,
                    "error_message": "Invalid phone number according to international ITU standards.",
                }

            e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            intl = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
            natl = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
            region = geocoder.description_for_number(parsed, "en") or carrier.name_for_number(parsed, "en") or None
            country_iso = phonenumbers.region_code_for_number(parsed)

            return {
                "is_valid": True,
                "raw_number": num_clean,
                "e164_format": e164,
                "international_format": intl,
                "national_format": natl,
                "country_code": country_iso,
                "dialing_code": parsed.country_code,
                "carrier_or_region": region,
                "error_message": None,
            }

        except phonenumbers.NumberParseException as e:
            return {
                "is_valid": False,
                "raw_number": num_clean,
                "e164_format": None,
                "international_format": None,
                "national_format": None,
                "country_code": None,
                "dialing_code": None,
                "carrier_or_region": None,
                "error_message": f"Parse error: {str(e)}",
            }


phone_service = PhoneService()
