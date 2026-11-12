// View: Offers & Rewards
(function(window) {
  'use strict';

  let activeCategory = 'all';
  const activatedOffers = new Set(['OFF-1']); // default activated

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    const allOffers = state.offers || [];

    const categories = [
      { id: 'all', label: 'All Offers' },
      { id: 'Software & Cloud', label: 'Software & Cloud' },
      { id: 'Travel & Dining', label: 'Travel & Dining' },
      { id: 'Team Productivity', label: 'Team Productivity' }
    ];

    const filtered = activeCategory === 'all' 
      ? allOffers 
      : allOffers.filter(o => o.category === activeCategory);

    return `
      <div class="max-w-[1100px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">Offers & Rewards</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
              Exclusive corporate cashback, vendor discounts, and perks automatically applied to authorized spending.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-status-approved border border-status-approved/20 flex items-center gap-1.5">
              ${getIcon('award', 'w-3.5 h-3.5')}
              $342.50 Cashback Earned
            </span>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          ${categories.map(cat => `
            <button 
              type="button"
              onclick="window.AgentGuardViews.setOfferCategory('${cat.id}')"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategory === cat.id ? 'bg-primary text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-text-muted dark:text-slate-400 hover:text-text-main border border-surface-border dark:border-slate-800'}">
              ${cat.label}
            </button>
          `).join('')}
        </div>

        <!-- Offers Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${filtered.map(offer => {
            const isActivated = activatedOffers.has(offer.id);
            return `
              <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                
                <div class="space-y-3">
                  <!-- Badge & Category -->
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${isActivated ? 'bg-status-approved-bg text-status-approved' : 'bg-blue-50 dark:bg-slate-800 text-primary'}">
                      ${offer.badge}
                    </span>
                    <span class="text-[10px] text-text-muted dark:text-slate-400 font-medium">
                      ${offer.category}
                    </span>
                  </div>

                  <!-- Title & Merchant -->
                  <div>
                    <h3 class="text-base font-bold text-primary-dark dark:text-white leading-snug">
                      ${offer.title}
                    </h3>
                    <div class="text-xs font-semibold text-primary mt-0.5">
                      ${offer.merchant}
                    </div>
                  </div>

                  <!-- Description -->
                  <p class="text-xs text-text-muted dark:text-slate-300 leading-relaxed">
                    ${offer.description}
                  </p>
                </div>

                <!-- Footer: Expiry & Button -->
                <div class="pt-4 border-t border-surface-border dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <span class="text-[11px] text-text-muted dark:text-slate-400">
                    ${offer.expiry}
                  </span>
                  
                  <button 
                    type="button"
                    onclick="window.AgentGuardViews.toggleOfferActivation('${offer.id}')"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActivated 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-status-approved border border-status-approved/30 hover:bg-emerald-100' 
                        : 'bg-primary hover:bg-secondary text-white shadow-xs'
                    }">
                    ${isActivated ? '✓ Activated' : 'Activate Offer'}
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>

        <!-- How Rewards Work Banner -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-3">
          <h3 class="text-base font-bold text-primary-dark dark:text-white">How AgentGuard Rewards Work</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-1">
              <strong class="text-primary-dark dark:text-white block font-bold">1. Tap Activate</strong>
              <p class="text-text-muted dark:text-slate-400">Click Activate on any offer you want applied to your account or agents.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-1">
              <strong class="text-primary-dark dark:text-white block font-bold">2. Agents Spend Safely</strong>
              <p class="text-text-muted dark:text-slate-400">Whenever an approved AI agent or you make a transaction with the vendor, the perk triggers.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-1">
              <strong class="text-primary-dark dark:text-white block font-bold">3. Automatic Cashback</strong>
              <p class="text-text-muted dark:text-slate-400">Cashback rebates are directly deposited back into your PayPal balance monthly.</p>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['offers'] = render;

  window.AgentGuardViews.setOfferCategory = function(cat) {
    activeCategory = cat;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.toggleOfferActivation = function(offerId) {
    if (activatedOffers.has(offerId)) {
      activatedOffers.delete(offerId);
      window.AgentGuardApp.showToast('Offer deactivated', 'info');
    } else {
      activatedOffers.add(offerId);
      window.AgentGuardApp.showToast('Offer activated! Perks will automatically apply to authorized payments.', 'success');
    }
    window.AgentGuardApp.renderActiveView();
  };

})(window);
