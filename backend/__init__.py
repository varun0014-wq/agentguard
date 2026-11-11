"""
AgentGuard API Routes Package.
Exports routers for all 8 features plus core payment security firewall.
"""

from backend.routes.agents import router as agents_router
from backend.routes.products import router as products_router
from backend.routes.payments import router as payments_router
from backend.routes.security import router as security_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.webhooks import router as webhooks_router
from backend.routes.spending import router as spending_router
from backend.routes.bills import router as bills_router
from backend.routes.currency import router as currency_router
from backend.routes.scanner import router as scanner_router
from backend.routes.chatbot import router as chatbot_router
from backend.routes.schemes import router as schemes_router
from backend.routes.phone import router as phone_router
from backend.routes.compat import router as compat_router

__all__ = [
    "agents_router",
    "products_router",
    "payments_router",
    "security_router",
    "dashboard_router",
    "webhooks_router",
    "spending_router",
    "bills_router",
    "currency_router",
    "scanner_router",
    "chatbot_router",
    "schemes_router",
    "phone_router",
    "compat_router",
]
