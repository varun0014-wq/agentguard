// View: User Profile, System Settings & Support
(function(window) {
  'use strict';

  function renderProfile(state) {
    const getIcon = window.AgentGuardIcons.get;
    const user = state.currentUser || state.user || {
      name: 'User',
      email: 'user@example.com',
      title: 'Account Custodian',
      paypalAccountId: 'PAYPAL-AG-882194'
    };

    return `
      <div class="max-w-[1000px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <!-- Header -->
        <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">Account Profile</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">Manage your personal credentials, contact details, and security configuration.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-status-approved border border-status-approved/20">
            Active & Verified
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Left Col: Avatar Card -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs flex flex-col items-center text-center space-y-4">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold text-3xl flex items-center justify-center shadow-md">
              ${(user.name || 'U').charAt(0).toUpperCase()}
            </div>

            <div class="space-y-1">
              <h2 class="text-lg font-bold text-primary-dark dark:text-white">${user.name}</h2>
              <p class="text-xs text-primary font-medium">${user.title || 'Account Custodian'}</p>
              <div class="text-[11px] font-mono text-text-muted dark:text-slate-400">${user.email}</div>
            </div>

            <div class="w-full p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-xs text-left space-y-2">
              <div class="flex justify-between">
                <span class="text-text-muted">Account Status:</span>
                <span class="text-status-approved font-bold">Protected</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted">Connected PayPal ID:</span>
                <span class="font-mono text-primary font-semibold">${user.paypalAccountId || 'PP-8821-AG'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted">Security Level:</span>
                <span class="text-text-main dark:text-slate-200 font-semibold">Maximum</span>
              </div>
            </div>

            <button 
              type="button" 
              onclick="window.AgentGuardViews.handleLogout()"
              class="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-status-blocked text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/30">
              ${getIcon('logout', 'w-3.5 h-3.5')}
              <span>Sign Out of Account</span>
            </button>
          </div>

          <!-- Right 2 Cols: Editable Information Form with International Phone Input -->
          <div class="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold text-primary-dark dark:text-white">Profile Details</h3>

            <div class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Full Legal Name</label>
                  <input id="profile-name" type="text" value="${user.name}" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 font-medium text-text-main dark:text-slate-100 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Role / Job Title</label>
                  <input id="profile-title" type="text" value="${user.title || 'Account Custodian'}" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 font-medium text-text-main dark:text-slate-100 focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Email Address</label>
                <input id="profile-email" type="email" value="${user.email}" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 font-medium text-text-main dark:text-slate-100 focus:outline-none focus:border-primary" />
              </div>

              <!-- International Phone Input Integration -->
              <div>
                <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Mobile Phone Number (Security Notifications)</label>
                ${window.PhoneInputComponent ? window.PhoneInputComponent.render('profile-phone', user.country || 'US', user.phone || '555 019-2834') : ''}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Country / Region</label>
                  <select id="profile-country" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 font-semibold text-text-main dark:text-slate-200">
                    <option value="US" selected>🇺🇸 United States</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="AE">🇦🇪 United Arab Emirates</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="SG">🇸🇬 Singapore</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-text-muted dark:text-slate-400 mb-1">Connected PayPal Account</label>
                  <input type="text" readonly value="${user.paypalAccountId || 'PP-8821-AG'}" class="w-full h-10 px-3 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 font-mono text-text-muted" />
                </div>
              </div>

              <div class="pt-3 border-t border-surface-border dark:border-slate-800 flex justify-end">
                <button onclick="window.AgentGuardViews.handleSaveProfile()" class="px-5 py-2.5 bg-primary hover:bg-secondary text-white text-xs font-bold rounded-xl shadow-xs transition-all">
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  function renderSettings(state) {
    const getIcon = window.AgentGuardIcons.get;

    return `
      <div class="max-w-[1000px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <!-- Header -->
        <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">Settings</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">Customize appearance, notification channels, and security preferences.</p>
          </div>
        </div>

        <div class="space-y-5">

          <!-- 1. Theme Preferences -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold text-primary-dark dark:text-white">Appearance & Theme</h3>
            <div class="flex items-center justify-between text-xs p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
              <div>
                <strong class="text-primary-dark dark:text-white block">Dark Mode</strong>
                <span class="text-text-muted dark:text-slate-400">Toggle between clean daylight theme and high-contrast dark mode.</span>
              </div>
              <button onclick="window.AgentGuardStore.toggleTheme()" class="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-secondary transition-all">
                Switch to ${state.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          <!-- 2. Security Preferences -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold text-primary-dark dark:text-white">Security Safeguards</h3>
            
            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                <div>
                  <strong class="text-primary-dark dark:text-white block">Require Confirmation on Large Payments</strong>
                  <span class="text-text-muted dark:text-slate-400">Hold any transaction that exceeds individual agent limits for human approval.</span>
                </div>
                <input type="checkbox" checked class="w-4 h-4 text-primary rounded" />
              </div>

              <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                <div>
                  <strong class="text-primary-dark dark:text-white block">Automatic Merchant Verification</strong>
                  <span class="text-text-muted dark:text-slate-400">Validate all recipient merchant domains before permitting autonomous agents to pay.</span>
                </div>
                <input type="checkbox" checked class="w-4 h-4 text-primary rounded" />
              </div>

              <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                <div>
                  <strong class="text-primary-dark dark:text-white block">Automatic Emergency Pause on Anomaly</strong>
                  <span class="text-text-muted dark:text-slate-400">Immediately freeze an agent if it repeatedly requests unauthorized payments.</span>
                </div>
                <input type="checkbox" checked class="w-4 h-4 text-primary rounded" />
              </div>
            </div>
          </div>

          <!-- 3. Notification Preferences -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-base font-bold text-primary-dark dark:text-white">Notification Channels</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                <span class="font-medium">Email Alerts for Pending Approvals</span>
                <input type="checkbox" checked class="w-4 h-4 text-primary rounded" />
              </div>
              <div class="flex items-center justify-between p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700">
                <span class="font-medium">SMS Notifications for Blocked Payments</span>
                <input type="checkbox" checked class="w-4 h-4 text-primary rounded" />
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  function renderHelp(state) {
    const getIcon = window.AgentGuardIcons.get;
    return `
      <div class="max-w-[1000px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-2">
          <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">Help & Support</h1>
          <p class="text-xs text-text-muted dark:text-slate-400">Learn how AgentGuard protects your finances when using autonomous AI assistants.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-3">
            <h3 class="text-sm font-bold text-primary-dark dark:text-white flex items-center gap-2">
              ${getIcon('shield', 'w-4 h-4 text-primary')}
              <span>How Payment Decisions Work</span>
            </h3>
            <p class="text-text-muted dark:text-slate-400 leading-relaxed">
              Every payment generated by an AI assistant undergoes real-time security verification:
            </p>
            <ul class="space-y-2 list-none text-text-main dark:text-slate-200">
              <li class="flex items-start gap-2">
                <span class="text-status-approved font-bold">✓</span>
                <div><strong>Auto-Approved:</strong> Regular everyday payments within configured limits and sent to approved merchants are completed instantly.</div>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-accent-orange font-bold">⏳</span>
                <div><strong>Requires Approval:</strong> Larger expenses or new merchants are held safely in your Approvals inbox until you review them.</div>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-status-blocked font-bold">✕</span>
                <div><strong>Blocked:</strong> Any attempt to send money to suspicious or unverified accounts is stopped immediately to protect your balance.</div>
              </li>
            </ul>
          </div>

          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs space-y-3">
            <h3 class="text-sm font-bold text-primary-dark dark:text-white flex items-center gap-2">
              ${getIcon('lock', 'w-4 h-4 text-status-approved')}
              <span>Managing Your AI Agents</span>
            </h3>
            <p class="text-text-muted dark:text-slate-400 leading-relaxed">
              You maintain total control over how much each assistant can spend:
            </p>
            <ul class="space-y-2 list-none text-text-main dark:text-slate-200">
              <li class="flex items-start gap-2">
                <span class="text-primary font-bold">•</span>
                <div><strong>Custom Spending Caps:</strong> Set daily and monthly spending limits for every individual agent on the Agent Control page.</div>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary font-bold">•</span>
                <div><strong>Pause Anytime:</strong> Temporarily pause any agent with one click whenever you want to review its activity.</div>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary font-bold">•</span>
                <div><strong>Emergency Safety Switch:</strong> Use the Emergency Pause button on the Security Center page to stop all agents instantly if needed.</div>
              </li>
            </ul>
          </div>

        </div>

        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs text-xs space-y-2">
          <h3 class="text-sm font-bold text-primary-dark dark:text-white">Need Additional Assistance?</h3>
          <p class="text-text-muted dark:text-slate-400">
            For questions about your account, transactions, or agent policies, reach our 24/7 financial support desk at 
            <a href="mailto:support@agentguard.paypal" class="text-primary font-semibold hover:underline">support@agentguard.paypal</a>.
          </p>
        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['profile'] = renderProfile;
  window.AgentGuardViews['settings'] = renderSettings;
  window.AgentGuardViews['support'] = renderHelp;

  window.AgentGuardViews.handleSaveProfile = function() {
    const name = document.getElementById('profile-name') ? document.getElementById('profile-name').value.trim() : '';
    const title = document.getElementById('profile-title') ? document.getElementById('profile-title').value.trim() : '';
    const email = document.getElementById('profile-email') ? document.getElementById('profile-email').value.trim() : '';
    const phone = window.PhoneInputComponent ? window.PhoneInputComponent.getFullNumber('profile-phone') : '';

    if (!name) {
      window.AgentGuardApp.showToast('Please enter your name', 'warning');
      return;
    }

    if (window.AgentGuardStore.state.currentUser) {
      window.AgentGuardStore.state.currentUser.name = name;
      window.AgentGuardStore.state.currentUser.title = title;
      window.AgentGuardStore.state.currentUser.email = email;
      if (phone) window.AgentGuardStore.state.currentUser.phone = phone;
    }

    window.AgentGuardApp.showToast('Profile updated successfully', 'success');
    window.AgentGuardStore.notify();
  };

  window.AgentGuardViews.handleLogout = function() {
    window.AgentGuardStore.logout();
    window.AgentGuardApp.showToast('Signed out successfully', 'info');
  };

})(window);
