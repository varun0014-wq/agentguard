// View: Monthly Spending Dashboard (Accurate to Reference Screenshot Layout)
(function(window) {
  'use strict';

  let selectedPeriod = 'monthly'; // 'daily' | 'weekly' | 'monthly' | 'quarterly'
  let filterCategory = 'all';
  let filterSpender = 'all';
  let ledgerQuery = '';

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;

    // Period specific calculations
    let periodLabel = 'February 2026';
    let totalSpend = state.financials.monthlySpend;
    let spendCap = state.financials.monthlyCap;
    let aiSpend = 31240.00;
    let manualSpend = 11070.80;
    let projectionSpend = 59400.00;
    let trajectoryPoints = [
      { label: 'Week 1 (Feb 1–7)', x: 0, y: 215, val: '$11.2k' },
      { label: 'Week 2 (Feb 8–14)', x: 140, y: 180, val: '$24.6k' },
      { label: 'Week 3 (Feb 15–21)', x: 290, y: 145, val: '$35.8k' },
      { label: 'Today (Feb 18)', x: 450, y: 78, val: '$42.3k', active: true },
      { label: 'Week 4 (Close)', x: 700, y: 120, val: '$59.4k', projection: true }
    ];

    if (selectedPeriod === 'daily') {
      periodLabel = 'Today (Feb 18, 2026)';
      totalSpend = state.financials.dailySpend || 3120.40;
      spendCap = state.financials.dailyCap || 8000.00;
      aiSpend = 2450.00;
      manualSpend = 670.40;
      projectionSpend = 4200.00;
      trajectoryPoints = [
        { label: '12 AM', x: 0, y: 210, val: '$200' },
        { label: '6 AM', x: 140, y: 190, val: '$850' },
        { label: '12 PM', x: 290, y: 150, val: '$1.8k' },
        { label: '4 PM (Now)', x: 450, y: 85, val: '$3.1k', active: true },
        { label: '11:59 PM', x: 700, y: 110, val: '$4.2k', projection: true }
      ];
    } else if (selectedPeriod === 'weekly') {
      periodLabel = 'This Week (Feb 12–18)';
      totalSpend = state.financials.weeklySpend || 9840.50;
      spendCap = 17000.00;
      aiSpend = 7230.00;
      manualSpend = 2610.50;
      projectionSpend = 14500.00;
      trajectoryPoints = [
        { label: 'Mon', x: 0, y: 215, val: '$1.2k' },
        { label: 'Tue', x: 140, y: 175, val: '$3.8k' },
        { label: 'Wed', x: 290, y: 130, val: '$6.5k' },
        { label: 'Thu (Today)', x: 450, y: 80, val: '$9.8k', active: true },
        { label: 'Sun', x: 700, y: 115, val: '$14.5k', projection: true }
      ];
    } else if (selectedPeriod === 'quarterly') {
      periodLabel = 'Q1 2026 (Jan–Mar)';
      totalSpend = 124500.00;
      spendCap = 204000.00;
      aiSpend = 91800.00;
      manualSpend = 32700.00;
      projectionSpend = 178000.00;
      trajectoryPoints = [
        { label: 'Jan Actual', x: 0, y: 210, val: '$39k' },
        { label: 'Jan Close', x: 140, y: 170, val: '$82k' },
        { label: 'Feb MTD', x: 290, y: 125, val: '$124.5k' },
        { label: 'Mid-Q1 (Now)', x: 450, y: 75, val: '$124.5k', active: true },
        { label: 'End of Q1', x: 700, y: 105, val: '$178k', projection: true }
      ];
    }

    const spendPct = ((totalSpend / spendCap) * 100).toFixed(1);
    const spendLeft = (spendCap - totalSpend).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const aiSharePct = ((aiSpend / totalSpend) * 100).toFixed(1);
    const manualSharePct = ((manualSpend / totalSpend) * 100).toFixed(1);

    const quotas = state.quotas || [
      { name: 'Engineering & DevOps', tag: 'Autonomous Cloud Provisioning', spent: 18400.00, cap: 25000, pct: 73.6, status: 'Active Bounds', statusColor: 'emerald' },
      { name: 'Cloud Infrastructure', tag: 'Core Server Hosting & Failover', spent: 9120.00, cap: 15000, pct: 60.8, status: 'Active Bounds', statusColor: 'emerald' },
      { name: 'Travel & Hospitality', tag: 'Employee Corporate Bookings', spent: 6770.00, cap: 8000, pct: 84.6, status: 'Quota Warning', statusColor: 'amber' },
      { name: 'Marketing & Ad Campaigns', tag: 'Search & Social Bidding', spent: 4850.00, cap: 10000, pct: 48.5, status: 'Active Bounds', statusColor: 'cyan' }
    ];

    const filteredLedger = state.ledger.filter(item => {
      const matchQuery = !ledgerQuery || 
        item.recipient.toLowerCase().includes(ledgerQuery.toLowerCase()) || 
        item.initiator.toLowerCase().includes(ledgerQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(ledgerQuery.toLowerCase());
      
      const matchCategory = filterCategory === 'all' || (item.category && item.category.toLowerCase().includes(filterCategory.toLowerCase()));
      const matchSpender = filterSpender === 'all' || item.initiator.toLowerCase().includes(filterSpender.toLowerCase());

      return matchQuery && matchCategory && matchSpender;
    });

    return `
      <div class="max-w-[1400px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <!-- Breadcrumb & Status Navigation -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted dark:text-slate-400">
          <div class="flex items-center gap-1.5">
            <span>AgentGuard Financials</span>
            ${getIcon('chevron-right', 'w-3.5 h-3.5 text-text-muted')}
            <span>Expenses</span>
            ${getIcon('chevron-right', 'w-3.5 h-3.5 text-text-muted')}
            <span class="text-primary font-bold">Monthly Spending</span>
          </div>
          <div class="flex items-center gap-2 font-mono text-[11px]">
            <span class="w-2 h-2 rounded-full bg-status-approved"></span>
            <span class="text-text-main dark:text-slate-200 font-semibold">Ledger Sync: Real-Time</span>
            <span>•</span>
            <span class="text-text-muted">PayPal Core Protection</span>
          </div>
        </div>

        <!-- Title & Action Control Bar -->
        <section class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-extrabold tracking-tight text-primary-dark dark:text-white">
                Monthly Spending & Expense Breakdown
              </h1>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-sky-300 border border-primary/20 tracking-wide uppercase">
                Active Tracking
              </span>
            </div>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time telemetry of corporate expenditures, autonomous AI agent spending, and department budgets authenticated through PayPal.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Range Selector Pills: Daily, Weekly, Monthly, Quarterly -->
            <div class="bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-xl p-1 flex text-xs font-semibold text-text-muted">
              <button 
                onclick="window.AgentGuardViews.setSpendingPeriod('daily')" 
                class="px-3 py-1.5 rounded-lg transition-all ${selectedPeriod === 'daily' ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs' : 'hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
                Daily
              </button>
              <button 
                onclick="window.AgentGuardViews.setSpendingPeriod('weekly')" 
                class="px-3 py-1.5 rounded-lg transition-all ${selectedPeriod === 'weekly' ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs' : 'hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
                Weekly
              </button>
              <button 
                onclick="window.AgentGuardViews.setSpendingPeriod('monthly')" 
                class="px-3 py-1.5 rounded-lg transition-all ${selectedPeriod === 'monthly' ? 'bg-primary text-white font-bold shadow-xs' : 'hover:text-text-main dark:text-slate-400 dark:hover:text-white'} flex items-center gap-1.5">
                <span>${periodLabel}</span>
              </button>
              <button 
                onclick="window.AgentGuardViews.setSpendingPeriod('quarterly')" 
                class="px-3 py-1.5 rounded-lg transition-all ${selectedPeriod === 'quarterly' ? 'bg-white dark:bg-slate-900 text-primary font-bold shadow-xs' : 'hover:text-text-main dark:text-slate-400 dark:hover:text-white'}">
                Quarterly
              </button>
            </div>

            <!-- Export Report Button -->
            <button 
              onclick="window.AgentGuardViews.exportSpendingCsv()" 
              class="bg-white dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-text-main dark:text-slate-200 hover:bg-surface-bg dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors">
              ${getIcon('download', 'w-4 h-4 text-text-muted')}
              <span>Export Report</span>
            </button>

            <!-- Set Budget Limit Button -->
            <button 
              onclick="window.AgentGuardViews.openBudgetModal()" 
              class="bg-primary hover:bg-secondary text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors">
              ${getIcon('sliders', 'w-4 h-4')}
              <span>Set Budget Limit</span>
            </button>
          </div>
        </section>

        <!-- Waiting for Approval Box (Explicit White Background in Light Mode, High Contrast) -->
        ${state.pendingApprovals && state.pendingApprovals.length > 0 ? `
          <div class="bg-white dark:bg-slate-900 border-2 border-primary/25 dark:border-primary/40 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-accent-orange border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                ${getIcon('clock', 'w-6 h-6')}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-extrabold text-primary-dark dark:text-white">Waiting for Approval</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-mono">
                    ${state.pendingApprovals.length} Pending
                  </span>
                </div>
                <p class="text-xs text-text-muted dark:text-slate-300 mt-0.5 font-medium">
                  <strong>$${state.pendingApprovals.reduce((s, p) => s + p.amount, 0).toFixed(2)} USD</strong> total requested by autonomous AI agents awaiting your explicit authorization before settling.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button 
                type="button"
                onclick="window.AgentGuardStore.setTab('payment-approvals')"
                class="px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2">
                <span>Review Approvals (${state.pendingApprovals.length})</span>
                ${getIcon('arrow-right', 'w-3.5 h-3.5')}
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 4 Metric Cards (Matching Screenshot) -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Total Monthly Expenditure -->
          <div class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">TOTAL EXPENDITURE</span>
                <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center">
                  ${getIcon('credit-card', 'w-4 h-4')}
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white tracking-tight font-mono">
                $${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              
              <div class="mt-3">
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-text-muted dark:text-slate-400">Cap: $${spendCap.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span class="text-primary font-bold">${spendPct}% Consumed</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-primary h-1.5 rounded-full transition-all duration-500" style="width: ${Math.min(100, spendPct)}%;"></div>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-surface-border dark:border-slate-800 flex items-center justify-between text-xs">
              <span class="text-status-approved font-semibold flex items-center gap-0.5">
                ${getIcon('arrow-up', 'w-3.5 h-3.5 text-status-approved')} +8.4% vs Jan
              </span>
              <span class="text-text-muted dark:text-slate-400 font-medium font-mono">$${spendLeft} left</span>
            </div>
          </div>

          <!-- Card 2: AI Agent Spending -->
          <div class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">AI AGENT SPENDING</span>
                <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  ${getIcon('bot', 'w-4 h-4')}
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white tracking-tight font-mono">
                $${aiSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div class="mt-3">
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-text-muted dark:text-slate-400">Share of Total Spend</span>
                  <span class="text-indigo-600 dark:text-indigo-400 font-bold">${aiSharePct}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${aiSharePct}%;"></div>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-surface-border dark:border-slate-800 flex items-center justify-between text-xs">
              <span class="text-text-muted dark:text-slate-400">1,720 micro-settlements</span>
              <span class="text-status-approved font-semibold bg-status-approved-bg px-2 py-0.5 rounded">0 Policy Violations</span>
            </div>
          </div>

          <!-- Card 3: Manual / Employee Spend -->
          <div class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">MANUAL / EMPLOYEE SPEND</span>
                <div class="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  ${getIcon('user', 'w-4 h-4')}
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white tracking-tight font-mono">
                $${manualSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div class="mt-3">
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-text-muted dark:text-slate-400">Share of Total Spend</span>
                  <span class="text-sky-600 dark:text-sky-400 font-bold">${manualSharePct}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-sky-500 h-1.5 rounded-full" style="width: ${manualSharePct}%;"></div>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-surface-border dark:border-slate-800 flex items-center justify-between text-xs">
              <span class="text-text-muted dark:text-slate-400">Corporate Card & Direct</span>
              <span class="text-primary font-semibold">41 Receipts Logged</span>
            </div>
          </div>

          <!-- Card 4: Month-End Projection / Remaining Budget -->
          <div class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-text-muted dark:text-slate-400 uppercase tracking-wider">PROJECTED CLOSE</span>
                <div class="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  ${getIcon('trending-up', 'w-4 h-4')}
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-extrabold text-primary-dark dark:text-white tracking-tight font-mono">
                $${projectionSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div class="mt-2.5 flex items-center justify-between text-xs">
                <span class="text-text-muted dark:text-slate-400">Target Cap Margin:</span>
                <span class="text-status-approved bg-status-approved-bg px-2 py-0.5 rounded font-bold font-mono">Under Cap</span>
              </div>
            </div>
            <div class="pt-3 border-t border-surface-border dark:border-slate-800 flex items-center justify-between text-xs">
              <span class="text-status-approved font-semibold flex items-center gap-1">
                ${getIcon('check-circle', 'w-3.5 h-3.5 text-status-approved')} Safe Range
              </span>
              <span class="text-text-muted dark:text-slate-400">-12.6% AI Discount</span>
            </div>
          </div>

        </section>

        <!-- Charts: Trajectory & Donut Split Grid -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Monthly Spending Trajectory & Run-Rate -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-border dark:border-slate-800">
                <div>
                  <h2 class="text-base font-bold text-primary-dark dark:text-white tracking-tight">
                    Spending Trajectory & Run-Rate
                  </h2>
                  <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
                    Real-time telemetry updated continuously from PayPal payment webhooks.
                  </p>
                </div>
                
                <div class="flex items-center gap-4 text-xs">
                  <div class="flex items-center gap-3 text-text-muted dark:text-slate-400">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      <span>Actual Spend</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <span>Benchmark</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-3 h-0.5 bg-status-blocked border-t border-dashed border-status-blocked"></span>
                      <span class="text-status-blocked font-semibold">Budget Cap</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Vector Area Chart -->
              <div class="relative mt-6 h-64 w-full">
                <div class="absolute inset-y-0 left-0 flex flex-col justify-between text-[10px] text-text-muted font-mono pr-2">
                  <span>$70k</span>
                  <span>$50k</span>
                  <span>$35k</span>
                  <span>$15k</span>
                  <span>$0k</span>
                </div>

                <div class="ml-10 h-full relative">
                  <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 230">
                    <line stroke="#E2E8F0" class="dark:stroke-slate-800" stroke-dasharray="4 4" x1="0" x2="700" y1="10" y2="10"></line>
                    <line stroke="#E2E8F0" class="dark:stroke-slate-800" stroke-dasharray="4 4" x1="0" x2="700" y1="65" y2="65"></line>
                    <line stroke="#E2E8F0" class="dark:stroke-slate-800" stroke-dasharray="4 4" x1="0" x2="700" y1="120" y2="120"></line>
                    <line stroke="#E2E8F0" class="dark:stroke-slate-800" stroke-dasharray="4 4" x1="0" x2="700" y1="175" y2="175"></line>
                    <line stroke="#CBD5E1" class="dark:stroke-slate-700" stroke-width="1" x1="0" x2="700" y1="220" y2="220"></line>
                    
                    <!-- Max Cap Red Dashed Line -->
                    <line stroke="#DC2626" stroke-dasharray="6 4" stroke-width="1.5" x1="0" x2="700" y1="20" y2="20"></line>
                    <text fill="#DC2626" font-size="10" font-weight="bold" text-anchor="end" x="690" y="16">Enforced Cap: $${spendCap.toLocaleString()} / Mo</text>

                    <!-- Gradient Definition -->
                    <defs>
                      <linearGradient id="spendBlueGradModern" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#0070BA" stop-opacity="0.35"></stop>
                        <stop offset="100%" stop-color="#0070BA" stop-opacity="0.01"></stop>
                      </linearGradient>
                    </defs>

                    <!-- Jan Benchmark Path (Grey Dashed) -->
                    <path d="M 0 210 Q 150 170, 300 135 T 500 85 T 700 45" fill="none" stroke="#94A3B8" stroke-dasharray="4 3" stroke-width="2"></path>
                    
                    <!-- Feb Actual Area Fill -->
                    <path d="M 0 215 L 140 180 L 290 145 L 450 78 L 450 220 L 0 220 Z" fill="url(#spendBlueGradModern)"></path>
                    
                    <!-- Feb Actual Line -->
                    <path d="M 0 215 L 140 180 L 290 145 L 450 78" fill="none" stroke="#0070BA" stroke-linecap="round" stroke-width="3"></path>
                    
                    <!-- Projection Line -->
                    <path d="M 450 78 L 560 100 L 700 120" fill="none" stroke="#0070BA" stroke-dasharray="4 4" stroke-width="2"></path>

                    <circle cx="140" cy="180" fill="#FFFFFF" r="4" stroke="#0070BA" stroke-width="2.5"></circle>
                    <circle cx="290" cy="145" fill="#FFFFFF" r="4" stroke="#0070BA" stroke-width="2.5"></circle>
                    <circle cx="450" cy="78" fill="#142C4C" r="6" stroke="#FFFFFF" stroke-width="2.5"></circle>
                    <circle cx="700" cy="120" fill="#FFFFFF" r="3.5" stroke="#94A3B8" stroke-width="2"></circle>
                  </svg>

                  <!-- Tooltip Callout -->
                  <div class="absolute left-[64%] top-3 -translate-x-1/2 bg-primary-dark text-white p-2.5 rounded-xl shadow-xl text-center pointer-events-none z-10 border border-slate-700">
                    <div class="text-[9px] uppercase tracking-wider text-slate-300 font-bold">CURRENT SPEND</div>
                    <div class="text-xs font-bold text-white font-mono">$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="text-[9px] text-emerald-300 font-semibold">Under Week Cap by $4,150</div>
                  </div>
                </div>

                <div class="ml-10 mt-2 flex justify-between text-[11px] text-text-muted dark:text-slate-400 font-medium">
                  ${trajectoryPoints.map(p => `
                    <span class="${p.active ? 'text-primary font-bold' : ''}">${p.label}</span>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Bottom Protection Summary Pill -->
            <div class="mt-8 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-slate-700 text-primary flex items-center justify-center shrink-0">
                  ${getIcon('shield-check', 'w-4 h-4 text-primary')}
                </div>
                <div>
                  <span class="font-bold text-primary-dark dark:text-white">Active Rate-Limiting Protection:</span>
                  <span class="text-text-muted dark:text-slate-300">Prevented $4,850.00 in redundant cloud API billing this month.</span>
                </div>
              </div>
              <button 
                onclick="window.AgentGuardStore.setTab('security-monitoring')" 
                class="text-primary hover:underline font-bold text-xs flex items-center gap-1 shrink-0">
                View Security Log →
              </button>
            </div>
          </div>

          <!-- Right 1 Col: Category-wise Distribution Donut -->
          <div class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-surface-border dark:border-slate-800">
                <h2 class="text-base font-bold text-primary-dark dark:text-white tracking-tight">Category Distribution</h2>
                <span class="text-xs font-bold text-primary">4 Categories</span>
              </div>
              <p class="text-xs text-text-muted dark:text-slate-400 mt-1">Expenses verified across all business units.</p>

              <!-- Donut Chart -->
              <div class="flex items-center justify-center my-6">
                <div class="relative w-44 h-44">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="38" stroke="#F1F5F9" class="dark:stroke-slate-800" stroke-width="12"></circle>
                    <circle cx="50" cy="50" fill="none" r="38" stroke="#0070BA" stroke-dasharray="100.3 238.76" stroke-dashoffset="0" stroke-width="12"></circle>
                    <circle cx="50" cy="50" fill="none" r="38" stroke="#1546A0" stroke-dasharray="66.8 238.76" stroke-dashoffset="-100.3" stroke-width="12"></circle>
                    <circle cx="50" cy="50" fill="none" r="38" stroke="#38BDF8" stroke-dasharray="38.2 238.76" stroke-dashoffset="-167.1" stroke-width="12"></circle>
                    <circle cx="50" cy="50" fill="none" r="38" stroke="#818CF8" stroke-dasharray="33.4 238.76" stroke-dashoffset="-205.3" stroke-width="12"></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="text-[9px] uppercase tracking-wider text-text-muted dark:text-slate-400 font-bold">TOTAL VERIFIED</span>
                    <span class="text-xl font-black text-primary-dark dark:text-white font-mono leading-tight">$${(totalSpend / 1000).toFixed(1)}k</span>
                    <span class="text-[10px] text-status-approved font-bold">100% Reconciled</span>
                  </div>
                </div>
              </div>

              <!-- Category Breakdown List -->
              <div class="space-y-3 pt-1 text-xs">
                <div class="flex items-center justify-between">
                  <div class="flex items-start gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0"></span>
                    <div>
                      <div class="font-bold text-text-main dark:text-slate-100">Cloud & Infrastructure</div>
                      <div class="text-[11px] text-text-muted dark:text-slate-400">AWS, GCP, OpenAI APIs</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-text-main dark:text-slate-100 font-mono">$17,770.50</div>
                    <div class="text-[10px] text-status-approved font-semibold">42% • +5.1% MoM</div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-start gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-secondary mt-1 shrink-0"></span>
                    <div>
                      <div class="font-bold text-text-main dark:text-slate-100">Enterprise Software</div>
                      <div class="text-[11px] text-text-muted dark:text-slate-400">GitHub, Datadog, Slack, Figma</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-text-main dark:text-slate-100 font-mono">$11,847.00</div>
                    <div class="text-[10px] text-text-muted dark:text-slate-400 font-semibold">28% • -1.4% MoM</div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-start gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#38BDF8] mt-1 shrink-0"></span>
                    <div>
                      <div class="font-bold text-text-main dark:text-slate-100">Corporate Travel</div>
                      <div class="text-[11px] text-text-muted dark:text-slate-400">Delta, United, Marriott</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-text-main dark:text-slate-100 font-mono">$6,769.30</div>
                    <div class="text-[10px] text-accent-orange font-semibold">16% • +14.2% MoM</div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-start gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#818CF8] mt-1 shrink-0"></span>
                    <div>
                      <div class="font-bold text-text-main dark:text-slate-100">AI Model Tokens</div>
                      <div class="text-[11px] text-text-muted dark:text-slate-400">Anthropic Claude, Perplexity Pro</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-text-main dark:text-slate-100 font-mono">$5,924.00</div>
                    <div class="text-[10px] text-text-muted dark:text-slate-400 font-semibold">14% • -8.9% MoM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        <!-- Departmental & Agent Spending Breakdown -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-primary-dark dark:text-white tracking-tight">
                Departmental & Agent Spending Breakdown
              </h2>
              <p class="text-xs text-text-muted dark:text-slate-400">
                Consumption limits and quotas enforced across individual departments and autonomous agents.
              </p>
            </div>
            <button 
              onclick="window.AgentGuardViews.openBudgetModal()" 
              class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Adjust Quota Caps</span>
              ${getIcon('sliders', 'w-3.5 h-3.5')}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${quotas.map(q => `
              <div class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                <div class="flex items-center justify-between gap-2 text-[10px] font-bold">
                  <span class="text-text-muted dark:text-slate-400 uppercase tracking-wider truncate" title="${q.tag}">${q.tag}</span>
                  <span class="whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                    q.statusColor === 'amber'
                      ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60'
                      : 'text-status-approved bg-status-approved-bg border border-status-approved/20'
                  }">
                    ${q.status}
                  </span>
                </div>
                <h3 class="font-bold text-primary-dark dark:text-white text-sm">${q.name}</h3>
                
                <div>
                  <div class="text-xs text-text-muted dark:text-slate-400 flex justify-between font-mono mb-1">
                    <span class="font-bold text-primary-dark dark:text-white">$${q.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span>of $${(q.cap / 1000).toFixed(0)}k Cap</span>
                  </div>
                  <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div class="${q.pct > 80 ? 'bg-accent-orange' : 'bg-primary'} h-1.5 rounded-full" style="width: ${q.pct}%;"></div>
                  </div>
                </div>

                <div class="flex justify-between text-[11px] text-text-muted dark:text-slate-400 pt-2 border-t border-surface-border dark:border-slate-800">
                  <span>${q.pct}% used</span>
                  <span class="font-mono font-bold text-text-main dark:text-slate-200">$${(q.cap - q.spent).toLocaleString('en-US', { minimumFractionDigits: 0 })} left</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Transaction Ledger Table with Search & Filters -->
        <section class="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden space-y-4 p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-surface-border dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-primary-dark dark:text-white">Recent Spending Ledger</h3>
              <p class="text-xs text-text-muted dark:text-slate-400">All machine and user payments logged in current accounting period.</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Search Input -->
              <div class="relative w-64">
                <input 
                  type="text" 
                  value="${ledgerQuery}"
                  oninput="window.AgentGuardViews.setSpendingQuery(this.value)"
                  placeholder="Search recipient or agent..." 
                  class="w-full h-9 pl-3 pr-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <!-- Filter Category -->
              <select 
                onchange="window.AgentGuardViews.setSpendingCategory(this.value)"
                class="h-9 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-200 font-semibold focus:outline-none cursor-pointer">
                <option value="all" ${filterCategory === 'all' ? 'selected' : ''}>All Categories</option>
                <option value="cloud" ${filterCategory === 'cloud' ? 'selected' : ''}>Cloud & Infrastructure</option>
                <option value="saas" ${filterCategory === 'saas' ? 'selected' : ''}>SaaS Subscriptions</option>
                <option value="travel" ${filterCategory === 'travel' ? 'selected' : ''}>Travel</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-[11px] text-text-muted dark:text-slate-400 uppercase tracking-wider border-b border-surface-border dark:border-slate-800">
                  <th class="py-3 px-3">Transaction</th>
                  <th class="py-3 px-3">Recipient</th>
                  <th class="py-3 px-3">Initiator</th>
                  <th class="py-3 px-3">Date</th>
                  <th class="py-3 px-3 text-right">Amount</th>
                  <th class="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-border dark:divide-slate-800 font-medium">
                ${filteredLedger.slice(0, 8).map(row => `
                  <tr class="hover:bg-surface-bg dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-3 font-mono text-primary dark:text-sky-400 font-semibold text-[11px]">${row.id}</td>
                    <td class="py-3 px-3 font-bold text-primary-dark dark:text-white">${row.recipient}</td>
                    <td class="py-3 px-3 text-text-main dark:text-slate-300">${row.initiator}</td>
                    <td class="py-3 px-3 text-text-muted dark:text-slate-400">${row.date}</td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-primary-dark dark:text-white">$${Math.abs(row.amount).toFixed(2)}</td>
                    <td class="py-3 px-3 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.statusCode === 'successful' ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        row.statusCode === 'awaiting_approval' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700' :
                        'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }">
                        ${row.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['monthly-spending'] = render;
  window.AgentGuardViews['spending-analytics'] = render;
  window.AgentGuardViews['monthly-spends'] = render;

  window.AgentGuardViews.setSpendingPeriod = function(period) {
    selectedPeriod = period;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setSpendingCategory = function(cat) {
    filterCategory = cat;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.setSpendingQuery = function(q) {
    ledgerQuery = q;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.exportSpendingCsv = function() {
    const csvContent = 'ID,Recipient,Initiator,Amount,Status,Date\n' +
      window.AgentGuardStore.state.ledger.map(l => `${l.id},"${l.recipient}","${l.initiator}",${l.amount},${l.status},"${l.date}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Spending_Report_${selectedPeriod}_2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.AgentGuardApp.showToast('Spending report CSV exported successfully.', 'success');
  };

  window.AgentGuardViews.openBudgetModal = function() {
    const modal = document.getElementById('budget-limit-modal');
    if (modal) {
      const input = document.getElementById('budget-limit-input');
      if (input) input.value = window.AgentGuardStore.state.financials.monthlyCap;
      modal.classList.remove('hidden');
    }
  };

  window.AgentGuardViews.closeBudgetModal = function() {
    const modal = document.getElementById('budget-limit-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.AgentGuardViews.saveBudgetLimit = function() {
    const input = document.getElementById('budget-limit-input');
    const val = parseFloat(input ? input.value : 0);
    if (val && val > 0) {
      window.AgentGuardStore.state.financials.monthlyCap = val;
      window.AgentGuardViews.closeBudgetModal();
      window.AgentGuardApp.showToast(`Monthly budget limit updated to $${val.toLocaleString()}`, 'success');
      window.AgentGuardStore.notify();
    } else {
      window.AgentGuardApp.showToast('Please enter a valid budget limit amount', 'warning');
    }
  };

})(window);
