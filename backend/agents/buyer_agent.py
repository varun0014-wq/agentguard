"""
Agent A: Purchasing Agent (Buyer Agent).
Accepts natural-language purchasing instructions, searches products via Channel3,
selects the best match, and generates a structured payment request.

CRITICAL SECURITY CONSTRAINT:
Agent A NEVER receives PayPal credentials and cannot execute payments directly.
All requests MUST be submitted to AgentGuard's independent security engine.
"""

import uuid
from decimal import Decimal
from typing import Dict, Any, Optional

from backend.agents.ai_provider import AIProvider
from backend.services.channel3_service import channel3_service
from backend.schemas import PaymentRequestCreate


class BuyerAgent:
    """
    Autonomous purchasing agent that assists users by searching catalogs
    and formulating purchase intent without direct payment authority.
    """

    def __init__(self, agent_id: str = "shopping_agent"):
        self.agent_id = agent_id

    async def process_instruction(self, instruction: str) -> Dict[str, Any]:
        """
        End-to-end processing of a user's natural language request:
        1. Parse intent (product search term & budget limit)
        2. Search Channel3 product catalog
        3. Select best matching product
        4. Formulate structured payment request
        """
        # Step 1: Parse instruction using AI / deterministic parser
        parsed = AIProvider.parse_purchasing_instruction(instruction)
        query = parsed.get("query", instruction)
        max_budget = parsed.get("max_budget")
        max_budget_dec = Decimal(str(max_budget)) if max_budget else None

        # Step 2: Search Channel3 catalog
        products = await channel3_service.search_products(query, max_price=max_budget_dec)

        if not products:
            return {
                "success": False,
                "message": f"No products found matching '{query}' within budget.",
                "query": query,
                "selected_product": None,
                "payment_request": None,
            }

        # Step 3: Select best product (first suitable match)
        selected = products[0]

        # Step 4: Generate structured payment request
        idempotency_key = f"idem_{uuid.uuid4().hex[:16]}"
        payment_request = PaymentRequestCreate(
            agent_id=self.agent_id,
            product_name=selected.name,
            merchant=selected.merchant,
            amount=selected.price,
            currency=selected.currency,
            product_reference=selected.id,
            idempotency_key=idempotency_key,
        )

        return {
            "success": True,
            "message": f"Found '{selected.name}' from {selected.merchant} for ${selected.price:.2f}.",
            "query": query,
            "selected_product": selected.model_dump(),
            "payment_request": payment_request.model_dump(),
        }


buyer_agent = BuyerAgent()
