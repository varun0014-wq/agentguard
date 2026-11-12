"""
AI Financial Chatbot Service for AgentGuard.
Understands natural-language financial questions, routes to backend services,
and provides context-aware financial explanations.
"""

import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.models import ChatMessage, Transaction, SpendingBudget, Bill, BillParticipant
from backend.services.spending_service import spending_service
from backend.services.currency_service import currency_service
from backend.services.channel3_service import channel3_service
from backend.config import settings


class ChatbotService:
    @classmethod
    async def process_user_message(
        cls, db: Session, user_id: str, message: str
    ) -> Dict[str, Any]:
        msg_clean = message.strip()
        lower_msg = msg_clean.lower()

        # Save user message
        user_record = ChatMessage(
            user_id=user_id,
            role="user",
            content=msg_clean,
        )
        db.add(user_record)
        db.flush()

        intent = "GENERAL_QUERY"
        reply = ""
        suggested_actions = []
        metadata = {}

        # Intent 1: Monthly spending query
        if any(w in lower_msg for w in ["spend this month", "monthly spend", "how much did i spend", "my spending"]):
            intent = "MONTHLY_SPEND"
            spending = spending_service.get_monthly_spending(db, user_id)
            reply = (
                f"Your total spending for {spending.month} is ${spending.total_spending:.2f} across "
                f"{spending.transaction_count} transaction(s)."
            )
            if spending.budget_limit:
                reply += f" You have used {spending.budget_used_percentage}% of your ${spending.budget_limit:.2f} budget."
            suggested_actions = ["View Category Breakdown", "Check Budget Alerts", "View Transaction History"]
            metadata = {"total_spending": float(spending.total_spending), "month": spending.month}

        # Intent 2: Highest spending category
        elif any(w in lower_msg for w in ["highest spending", "top category", "category spend", "which category"]):
            intent = "CATEGORY_BREAKDOWN"
            breakdown = spending_service.get_category_breakdown(db, user_id)
            if breakdown.categories:
                top = breakdown.categories[0]
                reply = (
                    f"Your highest spending category this month is **{top.category}** with "
                    f"${top.amount:.2f} ({top.percentage}% of total spending across {top.count} transactions)."
                )
            else:
                reply = "No categorized spending recorded yet for this month."
            suggested_actions = ["View All Categories", "Set Monthly Budget"]
            metadata = {"categories": [c.model_dump() for c in breakdown.categories]}

        # Intent 3: Unpaid bills / Money owed
        elif any(w in lower_msg for w in ["owe", "split bill", "friends owe", "unpaid bill"]):
            intent = "BILL_STATUS"
            bills = db.query(Bill).filter(Bill.status != "PAID").all()
            if bills:
                reply = f"You have {len(bills)} active/unpaid bill(s):\n"
                for b in bills[:3]:
                    reply += f"• **{b.title}**: Total ${b.total_amount:.2f} ({b.status})\n"
            else:
                reply = "All your shared bills are fully settled! No pending bill debts found."
            suggested_actions = ["Create New Split Bill", "View Pending Approvals"]

        # Intent 4: Currency conversion query
        elif "convert" in lower_msg or "exchange rate" in lower_msg:
            intent = "CURRENCY_CONVERT"
            match = re.search(r"convert\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]{3})\s*(?:in|to|into)\s*([a-zA-Z]{3})", lower_msg)
            if match:
                amt = Decimal(match.group(1))
                from_c = match.group(2).upper()
                to_c = match.group(3).upper()
                conv = await currency_service.convert_currency(from_c, to_c, amt, db, user_id)
                reply = (
                    f"{amt} {from_c} = **{conv['converted_amount']} {to_c}** "
                    f"(Exchange rate: 1 {from_c} = {conv['exchange_rate']} {to_c}).\n"
                    f"*{conv['disclaimer']}*"
                )
                metadata = conv
            else:
                reply = "Please specify the conversion like: 'Convert 100 USD to INR' or 'Convert 50 EUR to USD'."
            suggested_actions = ["View Supported Currencies", "Check Exchange Rates"]

        # Intent 5: Pending payments
        elif any(w in lower_msg for w in ["pending payment", "pending approval", "review payment"]):
            intent = "PENDING_PAYMENTS"
            pending = (
                db.query(Transaction)
                .filter(Transaction.payment_status == "REQUIRES_APPROVAL")
                .all()
            )
            if pending:
                reply = f"You have **{len(pending)} payment(s) awaiting human approval**:\n"
                for p in pending[:3]:
                    reply += f"• {p.product_name} (${p.amount} from {p.merchant}) - Risk: {p.risk_score}/100\n"
                reply += "\nWould you like to approve or reject any of these?"
            else:
                reply = "Great news! You have zero pending payments awaiting human review."
            suggested_actions = ["Go to Approval Center", "View Dashboard"]

        # Intent 6: Monthly budget check
        elif "budget" in lower_msg:
            intent = "BUDGET_INQUIRY"
            alert = spending_service.check_spending_alerts(db, user_id)
            if alert.budget_amount > 0:
                reply = (
                    f"Your monthly budget is **${alert.budget_amount:.2f}**. "
                    f"Current spending is **${alert.current_spending:.2f}** ({alert.percentage_used}% used). "
                    f"Status: **{alert.alert_level}**."
                )
            else:
                reply = "No monthly budget is configured. You can set one via 'Set Monthly Budget'."
            suggested_actions = ["Set New Budget", "View Spending Trends"]

        # Intent 7: Blocked payment explanation
        elif any(w in lower_msg for w in ["blocked", "why was my payment", "rejected"]):
            intent = "BLOCKED_EXPLANATION"
            last_blocked = (
                db.query(Transaction)
                .filter(Transaction.decision == "BLOCK")
                .order_by(Transaction.created_at.desc())
                .first()
            )
            if last_blocked:
                reasons_str = "; ".join(last_blocked.risk_reasons or ["Policy violation"])
                reply = (
                    f"The payment for **{last_blocked.product_name}** (${last_blocked.amount} to {last_blocked.merchant}) "
                    f"was **BLOCKED** by the AgentGuard security engine.\n\n"
                    f"**Reason(s):** {reasons_str}\n\n"
                    f"*AgentGuard's security firewall ensures transactions violating financial limits never reach PayPal.*"
                )
            else:
                reply = "No blocked transactions found in your recent history."
            suggested_actions = ["View Security Policies", "Review Agent Permissions"]

        # Intent 8: Product search
        elif any(w in lower_msg for w in ["find", "search product", "buy"]):
            intent = "PRODUCT_SEARCH"
            q_clean = re.sub(r"\b(find|search|buy|me|a|an|the|for|under|\$\d+)\b", "", lower_msg).strip()
            products = await channel3_service.search_products(q_clean or "electronics")
            if products:
                reply = f"Found {len(products)} matching product(s) via Channel3:\n"
                for p in products[:2]:
                    reply += f"• **{p.name}** - ${p.price} from {p.merchant} ({p.source})\n"
                reply += "Your purchasing agent can formulate a secure payment request for any of these."
            else:
                reply = f"Could not find any products matching '{q_clean}'."
            suggested_actions = ["Submit Purchase Request", "View Catalog"]

        # Default fallback
        else:
            intent = "GENERAL_ASSIST"
            reply = (
                "I am **AgentGuard Financial AI Copilot**. I can assist you with:\n"
                "• Monthly spending tracking & category summaries\n"
                "• Shared bill calculations & payment statuses\n"
                "• Multi-currency conversions (USD, INR, EUR, GBP, etc.)\n"
                "• Explaining AI agent security blocks & pending reviews\n"
                "• Product discovery via Channel3"
            )
            suggested_actions = ["Show Monthly Spending", "Check Budget", "Convert USD to INR", "View Pending Payments"]

        # Save assistant message
        user_record.intent_detected = intent
        assistant_record = ChatMessage(
            user_id=user_id,
            role="assistant",
            content=reply,
            intent_detected=intent,
            metadata_json=metadata,
        )
        db.add(assistant_record)
        db.commit()

        return {
            "reply": reply,
            "intent_detected": intent,
            "suggested_actions": suggested_actions,
            "metadata": metadata,
        }

    @classmethod
    def get_chat_history(cls, db: Session, user_id: str = "default_user", limit: int = 50) -> List[ChatMessage]:
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
            .all()
        )

    @classmethod
    def clear_chat_history(cls, db: Session, user_id: str = "default_user") -> int:
        deleted = (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user_id)
            .delete()
        )
        db.commit()
        return deleted


chatbot_service = ChatbotService()
