// View 5: Security Center (Clean Light Theme, Understandable Information)
(function(window) {
  'use strict';

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;

    return `
      <div class="max-w-[1200px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-status-approved animate-pulse"></span>
              <span class="text-xs font-bold text-status-approved uppercase tracking-wider">Firewall Status: Normal & Protected</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">Security Center</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
              AgentGuard monitors every automated payment in real time, automatically preventing scams, unauthorized transfers, and price errors.
            </p>
          </div>

          <!-- Emergency Action -->
          <button 
            onclick="window.AgentGuardStore.pauseAllAgents(); window.AgentGuardApp.showToast('Emergency hold activated. All agents paused.', 'warning');"
            class="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-status-blocked text-status-blocked hover:text-white border border-status-blocked/30 text-xs font-bold transition-all flex items-center gap-2">
            ${getIcon('power', 'w-4 h-4')}
            <span>Pause All AI Agents</span>
          </button>
        </div>

        <!-- 4 Simple Security Status Cards (Light Theme, Clean Palette) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-1.5">
            <span class="text-xs text-text-muted dark:text-slate-400 font-semibold">Funds Protected</span>
            <div class="text-2xl font-extrabold text-status-approved font-mono">
              $${state.financials.savedVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p class="text-[11px] text-text-muted dark:text-slate-400">Total money saved from blocked suspicious requests</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-1.5">
            <span class="text-xs text-text-muted dark:text-slate-400 font-semibold">Blocked Requests</span>
            <div class="text-2xl font-extrabold text-status-blocked font-mono">
              ${state.blockedPayments.length} Stopped
            </div>
            <p class="text-[11px] text-text-muted dark:text-slate-400">Zero unauthorized payments permitted</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-1.5">
            <span class="text-xs text-text-muted dark:text-slate-400 font-semibold">Active Guardrails</span>
            <div class="text-2xl font-extrabold text-primary font-mono">
              100% On
            </div>
            <p class="text-[11px] text-text-muted dark:text-slate-400">Daily spending caps and recipient allowlists enforced</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-1.5">
            <span class="text-xs text-text-muted dark:text-slate-400 font-semibold">Inspection Speed</span>
            <div class="text-2xl font-extrabold text-primary-dark dark:text-white font-mono">
              18 ms
            </div>
            <p class="text-[11px] text-text-muted dark:text-slate-400">Instant evaluation before any money leaves your account</p>
          </div>

        </div>

        <!-- 2 Column Layout: Suspicious Activity Log & How We Protect You -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left 2 Columns: Suspicious Activity & Blocked Payments List (Clean Light Design) -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-primary-dark dark:text-white">Suspicious Activity Log</h3>
                <p class="text-xs text-text-muted dark:text-slate-400">Recent attempts that were caught and prevented by your financial firewall</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-status-approved-bg text-status-approved">
                All Threats Neutralized
              </span>
            </div>

            <div class="space-y-3">
              ${state.blockedPayments.map(item => `
                <div class="p-4 rounded-xl bg-surface-bg dark:bg-slate-800/60 border border-surface-border dark:border-slate-700 space-y-2 text-xs">
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-red-100 text-status-blocked flex items-center justify-center shrink-0">
                        ${getIcon('shield-x', 'w-4 h-4')}
                      </div>
                      <strong class="text-primary-dark dark:text-white text-xs">${item.recipient}</strong>
                    </div>
                    <span class="font-mono font-bold text-status-blocked text-xs">Blocked: $${item.amount.toFixed(2)} USD</span>
                  </div>

                  <p class="text-text-main dark:text-slate-300 leading-relaxed font-normal">
                    ${item.reason}
                  </p>

                  <div class="flex items-center justify-between text-[11px] text-text-muted dark:text-slate-400 pt-1 border-t border-surface-border dark:border-slate-700">
                    <span>Target Agent: <strong>${item.agentName}</strong></span>
                    <span>${item.date}</span>
                  </div>

                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right Column: Protection Overview & Merchant Safety Status -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
            
            <div class="space-y-4">
              <div>
                <h3 class="text-base font-bold text-primary-dark dark:text-white">How AgentGuard Protects You</h3>
                <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">Simple safeguards always active in the background</p>
              </div>

              <div class="space-y-3 text-xs">
                
                <div class="flex items-start gap-3 p-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                  <div class="text-status-approved shrink-0 mt-0.5">
                    ${getIcon('check-circle', 'w-4 h-4')}
                  </div>
                  <div>
                    <strong class="text-primary-dark dark:text-white block">Recipient Verification</strong>
                    <span class="text-text-muted dark:text-slate-400">Agents can only pay verified merchant names that you have approved.</span>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                  <div class="text-status-approved shrink-0 mt-0.5">
                    ${getIcon('check-circle', 'w-4 h-4')}
                  </div>
                  <div>
                    <strong class="text-primary-dark dark:text-white block">Hard Spending Ceilings</strong>
                    <span class="text-text-muted dark:text-slate-400">If an invoice exceeds an agent's limit, it pauses immediately for your confirmation.</span>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                  <div class="text-status-approved shrink-0 mt-0.5">
                    ${getIcon('check-circle', 'w-4 h-4')}
                  </div>
                  <div>
                    <strong class="text-primary-dark dark:text-white block">Price Spike Protection</strong>
                    <span class="text-text-muted dark:text-slate-400">Sudden price increases over normal contract rates are caught and held for review.</span>
                  </div>
                </div>

              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-xs text-primary border border-primary/20 space-y-1">
              <strong class="block">Need to adjust security rules?</strong>
              <p class="text-[11px] text-text-muted dark:text-slate-400">You can customize individual agent limits in Agent Control.</p>
              <button onclick="window.AgentGuardStore.setTab('agent-control')" class="text-xs font-bold text-primary hover:underline block pt-1">
                Go to Agent Control →
              </button>
            </div>

          </div>

        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['security-monitoring'] = render;
})(window);
