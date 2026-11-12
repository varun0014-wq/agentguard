// View 2: Agent Control (Fixed Grid Alignment & Uniform Cards)
(function(window) {
  'use strict';

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;

    return `
      <div class="max-w-[1240px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-primary uppercase tracking-wider">Fleet Management</span>
              <span class="text-xs text-text-muted">•</span>
              <span class="text-xs font-semibold text-status-approved">6 Connected Assistants</span>
            </div>
            <h1 class="text-2xl font-extrabold text-primary-dark dark:text-white tracking-tight">AI Agent Management</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-1 max-w-2xl">
              Set spending limits, configure approved merchant lists, and pause or activate autonomous agents instantly.
            </p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button 
              type="button"
              onclick="window.AgentGuardStore.pauseAllAgents(); window.AgentGuardApp.showToast('All autonomous spending paused', 'warning');" 
              class="px-4 py-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-text-main dark:text-slate-200 border border-surface-border dark:border-slate-700 transition-colors flex items-center gap-1.5">
              ${getIcon('pause', 'w-3.5 h-3.5 text-accent-orange')}
              <span>Pause All Agents</span>
            </button>
            <button 
              type="button"
              onclick="window.AgentGuardStore.resumeAllAgents(); window.AgentGuardApp.showToast('All agents activated', 'success');" 
              class="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
              ${getIcon('play', 'w-3.5 h-3.5')}
              <span>Activate All</span>
            </button>
          </div>
        </div>

        <!-- Rigid, Balanced 3-Column Responsive Grid (Uniform Heights & Equal Alignment) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          ${state.agents.map(agent => {
            const status = agent.status || 'Active';
            const isActive = status === 'Active';
            const isPaused = status === 'Paused';
            const isNeedsApproval = status === 'Needs Approval';
            const isBlocked = status === 'Blocked';

            const spentPct = Math.min(100, Math.round((agent.monthlySpent / agent.monthlyCap) * 100));
            const dailyLimit = agent.dailyLimit || Math.round(agent.txLimit * 1.5);

            return `
              <div class="bg-white dark:bg-slate-900 rounded-3xl border ${
                isBlocked ? 'border-status-blocked/40 ring-1 ring-status-blocked/20' : 
                isNeedsApproval ? 'border-accent-orange/50 ring-1 ring-accent-orange/20' : 
                isPaused ? 'border-slate-300 dark:border-slate-700' : 
                'border-surface-border dark:border-slate-800'
              } p-6 shadow-xs flex flex-col justify-between h-full space-y-4 hover:shadow-md transition-all">
                
                <!-- Card Header -->
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-3">
                      <div class="w-11 h-11 rounded-2xl ${
                        isBlocked ? 'bg-red-50 dark:bg-red-950/40 text-status-blocked' : 
                        isNeedsApproval ? 'bg-amber-50 dark:bg-amber-950/40 text-accent-orange' : 
                        isPaused ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 
                        'bg-blue-50 dark:bg-slate-800 text-primary'
                      } flex items-center justify-center shrink-0">
                        ${getIcon('bot', 'w-6 h-6')}
                      </div>
                      <div>
                        <h3 class="text-base font-bold text-primary-dark dark:text-white leading-tight">${agent.name}</h3>
                        <span class="text-[11px] text-text-muted dark:text-slate-400 font-mono">${agent.id}</span>
                      </div>
                    </div>

                    <!-- 4 Simple Status Labels: Active | Paused | Needs Approval | Blocked -->
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isActive ? 'bg-status-approved-bg text-status-approved border border-status-approved/30' :
                      isNeedsApproval ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold' :
                      isPaused ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700' :
                      'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                    }">
                      ${status}
                    </span>
                  </div>

                  <!-- Purpose of the Agent (Fixed 2-line height for clean visual alignment) -->
                  <p class="text-xs text-text-muted dark:text-slate-400 h-9 line-clamp-2 leading-relaxed">
                    ${agent.purpose}
                  </p>
                </div>

                <!-- Limits & Usage Section (Consistent Height) -->
                <div class="bg-surface-bg dark:bg-slate-800/60 p-4 rounded-2xl border border-surface-border dark:border-slate-700 space-y-3 text-xs">
                  
                  <div class="grid grid-cols-2 gap-2 pb-2 border-b border-surface-border dark:border-slate-700">
                    <div>
                      <span class="text-[11px] text-text-muted dark:text-slate-400 block">Single-Tx Cap</span>
                      <strong class="text-primary-dark dark:text-white font-mono text-sm">$${agent.txLimit.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span class="text-[11px] text-text-muted dark:text-slate-400 block">Daily Limit</span>
                      <strong class="text-primary-dark dark:text-white font-mono text-sm">$${dailyLimit.toLocaleString()}</strong>
                    </div>
                  </div>

                  <!-- Monthly Spending & Progress -->
                  <div class="space-y-1">
                    <div class="flex justify-between text-[11px] text-text-muted dark:text-slate-400 font-mono">
                      <span>Monthly Spending</span>
                      <span><strong>$${agent.monthlySpent.toLocaleString()}</strong> / $${agent.monthlyCap.toLocaleString()}</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div class="${spentPct > 80 ? 'bg-accent-orange' : 'bg-primary'} h-1.5 rounded-full transition-all" style="width: ${spentPct}%;"></div>
                    </div>
                  </div>

                  <!-- Allowed Merchants -->
                  <div>
                    <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 block mb-1 uppercase tracking-wider">
                      Allowed Merchants
                    </span>
                    <div class="flex flex-wrap gap-1">
                      ${agent.allowedMerchants.slice(0, 3).map(m => `
                        <span class="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-[10px] font-medium text-text-main dark:text-slate-200">
                          ${m}
                        </span>
                      `).join('')}
                      ${agent.allowedMerchants.length > 3 ? `
                        <span class="px-1.5 py-0.5 rounded text-[10px] text-text-muted font-bold">+${agent.allowedMerchants.length - 3}</span>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Approval Requirement Note -->
                  <div class="text-[11px] text-text-muted dark:text-slate-400 italic pt-1 border-t border-surface-border dark:border-slate-700 truncate">
                    ${agent.approvalSetting}
                  </div>
                </div>

                <!-- Functional Action Buttons -->
                <div class="pt-2 flex items-center justify-between gap-2 text-xs">
                  <button 
                    type="button"
                    onclick="window.AgentGuardViews.openEditLimitModal('${agent.id}')"
                    class="flex-1 py-2 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-primary dark:text-sky-400 font-bold border border-surface-border dark:border-slate-700 transition-colors">
                    Configure Limits
                  </button>

                  ${(isActive || isNeedsApproval) ? `
                    <button 
                      type="button"
                      onclick="window.AgentGuardViews.toggleAgentPause('${agent.id}', 'pause')"
                      class="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/80 transition-colors">
                      Pause
                    </button>
                  ` : `
                    <button 
                      type="button"
                      onclick="window.AgentGuardViews.toggleAgentPause('${agent.id}', 'activate')"
                      class="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80 transition-colors">
                      Activate
                    </button>
                  `}

                  <button 
                    type="button"
                    onclick="window.AgentGuardViews.openAgentDetails('${agent.id}')"
                    class="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-bg dark:hover:bg-slate-800 transition-colors"
                    title="View Full Rules">
                    ${getIcon('info', 'w-4 h-4')}
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['agent-control'] = render;

  window.AgentGuardViews.toggleAgentPause = function(agentId, action) {
    if (action === 'pause') {
      window.AgentGuardStore.pauseAgent(agentId);
      window.AgentGuardApp.showToast(`Agent ${agentId} is now paused.`, 'info');
    } else {
      window.AgentGuardStore.resumeAgent(agentId);
      window.AgentGuardApp.showToast(`Agent ${agentId} has been activated.`, 'success');
    }
  };

  window.AgentGuardViews.openEditLimitModal = function(agentId) {
    const agent = window.AgentGuardStore.state.agents.find(a => a.id === agentId);
    if (!agent) return;

    document.getElementById('edit-agent-id').value = agent.id;
    document.getElementById('edit-agent-name-display').textContent = agent.name;
    document.getElementById('edit-agent-tx-limit').value = agent.txLimit;
    document.getElementById('edit-agent-monthly-cap').value = agent.monthlyCap;
    document.getElementById('edit-agent-merchants').value = agent.allowedMerchants.join(', ');

    const modal = document.getElementById('edit-limit-modal');
    if (modal) modal.classList.remove('hidden');
  };

  window.AgentGuardViews.closeEditLimitModal = function() {
    const modal = document.getElementById('edit-limit-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.AgentGuardViews.saveEditLimits = function() {
    const agentId = document.getElementById('edit-agent-id').value;
    const txLimit = document.getElementById('edit-agent-tx-limit').value;
    const monthlyCap = document.getElementById('edit-agent-monthly-cap').value;
    const merchants = document.getElementById('edit-agent-merchants').value;

    window.AgentGuardStore.updateAgentLimits(agentId, txLimit, monthlyCap, merchants);
    window.AgentGuardViews.closeEditLimitModal();
    window.AgentGuardApp.showToast('Agent spending limits updated successfully.', 'success');
  };

  window.AgentGuardViews.openAgentDetails = function(agentId) {
    const agent = window.AgentGuardStore.state.agents.find(a => a.id === agentId);
    if (!agent) return;

    const modal = document.getElementById('agent-info-modal');
    const content = document.getElementById('agent-info-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="space-y-4 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-surface-border dark:border-slate-800">
          <div>
            <strong class="text-base font-bold text-primary-dark dark:text-white">${agent.name}</strong>
            <div class="text-text-muted font-mono text-[11px]">${agent.id} • ${agent.model}</div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
            agent.status === 'Active' ? 'bg-status-approved-bg text-status-approved' : 
            agent.status === 'Needs Approval' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
            agent.status === 'Paused' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }">${agent.status}</span>
        </div>
        <p class="text-text-muted dark:text-slate-300 leading-relaxed">${agent.purpose}</p>
        <div class="bg-surface-bg dark:bg-slate-800 p-4 rounded-2xl space-y-2 font-mono">
          <div class="flex justify-between"><span>Per-Transaction Cap:</span><strong>$${agent.txLimit.toLocaleString()} USD</strong></div>
          <div class="flex justify-between"><span>Daily Spending Cap:</span><strong>$${(agent.dailyLimit || agent.txLimit * 1.5).toLocaleString()} USD</strong></div>
          <div class="flex justify-between"><span>Monthly Cap:</span><strong>$${agent.monthlyCap.toLocaleString()} USD</strong></div>
          <div class="flex justify-between"><span>Total Spent This Month:</span><strong>$${agent.monthlySpent.toLocaleString()} USD</strong></div>
        </div>
        <div>
          <span class="font-bold text-primary-dark dark:text-white block mb-1.5">Approved Merchant List:</span>
          <div class="flex flex-wrap gap-1.5">
            ${agent.allowedMerchants.map(m => `<span class="px-2.5 py-1 bg-surface-bg dark:bg-slate-800 rounded-lg border border-surface-border dark:border-slate-700 text-[11px] font-medium">${m}</span>`).join('')}
          </div>
        </div>
        <div class="pt-2 text-[11px] text-text-muted dark:text-slate-400 border-t border-surface-border dark:border-slate-800">
          <strong>Approval Policy:</strong> ${agent.approvalSetting}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  };

  window.AgentGuardViews.closeAgentDetails = function() {
    const modal = document.getElementById('agent-info-modal');
    if (modal) modal.classList.add('hidden');
  };

})(window);
