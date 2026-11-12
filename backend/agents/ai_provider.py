"""
Modular AI Provider Interface for AgentGuard.
Supports Google Gemini, OpenAI, and deterministic rule-based fallback.
"""

import json
import logging
import re
from typing import Optional, Dict, Any
from backend.config import settings

logger = logging.getLogger("agentguard.ai")


class AIProvider:
    @classmethod
    def get_provider_name(cls) -> str:
        if settings.is_gemini_configured:
            return "Google Gemini"
        elif settings.is_openai_configured:
            return "OpenAI"
        return "Deterministic Fallback (No API key configured)"

    @classmethod
    def parse_purchasing_instruction(cls, instruction: str) -> Dict[str, Any]:
        """
        Extracts product keywords and budget constraint from natural language.
        If an LLM is configured, uses it. Otherwise uses regex/deterministic parsing.
        """
        # Try Gemini if configured
        if settings.is_gemini_configured:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
You are an AI Purchasing Agent parser. Extract the item query and maximum budget from this request:
"{instruction}"

Return ONLY valid JSON in this exact structure:
{{
  "query": "search query string",
  "max_budget": 100.00
}}
If no budget is mentioned, set max_budget to null.
"""
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.strip("`").removeprefix("json").strip()
                return json.loads(text)
            except Exception as e:
                logger.warning(f"Gemini instruction parsing failed, falling back to deterministic: {e}")

        # Try OpenAI if configured
        if settings.is_openai_configured:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "Extract item query and max_budget as JSON: {\"query\": \"...\", \"max_budget\": 100.0 or null}",
                        },
                        {"role": "user", "content": instruction},
                    ],
                    response_format={"type": "json_object"},
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.warning(f"OpenAI instruction parsing failed, falling back to deterministic: {e}")

        # Deterministic Fallback Parser
        return cls._deterministic_parse_instruction(instruction)

    @classmethod
    def _deterministic_parse_instruction(cls, instruction: str) -> Dict[str, Any]:
        """
        Robust regex parser for parsing instructions like:
        "Find wireless headphones under $100"
        "Buy a laptop for 500 dollars"
        "Get a wireless keyboard"
        """
        budget = None
        # Match "$100", "100 dollars", "under 100", "below $80"
        budget_match = re.search(r"(?:under|below|for|max|up to)?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:dollars|\$)?", instruction, re.IGNORECASE)
        if budget_match:
            try:
                val = float(budget_match.group(1))
                # Only treat as budget if preceded by under/below/for/max or has $
                if "$" in instruction or any(w in instruction.lower() for w in ["under", "below", "max", "budget", "for", "dollars"]):
                    budget = val
            except ValueError:
                pass

        # Clean query by removing common stop words
        cleaned = re.sub(
            r"\b(find|search|buy|purchase|get|me|a|an|the|under|below|for|dollars|\$|\d+(?:\.\d{1,2})?)\b",
            "",
            instruction,
            flags=re.IGNORECASE,
        ).strip()
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        return {
            "query": cleaned if cleaned else instruction,
            "max_budget": budget,
        }

    @classmethod
    def generate_auditor_explanation(
        cls,
        decision: str,
        risk_score: int,
        reasons: list[str],
        policy_violations: list[str],
        product_name: str,
        merchant: str,
        amount: str,
    ) -> str:
        """
        Generates human-readable auditor commentary.
        Uses LLM if available; otherwise produces clear deterministic security analysis.
        NOTE: LLM explanation CANNOT override the deterministic decision!
        """
        if settings.is_gemini_configured:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
You are the Independent Financial Auditor for AgentGuard.
Explain this security decision clearly and concisely in 2 sentences:
- Decision: {decision}
- Risk Score: {risk_score}/100
- Product: {product_name}
- Merchant: {merchant}
- Amount: ${amount}
- Policy Violations: {policy_violations}
- Risk Reasons: {reasons}

Note: You CANNOT change the decision. Summarize the audit findings professionally.
"""
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini audit explanation failed, using deterministic: {e}")

        # Deterministic Auditor Commentary
        if decision == "APPROVE":
            return (
                f"Auditor cleared purchase of {product_name} from {merchant} for ${amount}. "
                f"Low risk score ({risk_score}/100); all security policies and budget limits satisfied."
            )
        elif decision == "REVIEW":
            primary_reason = reasons[0] if reasons else "Elevated risk score"
            return (
                f"Auditor flagged purchase of {product_name} from {merchant} for ${amount} (Risk: {risk_score}/100). "
                f"Human approval required due to: {primary_reason}."
            )
        else:
            violation_summary = "; ".join(policy_violations if policy_violations else reasons)
            return (
                f"Auditor BLOCKED purchase of {product_name} for ${amount}. "
                f"Strict policy violation detected: {violation_summary}. No payment will be executed."
            )
