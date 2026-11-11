#!/usr/bin/env python3
"""
AgentGuard demo: a simulated AI shopping agent ("Agent A") tries to buy things.
It has NO PayPal credentials - every purchase must pass through AgentGuard.

Usage:
    uvicorn backend.main:app --port 8000        # terminal 1
    python demo_agent.py                         # terminal 2
    python demo_agent.py --url https://your-app.onrender.com --auto-approve

Only the Python standard library is needed.
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request
import uuid

G, Y, R, B, X = "\033[92m", "\033[93m", "\033[91m", "\033[1m", "\033[0m"
COLOR = {"APPROVE": G, "REVIEW": Y, "BLOCK": R}


def call(base, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        base + path, data=data, method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def attempt(base, agent, title, product, merchant, amount, ref=None, key=None):
    print(f"\n{B}▶ {title}{X}")
    print(f"  Agent wants: {product} from {merchant} for ${amount:.2f}")
    code, res = call(base, "POST", "/payments/request", {
        "agent_id": agent, "product_name": product, "merchant": merchant,
        "amount": amount, "currency": "USD", "product_reference": ref,
        "idempotency_key": key or f"demo-{uuid.uuid4().hex[:12]}",
    })
    if code >= 400:
        print(f"  {R}Request rejected by API ({code}): {res}{X}")
        return None
    d = res.get("decision", "?")
    print(f"  {COLOR.get(d, '')}{B}{d}{X}  risk={res.get('risk_score')}  status={res.get('payment_status')}")
    for reason in res.get("risk_reasons", []):
        print(f"    - {reason}")
    if res.get("paypal_order_id"):
        print(f"  PayPal order: {res['paypal_order_id']}")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8000")
    ap.add_argument("--agent", default="shopping_agent")
    ap.add_argument("--auto-approve", action="store_true",
                    help="approve held payments automatically instead of asking")
    a = ap.parse_args()
    base = a.url.rstrip("/")

    code, h = call(base, "GET", "/health")
    if code != 200:
        sys.exit(f"{R}Cannot reach AgentGuard at {base}. Start the backend first.{X}")
    print(f"{B}AgentGuard online{X} ({h.get('environment')}). Agent '{a.agent}' has no PayPal credentials.")

    # 1. Safe purchase -> APPROVE
    attempt(base, a.agent, "1. Safe, small purchase from a trusted store",
            "Wireless Keyboard", "TrustedStore", 20.00, "prod_kb_001")

    # 2. New merchant + above auto limit -> REVIEW
    held = attempt(base, a.agent, "2. Unknown merchant, higher amount",
                   "Wireless Headphones", "NewStore", 80.00, "prod_hp_002")

    # 3. Price tampering -> BLOCK
    attempt(base, a.agent, "3. Prompt-injected price: laptop claimed at $900 (real price $500)",
            "Laptop", "TechStore", 900.00, "prod_lp_003")

    # 4. Restricted merchant -> BLOCK
    attempt(base, a.agent, "4. Restricted merchant", "Gift Cards", "ShadyMarket", 30.00)

    # 5. Replay attack -> BLOCK
    key = f"demo-replay-{uuid.uuid4().hex[:8]}"
    attempt(base, a.agent, "5a. Normal purchase", "Wireless Mouse", "TrustedStore", 25.00, "prod_ms_004", key)
    attempt(base, a.agent, "5b. Same request replayed (duplicate idempotency key)",
            "Wireless Mouse", "TrustedStore", 25.00, "prod_ms_004", key)

    # Human-in-the-loop for the held payment
    if held and held.get("payment_status") == "REQUIRES_APPROVAL":
        print(f"\n{B}Human review needed{X}: ${float(held['amount']):.2f} at {held['merchant']} "
              f"(id {held['id']}) is waiting in /payments/pending")
        ans = "y" if a.auto_approve else input("Approve this payment? [y/N] ").strip().lower()
        action = "approve" if ans == "y" else "reject"
        code, res = call(base, "POST", f"/payments/{held['id']}/{action}",
                         {"reviewer_notes": "Reviewed in demo"})
        print(f"  {action.upper()} -> HTTP {code}: {res.get('message', res)}")
        if res.get("paypal_approval_url"):
            print(f"  PayPal buyer approval URL: {res['paypal_approval_url']}")

    time.sleep(0.3)
    code, logs = call(base, "GET", "/agent/logs?limit=8")
    if code == 200:
        print(f"\n{B}Latest audit log{X}")
        for l in logs:
            print(f"  [{l.get('level')}] {l.get('message')}")
    print(f"\nOpen {base}/ to see everything in the dashboard.")


if __name__ == "__main__":
    main()
