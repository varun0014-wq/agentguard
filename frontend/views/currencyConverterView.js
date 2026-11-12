// View: Worldwide ISO 4217 Currency Converter with Real-Time API & Offline Fallback Handling
(function(window) {
  'use strict';

  // 40+ Commonly traded world currencies with flags, names, and 2026 latest benchmark rates (e.g. 1 USD = 93.61 INR)
  const WORLD_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 1.0 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 93.61 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 0.89 },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 0.75 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 158.91 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rate: 1.42 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rate: 1.52 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', rate: 0.83 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rate: 1.28 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rate: 3.6725 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', rate: 3.751 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rate: 6.95 },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', rate: 5.52 },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', rate: 18.60 },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rate: 1384.0 },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 16.42 },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', rate: 10.15 },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', rate: 10.45 },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', rate: 6.64 },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', rate: 1.78 },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', rate: 7.84 },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rate: 35.80 },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', rate: 16250.0 },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', rate: 4.45 },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', rate: 58.40 },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', rate: 50.22 },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', rate: 3.98 },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', rate: 3.68 },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', rate: 53.30 },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rate: 1347.0 },
    { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', rate: 32.15 },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', rate: 23.10 },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', flag: '🇶🇦', rate: 3.64 },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼', rate: 0.311 },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', rate: 950.0 },
    { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', rate: 4120.0 },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', rate: 1545.0 },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', rate: 25480.0 },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', rate: 279.20 },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', rate: 125.10 },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rate: 129.50 }
  ];

  let currentFromCode = 'USD';
  let currentToCode = 'EUR';
  let currentAmount = 1000;
  let isApiLive = false;
  let apiStatusText = 'Checking rates...';
  let lastUpdatedTime = 'Standard Reference Banking Rates';
  let hasAttemptedFetch = false;

  // Attempt live exchange rate fetch using reliable public API
  async function fetchLiveExchangeRates() {
    try {
      apiStatusText = 'Fetching live rates...';
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
      if (!res.ok) throw new Error('API response status ' + res.status);
      const data = await res.json();
      if (data && data.rates) {
        WORLD_CURRENCIES.forEach(c => {
          if (data.rates[c.code]) {
            c.rate = data.rates[c.code];
          }
        });
        isApiLive = true;
        lastUpdatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Live Market Feed)';
        apiStatusText = 'Connected to Live Exchange API';
      }
    } catch (err) {
      console.warn('Live exchange rate API unavailable, falling back to reference rates:', err);
      isApiLive = false;
      lastUpdatedTime = 'Benchmark Banking Rates (API offline)';
      apiStatusText = 'Live API Unavailable — Displaying Reference Rates';
    } finally {
      hasAttemptedFetch = true;
      if (window.AgentGuardApp && typeof window.AgentGuardApp.renderActiveView === 'function') {
        window.AgentGuardApp.renderActiveView();
      }
    }
  }

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    
    // Auto-fetch rates once when view rendered
    if (!hasAttemptedFetch && typeof fetch !== 'undefined') {
      hasAttemptedFetch = true;
      setTimeout(fetchLiveExchangeRates, 100);
    }

    const fromCurr = WORLD_CURRENCIES.find(c => c.code === currentFromCode) || WORLD_CURRENCIES[0];
    const toCurr = WORLD_CURRENCIES.find(c => c.code === currentToCode) || WORLD_CURRENCIES[1];

    // Conversion calculation
    const amountInUsd = currentAmount / fromCurr.rate;
    const convertedAmount = amountInUsd * toCurr.rate;
    const singleUnitRate = (1 / fromCurr.rate) * toCurr.rate;
    const inverseUnitRate = (1 / toCurr.rate) * fromCurr.rate;

    return `
      <div class="max-w-[1240px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-primary uppercase tracking-wider">Multi-Currency Engine</span>
              <span class="text-xs text-text-muted">•</span>
              <span class="text-xs font-semibold text-text-muted dark:text-slate-400">40+ ISO 4217 Currencies</span>
            </div>
            <h1 class="text-2xl font-extrabold text-primary-dark dark:text-white tracking-tight">Worldwide Currency Converter</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-1 max-w-2xl">
              Calculate foreign exchange rates with live interbank feeds or verified reference banking benchmarks.
            </p>
          </div>

          <!-- Status Indicator & Refresh Button -->
          <div class="flex items-center gap-2.5 shrink-0">
            <span class="px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              isApiLive 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-status-approved border border-status-approved/30' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-accent-orange border border-accent-orange/30'
            } flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${isApiLive ? 'bg-status-approved animate-pulse' : 'bg-accent-orange'}"></span>
              <span>${isApiLive ? 'Live Market Feed' : 'Reference Rates'}</span>
            </span>

            <button 
              type="button"
              onclick="window.AgentGuardViews.refreshRates()"
              class="px-3.5 py-1.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-primary transition-colors flex items-center gap-1.5 border border-surface-border dark:border-slate-700">
              ${getIcon('refresh-cw', 'w-3.5 h-3.5')}
              <span>Refresh Rates</span>
            </button>
          </div>
        </div>

        <!-- Notification Banner: Clearly Indicating If Rates Are Live or Fallback -->
        ${isApiLive ? `
          <div class="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-status-approved/30 text-xs text-status-approved flex items-center justify-between">
            <div class="flex items-center gap-2">
              ${getIcon('check-circle', 'w-4 h-4 text-status-approved shrink-0')}
              <span><strong>Live Exchange Rates Active:</strong> Rates synchronized with real-time interbank market.</span>
            </div>
            <span class="font-mono text-[11px] text-text-muted dark:text-slate-400">Updated: ${lastUpdatedTime}</span>
          </div>
        ` : `
          <div class="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-accent-orange/30 text-xs text-accent-orange flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              ${getIcon('alert-triangle', 'w-4 h-4 text-accent-orange shrink-0')}
              <span><strong>Notice:</strong> ${apiStatusText}. Displayed rates are benchmark reference rates and not live.</span>
            </div>
            <span class="font-mono text-[11px] text-text-muted dark:text-slate-400">${lastUpdatedTime}</span>
          </div>
        `}

        <!-- Main Converter Card -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-surface-border dark:border-slate-800 shadow-sm space-y-6">
          
          <div class="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            
            <!-- Send Amount & Currency (Cols 1-5) -->
            <div class="lg:col-span-5 space-y-2">
              <label class="block text-xs font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                You Send
              </label>
              <div class="flex items-center rounded-2xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 p-2 focus-within:border-primary transition-all">
                <span class="pl-2 pr-1 text-base font-bold text-text-muted font-mono">${fromCurr.symbol}</span>
                <input 
                  id="converter-amount-input"
                  type="number" 
                  min="0"
                  step="any"
                  value="${currentAmount}"
                  oninput="window.AgentGuardViews.handleCurrencyAmountChange(this.value)"
                  class="w-full h-11 px-2 bg-transparent text-xl font-extrabold text-primary-dark dark:text-white focus:outline-none font-mono"
                  placeholder="0.00"
                />
                <div class="relative shrink-0 pr-1">
                  <select 
                    id="converter-from-select"
                    onchange="window.AgentGuardViews.handleFromCurrencyChange(this.value)"
                    class="h-10 px-3 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 rounded-xl text-xs font-bold text-primary-dark dark:text-white focus:outline-none cursor-pointer">
                    ${WORLD_CURRENCIES.map(c => `
                      <option value="${c.code}" ${c.code === currentFromCode ? 'selected' : ''}>
                        ${c.flag} ${c.code} - ${c.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>

            <!-- Swap Currencies Button (Col 6) -->
            <div class="lg:col-span-1 flex justify-center py-2 lg:py-0">
              <button 
                type="button"
                onclick="window.AgentGuardViews.swapConverterCurrencies()"
                class="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-primary border border-primary/20 flex items-center justify-center transition-all shadow-xs"
                title="Swap Currencies">
                ${getIcon('refresh-cw', 'w-5 h-5')}
              </button>
            </div>

            <!-- Recipient Receives Amount & Currency (Cols 7-11) -->
            <div class="lg:col-span-5 space-y-2">
              <label class="block text-xs font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                Recipient Receives
              </label>
              <div class="flex items-center rounded-2xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 p-2 focus-within:border-primary transition-all">
                <span class="pl-2 pr-1 text-base font-bold text-text-muted font-mono">${toCurr.symbol}</span>
                <input 
                  type="text" 
                  readonly
                  value="${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"
                  class="w-full h-11 px-2 bg-transparent text-xl font-extrabold text-status-approved focus:outline-none font-mono"
                />
                <div class="relative shrink-0 pr-1">
                  <select 
                    id="converter-to-select"
                    onchange="window.AgentGuardViews.handleToCurrencyChange(this.value)"
                    class="h-10 px-3 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 rounded-xl text-xs font-bold text-primary-dark dark:text-white focus:outline-none cursor-pointer">
                    ${WORLD_CURRENCIES.map(c => `
                      <option value="${c.code}" ${c.code === currentToCode ? 'selected' : ''}>
                        ${c.flag} ${c.code} - ${c.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>

          </div>

          <!-- Conversion Rate Breakdown & Action Bar -->
          <div class="p-5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div class="space-y-0.5">
              <div class="font-bold text-primary-dark dark:text-white text-base font-mono">
                1 ${fromCurr.code} = ${singleUnitRate.toFixed(4)} ${toCurr.code}
              </div>
              <div class="text-text-muted dark:text-slate-400 text-xs">
                Inverse exchange rate: 1 ${toCurr.code} = ${inverseUnitRate.toFixed(4)} ${fromCurr.code}
              </div>
            </div>

            <!-- Explicit Convert & Recalculate Button as requested -->
            <div class="flex items-center gap-3">
              <button 
                type="button"
                onclick="window.AgentGuardViews.executeConvert()"
                class="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2">
                ${getIcon('check', 'w-4 h-4')}
                <span>Convert</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Popular World Currencies Quick Table -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-surface-border dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-surface-border dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-primary-dark dark:text-white">Popular World Currency Benchmarks</h3>
              <p class="text-xs text-text-muted dark:text-slate-400">Click any currency below to immediately calculate relative to 1 USD.</p>
            </div>
            <span class="text-xs text-text-muted font-mono">Base: 1 USD</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            ${WORLD_CURRENCIES.slice(0, 18).map(c => `
              <button 
                type="button"
                onclick="window.AgentGuardViews.selectQuickCurrency('${c.code}')"
                class="p-3.5 rounded-2xl bg-surface-bg dark:bg-slate-800 hover:border-primary border border-surface-border dark:border-slate-700 text-left transition-all">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-lg">${c.flag}</span>
                  <span class="text-[10px] font-bold text-text-muted uppercase font-mono">${c.code}</span>
                </div>
                <div class="font-extrabold text-primary-dark dark:text-white text-xs font-mono">${c.symbol}${c.rate.toFixed(2)}</div>
                <div class="text-[10px] text-text-muted truncate mt-0.5">${c.name}</div>
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['currency-converter'] = render;

  window.AgentGuardViews.handleCurrencyAmountChange = function(val) {
    currentAmount = parseFloat(val) || 0;
    const fromCurr = WORLD_CURRENCIES.find(c => c.code === currentFromCode) || WORLD_CURRENCIES[0];
    const toCurr = WORLD_CURRENCIES.find(c => c.code === currentToCode) || WORLD_CURRENCIES[1];
    const converted = (currentAmount / fromCurr.rate) * toCurr.rate;

    const outInput = document.querySelector('input[readonly]');
    if (outInput) {
      outInput.value = converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  window.AgentGuardViews.handleFromCurrencyChange = function(code) {
    currentFromCode = code;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.handleToCurrencyChange = function(code) {
    currentToCode = code;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.swapConverterCurrencies = function() {
    const temp = currentFromCode;
    currentFromCode = currentToCode;
    currentToCode = temp;
    window.AgentGuardApp.renderActiveView();
    window.AgentGuardApp.showToast(`Swapped currencies to ${currentFromCode} → ${currentToCode}`, 'info');
  };

  window.AgentGuardViews.selectQuickCurrency = function(code) {
    currentToCode = code;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.executeConvert = function() {
    window.AgentGuardApp.showToast(`Converted $${currentAmount.toLocaleString()} ${currentFromCode} successfully.`, 'success');
  };

  window.AgentGuardViews.refreshRates = function() {
    fetchLiveExchangeRates();
  };

})(window);
