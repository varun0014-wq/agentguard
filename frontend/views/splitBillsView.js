// View: Split Bills (Section 10 - Dedicated Sidebar Page)
(function(window) {
  'use strict';

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    const splitState = state.splitBills;
    const participants = splitState.participants;
    const count = participants.length;
    const total = splitState.billTotal;
    const sharePerPerson = count > 0 ? (total / count).toFixed(2) : '0.00';

    return `
      <div class="max-w-[1100px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">Split Bills</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
              Easily divide team lunches, shared software invoices, or group expenses with friends and colleagues.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-slate-800 text-primary">
              ${count} People in Split
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left 2 Cols: Participants List & Add Member -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-5">
            
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-primary-dark dark:text-white">Group Participants</h3>
              <span class="text-xs text-text-muted">Shares update automatically</span>
            </div>

            <!-- Participant Items -->
            <div class="divide-y divide-surface-border dark:divide-slate-800 text-xs">
              ${participants.map((p, index) => `
                <div class="py-3.5 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-800 text-primary font-bold flex items-center justify-center shrink-0">
                      ${p.name.charAt(0)}
                    </div>
                    <div>
                      <div class="font-bold text-primary-dark dark:text-white text-xs">${p.name}</div>
                      <div class="text-[11px] text-text-muted font-mono">${p.phone || 'No phone entered'}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <div class="font-mono font-bold text-primary-dark dark:text-white text-sm">$${p.share.toFixed(2)}</div>
                      <span class="text-[10px] font-semibold ${p.isPaid ? 'text-status-approved' : 'text-accent-orange'}">
                        ${p.isPaid ? '✓ Paid' : 'Request Pending'}
                      </span>
                    </div>

                    ${index > 0 ? `
                      <button 
                        onclick="window.AgentGuardStore.removeParticipant('${p.id}')"
                        class="p-1 rounded text-text-muted hover:text-status-blocked" 
                        title="Remove person">
                        ${getIcon('x', 'w-4 h-4')}
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Add Person Form with Worldwide International Phone Input -->
            <div class="pt-4 border-t border-surface-border dark:border-slate-800 space-y-3">
              <strong class="text-xs font-bold text-primary-dark dark:text-white block">+ Add Another Person to Split</strong>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  id="split-new-name"
                  type="text" 
                  placeholder="Person's Name" 
                  class="h-10 px-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <div>
                  ${window.PhoneInputComponent ? window.PhoneInputComponent.render('split-new-phone', 'US', '') : ''}
                </div>
              </div>
              <button 
                type="button"
                onclick="window.AgentGuardViews.handleAddSplitPerson()"
                class="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-all shadow-xs">
                Add to Group & Recalculate
              </button>
            </div>

          </div>

          <!-- Right Col: Calculator & Payment Action -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
            <div class="space-y-4">
              <h3 class="text-base font-bold text-primary-dark dark:text-white">Bill Summary</h3>

              <div class="space-y-3 text-xs">
                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Total Bill Amount ($)</label>
                  <input 
                    id="split-bill-input"
                    type="number" 
                    value="${total.toFixed(2)}"
                    oninput="window.AgentGuardStore.updateSplitTotal(this.value)"
                    class="w-full h-11 px-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-base font-mono font-bold text-primary-dark dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Splitting Method</label>
                  <select class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs font-semibold">
                    <option selected>Equal Split (Shared Equally)</option>
                    <option>Custom Amounts</option>
                  </select>
                </div>

                <div class="p-4 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-1">
                  <span class="text-xs text-text-muted dark:text-slate-400">Each Person Owes:</span>
                  <div class="text-2xl font-black text-primary font-mono">$${sharePerPerson} USD</div>
                  <span class="text-[11px] text-text-muted dark:text-slate-400">Divided across ${count} participants</span>
                </div>
              </div>
            </div>

            <button 
              onclick="window.AgentGuardApp.showToast('Payment requests sent to all group members via SMS & Email', 'success')"
              class="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2">
              ${getIcon('send', 'w-4 h-4')}
              <span>Send Payment Requests</span>
            </button>
          </div>

        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['split-bills'] = render;

  window.AgentGuardViews.handleAddSplitPerson = function() {
    const nameInput = document.getElementById('split-new-name');
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = window.PhoneInputComponent ? window.PhoneInputComponent.getFullNumber('split-new-phone') : '';

    if (!name) {
      window.AgentGuardApp.showToast('Please enter the person\'s name', 'warning');
      return;
    }

    window.AgentGuardStore.addParticipant(name, phone);
    if (nameInput) nameInput.value = '';
    window.AgentGuardApp.showToast(`Added ${name} to the bill split`, 'success');
  };
})(window);
