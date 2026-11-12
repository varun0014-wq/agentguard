// View 4: Transaction History (Clean, Simple Table with Date, Month, Year & Status Filters)
(function(window) {
  'use strict';

  let searchQuery = '';
  let statusFilter = 'all'; // 'all' | 'successful' | 'awaiting_approval' | 'blocked'
  let yearFilter = 'all';   // 'all' | '2026' | '2025' | '2024'
  let monthFilter = 'all';  // 'all' | 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec'
  let quickDateFilter = 'all'; // 'all' | 'today' | 'yesterday' | 'past7' | 'past30'
  let customDateFilter = '';

  const MONTHS = [
    { code: 'all', label: 'All Months' },
    { code: 'Jan', label: 'January' },
    { code: 'Feb', label: 'February' },
    { code: 'Mar', label: 'March' },
    { code: 'Apr', label: 'April' },
    { code: 'May', label: 'May' },
    { code: 'Jun', label: 'June' },
    { code: 'Jul', label: 'July' },
    { code: 'Aug', label: 'August' },
    { code: 'Sep', label: 'September' },
    { code: 'Oct', label: 'October' },
    { code: 'Nov', label: 'November' },
    { code: 'Dec', label: 'December' }
  ];

  const YEARS = ['all', '2026', '2025', '2024'];

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;

    // Filter transactions by Search, Status, Year, Month, and Date
    const filteredLedger = state.ledger.filter(txn => {
      // 1. Search Query
      const matchSearch = !searchQuery ||
        txn.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.initiator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (txn.detail && txn.detail.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status
      const matchStatus = statusFilter === 'all' || txn.statusCode === statusFilter;

      // 3. Year
      const matchYear = yearFilter === 'all' || txn.date.includes(yearFilter);

      // 4. Month
      const matchMonth = monthFilter === 'all' || txn.date.includes(monthFilter);

      // 5. Quick Date / Custom Date
      let matchDate = true;
      if (quickDateFilter === 'today') {
        matchDate = txn.date.includes('Nov 10') || txn.date.toLowerCase().includes('today');
      } else if (quickDateFilter === 'yesterday') {
        matchDate = txn.date.includes('Nov 09') || txn.date.toLowerCase().includes('yesterday');
      } else if (quickDateFilter === 'past7') {
        matchDate = txn.date.includes('Nov 04') || txn.date.includes('Nov 05') || txn.date.includes('Nov 07') || txn.date.includes('Nov 08') || txn.date.includes('Nov 09') || txn.date.includes('Nov 10');
      } else if (customDateFilter) {
        matchDate = txn.date.includes(customDateFilter);
      }

      return matchSearch && matchStatus && matchYear && matchMonth && matchDate;
    });

    const activeFilterCount = (searchQuery ? 1 : 0) + 
      (statusFilter !== 'all' ? 1 : 0) + 
      (yearFilter !== 'all' ? 1 : 0) + 
      (monthFilter !== 'all' ? 1 : 0) + 
      (quickDateFilter !== 'all' || customDateFilter ? 1 : 0);

    return `
      <div class="max-w-[1240px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm transition-colors">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-primary uppercase tracking-wider">Financial Records</span>
              <span class="text-xs text-text-muted">•</span>
              <span class="text-xs font-mono text-status-approved font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-status-approved animate-pulse"></span>
                Real-Time Ledger
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-primary-dark dark:text-white tracking-tight">Transactions & Activity</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-1 max-w-2xl">
              Inspect all autonomous agent micro-settlements, team disbursements, pending approvals, and security-blocked requests.
            </p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button 
              type="button"
              onclick="window.AgentGuardApp.exportIncidentReport()" 
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-text-main dark:text-slate-200 border border-surface-border dark:border-slate-700 transition-all shadow-xs">
              ${getIcon('download', 'w-4 h-4 text-primary')}
              <span>Download Statement (CSV)</span>
            </button>
          </div>
        </div>

        <!-- Comprehensive Filter Controls: Date, Month, Year & Status -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          
          <!-- Top Row: Search & Status -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            <!-- Search Box (Cols 1-7) -->
            <div class="md:col-span-7 relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-slate-400">
                ${getIcon('search', 'w-4 h-4')}
              </span>
              <input 
                type="text" 
                placeholder="Search by recipient, agent, transaction ID, or note..." 
                value="${searchQuery}" 
                oninput="window.AgentGuardViews.setTxnSearch(this.value)"
                class="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <!-- Status Filter (Cols 8-12) -->
            <div class="md:col-span-5">
              <select 
                onchange="window.AgentGuardViews.setTxnStatusFilter(this.value)" 
                class="w-full h-11 px-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-200 font-semibold focus:outline-none focus:border-primary cursor-pointer transition-colors">
                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Payment Statuses</option>
                <option value="successful" ${statusFilter === 'successful' ? 'selected' : ''}>✓ Paid / Approved</option>
                <option value="awaiting_approval" ${statusFilter === 'awaiting_approval' ? 'selected' : ''}>⏳ Waiting for Approval</option>
                <option value="blocked" ${statusFilter === 'blocked' ? 'selected' : ''}>✕ Blocked by Firewall</option>
              </select>
            </div>

          </div>

          <!-- Bottom Row: Date, Month & Year Dropdowns (As explicitly requested by user) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-surface-border dark:border-slate-800">
            
            <!-- 1. Year Filter -->
            <div>
              <label class="block text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                Year
              </label>
              <select 
                onchange="window.AgentGuardViews.setTxnYearFilter(this.value)"
                class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs font-semibold text-text-main dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer">
                <option value="all" ${yearFilter === 'all' ? 'selected' : ''}>All Years</option>
                <option value="2026" ${yearFilter === '2026' ? 'selected' : ''}>2026 (Current)</option>
                <option value="2025" ${yearFilter === '2025' ? 'selected' : ''}>2025</option>
                <option value="2024" ${yearFilter === '2024' ? 'selected' : ''}>2024</option>
              </select>
            </div>

            <!-- 2. Month Filter -->
            <div>
              <label class="block text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                Month
              </label>
              <select 
                onchange="window.AgentGuardViews.setTxnMonthFilter(this.value)"
                class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs font-semibold text-text-main dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer">
                ${MONTHS.map(m => `
                  <option value="${m.code}" ${monthFilter === m.code ? 'selected' : ''}>${m.label}</option>
                `).join('')}
              </select>
            </div>

            <!-- 3. Quick Date Range -->
            <div>
              <label class="block text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <select 
                onchange="window.AgentGuardViews.setTxnQuickDateFilter(this.value)"
                class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs font-semibold text-text-main dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer">
                <option value="all" ${quickDateFilter === 'all' ? 'selected' : ''}>All Dates</option>
                <option value="today" ${quickDateFilter === 'today' ? 'selected' : ''}>Today (Nov 10)</option>
                <option value="yesterday" ${quickDateFilter === 'yesterday' ? 'selected' : ''}>Yesterday (Nov 09)</option>
                <option value="past7" ${quickDateFilter === 'past7' ? 'selected' : ''}>Past 7 Days</option>
              </select>
            </div>

            <!-- 4. Specific Date Finder -->
            <div>
              <label class="block text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                Find Exact Day
              </label>
              <input 
                type="text" 
                placeholder="e.g. Nov 10 or 08" 
                value="${customDateFilter}"
                oninput="window.AgentGuardViews.setTxnCustomDate(this.value)"
                class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

          </div>

          <!-- Active Filter Pill Bar & Counter -->
          <div class="flex items-center justify-between text-xs text-text-muted dark:text-slate-400 pt-1">
            <div class="flex items-center gap-2">
              <span>Showing <strong class="text-primary-dark dark:text-white font-mono">${filteredLedger.length}</strong> of ${state.ledger.length} transactions</span>
              ${activeFilterCount > 0 ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-primary border border-primary/20">
                  ${activeFilterCount} active filters
                </span>
              ` : ''}
            </div>

            ${activeFilterCount > 0 ? `
              <button 
                type="button"
                onclick="window.AgentGuardViews.clearTxnFilters()" 
                class="text-primary hover:underline font-bold text-xs flex items-center gap-1">
                <span>Reset All Filters</span>
                ${getIcon('rotate-ccw', 'w-3 h-3')}
              </button>
            ` : ''}
          </div>

        </div>

        <!-- Transactions Ledger Table (Full Dark Mode & Box Shadows) -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-surface-bg dark:bg-slate-800/90 border-b border-surface-border dark:border-slate-700 text-[11px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">
                  <th class="py-3.5 px-4">Transaction & Recipient</th>
                  <th class="py-3.5 px-4">Initiator</th>
                  <th class="py-3.5 px-4">Date & Time</th>
                  <th class="py-3.5 px-4 text-right">Amount (USD)</th>
                  <th class="py-3.5 px-4 text-center">Status</th>
                  <th class="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-border dark:divide-slate-800 font-medium">
                ${filteredLedger.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-14 text-center text-text-muted dark:text-slate-400">
                      <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
                        ${getIcon('search', 'w-5 h-5')}
                      </div>
                      <p class="font-bold text-sm text-primary-dark dark:text-white">No transactions found</p>
                      <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">Try adjusting your date, month, year, or search criteria.</p>
                      <button onclick="window.AgentGuardViews.clearTxnFilters()" class="mt-3 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs">
                        Clear All Filters
                      </button>
                    </td>
                  </tr>
                ` : filteredLedger.map(row => {
                  const isPaid = row.statusCode === 'successful';
                  const isWaiting = row.statusCode === 'awaiting_approval';
                  const isBlocked = row.statusCode === 'blocked';

                  return `
                    <tr class="hover:bg-surface-bg/70 dark:hover:bg-slate-800/50 transition-colors">
                      <!-- Recipient & Details -->
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2.5">
                          <div class="w-8 h-8 rounded-xl ${
                            isPaid ? 'bg-status-approved-bg text-status-approved' :
                            isWaiting ? 'bg-amber-50 dark:bg-amber-950/70 text-accent-orange dark:text-amber-300' : 'bg-red-50 dark:bg-red-950/70 text-status-blocked dark:text-red-300'
                          } flex items-center justify-center shrink-0">
                            ${isPaid ? getIcon('check', 'w-4 h-4') : isWaiting ? getIcon('clock', 'w-4 h-4') : getIcon('shield-x', 'w-4 h-4')}
                          </div>
                          <div>
                            <div class="font-bold text-primary-dark dark:text-white text-xs">${row.recipient}</div>
                            <div class="text-[11px] text-text-muted dark:text-slate-400 font-mono">${row.id} • ${row.detail || 'Service expense'}</div>
                          </div>
                        </div>
                      </td>

                      <!-- Initiator -->
                      <td class="py-3.5 px-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          row.isAgent ? 'bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-sky-300 border border-primary/20' : 'bg-surface-bg dark:bg-slate-800 text-text-main dark:text-slate-200 border border-surface-border dark:border-slate-700'
                        }">
                          ${row.isAgent ? getIcon('bot', 'w-3 h-3 text-primary') : getIcon('user', 'w-3 h-3')}
                          ${row.initiator}
                        </span>
                      </td>

                      <!-- Date & Time -->
                      <td class="py-3.5 px-4 text-text-muted dark:text-slate-400 font-mono text-xs">
                        <div class="text-text-main dark:text-slate-200 font-semibold">${row.date}</div>
                        <div class="text-[10px] text-text-muted dark:text-slate-400">${row.time}</div>
                      </td>

                      <!-- Amount -->
                      <td class="py-3.5 px-4 text-right font-extrabold font-mono text-primary-dark dark:text-white text-sm">
                        $${Math.abs(row.amount).toFixed(2)}
                      </td>

                      <!-- Status Badge -->
                      <td class="py-3.5 px-4 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                          isPaid ? 'bg-emerald-50 dark:bg-emerald-950/80 text-status-approved dark:text-emerald-400 border border-status-approved/30 dark:border-emerald-800' :
                          isWaiting ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700' :
                          'bg-red-50 dark:bg-red-950/80 text-status-blocked dark:text-red-400 border border-status-blocked/30 dark:border-red-800'
                        }">
                          ${row.status}
                        </span>
                      </td>

                      <!-- Details Button -->
                      <td class="py-3.5 px-4 text-center">
                        <button 
                          type="button"
                          onclick="window.AgentGuardViews.openTxnDetails('${row.id}')" 
                          class="p-2 rounded-xl text-primary hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors" 
                          title="View Full Ledger Details">
                          ${getIcon('eye', 'w-4 h-4 text-primary')}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['transactions'] = render;

  window.AgentGuardViews.setTxnSearch = function(val) {
    searchQuery = val;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setTxnStatusFilter = function(val) {
    statusFilter = val;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setTxnYearFilter = function(val) {
    yearFilter = val;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setTxnMonthFilter = function(val) {
    monthFilter = val;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setTxnQuickDateFilter = function(val) {
    quickDateFilter = val;
    customDateFilter = '';
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setTxnCustomDate = function(val) {
    customDateFilter = val;
    quickDateFilter = 'all';
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.clearTxnFilters = function() {
    searchQuery = '';
    statusFilter = 'all';
    yearFilter = 'all';
    monthFilter = 'all';
    quickDateFilter = 'all';
    customDateFilter = '';
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.openTxnDetails = function(id) {
    if (window.AgentGuardApp && typeof window.AgentGuardApp.openTxnDetails === 'function') {
      window.AgentGuardApp.openTxnDetails(id);
    }
  };

})(window);