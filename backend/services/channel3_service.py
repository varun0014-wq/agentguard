"""
Channel3 Product Discovery Service.
Integrates with the Channel3 API for agentic product search and catalog discovery.
Provides an identified demo catalog fallback when live credentials are not present.
"""

import logging
from decimal import Decimal
from typing import List, Optional, Dict, Any
import httpx

from backend.config import settings
from backend.schemas import ProductItem

logger = logging.getLogger("agentguard.channel3")

# Verified catalog for demo scenarios & testing
DEMO_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "prod_kb_001",
        "name": "Wireless Keyboard",
        "description": "Ergonomic slim wireless bluetooth keyboard with silent keys",
        "merchant": "TrustedStore",
        "price": Decimal("20.00"),
        "currency": "USD",
        "in_stock": True,
        "category": "Electronics / Computer Accessories",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
    },
    {
        "id": "prod_hp_002",
        "name": "Wireless Headphones",
        "description": "Active noise cancelling over-ear bluetooth headphones",
        "merchant": "NewStore",  # New merchant triggering human review
        "price": Decimal("80.00"),
        "currency": "USD",
        "in_stock": True,
        "category": "Electronics / Audio",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    },
    {
        "id": "prod_lp_003",
        "name": "Laptop",
        "description": "15-inch ultra-portable productivity laptop with 16GB RAM",
        "merchant": "TechStore",
        "price": Decimal("500.00"),  # Verified offer is $500.00
        "currency": "USD",
        "in_stock": True,
        "category": "Electronics / Computers",
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500",
    },
    {
        "id": "prod_ms_004",
        "name": "Wireless Mouse",
        "description": "Precision optical wireless ergonomic mouse",
        "merchant": "TrustedStore",
        "price": Decimal("25.00"),
        "currency": "USD",
        "in_stock": True,
        "category": "Electronics / Computer Accessories",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500",
    },
    {
        "id": "prod_mon_005",
        "name": "4K Ultra-HD Monitor",
        "description": "27-inch IPS 4K HDR monitor for professional workstations",
        "merchant": "TechStore",
        "price": Decimal("320.00"),
        "currency": "USD",
        "in_stock": True,
        "category": "Electronics / Displays",
        "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500",
    },
]


class Channel3Service:
    """
    Channel3 API Service with live API integration and identified fallback.
    """

    def __init__(self):
        self.api_key = settings.CHANNEL3_API_KEY
        self.base_url = settings.CHANNEL3_BASE_URL
        self.timeout = 10.0
        # In-memory registry of verified offers for price verification
        self._verified_offers: Dict[str, Dict[str, Any]] = {
            item["id"]: item for item in DEMO_CATALOG
        }

    @property
    def is_configured(self) -> bool:
        return settings.is_channel3_configured

    async def search_products(
        self, query: str, max_price: Optional[Decimal] = None
    ) -> List[ProductItem]:
        """
        Searches products via Channel3 API or demo fallback.
        """
        if self.is_configured:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    }
                    params: Dict[str, Any] = {"q": query}
                    if max_price:
                        params["max_price"] = str(max_price)

                    response = await client.get(
                        f"{self.base_url}/v1/products/search",
                        headers=headers,
                        params=params,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        products = []
                        for raw in data.get("products", []):
                            price = Decimal(str(raw.get("price", "0.00")))
                            prod = ProductItem(
                                id=raw.get("id"),
                                name=raw.get("name"),
                                description=raw.get("description"),
                                merchant=raw.get("merchant", {}).get("name", "Unknown"),
                                price=price,
                                currency=raw.get("currency", "USD"),
                                in_stock=raw.get("in_stock", True),
                                category=raw.get("category"),
                                image_url=raw.get("image_url"),
                                source="channel3_live",
                            )
                            # Cache for price verification
                            self._verified_offers[prod.id] = prod.model_dump()
                            products.append(prod)
                        return products
                    else:
                        logger.warning(
                            f"Channel3 live search returned {response.status_code}, using demo fallback"
                        )
            except Exception as e:
                logger.warning(f"Channel3 live connection failed: {e}. Using demo fallback.")

        # Fallback to identified demo catalog
        return self._search_demo_catalog(query, max_price)

    def _search_demo_catalog(
        self, query: str, max_price: Optional[Decimal] = None
    ) -> List[ProductItem]:
        q_tokens = [t.lower() for t in query.split() if len(t) > 1]
        scored_items = []
        for item in DEMO_CATALOG:
            if max_price is not None and item["price"] > max_price:
                continue

            item_text = f"{item['name']} {item.get('description', '')} {item.get('category', '')}".lower()
            name_text = item["name"].lower()

            if not q_tokens:
                scored_items.append((1, item))
            else:
                score = sum(3 if token in name_text else 1 for token in q_tokens if token in item_text)
                if score > 0:
                    scored_items.append((score, item))

        scored_items.sort(key=lambda x: x[0], reverse=True)

        results = [
            ProductItem(
                id=item["id"],
                name=item["name"],
                description=item.get("description"),
                merchant=item["merchant"],
                price=item["price"],
                currency=item.get("currency", "USD"),
                in_stock=item.get("in_stock", True),
                category=item.get("category"),
                image_url=item.get("image_url"),
                source="channel3_demo",
            )
            for _, item in scored_items
        ]
        return results

    def get_product(self, product_id: str) -> Optional[ProductItem]:
        """
        Retrieves product details and verified offer by ID.
        """
        if product_id in self._verified_offers:
            raw = self._verified_offers[product_id]
            return ProductItem(
                id=raw["id"],
                name=raw["name"],
                description=raw.get("description"),
                merchant=raw["merchant"],
                price=Decimal(str(raw["price"])),
                currency=raw.get("currency", "USD"),
                in_stock=raw.get("in_stock", True),
                category=raw.get("category"),
                image_url=raw.get("image_url"),
                source=raw.get("source", "channel3_demo"),
            )
        return None

    def get_verified_price(
        self, product_reference: Optional[str], product_name: str
    ) -> Optional[Decimal]:
        """
        Looks up verified catalog price to protect against manipulated payment requests.
        """
        # Lookup by product reference first
        if product_reference and product_reference in self._verified_offers:
            return Decimal(str(self._verified_offers[product_reference]["price"]))

        # Lookup by matching name
        norm_name = product_name.strip().lower()
        for item in self._verified_offers.values():
            if item["name"].strip().lower() == norm_name:
                return Decimal(str(item["price"]))

        return None


# Global singleton
channel3_service = Channel3Service()
