// Views: Extra Navigation Pages (Transactions, Logs, Permissions, Split Bills, Currency, etc.)
(function(window) {
  'use strict';

  // 1. Transaction History View
  function renderTransactions(state) {
    return `
      <div class="max-w-[1400px] mx-auto space-y-6 pb-16 animate-fade-in">
        <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
          <div>
            <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Full Transaction Audit Ledger</h1>
            <p class="text-xs text-text-muted mt-0.5">Cryptographically signed ledger of all 1,742 machine and human transactions across PayPal rails.</p>
          </div>
          <button onclick="window.AgentGuardApp.exportIncidentReport()" class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-bg border border-surface-border text-xs font-semibold text-text-main hover:bg-slate-200 transition-colors">
            <span class="material-symbols-outlined text-[17px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-surface-border shadow-sm overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-bg border-b border-surface-border text-[10px] font-bold text-text-muted uppercase">
                <th class="py-3 px-4">TXN HASH</th>
                <th class="py-3 px-4">MERCHANT</th>
                <th class="py-3 px-4">INITIATOR</th>
                <th class="py-3 px-4">CATEGORY</th>
                <th class="py-3 px-4">METHOD</th>
                <th class="py-3 px-4 text-right">AMOUNT</th>
                <th class="py-3 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-border text-xs">
              ${state.ledger.map(row => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-4 font-mono text-secondary font-semibold text-[11px]">${row.id}</td>
                  <td class="py-3 px-4 font-bold text-primary-dark">${row.merchant}</td>
                  <td class="py-3 px-4 text-text-main">${row.initiator}</td>
                  <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-secondary border border-secondary/20">${row.category}</span></td>
                  <td class="py-3 px-4 font-mono text-[11px]">${row.method}</td>
                  <td class="py-3 px-4 text-right font-bold font-mono">$${Math.abs(row.amount).toFixed(2)}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-approved-bg text-status-approved border border-status-approved/30">
                      ${row.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 2. Agent Activity Logs View
  function renderLogs(state) {
    return `
      <div class="max-w-[1400px] mx-auto space-y-6 pb-16 animate-fade-in">
        <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
          <div>
            <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Agent Activity & Machine Enclave Logs</h1>
            <p class="text-xs text-text-muted mt-0.5">Streaming telemetry of raw prompt payloads, JSON API requests, and HMAC validation results.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-status-approved animate-ping"></span>
            <span class="text-xs font-mono text-text-muted">Live Stream: 24 msgs/sec</span>
          </div>
        </div>

        <div class="bg-slate-950 text-emerald-400 p-6 rounded-2xl font-mono text-xs shadow-xl border border-slate-800 space-y-3 overflow-x-auto max-h-[600px] overflow-y-auto">
          <div class="text-slate-500">// --- PayPal AgentGuard Kernel v4.8.2 Log Stream Initialized ---</div>
          <div>[10:45:12.102] <span class="text-blue-400">INFO</span> [AGT-5120-DVP] Dispatched checkout intent to Amazon Web Services ($8,940.20) -> HMAC Validated -> <span class="text-emerald-400">STATUS 200 OK</span></div>
          <div>[10:42:08.411] <span class="text-amber-400">WARN</span> [AGT-8412-TRV] Transaction TXN-9024-DAL exceeds threshold limit ($2,150.00 > $1,500.00) -> Held in Review Queue</div>
          <div>[10:38:55.992] <span class="text-red-400">ALERT</span> [AGT-3390-SLS] Semantic prompt injection detected in reasoning payload -> Hard kill triggered -> AGT-3390-SLS Quarantined</div>
          <div>[10:35:10.120] <span class="text-blue-400">INFO</span> [AGT-8711-DDG] Datadog recurring contract verified -> $890.00 auto-disbursed via PayPal Primary Vault</div>
          <div>[10:30:02.001] <span class="text-slate-400">HEARTBEAT</span> Enclave FIDO2 root key verified. Zero memory leaks across 6 active worker threads.</div>
          <div>[10:28:44.890] <span class="text-blue-400">INFO</span> [AGT-1044-PROC] Vercel Enterprise renewal intent received ($2,400.00) -> First-time domain hold activated</div>
          <div class="text-slate-600 animate-pulse">// Waiting for incoming machine payment webhooks...</div>
        </div>
      </div>
    `;
  }

  // 3. Permissions & Limits View
  function renderPermissions(state) {
    return `
      <div class="max-w-[1400px] mx-auto space-y-6 pb-16 animate-fade-in">
        <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
          <div>
            <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Permissions, Guardrails & Spending Limits</h1>
            <p class="text-xs text-text-muted mt-0.5">Enforce cryptographic upper bounds, whitelist trusted merchant domains, and configure prompt safety thresholds.</p>
          </div>
          <button onclick="window.AgentGuardApp.openRulesModal()" class="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary-container transition-all">
            + Add New Policy Rule
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
            <h2 class="text-base font-bold text-primary-dark">Global Guardrail Enforcements</h2>
            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between p-3 rounded-xl bg-surface-bg border border-surface-border">
                <div>
                  <div class="font-bold text-primary-dark">Single-Transaction Maximum Ceiling</div>
                  <div class="text-text-muted text-[11px]">Any intent above this value strictly requires human 2FA sign-off.</div>
                </div>
                <span class="font-bold font-mono text-sm text-primary">$5,000.00</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-surface-bg border border-surface-border">
                <div>
                  <div class="font-bold text-primary-dark">NLP Prompt Injection Heuristics</div>
                  <div class="text-text-muted text-[11px]">Strict jailbreak and instruction-override detection on LLM inputs.</div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-approved-bg text-status-approved">100% Strict</span>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-surface-bg border border-surface-border">
                <div>
                  <div class="font-bold text-primary-dark">Cross-Border FX Spread Threshold</div>
                  <div class="text-text-muted text-[11px]">Flag currency trades diverging beyond ECB spot rate.</div>
                </div>
                <span class="font-bold font-mono text-sm text-primary">±0.25%</span>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
            <h2 class="text-base font-bold text-primary-dark">Active Merchant Domain Whitelists</h2>
            <p class="text-xs text-text-muted">Autonomous agents can only disburse funds directly to verified merchant identities on file.</p>
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">aws.amazon.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">datadoghq.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">github.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">delta.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">united.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">hetzner.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">openai.com</span>
              <span class="px-3 py-1 rounded-lg bg-surface-bg border border-surface-border text-xs font-mono font-medium">vercel.com</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Split Bills View
  function renderSplitBills() {
    return `
      <div class="max-w-[1000px] mx-auto space-y-6 pb-16 animate-fade-in">
        <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
          <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Split Bills — AI Multi-Party Settlement</h1>
          <p class="text-xs text-text-muted mt-0.5">Autonomous bill parsing and multi-agent corporate expense division powered by PayPal.</p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-text-muted mb-1">Total Bill Amount ($)</label>
              <input id="split-total" class="w-full h-10 px-3 rounded-lg border border-surface-border text-xs font-mono text-primary-dark font-bold" value="840.00" type="number"/>
            </div>
            <div>
              <label class="block text-xs font-bold text-text-muted mb-1">Participants / Agents</label>
              <input id="split-count" class="w-full h-10 px-3 rounded-lg border border-surface-border text-xs font-mono text-primary-dark font-bold" value="4" type="number"/>
            </div>
            <div>
              <label class="block text-xs font-bold text-text-muted mb-1">Tip / Service %</label>
              <input id="split-tip" class="w-full h-10 px-3 rounded-lg border border-surface-border text-xs font-mono text-primary-dark font-bold" value="15" type="number"/>
            </div>
          </div>

          <div class="pt-4 border-t border-surface-border flex items-center justify-between">
            <span class="text-xs text-text-muted">Calculated Per Participant:</span>
            <span id="split-result" class="text-2xl font-black text-secondary font-mono">$241.50</span>
          </div>

          <button onclick="window.AgentGuardApp.showToast('PayPal payment split request dispatched to 4 participants', 'success')" class="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all">
            Send Multi-Agent PayPal Invoices
          </button>
        </div>
      </div>
    `;
  }

  // 5. Currency Converter View
  function renderCurrencyConverter() {
    return `
      <div class="max-w-[1000px] mx-auto space-y-6 pb-16 animate-fade-in">
        <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
          <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Institutional FX Currency Converter</h1>
          <p class="text-xs text-text-muted mt-0.5">Real-time European Central Bank (ECB) spot corridor conversion for autonomous cross-border cloud spend.</p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 bg-surface-bg rounded-xl border border-surface-border space-y-2">
              <span class="text-xs font-bold text-text-muted">You Send</span>
              <div class="flex items-center gap-2">
                <input class="w-full h-10 bg-white px-3 rounded-lg border border-surface-border text-sm font-mono font-bold" value="280.00" type="number"/>
                <span class="px-3 py-2 bg-white rounded-lg border border-surface-border font-bold text-xs">EUR</span>
              </div>
            </div>

            <div class="p-4 bg-surface-bg rounded-xl border border-surface-border space-y-2">
              <span class="text-xs font-bold text-text-muted">Recipient Gets (USD)</span>
              <div class="flex items-center gap-2">
                <input class="w-full h-10 bg-white px-3 rounded-lg border border-surface-border text-sm font-mono font-bold text-secondary" value="300.00" readonly type="number"/>
                <span class="px-3 py-2 bg-white rounded-lg border border-surface-border font-bold text-xs">USD</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-status-approved-bg border border-status-approved/20 text-xs text-status-approved flex items-center justify-between">
            <span>Guaranteed Exchange Rate: 1 EUR = 1.0714 USD</span>
            <span class="font-bold">0.12% Spread (Safe Corridor)</span>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Profile / Settings / Tools
  function renderGeneric(title, desc) {
    return `
      <div class="max-w-[1000px] mx-auto space-y-6 pb-16 animate-fade-in">
        <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-2">
          <h1 class="text-2xl font-bold text-primary-dark tracking-tight">${title}</h1>
          <p class="text-xs text-text-muted">${desc}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-surface-border shadow-sm text-xs text-text-muted space-y-3">
          <p>This module is authenticated under enterprise session credentials for <strong>Elena Vance</strong> (Fintech Security Lead).</p>
          <div class="p-3 bg-surface-bg rounded-xl border border-surface-border font-mono text-[11px]">
            <div>Operator Role: Primary Cryptographic Custodian</div>
            <div>Auth Digest: FIDO2-HMAC-SHA256-US-EAST</div>
            <div>Status: Nominal Active Enclave</div>
          </div>
        </div>
      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['transactions'] = renderTransactions;
  window.AgentGuardViews['agent-logs'] = renderLogs;
  window.AgentGuardViews['agent-permissions'] = renderPermissions;
  window.AgentGuardViews['split-bills'] = renderSplitBills;
  window.AgentGuardViews['currency-converter'] = renderCurrencyConverter;
  window.AgentGuardViews['qr-scanner'] = () => renderGeneric('QR Scanner & Point-of-Sale Guard', 'Inspect and authorize camera and QR code machine payments.');
  window.AgentGuardViews['offers'] = () => renderGeneric('Enterprise Offers & Vendor Volume Rebates', 'Corporate discounts pre-negotiated for autonomous cloud fleet spending.');
  window.AgentGuardViews['profile'] = () => renderGeneric('Operator Security Profile', 'Elena Vance — Senior Fintech Security Architect & Cryptographic Enclave Administrator.');
  window.AgentGuardViews['settings'] = () => renderGeneric('AgentGuard Core Settings', 'Configure alert webhooks, Slack emergency paging, and PayPal API OAuth endpoints.');
  window.AgentGuardViews['support'] = () => renderGeneric('Documentation & Incident Support Desk', 'Comprehensive guide to AgentGuard zero-trust protocols and developer reference.');
})(window);
