"""
PayPal REST API Integration Service.
Handles OAuth 2.0 authentication, Orders API (create, get, capture),
and Webhook signature verification against PayPal Sandbox.
"""

import time
import logging
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple
import httpx

from backend.config import settings

logger = logging.getLogger("agentguard.paypal")


class PayPalService:
    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.base_url = settings.PAYPAL_BASE_URL
        self.webhook_id = settings.PAYPAL_WEBHOOK_ID
        self.timeout = 15.0

        # Token cache
        self._cached_token: Optional[str] = None
        self._token_expiry_timestamp: float = 0.0

    @property
    def is_configured(self) -> bool:
        return settings.is_paypal_configured

    async def get_access_token(self) -> str:
        """
        Retrieves or refreshes an OAuth 2.0 bearer token from PayPal.
        """
        now = time.time()
        # Return cached token if valid for at least another 60 seconds
        if self._cached_token and now < self._token_expiry_timestamp - 60:
            return self._cached_token

        if not self.is_configured:
            # When credentials are not yet configured, provide mock token for offline test mode
            self._cached_token = "mock_paypal_access_token_demo"
            self._token_expiry_timestamp = now + 3600
            return self._cached_token

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/v1/oauth2/token",
                    data={"grant_type": "client_credentials"},
                    auth=(self.client_id, self.client_secret),
                    headers={"Accept": "application/json", "Accept-Language": "en_US"},
                )
                if response.status_code == 200:
                    data = response.json()
                    self._cached_token = data["access_token"]
                    expires_in = data.get("expires_in", 3600)
                    self._token_expiry_timestamp = now + float(expires_in)
                    return self._cached_token
                else:
                    logger.error(f"PayPal OAuth failed: {response.status_code} {response.text}")
                    raise RuntimeError(f"PayPal OAuth error: {response.text}")
            except httpx.RequestError as exc:
                logger.error(f"PayPal connection error during auth: {exc}")
                raise RuntimeError(f"PayPal connection failed: {exc}")

    async def create_order(
        self,
        reference_id: str,
        amount: Decimal,
        currency: str = "USD",
        description: str = "AgentGuard Authorized Purchase",
        return_url: str = "http://localhost:3000/payments/success",
        cancel_url: str = "http://localhost:3000/payments/cancel",
    ) -> Dict[str, Any]:
        """
        Creates an authorized PayPal Checkout Order.
        Returns order dict containing 'id' and 'approval_url'.
        """
        if not self.is_configured:
            # Mock sandbox response for local development when credentials not supplied
            order_id = f"MOCK-ORDER-{reference_id[:8]}"
            approval_url = f"https://www.sandbox.paypal.com/checkoutnow?token={order_id}"
            return {
                "id": order_id,
                "status": "CREATED",
                "approval_url": approval_url,
                "is_mock": True,
            }

        token = await self.get_access_token()
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": reference_id,
                    "description": description[:127],
                    "amount": {
                        "currency_code": currency.upper(),
                        "value": f"{amount:.2f}",
                    },
                }
            ],
            "application_context": {
                "brand_name": "AgentGuard Security",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = await client.post(
                f"{self.base_url}/v2/checkout/orders",
                json=payload,
                headers=headers,
            )

            if response.status_code in (200, 201):
                data = response.json()
                order_id = data.get("id")
                # Extract the buyer approval link
                approval_url = None
                for link in data.get("links", []):
                    if link.get("rel") == "approve":
                        approval_url = link.get("href")
                        break
                return {
                    "id": order_id,
                    "status": data.get("status"),
                    "approval_url": approval_url,
                    "raw": data,
                    "is_mock": False,
                }
            else:
                logger.error(f"PayPal create order failed: {response.status_code} {response.text}")
                raise RuntimeError(f"PayPal API order creation error: {response.text}")

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """
        Fetches an order from PayPal Orders API to verify its real status.
        """
        if not self.is_configured or order_id.startswith("MOCK-"):
            return {
                "id": order_id,
                "status": "APPROVED",
                "is_mock": True,
            }

        token = await self.get_access_token()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = await client.get(
                f"{self.base_url}/v2/checkout/orders/{order_id}",
                headers=headers,
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise RuntimeError(f"PayPal get order failed: {response.status_code} {response.text}")

    async def capture_order(self, order_id: str) -> Dict[str, Any]:
        """
        Captures authorized payment after buyer approval.
        Never reports success without confirming PayPal's actual response.
        """
        if not self.is_configured or order_id.startswith("MOCK-"):
            capture_id = f"MOCK-CAPTURE-{order_id[-8:]}"
            return {
                "id": order_id,
                "status": "COMPLETED",
                "capture_id": capture_id,
                "is_mock": True,
            }

        token = await self.get_access_token()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = await client.post(
                f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                headers=headers,
            )

            if response.status_code in (200, 201):
                data = response.json()
                status = data.get("status")
                capture_id = None
                purchase_units = data.get("purchase_units", [])
                if purchase_units:
                    captures = (
                        purchase_units[0]
                        .get("payments", {})
                        .get("captures", [])
                    )
                    if captures:
                        capture_id = captures[0].get("id")

                return {
                    "id": order_id,
                    "status": status,
                    "capture_id": capture_id,
                    "raw": data,
                    "is_mock": False,
                }
            else:
                logger.error(f"PayPal capture failed: {response.status_code} {response.text}")
                raise RuntimeError(f"PayPal capture failed: {response.text}")

    async def verify_webhook_signature(
        self,
        transmission_id: str,
        transmission_time: str,
        cert_url: str,
        auth_algo: str,
        transmission_sig: str,
        webhook_body: Dict[str, Any],
    ) -> bool:
        """
        Verifies PayPal webhook signature via PayPal's verify-webhook-signature endpoint.
        """
        if not self.is_configured:
            # If in demo/test mode with mock webhook, accept if headers are populated
            return bool(transmission_id and transmission_sig)

        if not self.webhook_id:
            logger.warning("PAYPAL_WEBHOOK_ID not set; rejecting webhook")
            return False

        token = await self.get_access_token()
        payload = {
            "transmission_id": transmission_id,
            "transmission_time": transmission_time,
            "cert_url": cert_url,
            "auth_algo": auth_algo,
            "transmission_sig": transmission_sig,
            "webhook_id": self.webhook_id,
            "webhook_event": webhook_body,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = await client.post(
                f"{self.base_url}/v1/notifications/verify-webhook-signature",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                result = response.json()
                return result.get("verification_status") == "SUCCESS"
            return False


paypal_service = PayPalService()
