// View 3: Payment Approvals (Clean, Professional, Clearly Separated White Cards)
(function(window) {
  'use strict';

  let currentSubTab = 'pending'; // 'pending' | 'history' | 'blocked'

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    const pendingList = state.pendingApprovals;
    const pendingCount = pendingList.length;

    return `
      <div class="max-w-[1240px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm">
          <div>
            <div class="flex items-center gap-2.5 mb-1">
              <h1 class="text-2xl font-extrabold text-primary-dark dark:text-white tracking-tight">Payment Approvals</h1>
              ${pendingCount > 0 ? `
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 font-mono">
                  ${pendingCount} Pending
                </span>
              ` : `
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-approved-bg text-status-approved">
                  All Clear
                </span>
              `}
            </div>
            <p class="text-xs text-text-muted dark:text-slate-400 max-w-2xl leading-relaxed">
              When an AI assistant requests a payment that exceeds its regular spending cap or involves a new vendor, it pauses here for your explicit authorization.
            </p>
          </div>

          <!-- Sub-Tab Selection -->
          <div class="flex items-center gap-1 bg-surface-bg dark:bg-slate-800 p-1.5 rounded-2xl border border-surface-border dark:border-slate-700 text-xs font-bold shrink-0">
            <button 
              type="button"
              onclick="window.AgentGuardViews.setApprovalsTab('pending')" 
              class="px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${currentSubTab === 'pending' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              <span>Needs Approval</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] ${currentSubTab === 'pending' ? 'bg-white text-primary font-bold' : 'bg-amber-100 text-amber-900'}">${pendingCount}</span>
            </button>

            <button 
              type="button"
              onclick="window.AgentGuardViews.setApprovalsTab('history')" 
              class="px-3.5 py-2 rounded-xl transition-all ${currentSubTab === 'history' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              <span>Approved History</span>
            </button>

            <button 
              type="button"
              onclick="window.AgentGuardViews.setApprovalsTab('blocked')" 
              class="px-3.5 py-2 rounded-xl transition-all ${currentSubTab === 'blocked' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              <span>Blocked (${state.blockedPayments.length})</span>
            </button>
          </div>
        </div>

        <!-- SUB-TAB 1: PENDING PAYMENTS (NEEDS APPROVAL) -->
        ${currentSubTab === 'pending' ? `
          <div class="space-y-5">
            ${pendingCount === 0 ? `
              <div class="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-surface-border dark:border-slate-800 shadow-sm space-y-3">
                <div class="w-14 h-14 rounded-full bg-status-approved-bg text-status-approved mx-auto flex items-center justify-center">
                  ${getIcon('check', 'w-7 h-7')}
                </div>
                <h3 class="text-lg font-bold text-primary-dark dark:text-white">You're All Caught Up</h3>
                <p class="text-xs text-text-muted dark:text-slate-400 max-w-sm mx-auto">
                  No automated payments are waiting for your approval. Routine invoices within pre-set caps are processed safely.
                </p>
              </div>
            ` : `
              <div class="space-y-4">
                ${pendingList.map(item => `
                  <!-- Clearly Separated Clean WHITE Card -->
                  <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-surface-border dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4">
                    
                    <!-- Top Row: Recipient & Amount -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border dark:border-slate-800">
                      <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-accent-orange flex items-center justify-center shrink-0">
                          ${getIcon('clock', 'w-6 h-6')}
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <h3 class="text-lg font-extrabold text-primary-dark dark:text-white">${item.recipient}</h3>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 uppercase font-mono">
                              Awaiting Approval
                            </span>
                          </div>
                          <span class="text-xs text-text-muted dark:text-slate-400">
                            Requested by: <strong class="text-primary-dark dark:text-white">${item.agentName}</strong> • ${item.date}
                          </span>
                        </div>
                      </div>

                      <div class="text-left sm:text-right">
                        <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white font-mono">
                          $${item.amount.toFixed(2)} <span class="text-xs font-semibold text-text-muted">${item.currency}</span>
                        </div>
                        <span class="text-[11px] text-accent-orange font-semibold">${item.simpleStatus}</span>
                      </div>
                    </div>

                    <!-- Middle: Purpose & Explanation -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-surface-bg dark:bg-slate-800/60 border border-surface-border dark:border-slate-700 text-xs">
                      <div class="md:col-span-2 space-y-1">
                        <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wide">Reason for Review</span>
                        <p class="text-xs text-text-main dark:text-slate-200 leading-relaxed font-medium">
                          ${item.reason}
                        </p>
                        <div class="text-[11px] text-text-muted dark:text-slate-400 mt-1">
                          Details: ${item.rawDetails}
                        </div>
                      </div>

                      <div class="space-y-1 md:border-l md:border-surface-border md:dark:border-slate-700 md:pl-4">
                        <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wide">Safety Check</span>
                        <div class="text-status-approved font-semibold flex items-center gap-1">
                          ${getIcon('check-circle', 'w-3.5 h-3.5 text-status-approved')}
                          <span>Verified Domain</span>
                        </div>
                        <div class="text-text-muted text-[11px]">Funds remain safely in your PayPal balance until approved.</div>
                      </div>
                    </div>

                    <!-- Actions: Approve with Confirmation & Reject -->
                    <div class="flex items-center justify-end gap-3 pt-1">
                      <button 
                        type="button"
                        onclick="window.AgentGuardViews.handleReject('${item.id}')"
                        class="px-5 py-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-red-50 hover:text-status-blocked text-xs font-semibold text-text-muted dark:text-slate-300 border border-surface-border dark:border-slate-700 transition-colors">
                        Decline Payment
                      </button>

                      <button 
                        type="button"
                        onclick="window.AgentGuardViews.handleApprove('${item.id}')"
                        class="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2">
                        ${getIcon('check', 'w-4 h-4')}
                        <span>Approve & Pay $${item.amount.toFixed(2)} USD</span>
                      </button>
                    </div>

                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- SUB-TAB 2: APPROVED HISTORY -->
        ${currentSubTab === 'history' ? `
          <div class="space-y-3">
            ${state.autoApprovedHistory.map(item => `
              <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-surface-border dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-status-approved-bg text-status-approved flex items-center justify-center shrink-0">
                    ${getIcon('check-circle', 'w-5 h-5')}
                  </div>
                  <div>
                    <h4 class="font-bold text-primary-dark dark:text-white text-sm">${item.recipient}</h4>
                    <span class="text-xs text-text-muted dark:text-slate-400">Approved for ${item.agentName} • ${item.date}</span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-mono font-bold text-primary-dark dark:text-white text-base">$${item.amount.toFixed(2)} ${item.currency}</div>
                  <span class="text-[10px] font-bold text-status-approved bg-status-approved-bg px-2 py-0.5 rounded">Settled</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- SUB-TAB 3: BLOCKED PAYMENTS -->
        ${currentSubTab === 'blocked' ? `
          <div class="space-y-4">
            ${state.blockedPayments.map(item => `
              <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-status-blocked/30 shadow-xs space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-red-50 text-status-blocked flex items-center justify-center shrink-0">
                      ${getIcon('shield-x', 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 class="font-bold text-status-blocked text-sm">${item.recipient}</h4>
                      <span class="text-xs text-text-muted dark:text-slate-400">Intercepted attempt from ${item.agentName} • ${item.date}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono font-bold text-status-blocked text-lg">$${item.amount.toFixed(2)} USD</div>
                    <span class="text-[10px] font-bold text-status-blocked uppercase">Stopped by Firewall</span>
                  </div>
                </div>

                <div class="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-text-main dark:text-slate-200">
                  <strong>Protection Trigger:</strong> ${item.reason}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['payment-approvals'] = render;

  window.AgentGuardViews.setApprovalsTab = function(tab) {
    currentSubTab = tab;
    window.AgentGuardApp.renderActiveView();
  };

  // Confirmation before approving
  window.AgentGuardViews.handleApprove = function(txnId) {
    if (window.AgentGuardApp && typeof window.AgentGuardApp.openApproveModal === 'function') {
      window.AgentGuardApp.openApproveModal(txnId);
    } else {
      window.AgentGuardStore.approveApproval(txnId);
      window.AgentGuardApp.showToast('Payment approved and released safely.', 'success');
    }
  };

  // Confirmation before rejecting
  window.AgentGuardViews.handleReject = function(txnId) {
    if (window.AgentGuardApp && typeof window.AgentGuardApp.promptReject === 'function') {
      window.AgentGuardApp.promptReject(txnId);
    } else {
      window.AgentGuardStore.rejectApproval(txnId, 'Declined by user.');
      window.AgentGuardApp.showToast('Payment declined and cancelled.', 'info');
    }
  };

})(window);
