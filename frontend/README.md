# AgentGuard – PayPal AI Financial Firewall
**Autonomous Agent Spending Controls & Financial Security Platform**

> *"Secure Every Agent. Trust Every Payment."*

AgentGuard provides a real-time, zero-trust cryptographic governance gateway that sits directly between autonomous AI agent execution runtimes and PayPal checkout/disbursement rails.

---

## 🚀 Quick Start (Zero Setup Required)

### Option 1: Instant Single-File Launch (Recommended)
Double-click **`paypal-agentguard-standalone.html`** in any web browser (Chrome, Edge, Safari, Firefox).
- Works completely offline without installing Node.js or any external dependencies.
- Perfect for quick previews, mobile browsers, or sharing over chat.

### Option 2: Full-Stack Node.js Server
```bash
npm start
# or
node server.js
```
Open **`http://localhost:3000`** in your browser.

---

## 🌟 Core Financial Protection Features

1. **Autonomous Fleet Control**: Set per-transaction caps, daily ceilings, and monthly spending allowances for connected AI assistants (Claude, GPT, Gemini).
2. **Human-in-the-Loop (HITL) Approvals**: Automatically routes high-value or unusual agent disbursements into a secure review queue for authorization.
3. **Real-Time Financial Firewall**: Blocks unrecognized transfer destinations, unauthorized wallet addresses, and adversarial prompt injections.
4. **Multi-Currency Engine**: Live currency conversions with global reference benchmarks (including INR, EUR, GBP, JPY, CAD, and 40+ currencies).
5. **Departmental Quotas & Expense Ledger**: Detailed spend tracking across Engineering, Infrastructure, Marketing, and Operations with CSV statement export.

---

## 📂 Architecture & Directory Structure

```
paypal-agentguard/
├── paypal-agentguard-standalone.html  # Portable, self-contained single-file application
├── index.html                         # Modular HTML application shell
├── server.js                          # Local static server & REST API service
├── app.js                             # Client-side router and state orchestrator
├── package.json                       # Project configuration
├── README.md                          # Platform documentation
│
├── components/                        # UI components (e.g. PhoneInput)
├── data/                              # State store, currency rates & financial ledger
├── services/                          # API clients & network adapters
├── utils/                             # SVG iconography and PayPal brand assets
├── views/                             # View controllers (Dashboard, Transactions, Approvals, Spends, etc.)
└── backend/                           # Optional Python FastAPI service
```

---

## 🛡️ Enterprise Financial Safeguards

- **Zero Exposed Credentials:** No production credentials or client secrets stored in source code.
- **PayPal Protected:** Integrated with PayPal authorization standards and simulated verification.
- **Dual Light/Dark Theme:** Professional UI optimized for financial monitoring across all lighting conditions.
