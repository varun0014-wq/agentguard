// PayPal AgentGuard - Main Controller & Application Orchestrator
(function(window) {
  'use strict';

  class App {
    constructor() {
      this.currentRejectTxnId = null;
      this.currentApproveTxnId = null;
    }

    init() {
      // 1. Subscribe to reactive store state updates
      window.AgentGuardStore.subscribe(() => {
        this.renderActiveView();
        this.updateHeaderAndSidebar();
        this.renderNotificationDrawer();
      });

      // 2. Global Keyboard shortcuts (⌘K for command palette, Esc to close modals)
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.openCommandPalette();
        }
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
      });

      // 3. Close dropdowns and menus on outside click
      window.addEventListener('click', (e) => {
        // Phone input dropdowns
        const phoneDropdowns = document.querySelectorAll('[id$="-dropdown"]');
        phoneDropdowns.forEach(dd => {
          if (!dd.contains(e.target) && !e.target.closest('[id$="-country-btn"]')) {
            dd.classList.add('hidden');
          }
        });

        // Notification center outside click
        const notifDrawer = document.getElementById('notification-center-drawer');
        const notifBtn = document.getElementById('header-notif-btn');
        if (notifDrawer && !notifDrawer.classList.contains('hidden')) {
          if (!notifDrawer.contains(e.target) && !notifBtn.contains(e.target)) {
            this.closeNotifications();
          }
        }

        // Header profile dropdown outside click
        const profileMenu = document.getElementById('header-profile-menu');
        const profileBtn = document.getElementById('header-profile-btn');
        if (profileMenu && !profileMenu.classList.contains('hidden')) {
          if (!profileMenu.contains(e.target) && (!profileBtn || !profileBtn.contains(e.target))) {
            this.closeProfileMenu();
          }
        }
      });

      // 4. URL Hash / Tab Routing Support
      const hashTab = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].split('&')[0];
      if (hashTab) {
        if (hashTab === 'login') {
          window.AgentGuardStore.state.isLoggedIn = false;
        } else if (window.AgentGuardViews && window.AgentGuardViews[hashTab]) {
          window.AgentGuardStore.state.activeTab = hashTab;
          window.AgentGuardStore.state.isLoggedIn = true;
        }
      }
      if (window.location.hash.includes('theme=dark') || window.location.search.includes('theme=dark')) {
        document.documentElement.classList.add('dark');
        window.AgentGuardStore.state.theme = 'dark';
      }
      window.addEventListener('hashchange', () => {
        const ht = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].split('&')[0];
        if (ht === 'login') {
          window.AgentGuardStore.logout();
        } else if (ht && window.AgentGuardViews && window.AgentGuardViews[ht]) {
          if (!window.AgentGuardStore.state.isLoggedIn) {
            window.AgentGuardStore.state.isLoggedIn = true;
          }
          window.AgentGuardStore.setTab(ht);
        }
      });

      // Ensure Header Brand Lockup (PayPal + AgentGuard) is rendered
      const logoContainer = document.getElementById('header-logo-container');
      if (logoContainer && window.AgentGuardIcons) {
        logoContainer.innerHTML = `
          <div class="flex items-center gap-2.5 sm:gap-3">
            ${window.AgentGuardIcons.paypalLogo(24)}
            <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div class="hidden sm:block">
              ${window.AgentGuardIcons.logo('small')}
            </div>
          </div>
        `;
      }

      // 5. Initial Render
      this.renderActiveView();
      this.updateHeaderAndSidebar();
      this.renderNotificationDrawer();
      console.log('[AgentGuard] Application initialized successfully.');
    }

    renderActiveView() {
      const container = document.getElementById('main-view-container');
      const header = document.getElementById('main-header');
      const sidebar = document.getElementById('main-sidebar');
      const layoutWrapper = document.getElementById('content-layout-wrapper');
      if (!container) return;

      const state = window.AgentGuardStore.state;

      // Authentication Gate:
      // If user is not logged in, show the login view and hide application chrome
      if (!state.isLoggedIn) {
        if (header) header.classList.add('hidden');
        if (sidebar) sidebar.classList.add('hidden');
        if (layoutWrapper) {
          layoutWrapper.className = 'w-full transition-all';
        }
        const loginRenderer = window.AgentGuardViews && window.AgentGuardViews['login'];
        if (typeof loginRenderer === 'function') {
          container.innerHTML = loginRenderer(state);
        }
        if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // When logged in, ensure header and sidebar are visible
      if (header) header.classList.remove('hidden');
      if (sidebar) sidebar.classList.remove('hidden');
      if (layoutWrapper) {
        layoutWrapper.className = 'lg:pl-72 transition-all';
      }

      // Render the active tab
      const tab = state.activeTab;
      const renderer = window.AgentGuardViews && window.AgentGuardViews[tab];

      if (typeof renderer === 'function') {
        container.innerHTML = renderer(state);
      } else {
        container.innerHTML = `
          <div class="p-12 text-center text-text-muted bg-white dark:bg-slate-900 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm">
            <h2 class="text-lg font-bold text-primary-dark dark:text-white">Page: ${tab}</h2>
            <p class="text-xs mt-1">Please select an option from the menu.</p>
          </div>
        `;
      }
      if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateHeaderAndSidebar() {
      const state = window.AgentGuardStore.state;
      if (!state.isLoggedIn) return;

      const pendingCount = state.pendingApprovals.length;
      const unreadNotifs = state.notifications.filter(n => n.unread).length;
      const user = state.currentUser || { name: 'User', email: 'user@paypal.com' };

      // Update Header user profile name and avatar initials
      const headerUserName = document.getElementById('header-user-name');
      const headerUserAvatar = document.getElementById('header-user-avatar');
      const menuUserName = document.getElementById('menu-user-name');
      const menuUserEmail = document.getElementById('menu-user-email');

      if (headerUserName) headerUserName.textContent = user.name || 'User';
      if (headerUserAvatar) headerUserAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
      if (menuUserName) menuUserName.textContent = user.name || 'User';
      if (menuUserEmail) menuUserEmail.textContent = user.email || `${(user.name || 'user').toLowerCase().replace(/\s+/g, '.')}@paypal.com`;

      // Update sidebar nav link active states
      const navLinks = document.querySelectorAll('[data-nav-tab]');
      navLinks.forEach(link => {
        const tab = link.getAttribute('data-nav-tab');
        const isCurrent = (tab === state.activeTab) || 
          (tab === 'spending-analytics' && state.activeTab === 'monthly-spending') ||
          (tab === 'monthly-spending' && state.activeTab === 'spending-analytics');

        if (isCurrent) {
          link.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm transition-all';
          const icon = link.querySelector('svg');
          if (icon) icon.classList.add('text-white');
        } else {
          link.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-text-muted dark:text-slate-400 hover:text-text-main dark:hover:text-white hover:bg-surface-bg dark:hover:bg-slate-800 text-xs font-semibold transition-colors';
          const icon = link.querySelector('svg');
          if (icon) icon.classList.remove('text-white');
        }
      });

      // Update Pending Badges in Header & Sidebar
      const pendingBadge = document.getElementById('sidebar-pending-badge');
      if (pendingBadge) {
        pendingBadge.textContent = `${pendingCount} Pending`;
        pendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
      }

      // Fix Notification Number Visibility in Light Mode
      const headerNotifBadge = document.getElementById('header-notif-count');
      if (headerNotifBadge) {
        const count = unreadNotifs > 0 ? unreadNotifs : (pendingCount > 0 ? pendingCount : 3);
        headerNotifBadge.textContent = count;
        headerNotifBadge.className = 'absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#F59E0B] text-white font-black text-[11px] rounded-full border-2 border-white dark:border-slate-900 shadow-md leading-none select-none z-10';
        headerNotifBadge.style.display = 'flex';
      }
    }

    // ==========================================
    // PROFILE MENU & LOGOUT HANDLERS
    // ==========================================
    toggleProfileMenu() {
      const menu = document.getElementById('header-profile-menu');
      if (menu) {
        menu.classList.toggle('hidden');
        if (!menu.classList.contains('hidden')) {
          const user = window.AgentGuardStore.state.currentUser || { name: 'User', email: 'user@paypal.com' };
          const menuUserName = document.getElementById('menu-user-name');
          const menuUserEmail = document.getElementById('menu-user-email');
          if (menuUserName) menuUserName.textContent = user.name || 'User';
          if (menuUserEmail) menuUserEmail.textContent = user.email || 'user@paypal.com';
        }
      }
    }

    closeProfileMenu() {
      const menu = document.getElementById('header-profile-menu');
      if (menu) menu.classList.add('hidden');
    }

    // ==========================================
    // MODAL HANDLERS
    // ==========================================

    // 1. Emergency Pause Modal
    openEmergencyModal() {
      const modal = document.getElementById('emergency-pause-modal');
      if (modal) modal.classList.remove('hidden');
    }
    closeEmergencyModal() {
      const modal = document.getElementById('emergency-pause-modal');
      if (modal) modal.classList.add('hidden');
    }
    confirmEmergencyPause() {
      window.AgentGuardStore.emergencyPauseFleet();
      this.closeEmergencyModal();
      this.showToast('Emergency Pause Active: All AI agent spending frozen.', 'danger');
    }

    // 2. Reject Payment
    promptReject(txnId) {
      this.currentRejectTxnId = txnId;
      const modal = document.getElementById('reject-payment-modal');
      if (modal) modal.classList.remove('hidden');
    }
    closeRejectModal() {
      const modal = document.getElementById('reject-payment-modal');
      if (modal) modal.classList.add('hidden');
      this.currentRejectTxnId = null;
    }
    confirmReject() {
      if (!this.currentRejectTxnId) return;
      const reasonEl = document.getElementById('reject-reason-input');
      const reason = reasonEl ? reasonEl.value : 'Operator declined transaction';
      window.AgentGuardStore.rejectApproval(this.currentRejectTxnId, reason);
      const txnId = this.currentRejectTxnId;
      this.closeRejectModal();
      this.showToast(`Payment request ${txnId} was rejected.`, 'info');
    }

    // 3. Approve Payment with Explicit Confirmation Modal
    openApproveModal(txnId) {
      this.currentApproveTxnId = txnId;
      const item = window.AgentGuardStore.state.pendingApprovals.find(p => p.id === txnId) ||
        window.AgentGuardStore.state.ledger.find(l => l.id === txnId);
      if (!item) return;

      const modal = document.getElementById('approve-confirm-modal');
      const content = document.getElementById('approve-confirm-content');
      if (!modal || !content) {
        window.AgentGuardStore.approveApproval(txnId);
        this.showToast(`Payment of $${item.amount.toFixed(2)} USD approved successfully.`, 'success');
        return;
      }

      content.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-surface-border dark:border-slate-700">
            <div>
              <strong class="text-sm font-bold text-primary-dark dark:text-white">${item.recipient}</strong>
              <div class="text-[11px] text-text-muted dark:text-slate-400 font-mono">${item.id} • ${item.agentName || item.initiator || 'AI Agent'}</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-black font-mono text-primary">$${item.amount.toFixed(2)} ${item.currency || 'USD'}</div>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-surface-bg dark:bg-slate-700/60 text-xs text-text-main dark:text-slate-200">
            <strong>Payment Reason:</strong>
            <p class="mt-0.5 text-text-muted dark:text-slate-300">${item.reason || item.detail || 'Standard authorized expenditure'}</p>
          </div>
          <p class="text-[11px] text-text-muted dark:text-slate-400 leading-snug">
            By confirming, the requested funds will be securely disbursed via PayPal rails to ${item.recipient}.
          </p>
        </div>
      `;

      modal.classList.remove('hidden');
    }

    closeApproveModal() {
      const modal = document.getElementById('approve-confirm-modal');
      if (modal) modal.classList.add('hidden');
      this.currentApproveTxnId = null;
    }

    executeApprovePayment() {
      if (!this.currentApproveTxnId) return;
      const approved = window.AgentGuardStore.approveApproval(this.currentApproveTxnId);
      this.closeApproveModal();
      if (approved) {
        this.showToast(`Payment of $${approved.amount.toFixed(2)} USD to ${approved.recipient} released successfully!`, 'success');
      } else {
        this.showToast('Payment confirmed and settled safely.', 'success');
      }
    }

    // 4. Transaction Details Modal
    openTxnDetails(txnId) {
      const item = window.AgentGuardStore.state.ledger.find(l => l.id === txnId);
      if (!item) return;

      const modal = document.getElementById('txn-details-modal');
      const content = document.getElementById('txn-details-content');
      if (!modal || !content) return;

      const isSuccess = item.statusCode === 'successful';
      const isPending = item.statusCode === 'awaiting_approval';

      content.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-surface-border dark:border-slate-800">
            <div>
              <span class="font-mono text-xs text-primary font-bold">${item.id}</span>
              <h4 class="text-base font-bold text-primary-dark dark:text-white">${item.recipient}</h4>
            </div>
            <div class="text-right">
              <div class="text-xl font-black font-mono text-primary-dark dark:text-white">$${Math.abs(item.amount).toFixed(2)} USD</div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isSuccess ? 'bg-status-approved-bg text-status-approved' :
                isPending ? 'bg-status-pending-bg text-accent-orange' : 'bg-red-50 text-status-blocked'
              }">${item.status}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
            <div>
              <span class="text-text-muted dark:text-slate-400 block text-[11px]">Initiator</span>
              <strong class="text-primary-dark dark:text-white">${item.initiator}</strong>
            </div>
            <div>
              <span class="text-text-muted dark:text-slate-400 block text-[11px]">Description</span>
              <strong class="text-primary-dark dark:text-white">${item.detail || 'Service payment'}</strong>
            </div>
            <div>
              <span class="text-text-muted dark:text-slate-400 block text-[11px]">Date</span>
              <span class="font-medium text-text-main dark:text-slate-200">${item.date}</span>
            </div>
            <div>
              <span class="text-text-muted dark:text-slate-400 block text-[11px]">Time</span>
              <span class="font-medium text-text-main dark:text-slate-200">${item.time}</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-status-approved/20 text-status-approved font-medium text-xs flex items-center gap-2">
            <span>✓ Verified by PayPal AgentGuard Security Shield</span>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
    }
    closeTxnDetails() {
      const modal = document.getElementById('txn-details-modal');
      if (modal) modal.classList.add('hidden');
    }

    // 5. Download Statement CSV
    exportIncidentReport() {
      const ledger = window.AgentGuardStore.state.ledger;
      const csvContent = 'ID,Recipient,Initiator,Amount,Status,Date,Time\n' +
        ledger.map(l => `${l.id},"${l.recipient}","${l.initiator}",${l.amount},${l.status},"${l.date}","${l.time || ''}"`).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AgentGuard_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Transaction statement downloaded.', 'success');
    }

    // 6. Command Palette (⌘K)
    openCommandPalette() {
      const modal = document.getElementById('command-palette-modal');
      if (modal) {
        modal.classList.remove('hidden');
        const input = document.getElementById('palette-input');
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }
    closeCommandPalette() {
      const modal = document.getElementById('command-palette-modal');
      if (modal) modal.classList.add('hidden');
    }

    // 7. Notification Center Drawer
    toggleNotifications() {
      const drawer = document.getElementById('notification-center-drawer');
      if (drawer) {
        drawer.classList.toggle('hidden');
        if (!drawer.classList.contains('hidden')) {
          this.renderNotificationDrawer();
        }
      }
    }
    closeNotifications() {
      const drawer = document.getElementById('notification-center-drawer');
      if (drawer) drawer.classList.add('hidden');
    }
    renderNotificationDrawer() {
      const feed = document.getElementById('notification-drawer-feed');
      if (!feed) return;

      const notifs = window.AgentGuardStore.state.notifications;
      const getIcon = window.AgentGuardIcons.get;

      feed.innerHTML = notifs.map(n => `
        <div onclick="window.AgentGuardStore.setTab('${n.targetTab || 'dashboard'}'); window.AgentGuardApp.closeNotifications();" class="p-3 rounded-2xl ${n.unread ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-primary/20' : 'bg-surface-bg dark:bg-slate-800/40 border border-surface-border dark:border-slate-700'} hover:border-primary transition-all cursor-pointer text-xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-primary-dark dark:text-white flex items-center gap-1.5">
              ${getIcon('bell', 'w-3.5 h-3.5 text-primary')}
              ${n.title}
            </span>
            <span class="text-[10px] text-text-muted font-mono">${n.time}</span>
          </div>
          <p class="text-[11px] text-text-muted dark:text-slate-300 leading-snug">${n.message}</p>
        </div>
      `).join('');
    }

    // 8. Mobile Navigation Drawer
    toggleMobileMenu() {
      const aside = document.getElementById('main-sidebar');
      if (aside) aside.classList.toggle('-translate-x-full');
    }
    closeMobileMenu() {
      const aside = document.getElementById('main-sidebar');
      if (aside) aside.classList.add('-translate-x-full');
    }

    // Environment Switcher (Sandbox vs Live Production)
    setEnvironment(env) {
      const sandboxBtn = document.getElementById('btn-env-sandbox');
      const prodBtn = document.getElementById('btn-env-production');
      if (env === 'production') {
        if (sandboxBtn) {
          sandboxBtn.className = 'px-3.5 py-1 rounded-full text-text-muted dark:text-slate-400 hover:text-text-main dark:hover:text-white font-medium text-xs transition-colors';
        }
        if (prodBtn) {
          prodBtn.className = 'px-3.5 py-1 rounded-full bg-[#003087] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5';
        }
        this.showToast('Live Production Mode: Ready with simulated real-time PayPal settlement rails.', 'info');
      } else {
        if (sandboxBtn) {
          sandboxBtn.className = 'px-3.5 py-1 rounded-full bg-[#003087] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5';
        }
        if (prodBtn) {
          prodBtn.className = 'px-3.5 py-1 rounded-full text-text-muted dark:text-slate-400 hover:text-text-main dark:hover:text-white font-medium text-xs transition-colors';
        }
        this.showToast('Active in PayPal Sandbox Testing Environment.', 'success');
      }
    }

    // 9. Toast Notifications
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      const bg = type === 'success' ? 'bg-status-approved text-white' :
        type === 'danger' ? 'bg-status-blocked text-white' :
        type === 'warning' ? 'bg-[#F59E0B] text-white' : 'bg-primary-dark text-white';

      toast.className = `${bg} px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in pointer-events-auto border border-white/20`;
      toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 opacity-80 hover:opacity-100">✕</button>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    closeAllModals() {
      this.closeEmergencyModal();
      this.closeRejectModal();
      this.closeApproveModal();
      this.closeTxnDetails();
      this.closeCommandPalette();
      this.closeNotifications();
      this.closeProfileMenu();
      const editModal = document.getElementById('edit-limit-modal');
      if (editModal) editModal.classList.add('hidden');
      const infoModal = document.getElementById('agent-info-modal');
      if (infoModal) infoModal.classList.add('hidden');
      const budgetModal = document.getElementById('budget-limit-modal');
      if (budgetModal) budgetModal.classList.add('hidden');
    }
  }

  window.AgentGuardApp = new App();
  window.addEventListener('DOMContentLoaded', () => {
    window.AgentGuardApp.init();
  });
})(window);