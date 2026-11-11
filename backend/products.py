"""
Products API routes for AgentGuard.
Interacts with Channel3 product discovery and catalog verification.
"""

from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from backend.schemas import ProductSearchResponse, ProductItem
from backend.services.channel3_service import channel3_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/search", response_model=ProductSearchResponse, summary="Search products via Channel3")
async def search_products(
    q: str = Query(..., min_length=1, description="Product search keyword, e.g. 'headphones'"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Optional maximum price filter"),
):
    """
    Discovers products across verified merchants using Channel3.
    Returns product details, prices, and merchant identifiers.
    """
    products = await channel3_service.search_products(query=q, max_price=max_price)
    source = "channel3_live" if channel3_service.is_configured else "channel3_demo"
    return ProductSearchResponse(
        query=q,
        count=len(products),
        source=source,
        products=products,
    )


@router.get("/{id}", response_model=ProductItem, summary="Get verified product details by ID")
def get_product(id: str):
    """
    Retrieves full verified offer information for a product by its ID or catalog reference.
    """
    product = channel3_service.get_product(id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with reference '{id}' not found")
    return product
