// View 7: More Services — Split Bills, Currency Converter, QR Scanner, Offers & Rewards
(function(window) {
  'use strict';

  function render(state) {
    const activeSubTab = state.moreServicesSubTab || 'split-bills';
    const getIcon = window.AgentGuardIcons.get;

    return `
      <div class="max-w-[1400px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-primary uppercase tracking-widest">PayPal Services</span>
              <span class="text-xs font-mono text-text-muted dark:text-slate-400">• Enhanced Agentic Commerce Suite</span>
            </div>
            <h1 class="text-2xl font-bold text-primary-dark dark:text-white tracking-tight">More Financial Services</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
              Multi-party bill splitting, institutional currency conversion, point-of-sale QR scanning, and corporate merchant rebates.
            </p>
          </div>

          <!-- Sub-Navigation Pills -->
          <div class="flex flex-wrap items-center gap-1.5 p-1 bg-surface-bg dark:bg-slate-800 rounded-xl border border-surface-border dark:border-slate-700 text-xs font-bold">
            <button onclick="window.AgentGuardStore.setMoreServicesSubTab('split-bills')" class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'split-bills' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              ${getIcon('split', 'w-3.5 h-3.5')}
              <span>Split Bills</span>
            </button>
            <button onclick="window.AgentGuardStore.setMoreServicesSubTab('currency')" class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'currency' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              ${getIcon('currency', 'w-3.5 h-3.5')}
              <span>Currency Converter</span>
            </button>
            <button onclick="window.AgentGuardStore.setMoreServicesSubTab('qr')" class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'qr' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              ${getIcon('qr-code', 'w-3.5 h-3.5')}
              <span>QR Scanner</span>
            </button>
            <button onclick="window.AgentGuardStore.setMoreServicesSubTab('offers')" class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'offers' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
              ${getIcon('tag', 'w-3.5 h-3.5')}
              <span>Offers & Rewards</span>
            </button>
          </div>
        </div>

        <!-- ==================== SUB-TAB 1: SPLIT BILLS ==================== -->
        ${activeSubTab === 'split-bills' ? `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left 2 Cols: Group & Participants -->
            <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-primary-dark dark:text-white">Active Split Group: AI Hackathon Cloud Cluster</h3>
                  <p class="text-xs text-text-muted dark:text-slate-400">Total Group Invoice: <strong>$1,200.00 USD</strong> • 4 Participants</p>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-approved-bg text-status-approved">PayPal Invoicing Active</span>
              </div>

              <!-- Participant Shares List -->
              <div class="divide-y divide-surface-border dark:divide-slate-800 text-xs">
                ${state.splitBills.groups[0].members.map(m => `
                  <div class="py-3.5 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center font-bold">
                        ${m.name[0]}
                      </div>
                      <div>
                        <div class="font-bold text-primary-dark dark:text-white">${m.name} <span class="text-text-muted font-normal">(${m.role})</span></div>
                        <div class="text-[11px] text-text-muted font-mono">${m.phone}</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="font-mono font-bold text-primary-dark dark:text-white text-sm">$${m.share.toFixed(2)}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Paid' || m.status === 'Auto-Settled' ? 'bg-status-approved-bg text-status-approved' : 'bg-status-pending-bg text-accent-orange'}">
                        ${m.status}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Add New Participant with International Phone Input -->
              <div class="pt-4 border-t border-surface-border dark:border-slate-800 space-y-3">
                <span class="text-xs font-bold text-primary-dark dark:text-white block">+ Add Colleague or Agent to Split Group</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input id="split-add-name" type="text" placeholder="Full Name or Bot Name" class="h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary" />
                  <div>
                    ${window.PhoneInputComponent ? window.PhoneInputComponent.render('split-add-phone', 'US', '') : ''}
                  </div>
                </div>
                <button onclick="window.AgentGuardApp.addSplitParticipant()" class="px-4 py-2 bg-primary hover:bg-secondary text-white text-xs font-bold rounded-xl transition-all shadow-xs">
                  Add Participant & Re-Split
                </button>
              </div>
            </div>

            <!-- Right Col: Calculator & Trigger -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="text-base font-bold text-primary-dark dark:text-white">Split Settings & Settlement</h3>
              
              <div class="space-y-3 text-xs">
                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Total Bill Amount ($)</label>
                  <input id="split-calc-total" type="number" value="1200.00" oninput="window.AgentGuardApp.recalculateSplit()" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-sm font-mono font-bold text-primary-dark dark:text-white" />
                </div>

                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Split Method</label>
                  <select id="split-calc-method" onchange="window.AgentGuardApp.recalculateSplit()" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs font-semibold text-text-main dark:text-slate-200">
                    <option value="equal">Equal Split (1/N)</option>
                    <option value="custom">Custom Percentage / Shares</option>
                  </select>
                </div>

                <div class="p-4 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-1">
                  <span class="text-xs text-text-muted dark:text-slate-400">Calculated Per Member:</span>
                  <div id="split-calc-display" class="text-2xl font-black text-primary font-mono">$300.00 USD</div>
                  <span class="text-[10px] text-text-muted font-mono">Dispatched through PayPal Invoicing APIs</span>
                </div>

                <button onclick="window.AgentGuardApp.showToast('PayPal payment requests dispatched to all group members', 'success')" class="w-full py-2.5 bg-primary hover:bg-secondary text-white text-xs font-bold rounded-xl transition-all shadow-md">
                  Send PayPal Payment Invoices
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- ==================== SUB-TAB 2: CURRENCY CONVERTER ==================== -->
        ${activeSubTab === 'currency' ? `
          <div class="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-sm space-y-5">
            <div class="space-y-1">
              <h3 class="text-base font-bold text-primary-dark dark:text-white">Institutional FX Currency Converter</h3>
              <p class="text-xs text-text-muted dark:text-slate-400">Real-time European Central Bank (ECB) spot rate feed for autonomous cross-border cloud spend.</p>
            </div>

            <!-- Currency Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <!-- Send Currency -->
              <div class="p-4 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-2">
                <span class="text-xs font-bold text-text-muted dark:text-slate-400">You Send</span>
                <div class="flex items-center gap-2">
                  <input id="fx-send-amount" type="number" value="1000.00" oninput="window.AgentGuardApp.recalculateFx()" class="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-sm font-mono font-bold text-primary-dark dark:text-white" />
                  <select id="fx-send-currency" onchange="window.AgentGuardApp.recalculateFx()" class="h-10 px-2 rounded-lg bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-xs font-bold">
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="GBP">🇬🇧 GBP</option>
                    <option value="INR">🇮🇳 INR</option>
                    <option value="AED">🇦🇪 AED</option>
                    <option value="SGD">🇸🇬 SGD</option>
                  </select>
                </div>
              </div>

              <!-- Receive Currency -->
              <div class="p-4 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-2">
                <span class="text-xs font-bold text-text-muted dark:text-slate-400">Recipient Gets</span>
                <div class="flex items-center gap-2">
                  <input id="fx-receive-amount" type="text" readonly value="83,250.00" class="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-sm font-mono font-bold text-status-approved" />
                  <select id="fx-receive-currency" onchange="window.AgentGuardApp.recalculateFx()" class="h-10 px-2 rounded-lg bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-xs font-bold">
                    <option value="INR" selected>🇮🇳 INR</option>
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="GBP">🇬🇧 GBP</option>
                    <option value="AED">🇦🇪 AED</option>
                    <option value="SGD">🇸🇬 SGD</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Swap Button & Rate Box -->
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-status-approved-bg dark:bg-emerald-950/20 border border-status-approved/30 text-xs">
              <div>
                <span class="text-text-muted dark:text-slate-400">Guaranteed Spot Rate: </span>
                <strong id="fx-rate-text" class="text-status-approved font-mono">1 USD = 83.25 INR</strong>
              </div>
              <button onclick="window.AgentGuardApp.swapCurrencies()" class="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-primary border border-surface-border dark:border-slate-700 font-bold flex items-center gap-1">
                ${getIcon('rotate-ccw', 'w-3.5 h-3.5')} Swap
              </button>
            </div>

            <div class="text-[11px] text-text-muted dark:text-slate-400 text-right font-mono">
              Last updated: ${state.exchangeRates.lastUpdated}
            </div>
          </div>
        ` : ''}

        <!-- ==================== SUB-TAB 3: QR CODE SCANNER ==================== -->
        ${activeSubTab === 'qr' ? `
          <div class="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-sm space-y-5">
            <div class="space-y-1">
              <h3 class="text-base font-bold text-primary-dark dark:text-white">QR Code Scanner & Point-of-Sale Gate</h3>
              <p class="text-xs text-text-muted dark:text-slate-400">Scan merchant QR invoices with machine verification before releasing PayPal funds.</p>
            </div>

            <!-- Simulated Viewfinder with Reticle & Animated Scan Line -->
            <div class="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800 shadow-inner">
              <!-- Animated Scanning Laser Line -->
              <div class="absolute inset-x-8 top-1/4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce"></div>

              <!-- Viewfinder Box Corners -->
              <div class="w-48 h-48 border-2 border-dashed border-sky-400/80 rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-2">
                <span class="text-white/60 text-xs">Align QR Code within frame</span>
                <div class="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
                  ${getIcon('qr-code', 'w-10 h-10')}
                </div>
              </div>

              <div class="absolute bottom-3 text-[11px] text-slate-400 font-mono">
                Sensor: Camera Stream Ready • AgentGuard POS Shield
              </div>
            </div>

            <!-- Quick Simulated Sample QR Codes -->
            <div class="space-y-2 text-xs">
              <span class="font-bold text-text-muted dark:text-slate-400">Simulate Sample QR Invoices:</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button onclick="window.AgentGuardApp.simulateQrScan('AWS Cloud Invoice #9981', 'Amazon Web Services', 142.50)" class="p-3 rounded-xl bg-surface-bg dark:bg-slate-800 hover:border-primary border border-surface-border dark:border-slate-700 text-left transition-all">
                  <div class="font-bold text-primary-dark dark:text-white">AWS Cloud Services QR</div>
                  <div class="text-[11px] text-text-muted font-mono">$142.50 USD • Verified Merchant</div>
                </button>

                <button onclick="window.AgentGuardApp.simulateQrScan('Delta Flight POS #4102', 'Delta Air Lines', 650.00)" class="p-3 rounded-xl bg-surface-bg dark:bg-slate-800 hover:border-primary border border-surface-border dark:border-slate-700 text-left transition-all">
                  <div class="font-bold text-primary-dark dark:text-white">Delta Air Lines Gate POS</div>
                  <div class="text-[11px] text-text-muted font-mono">$650.00 USD • Travel Concierge</div>
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- ==================== SUB-TAB 4: OFFERS & REWARDS ==================== -->
        ${activeSubTab === 'offers' ? `
          <div class="space-y-4">
            <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-primary/20 text-xs text-primary dark:text-sky-300 flex items-center justify-between">
              <span class="flex items-center gap-2">
                ${getIcon('gift', 'w-4 h-4')}
                <strong>Sample Demo Rewards Content:</strong> Autonomous merchant volume rebates pre-negotiated for AgentGuard fleets.
              </span>
              <span class="font-mono font-bold">PayPal Partner Perks</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              ${state.offers.map(o => `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-surface-border dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-approved-bg text-status-approved border border-status-approved/30 uppercase">
                        ${o.badge}
                      </span>
                      <span class="text-[11px] text-text-muted font-mono">${o.category}</span>
                    </div>

                    <h3 class="font-bold text-primary-dark dark:text-white text-base">${o.title}</h3>
                    <div class="text-xs font-semibold text-primary mt-0.5">${o.merchant}</div>
                    <p class="text-xs text-text-muted dark:text-slate-400 mt-2 leading-relaxed">${o.description}</p>
                  </div>

                  <div class="pt-3 border-t border-surface-border dark:border-slate-800 flex items-center justify-between text-xs">
                    <span class="font-mono text-[10px] text-text-muted">${o.expiry}</span>
                    <button onclick="window.AgentGuardApp.showToast('Promo code ${o.code} applied to PayPal business account!', 'success')" class="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold transition-all">
                      Apply Promo
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['more-services'] = render;
})(window);
