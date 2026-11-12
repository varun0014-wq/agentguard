// View 1: Main Dashboard (Simple, Balanced, Accessible Fintech Interface)
(function(window) {
  'use strict';

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    
    // Dynamic greeting based on actual time of day
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const userName = (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Elena';

    const pendingCount = state.pendingApprovals.length;
    const pendingTotal = state.pendingApprovals.reduce((acc, curr) => acc + curr.amount, 0);

    const monthlySpent = state.financials.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const monthlyLimit = state.financials.monthlyCap.toLocaleString('en-US');
    const remainingBudget = (state.financials.monthlyCap - state.financials.monthlySpend).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const spendPct = Math.min(100, Math.round((state.financials.monthlySpend / state.financials.monthlyCap) * 100));

    return `
      <div class="max-w-[1240px] mx-auto space-y-6 pb-12 animate-fade-in">

        <!-- 1. Friendly Greeting Section & Clean Welcome Banner -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-surface-border dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-primary uppercase tracking-wider">Financial Overview</span>
              <span class="text-xs text-text-muted dark:text-slate-500">•</span>
              <span class="text-xs font-mono text-status-approved font-semibold flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-status-approved animate-pulse"></span>
                Active Protection
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white tracking-tight">
              ${timeGreeting}, ${userName}
            </h1>
            <p class="text-xs sm:text-sm text-text-muted dark:text-slate-400 max-w-xl">
              All 6 AI agents are operating within your spending limits. You have <strong>${pendingCount} payments</strong> waiting for review today.
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button 
              onclick="window.AgentGuardStore.setTab('payment-approvals')"
              class="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2">
              ${getIcon('clock', 'w-4 h-4')}
              <span>Review Approvals (${pendingCount})</span>
            </button>
            <button 
              onclick="window.AgentGuardStore.setTab('monthly-spending')"
              class="px-4 py-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-text-main dark:text-slate-200 border border-surface-border dark:border-slate-700 transition-colors flex items-center gap-2">
              ${getIcon('pie-chart', 'w-4 h-4 text-primary')}
              <span>Monthly Spending</span>
            </button>
            <button 
              onclick="window.AgentGuardStore.setTab('agent-control')"
              class="px-4 py-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-text-main dark:text-slate-200 border border-surface-border dark:border-slate-700 transition-colors flex items-center gap-2">
              ${getIcon('bot', 'w-4 h-4 text-primary')}
              <span>Manage Agents</span>
            </button>
          </div>
        </div>

        <!-- 2. Core Overview Cards (Balanced Grid with Clear WHITE Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <!-- Card 1: Total Balance -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between text-text-muted dark:text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Total Balance</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center">
                ${getIcon('credit-card', 'w-4 h-4')}
              </div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white font-mono tracking-tight">
                $${state.financials.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p class="text-xs text-text-muted dark:text-slate-400 mt-1">Available in PayPal business account</p>
            </div>
            <div class="pt-2 border-t border-surface-border dark:border-slate-800 text-[11px] text-status-approved font-semibold flex items-center gap-1">
              <span>✓ Verified & ready for payments</span>
            </div>
          </div>

          <!-- Card 2: Monthly Spending -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between text-text-muted dark:text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Monthly Spending</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center">
                ${getIcon('trending-up', 'w-4 h-4')}
              </div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white font-mono tracking-tight">
                $${monthlySpent}
              </div>
              <div class="space-y-1.5 mt-2">
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-primary h-2 rounded-full transition-all duration-500" style="width: ${spendPct}%;"></div>
                </div>
                <div class="flex justify-between text-[11px] text-text-muted dark:text-slate-400">
                  <span>${spendPct}% of $${monthlyLimit} limit</span>
                  <span class="text-status-approved font-bold font-mono">$${remainingBudget} left</span>
                </div>
              </div>
            </div>
            <div class="pt-2 border-t border-surface-border dark:border-slate-800 text-[11px] text-text-muted dark:text-slate-400 flex items-center justify-between">
              <span>Status: <strong class="text-status-approved">Within Budget</strong></span>
              <button onclick="window.AgentGuardStore.setTab('monthly-spending')" class="text-primary hover:underline font-bold text-xs">Details →</button>
            </div>
          </div>

          <!-- Card 3: Pending Payments (EXPLICIT WHITE BACKGROUND AS REQUESTED) -->
          <div 
            onclick="window.AgentGuardStore.setTab('payment-approvals')"
            class="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-primary/20 dark:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between text-text-muted dark:text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider text-primary">Pending Payments</span>
              <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-accent-orange flex items-center justify-center">
                ${getIcon('clock', 'w-4 h-4')}
              </div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-accent-orange font-mono tracking-tight">
                ${pendingCount} ${pendingCount === 1 ? 'Payment' : 'Payments'}
              </div>
              <p class="text-xs text-text-muted dark:text-slate-400 mt-1">
                Totaling <strong>$${pendingTotal.toFixed(2)} USD</strong> waiting for your confirmation
              </p>
            </div>
            <div class="pt-2 border-t border-surface-border dark:border-slate-800 flex items-center justify-between text-xs">
              <span class="text-accent-orange font-bold">Needs Review</span>
              <span class="text-primary font-bold hover:underline flex items-center gap-1">
                Open Inbox →
              </span>
            </div>
          </div>

          <!-- Card 4: Connected AI Agents -->
          <div 
            onclick="window.AgentGuardStore.setTab('agent-control')"
            class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs hover:border-primary transition-all cursor-pointer flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between text-text-muted dark:text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Connected AI Agents</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center">
                ${getIcon('bot', 'w-4 h-4')}
              </div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white font-mono tracking-tight">
                6 Agents
              </div>
              <p class="text-xs text-text-muted dark:text-slate-400 mt-1">5 Active, 1 Paused</p>
            </div>
            <div class="pt-2 border-t border-surface-border dark:border-slate-800 text-[11px] text-text-muted dark:text-slate-400 flex items-center justify-between">
              <span>Guardrails: <strong class="text-status-approved">Enforced</strong></span>
              <span class="text-primary font-bold hover:underline">View Fleet →</span>
            </div>
          </div>

        </div>

        <!-- 3. Two-Column Midsection: Pending Approvals Queue & Quick Financial Summary -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- Left Column (8 cols): Pending Payments Requiring Confirmation -->
          <div class="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-surface-border dark:border-slate-800 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-surface-border dark:border-slate-800">
              <div>
                <h2 class="text-base font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <span>Payments Awaiting Your Approval</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-mono">${pendingCount} Pending</span>
                </h2>
                <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
                  Transactions held because they exceed regular agent caps or are sent to new merchants.
                </p>
              </div>
              <button 
                onclick="window.AgentGuardStore.setTab('payment-approvals')"
                class="text-xs text-primary font-bold hover:underline shrink-0">
                View All Approvals →
              </button>
            </div>

            <!-- Pending Cards List -->
            <div class="space-y-3.5">
              ${state.pendingApprovals.map(item => `
                <div class="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-surface-border dark:border-slate-700 hover:border-primary/50 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-accent-orange flex items-center justify-center shrink-0 mt-0.5">
                      ${getIcon('clock', 'w-5 h-5')}
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <strong class="text-sm text-primary-dark dark:text-white font-bold">${item.recipient}</strong>
                        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-text-muted dark:text-slate-300 border border-surface-border dark:border-slate-600">${item.id}</span>
                      </div>
                      <p class="text-xs text-text-muted dark:text-slate-300 leading-snug">
                        ${item.reason}
                      </p>
                      <div class="text-[11px] text-text-muted dark:text-slate-400">
                        Initiator: <span class="font-semibold text-primary-dark dark:text-slate-200">${item.agentName}</span> • ${item.date}
                      </div>
                    </div>
                  </div>

                  <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border dark:border-slate-700">
                    <div class="text-lg font-bold font-mono text-primary-dark dark:text-white">
                      $${item.amount.toFixed(2)} <span class="text-xs font-normal text-text-muted dark:text-slate-400">${item.currency}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button 
                        type="button"
                        onclick="window.AgentGuardViews.confirmApprovePayment('${item.id}')"
                        class="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-all shadow-xs">
                        Approve
                      </button>
                      <button 
                        type="button"
                        onclick="window.AgentGuardViews.confirmRejectPayment('${item.id}')"
                        class="px-3 py-1.5 rounded-xl bg-surface-bg dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-status-blocked dark:hover:text-red-400 text-xs font-semibold text-text-muted dark:text-slate-300 transition-colors border border-surface-border dark:border-slate-600">
                        Decline
                      </button>
                    </div>
                  </div>

                </div>
              `).join('')}

              ${state.pendingApprovals.length === 0 ? `
                <div class="p-8 text-center rounded-2xl bg-surface-bg dark:bg-slate-800/40 text-xs text-text-muted">
                  ✓ All payment requests are reviewed and settled.
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Right Column (4 cols): Quick Financial Safety Guardrails & AI Assistant Prompt -->
          <div class="lg:col-span-4 space-y-6">

            <!-- Security Firewall Status Box -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-surface-border dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-surface-border dark:border-slate-800">
                <h3 class="text-sm font-bold text-primary-dark dark:text-white flex items-center gap-1.5">
                  ${getIcon('shield-check', 'w-4 h-4 text-status-approved')}
                  <span>Firewall Protection</span>
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-approved-bg text-status-approved">
                  100% Active
                </span>
              </div>

              <div class="space-y-2.5 text-xs">
                <div class="flex justify-between items-center p-2.5 rounded-xl bg-surface-bg dark:bg-slate-800">
                  <span class="text-text-muted dark:text-slate-400">Auto-Approved Today:</span>
                  <strong class="text-status-approved font-mono">14 Transactions</strong>
                </div>
                <div class="flex justify-between items-center p-2.5 rounded-xl bg-surface-bg dark:bg-slate-800">
                  <span class="text-text-muted dark:text-slate-400">Suspicious Stopped:</span>
                  <strong class="text-status-blocked font-mono">2 Blocked</strong>
                </div>
                <div class="flex justify-between items-center p-2.5 rounded-xl bg-surface-bg dark:bg-slate-800">
                  <span class="text-text-muted dark:text-slate-400">Funds Protected:</span>
                  <strong class="text-primary font-mono font-bold">$18,620.00 USD</strong>
                </div>
              </div>

              <button 
                onclick="window.AgentGuardStore.setTab('security-monitoring')" 
                class="w-full py-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-primary transition-colors flex items-center justify-center gap-1.5">
                <span>View Security Center</span>
                ${getIcon('arrow-right', 'w-3.5 h-3.5')}
              </button>
            </div>

            <!-- Quick AI Assistant Card -->
            <div class="bg-gradient-to-br from-primary/10 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-3xl p-6 border border-primary/20 dark:border-slate-800 shadow-sm space-y-3">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                  ${getIcon('bot', 'w-5 h-5')}
                </div>
                <div>
                  <h3 class="text-sm font-bold text-primary-dark dark:text-white">Ask AI Assistant</h3>
                  <p class="text-[11px] text-text-muted dark:text-slate-400">Instant answers about your spending & agents</p>
                </div>
              </div>

              <p class="text-xs text-text-muted dark:text-slate-300 leading-relaxed">
                "How much did my marketing agent spend this week?" or "Explain why my payment was held."
              </p>

              <button 
                onclick="window.AgentGuardStore.setTab('ai-assistant')"
                class="w-full py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2">
                ${getIcon('message-square', 'w-3.5 h-3.5')}
                <span>Open Financial Assistant</span>
              </button>
            </div>

          </div>

        </div>

        <!-- 4. Recent Transactions Overview -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-surface-border dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-surface-border dark:border-slate-800">
            <div>
              <h2 class="text-base font-bold text-primary-dark dark:text-white">Recent Transactions</h2>
              <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">Latest machine and manual payments settled across PayPal rails.</p>
            </div>
            <button 
              onclick="window.AgentGuardStore.setTab('transactions')"
              class="text-xs text-primary font-bold hover:underline">
              View All Transactions →
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-[11px] text-text-muted dark:text-slate-400 uppercase tracking-wider border-b border-surface-border dark:border-slate-800">
                  <th class="py-3 px-3">Transaction</th>
                  <th class="py-3 px-3">Initiator</th>
                  <th class="py-3 px-3">Date</th>
                  <th class="py-3 px-3 text-right">Amount</th>
                  <th class="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-border dark:divide-slate-800 font-medium">
                ${state.ledger.slice(0, 5).map(item => `
                  <tr class="hover:bg-surface-bg dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-3">
                      <div class="font-bold text-primary-dark dark:text-white">${item.recipient}</div>
                      <div class="text-[11px] text-text-muted dark:text-slate-400 font-normal">${item.detail || 'Service expense'}</div>
                    </td>
                    <td class="py-3 px-3 text-text-main dark:text-slate-300">
                      ${item.initiator}
                    </td>
                    <td class="py-3 px-3 text-text-muted dark:text-slate-400">
                      ${item.date}
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-primary-dark dark:text-white">
                      $${Math.abs(item.amount).toFixed(2)}
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.statusCode === 'successful' ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        item.statusCode === 'awaiting_approval' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700' :
                        'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }">
                        ${item.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['dashboard'] = render;

  // Confirmation helpers for approving/rejecting from Dashboard
  window.AgentGuardViews.confirmApprovePayment = function(txnId) {
    if (window.AgentGuardApp && typeof window.AgentGuardApp.openApproveModal === 'function') {
      window.AgentGuardApp.openApproveModal(txnId);
    } else {
      window.AgentGuardStore.approveApproval(txnId);
      window.AgentGuardApp.showToast('Payment approved and released safely', 'success');
    }
  };

  window.AgentGuardViews.confirmRejectPayment = function(txnId) {
    if (window.AgentGuardApp && typeof window.AgentGuardApp.promptReject === 'function') {
      window.AgentGuardApp.promptReject(txnId);
    } else {
      window.AgentGuardStore.rejectApproval(txnId, 'Declined by user from dashboard');
      window.AgentGuardApp.showToast('Payment request declined', 'info');
    }
  };

})(window);
