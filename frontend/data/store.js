// PayPal AgentGuard - Central Reactive State Store
(function(window) {
  'use strict';

  function getInitialState() {
    return {
      // 1. Authentication State
      // Defaults to true so dashboard loads immediately with active navigation
      isLoggedIn: true,
      currentUser: {
        name: 'Alex Johnson',
        title: 'Primary Account Custodian',
        email: 'alex.johnson@mycompany.com',
        phone: '+1 (555) 019-2834',
        country: 'US',
        role: 'Account Owner',
        paypalAccountId: 'PP-BIZ-4921-SECURE',
        accountStatus: 'Verified Business Account',
        settings: {
          emailAlerts: true,
          smsAlerts: true,
          pushNotifications: true,
          enforceBiometrics: true,
          autoFreezeOnHighRisk: true,
          preferredCurrency: 'USD',
          language: 'en-US'
        }
      },

      theme: 'light',
      activeTab: 'dashboard',
      searchQuery: '',

      // Financial Metrics (Simplified for ordinary users & elderly accessibility)
      financials: {
        totalBalance: 148920.50,
        monthlySpend: 42310.80,
        monthlyCap: 68000.00,
        dailySpend: 3120.40,
        dailyCap: 8000.00,
        weeklySpend: 9840.50,
        yearlySpend: 184520.00,
        yearlyCap: 500000.00,
        totalTransactions: 1842,
        pendingApprovalsCount: 3,
        autoApprovedCount: 1720,
        blockedThreatsCount: 19,
        savedVolume: 18620.00
      },

      // Connected AI Agents (Simplified structures with identical properties)
      agents: [
        {
          id: 'AGT-1044',
          name: 'Procurement Assistant',
          purpose: 'Orders office hardware, laptops, and team cloud tools',
          status: 'Active', // 'Active' | 'Paused' | 'Blocked'
          model: 'Claude 3.5 Sonnet',
          txLimit: 5000,
          dailyLimit: 8000,
          monthlyCap: 15000,
          monthlySpent: 9120,
          allowedMerchants: ['Amazon Web Services', 'GitHub', 'Datadog', 'Vercel'],
          approvalSetting: 'Auto-approves purchases under $5,000 to approved merchants'
        },
        {
          id: 'AGT-8412',
          name: 'Travel Concierge AI',
          purpose: 'Books employee flights, hotels, and travel itineraries',
          status: 'Active',
          model: 'Gemini 1.5 Pro',
          txLimit: 1500,
          dailyLimit: 3000,
          monthlyCap: 8000,
          monthlySpent: 6770,
          allowedMerchants: ['Delta Air Lines', 'United Airlines', 'Marriott', 'Hilton'],
          approvalSetting: 'Requires your approval for any booking over $1,500'
        },
        {
          id: 'AGT-5120',
          name: 'Cloud Infrastructure Bot',
          purpose: 'Manages cloud server scaling and backup storage',
          status: 'Active',
          model: 'GPT-4 Turbo',
          txLimit: 4000,
          dailyLimit: 6000,
          monthlyCap: 25000,
          monthlySpent: 18400,
          allowedMerchants: ['Amazon Web Services', 'Hetzner Online', 'DigitalOcean'],
          approvalSetting: 'Monitors currency exchange rates and auto-scales compute'
        },
        {
          id: 'AGT-8711',
          name: 'Subscription Billing Agent',
          purpose: 'Pays monthly recurring team software subscriptions',
          status: 'Active',
          model: 'Claude 3 Haiku',
          txLimit: 2000,
          dailyLimit: 3000,
          monthlyCap: 10000,
          monthlySpent: 3650,
          allowedMerchants: ['Slack', 'Zoom', 'Datadog', 'Figma'],
          approvalSetting: 'Auto-settles verified regular invoices under $2,000'
        },
        {
          id: 'AGT-3390',
          name: 'Sales Leads Assistant',
          purpose: 'Purchases verified CRM sales contact lists and tools',
          status: 'Blocked',
          model: 'Mistral Large',
          txLimit: 1000,
          dailyLimit: 1500,
          monthlyCap: 5000,
          monthlySpent: 1200,
          allowedMerchants: ['Salesforce', 'ZoomInfo'],
          approvalSetting: 'Temporarily blocked due to an unrecognized recipient address'
        },
        {
          id: 'AGT-7721',
          name: 'Marketing Ad Manager',
          purpose: 'Manages online search and social media advertising bids',
          status: 'Paused',
          model: 'Llama 3.3',
          txLimit: 500,
          dailyLimit: 1000,
          monthlyCap: 10000,
          monthlySpent: 4850,
          allowedMerchants: ['Google Ads', 'Meta Ads', 'LinkedIn Ads'],
          approvalSetting: 'Paused by operator to review ad campaign budget'
        }
      ],

      // Pending Payment Approvals (Section 6)
      pendingApprovals: [
        {
          id: 'TXN-9024',
          recipient: 'Delta Air Lines',
          amount: 2150.00,
          currency: 'USD',
          agentName: 'Travel Concierge AI',
          agentId: 'AGT-8412',
          date: 'Today, 10:42 AM',
          reason: 'This flight ticket ($2,150.00) is higher than the agent\'s regular $1,500 spending limit.',
          simpleStatus: 'Waiting for your review',
          rawDetails: 'Non-stop business flight SFO to London Heathrow for team kickoff.'
        },
        {
          id: 'TXN-9921',
          recipient: 'Vercel Inc.',
          amount: 2400.00,
          currency: 'USD',
          agentName: 'Procurement Assistant',
          agentId: 'AGT-1044',
          date: 'Today, 10:28 AM',
          reason: 'This is the first time this agent is paying Vercel Inc. Needs your confirmation.',
          simpleStatus: 'New merchant confirmation',
          rawDetails: 'Annual hosting subscription for enterprise web services.'
        },
        {
          id: 'TXN-5120',
          recipient: 'Hetzner Online GmbH',
          amount: 300.00,
          currency: 'EUR',
          usdAmount: 320.00,
          agentName: 'Cloud Infrastructure Bot',
          agentId: 'AGT-5120',
          date: 'Today, 09:55 AM',
          reason: 'International payment to Germany for European backup servers.',
          simpleStatus: 'International currency review',
          rawDetails: 'Dedicated failover server hosting in Europe.'
        }
      ],

      // Completed / Approved History
      autoApprovedHistory: [
        {
          id: 'TXN-8841',
          recipient: 'Amazon Web Services',
          amount: 142.50,
          currency: 'USD',
          agentName: 'Procurement Assistant',
          date: 'Today, 10:45 AM',
          status: 'Auto-Approved',
          reason: 'Standard recurring monthly server bill within approved spending limit.'
        },
        {
          id: 'TXN-8711',
          recipient: 'Datadog Observability',
          amount: 890.00,
          currency: 'USD',
          agentName: 'Subscription Billing Agent',
          date: 'Today, 10:35 AM',
          status: 'Auto-Approved',
          reason: 'Approved software monitoring contract under the $2,000 limit.'
        },
        {
          id: 'TXN-0992',
          recipient: 'GitHub Enterprise',
          amount: 525.00,
          currency: 'USD',
          agentName: 'Cloud Infrastructure Bot',
          date: 'Today, 09:12 AM',
          status: 'Auto-Approved',
          reason: 'Monthly team developer licenses.'
        }
      ],

      // Blocked & Suspicious Transactions (Section 8)
      blockedPayments: [
        {
          id: 'TXN-9118',
          recipient: 'Unverified Personal Account (@anon_wallet)',
          amount: 1200.00,
          currency: 'USD',
          agentName: 'Sales Leads Assistant',
          date: 'Today, 10:38 AM',
          status: 'Blocked',
          reason: 'The agent attempted to send money to an unverified private account. AgentGuard stopped the payment instantly to protect your funds.',
          savedAmount: 1200.00
        },
        {
          id: 'TXN-4412',
          recipient: 'Apex Cloud Hardware Corp',
          amount: 5040.00,
          currency: 'USD',
          agentName: 'Procurement Assistant',
          date: 'Yesterday, 08:45 AM',
          status: 'Blocked',
          reason: 'The price for this item was suddenly 400% higher than the normal contract price. Held automatically for your safety.',
          savedAmount: 5040.00
        }
      ],

      // Recent Transactions Ledger (Section 7)
      ledger: [
        {
          id: 'TXN-8841',
          recipient: 'Amazon Web Services',
          detail: 'Monthly Cloud Compute Bill',
          initiator: 'Procurement Assistant',
          isAgent: true,
          amount: 8940.20,
          date: 'Nov 10, 2026',
          time: '10:45 AM',
          status: 'Paid',
          statusCode: 'successful'
        },
        {
          id: 'TXN-8711',
          recipient: 'OpenAI API Platform',
          detail: 'Team AI Service Usage',
          initiator: 'Customer Service AI',
          isAgent: true,
          amount: 4215.00,
          date: 'Nov 09, 2026',
          time: '04:12 PM',
          status: 'Paid',
          statusCode: 'successful'
        },
        {
          id: 'TXN-9102',
          recipient: 'United Airlines',
          detail: 'Client Conference Flight',
          initiator: 'You (Manual)',
          isAgent: false,
          amount: 2840.00,
          date: 'Nov 08, 2026',
          time: '08:30 AM',
          status: 'Paid',
          statusCode: 'successful'
        },
        {
          id: 'TXN-0144',
          recipient: 'Datadog Inc.',
          detail: 'Website Health Monitoring',
          initiator: 'Subscription Billing Agent',
          isAgent: true,
          amount: 3650.00,
          date: 'Nov 07, 2026',
          time: '11:15 AM',
          status: 'Paid',
          statusCode: 'successful'
        },
        {
          id: 'TXN-9024',
          recipient: 'Delta Air Lines',
          detail: 'Executive Flight Booking',
          initiator: 'Travel Concierge AI',
          isAgent: true,
          amount: 2150.00,
          date: 'Nov 10, 2026',
          time: '10:42 AM',
          status: 'Waiting Approval',
          statusCode: 'awaiting_approval'
        },
        {
          id: 'TXN-9118',
          recipient: 'Unverified Personal Account',
          detail: 'Unrecognized Transfer Attempt',
          initiator: 'Sales Leads Assistant',
          isAgent: true,
          amount: 1200.00,
          date: 'Nov 10, 2026',
          time: '10:38 AM',
          status: 'Blocked',
          statusCode: 'blocked'
        },
        {
          id: 'TXN-9921',
          recipient: 'Vercel Inc.',
          detail: 'Annual Hosting Workspace',
          initiator: 'Procurement Assistant',
          isAgent: true,
          amount: 2400.00,
          date: 'Nov 10, 2026',
          time: '10:28 AM',
          status: 'Waiting Approval',
          statusCode: 'awaiting_approval'
        },
        {
          id: 'TXN-0992',
          recipient: 'GitHub Enterprise',
          detail: 'Team Developer Licenses',
          initiator: 'Cloud Infrastructure Bot',
          isAgent: true,
          amount: 5250.00,
          date: 'Nov 05, 2026',
          time: '09:00 AM',
          status: 'Paid',
          statusCode: 'successful'
        },
        {
          id: 'TXN-8814',
          recipient: 'Figma Design',
          detail: 'Team Design Software',
          initiator: 'You (Manual)',
          isAgent: false,
          amount: 1800.00,
          date: 'Nov 04, 2026',
          time: '02:20 PM',
          status: 'Paid',
          statusCode: 'successful'
        }
      ],

      // Notifications Center (Section 13)
      notifications: [
        {
          id: 'NTF-1',
          title: 'Payment Needs Approval',
          message: 'Travel Concierge AI requested $2,150.00 for Delta Air Lines.',
          time: '14 mins ago',
          unread: true,
          targetTab: 'payment-approvals'
        },
        {
          id: 'NTF-2',
          title: 'Suspicious Payment Stopped',
          message: 'An unrecognized $1,200.00 transfer was stopped automatically.',
          time: '28 mins ago',
          unread: true,
          targetTab: 'security-monitoring'
        },
        {
          id: 'NTF-3',
          title: 'Payment Completed',
          message: '$142.50 to Amazon Web Services was paid safely within limits.',
          time: '45 mins ago',
          unread: false,
          targetTab: 'transactions'
        }
      ],

      // Split Bills State (Section 10)
      splitBills: {
        billTotal: 1200.00,
        tipPercent: 0,
        splitMethod: 'equal', // 'equal' | 'custom'
        participants: [
          { id: 'P-1', name: 'You (Account Owner)', phone: '+1 (555) 019-2834', share: 300.00, isPaid: true },
          { id: 'P-2', name: 'Sarah Miller', phone: '+1 (415) 555-0199', share: 300.00, isPaid: false },
          { id: 'P-3', name: 'David Chen', phone: '+44 7911 123456', share: 300.00, isPaid: false },
          { id: 'P-4', name: 'Emily Taylor', phone: '+61 412 345 678', share: 300.00, isPaid: true }
        ]
      },

      // Worldwide ISO 4217 Currency Rates (Section 10)
      currencyData: {
        lastUpdated: 'Live Spot Rates (Reliable Banking Feed)',
        currencies: [
          { code: 'USD', name: 'United States Dollar', symbol: '$', rate: 1.0 },
          { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.895 },
          { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.745 },
          { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 93.61 },
          { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 157.80 },
          { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.375 },
          { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.545 },
          { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', rate: 0.885 },
          { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.245 },
          { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.335 },
          { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ', rate: 3.6725 },
          { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rate: 3.751 },
          { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.45 },
          { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.68 },
          { code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 18.25 },
          { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1395.0 },
          { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 10.55 },
          { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 10.75 },
          { code: 'DKK', name: 'Danish Krone', symbol: 'kr', rate: 6.68 },
          { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.685 },
          { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.785 },
          { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 35.80 },
          { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 16250.0 },
          { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 4.48 },
          { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 58.40 },
          { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', rate: 3.68 },
          { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 49.20 },
          { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1540.0 }
        ]
      },

      // Departmental & AI Quotas for Monthly Spending
      quotas: [
        { name: 'Engineering & DevOps', tag: 'Autonomous Cloud Provisioning', spent: 18400.00, cap: 25000, pct: 73.6, status: 'Active Bounds', statusColor: 'emerald' },
        { name: 'Cloud Infrastructure', tag: 'Core Server Hosting & Failover', spent: 9120.00, cap: 15000, pct: 60.8, status: 'Active Bounds', statusColor: 'emerald' },
        { name: 'Travel & Hospitality', tag: 'Employee Corporate Bookings', spent: 6770.00, cap: 8000, pct: 84.6, status: 'Quota Warning', statusColor: 'amber' },
        { name: 'Marketing & Ad Campaigns', tag: 'Search & Social Bidding', spent: 4850.00, cap: 10000, pct: 48.5, status: 'Active Bounds', statusColor: 'cyan' }
      ],

      // Offers & Rewards (Section 10)
      offers: [
        {
          id: 'OFF-1',
          title: '5% Cashback on Cloud Software',
          merchant: 'Amazon Web Services, Vercel & GitHub',
          badge: '5% Cashback',
          description: 'Get 5% automatic cashback credited to your PayPal balance on all approved cloud tools and server spend.',
          expiry: 'Valid through Dec 31, 2026',
          category: 'Software & Cloud'
        },
        {
          id: 'OFF-2',
          title: 'Corporate Travel Rewards',
          merchant: 'Delta Air Lines & Marriott Hotels',
          badge: 'Double Points',
          description: 'Earn 2x rewards points on all approved corporate flight and hotel bookings made through your Travel Concierge.',
          expiry: 'Valid through Dec 15, 2026',
          category: 'Travel & Dining'
        },
        {
          id: 'OFF-3',
          title: '$250 Credit on Team Licenses',
          merchant: 'Slack, Zoom & Datadog',
          badge: '$250 Welcome Credit',
          description: 'Receive a $250 credit when your Subscription Agent sets up annual billing with participating business partners.',
          expiry: 'Valid through Jan 31, 2027',
          category: 'Team Productivity'
        }
      ]
    };
  }

  class Store {
    constructor() {
      // Check if user previously logged in
      const savedAuth = typeof localStorage !== 'undefined' ? localStorage.getItem('agentguard_user') : null;
      this.state = getInitialState();

      if (savedAuth) {
        try {
          const user = JSON.parse(savedAuth);
          if (user && user.name) {
            this.state.isLoggedIn = true;
            this.state.currentUser = user;
          }
        } catch (e) {}
      }

      this.listeners = [];
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      for (const listener of this.listeners) {
        try {
          listener(this.state);
        } catch (e) {
          console.error('[AgentGuard Store] Listener error:', e);
        }
      }
    }

    // 1. Navigation
    setTab(tab) {
      this.state.activeTab = tab;
      this.notify();
    }

    // 2. Authentication (Section 2)
    login(credentials) {
      const name = credentials.name || (credentials.emailOrPhone ? credentials.emailOrPhone.split('@')[0] : 'Account User');
      this.state.isLoggedIn = true;
      this.state.currentUser.name = name.charAt(0).toUpperCase() + name.slice(1);
      this.state.currentUser.email = credentials.emailOrPhone && credentials.emailOrPhone.includes('@') ? credentials.emailOrPhone : `${name.toLowerCase()}@business.com`;
      if (credentials.phone) this.state.currentUser.phone = credentials.phone;

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('agentguard_user', JSON.stringify(this.state.currentUser));
      }

      this.notify();
      return this.state.currentUser;
    }

    signup(data) {
      this.state.isLoggedIn = true;
      this.state.currentUser = {
        name: data.name || 'New Member',
        title: 'Account Administrator',
        email: data.email || 'user@example.com',
        phone: data.phone || '+1 (555) 019-2834',
        country: data.country || 'US',
        role: 'Account Owner',
        paypalAccountId: 'PP-' + Math.floor(1000 + Math.random() * 9000),
        accountStatus: 'Active & Verified',
        settings: {
          emailAlerts: true,
          smsAlerts: true,
          pushNotifications: true,
          enforceBiometrics: true,
          autoFreezeOnHighRisk: true,
          preferredCurrency: 'USD',
          language: 'en-US'
        }
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('agentguard_user', JSON.stringify(this.state.currentUser));
      }

      this.notify();
      return this.state.currentUser;
    }

    logout() {
      this.state.isLoggedIn = false;
      this.state.activeTab = 'dashboard';
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('agentguard_user');
      }
      this.notify();
    }

    toggleTheme() {
      this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined' && document.documentElement) {
        if (this.state.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      this.notify();
    }

    // 3. Agent Controls (Section 5)
    toggleAgentStatus(agentId) {
      const agent = this.state.agents.find(a => a.id === agentId);
      if (agent) {
        if (agent.status === 'Active') {
          agent.status = 'Paused';
        } else {
          agent.status = 'Active';
        }
        this.notify();
      }
    }

    pauseAgent(agentId) {
      const agent = this.state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.status = 'Paused';
        this.notify();
      }
    }

    resumeAgent(agentId) {
      const agent = this.state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.status = 'Active';
        this.notify();
      }
    }

    updateAgentLimits(agentId, newLimit, newMonthlyCap, merchantsList) {
      const agent = this.state.agents.find(a => a.id === agentId);
      if (agent) {
        if (newLimit !== undefined) agent.txLimit = parseFloat(newLimit) || agent.txLimit;
        if (newMonthlyCap !== undefined) agent.monthlyCap = parseFloat(newMonthlyCap) || agent.monthlyCap;
        if (merchantsList) {
          agent.allowedMerchants = merchantsList.split(',').map(m => m.trim()).filter(Boolean);
        }
        this.notify();
      }
    }

    pauseAllAgents() {
      this.state.fleetStatus = 'paused';
      this.state.agents.forEach(a => a.status = 'Paused');
      this.state.notifications.unshift({
        id: 'NTF-' + Date.now(),
        title: 'All Agents Paused',
        message: 'You have safely paused all connected AI agents. Spending is temporarily suspended.',
        time: 'Just now',
        unread: true,
        targetTab: 'agent-control'
      });
      this.notify();
    }

    resumeAllAgents() {
      this.state.fleetStatus = 'active';
      this.state.agents.forEach(a => {
        if (a.status !== 'Blocked') a.status = 'Active';
      });
      this.notify();
    }

    emergencyPauseFleet() {
      this.pauseAllAgents();
    }

    resumeFleet() {
      this.resumeAllAgents();
    }

    // 4. Payment Approvals (Section 6)
    approvePayment(txnId) {
      const idx = this.state.pendingApprovals.findIndex(p => p.id === txnId);
      if (idx === -1) return null;

      const item = this.state.pendingApprovals.splice(idx, 1)[0];

      // Update Financials
      this.state.financials.monthlySpend += item.amount;
      this.state.financials.dailySpend += item.amount;
      this.state.financials.autoApprovedCount += 1;
      this.state.financials.pendingApprovalsCount = this.state.pendingApprovals.length;

      // Add to completed history
      this.state.autoApprovedHistory.unshift({
        id: item.id,
        recipient: item.recipient,
        amount: item.amount,
        currency: item.currency || 'USD',
        agentName: item.agentName,
        date: 'Today, Just now',
        status: 'Approved by You',
        reason: 'Authorized payment released safely.'
      });

      // Update Ledger entry
      const ledgerEntry = this.state.ledger.find(l => l.id === item.id);
      if (ledgerEntry) {
        ledgerEntry.status = 'Paid';
        ledgerEntry.statusCode = 'successful';
      }

      this.notify();
      return item;
    }

    approveApproval(txnId) {
      return this.approvePayment(txnId);
    }

    rejectPayment(txnId, reason = 'Declined by account owner') {
      const idx = this.state.pendingApprovals.findIndex(p => p.id === txnId);
      if (idx === -1) return null;

      const item = this.state.pendingApprovals.splice(idx, 1)[0];

      this.state.financials.pendingApprovalsCount = this.state.pendingApprovals.length;
      this.state.financials.savedVolume += item.amount;

      // Add to blocked history
      this.state.blockedPayments.unshift({
        id: item.id,
        recipient: item.recipient,
        amount: item.amount,
        currency: item.currency || 'USD',
        agentName: item.agentName,
        date: 'Today, Just now',
        status: 'Rejected',
        reason: reason,
        savedAmount: item.amount
      });

      // Update Ledger entry
      const ledgerEntry = this.state.ledger.find(l => l.id === item.id);
      if (ledgerEntry) {
        ledgerEntry.status = 'Rejected';
        ledgerEntry.statusCode = 'blocked';
      }

      this.notify();
      return item;
    }

    rejectApproval(txnId, reason) {
      return this.rejectPayment(txnId, reason);
    }

    // 5. Split Bills (Section 10)
    updateSplitTotal(amount) {
      this.state.splitBills.billTotal = parseFloat(amount) || 0;
      this.recalculateShares();
      this.notify();
    }

    addParticipant(name, phone) {
      const newId = 'P-' + (this.state.splitBills.participants.length + 1);
      this.state.splitBills.participants.push({
        id: newId,
        name: name || 'Participant',
        phone: phone || '',
        share: 0,
        isPaid: false
      });
      this.recalculateShares();
      this.notify();
    }

    removeParticipant(id) {
      this.state.splitBills.participants = this.state.splitBills.participants.filter(p => p.id !== id);
      this.recalculateShares();
      this.notify();
    }

    recalculateShares() {
      const count = this.state.splitBills.participants.length;
      if (count === 0) return;
      const share = this.state.splitBills.billTotal / count;
      this.state.splitBills.participants.forEach(p => {
        p.share = Math.round(share * 100) / 100;
      });
    }

    markNotificationsRead() {
      this.state.notifications.forEach(n => n.unread = false);
      this.notify();
    }
  }

  window.AgentGuardStore = new Store();
})(window);
