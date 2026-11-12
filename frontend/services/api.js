// AgentGuard - API Client & Backend Integration Layer
// Implements the Python FastAPI / REST endpoints specified in Section 15
(function(window) {
  'use strict';

  const API_BASE_URL = window.AGENTGUARD_API_URL || 
    ((typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http'))
      ? (window.location.origin)
      : 'http://127.0.0.1:8000');

  class ApiService {
    constructor() {
      this.baseUrl = API_BASE_URL;
      this.isBackendAvailable = false;
      this.checkBackendHealth();
    }

    async checkBackendHealth() {
      try {
        const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          this.isBackendAvailable = true;
          console.log('[AgentGuard API] Connected to live backend at', this.baseUrl);
        }
      } catch (e) {
        this.isBackendAvailable = false;
        console.info('[AgentGuard API] Backend offline/local sandbox; operating with local reactive mock service.');
      }
    }

    // 1. GET /agents
    async getAgents() {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/agents`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('[AgentGuard API] GET /agents failed, falling back to store:', e);
        }
      }
      return window.AgentGuardStore.state.agents;
    }

    // 2. POST /agents
    async createAgent(agentData) {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agentData)
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('[AgentGuard API] POST /agents failed, falling back to store:', e);
        }
      }
      return window.AgentGuardStore.createAgent(agentData);
    }

    // 3. GET /transactions
    async getTransactions() {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/transactions`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('[AgentGuard API] GET /transactions failed, falling back to store:', e);
        }
      }
      return window.AgentGuardStore.state.ledger;
    }

    // 4. POST /payment/request
    async submitPaymentRequest(paymentPayload) {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/payment/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentPayload)
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('[AgentGuard API] POST /payment/request failed, falling back to store:', e);
        }
      }
      return window.AgentGuardStore.processPaymentRequest(paymentPayload);
    }

    // 5. GET /approvals
    async getApprovals() {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/approvals`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('[AgentGuard API] GET /approvals failed, falling back to store:', e);
        }
      }
      return window.AgentGuardStore.state.pendingApprovals;
    }

    // 6. POST /approvals/{id}
    async submitApprovalDecision(txnId, decision, notes = '') {
      // Decision must never directly disburse PayPal funds on frontend; it submits to backend policy validator
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/approvals/${encodeURIComponent(txnId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision, notes, signedBy: 'Elena Vance (Cryptographic FIDO2)' })
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn(`[AgentGuard API] POST /approvals/${txnId} failed, falling back to store:`, e);
        }
      }

      if (decision === 'approve') {
        return window.AgentGuardStore.approvePayment(txnId);
      } else if (decision === 'approve_whitelist') {
        return window.AgentGuardStore.approveAndWhitelist(txnId);
      } else {
        return window.AgentGuardStore.rejectPayment(txnId, notes);
      }
    }

    // 7. GET /agent/logs
    async getAgentLogs() {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/agent/logs`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('[AgentGuard API] GET /agent/logs failed, falling back to store:', e);
        }
      }
      return window.AgentGuardStore.state.incidents;
    }

    // 8. POST /agents/{id}/pause
    async pauseAgent(agentId, pausedState = true) {
      if (this.isBackendAvailable) {
        try {
          const res = await fetch(`${this.baseUrl}/agents/${encodeURIComponent(agentId)}/pause`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paused: pausedState })
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn(`[AgentGuard API] POST /agents/${agentId}/pause failed, falling back to store:`, e);
        }
      }
      return window.AgentGuardStore.toggleAgentStatus(agentId, pausedState);
    }
  }

  window.AgentGuardApi = new ApiService();
})(window);
