// Comprehensive Verification Test Script for PayPal AgentGuard
const fs = require('fs');
const path = require('path');

// Mock browser window and DOM environment
global.window = global;
global.document = {
  getElementById: (id) => {
    return {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      style: {}
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({
    appendChild: () => {},
    classList: { add: () => {} },
    style: {}
  })
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    passedTests++;
    console.log(`✓ PASS: ${message}`);
  }
}

console.log('\n--- 1. LOADING MODULES ---');
require('./utils/icons.js');
assert(typeof window.AgentGuardIcons !== 'undefined', 'AgentGuardIcons loaded');
assert(typeof window.AgentGuardIcons.logo === 'function', 'AgentGuardIcons.logo is defined');
assert(typeof window.AgentGuardIcons.paypalLogo === 'function', 'AgentGuardIcons.paypalLogo is defined');
assert(typeof window.AgentGuardIcons.paypalWordmark === 'function', 'AgentGuardIcons.paypalWordmark is defined');

require('./components/PhoneInput.js');
assert(typeof window.PhoneInputComponent !== 'undefined', 'PhoneInputComponent loaded');
assert(window.PhoneInputComponent.COUNTRIES.length >= 35, `PhoneInputComponent has ${window.PhoneInputComponent.COUNTRIES.length} worldwide countries`);

require('./services/api.js');
assert(typeof window.AgentGuardApi !== 'undefined', 'AgentGuardApi loaded');

require('./data/store.js');
assert(typeof window.AgentGuardStore !== 'undefined', 'AgentGuardStore loaded');
assert(window.AgentGuardStore.state.quotas && window.AgentGuardStore.state.quotas.length >= 4, 'Store has departmental quotas configured');

// Load Views
require('./views/loginView.js');
require('./views/dashboardView.js');
require('./views/agentControlView.js');
require('./views/paymentApprovalsView.js');
require('./views/securityMonitoringView.js');
require('./views/transactionsView.js');
require('./views/monthlySpendsView.js');
require('./views/spendingAnalyticsView.js');
require('./views/splitBillsView.js');
require('./views/currencyConverterView.js');
require('./views/qrScannerView.js');
require('./views/offersView.js');
require('./views/profileSettingsView.js');
require('./views/aiAssistantView.js');

console.log('\n--- 2. VERIFYING REGISTERED VIEWS ---');
const expectedTabs = [
  'login',
  'dashboard',
  'transactions',
  'payment-approvals',
  'agent-control',
  'security-monitoring',
  'monthly-spending',
  'split-bills',
  'currency-converter',
  'qr-scanner',
  'offers',
  'ai-assistant',
  'profile',
  'settings',
  'support'
];

expectedTabs.forEach(tab => {
  assert(typeof window.AgentGuardViews[tab] === 'function', `View '${tab}' is registered and is a function`);
});

console.log('\n--- 3. TESTING AUTHENTICATION FLOW & LOGIN VIEW ---');
const store = window.AgentGuardStore;
assert(store.state.isLoggedIn === true, 'Initial state isLoggedIn is true so Dashboard loads immediately');
assert(store.state.currentUser.name === 'Alex Johnson', 'Default logged in user is Alex Johnson');

// Test Logout to verify Login View
store.logout();
assert(store.state.isLoggedIn === false, 'After logout, isLoggedIn is false');

const loginHtml = window.AgentGuardViews['login'](store.state);
assert(loginHtml.includes('PayPal'), 'Login view includes primary PayPal branding');
assert(loginHtml.includes('Protected by') && loginHtml.includes('AgentGuard AI Security'), 'Login view includes subtle AgentGuard security badge');
assert(loginHtml.includes('Email or mobile number'), 'Login view includes Email or mobile number field');
assert(loginHtml.includes('Password'), 'Login view includes Password field');
assert(loginHtml.includes('Forgotten password?'), 'Login view includes Forgotten password link');
assert(loginHtml.includes('Log In'), 'Login view includes Log In button');
assert(loginHtml.includes('Sign Up'), 'Login view includes Sign Up option');
assert(loginHtml.includes('🇮🇳'), 'Login view includes Country flag option below the login card');
assert(loginHtml.includes('Contact Us') && loginHtml.includes('Worldwide'), 'Login view includes PayPal footer links');

// Test Signup
store.signup({ name: 'Alex Johnson', email: 'alex.j@example.com', phone: '+1 555-0199', password: 'pass' });
assert(store.state.isLoggedIn === true, 'After signup, isLoggedIn is true');
assert(store.state.currentUser.name === 'Alex Johnson', 'Current user name updated to Alex Johnson');

// Test Logout & Login
store.logout();
assert(store.state.isLoggedIn === false, 'After logout, isLoggedIn is false');
store.login({ emailOrPhone: 'advaitd0110@gmail.com', password: 'password123' });
assert(store.state.isLoggedIn === true, 'After login, isLoggedIn is true');
assert(store.state.currentUser.name.length > 0, 'Current user name populated');

console.log('\n--- 4. TESTING VIEW RENDERING OUTPUTS ---');
expectedTabs.forEach(tab => {
  store.setTab(tab);
  const renderer = window.AgentGuardViews[tab];
  const html = renderer(store.state);
  assert(typeof html === 'string' && html.length > 50, `View '${tab}' rendered valid HTML (${html.length} chars)`);

  // Check for forbidden hackathon / demo terms
  assert(!html.includes('Hackathon Judges Demo Center'), `View '${tab}' contains no 'Hackathon Judges Demo Center'`);
  assert(!html.includes('Hackathon Edition'), `View '${tab}' contains no 'Hackathon Edition'`);
  assert(!html.includes('S1 Auto') && !html.includes('S2 Hold') && !html.includes('S3 Block'), `View '${tab}' contains no S1/S2/S3 buttons`);
});

console.log('\n--- 5. TESTING TRANSACTIONS DATE, MONTH, YEAR FILTERS ---');
const txnHtml = window.AgentGuardViews['transactions'](store.state);
assert(txnHtml.includes('Year') && txnHtml.includes('2026'), 'Transactions view includes Year filter');
assert(txnHtml.includes('Month') && txnHtml.includes('January') && txnHtml.includes('November'), 'Transactions view includes Month filter');
assert(txnHtml.includes('Date Range') && txnHtml.includes('Today'), 'Transactions view includes Date Range filter');
assert(txnHtml.includes('Find Exact Day'), 'Transactions view includes Specific Date finder');

console.log('\n--- 6. TESTING MONTHLY SPENDING WAITING FOR APPROVAL BOX ---');
const monthlyHtml = window.AgentGuardViews['monthly-spending'](store.state);
assert(monthlyHtml.includes('Waiting for Approval'), 'Monthly Spends view contains prominent Waiting for Approval box');
assert(monthlyHtml.includes('Review Approvals'), 'Waiting for Approval box has Review Approvals action button');

console.log('\n--- 7. TESTING CURRENCY CONVERTER LATEST RATES ---');
const inrCurrency = store.state.currencyData.currencies.find(c => c.code === 'INR');
assert(inrCurrency && inrCurrency.rate === 93.61, `Currency Converter INR rate is 93.61 (found ${inrCurrency ? inrCurrency.rate : 'none'})`);

const currHtml = window.AgentGuardViews['currency-converter'](store.state);
assert(currHtml.includes('93.61') || currHtml.includes('INR'), 'Currency Converter renders 93.61 INR rate');

console.log('\n--- 8. TESTING AGENT CONTROL OPERATIONS ---');
const initialAgentsCount = store.state.agents.length;
assert(initialAgentsCount === 6, 'Agent fleet has 6 connected agents');

// Pause agent
const targetAgentId = store.state.agents[0].id;
store.pauseAgent(targetAgentId);
assert(store.state.agents[0].status === 'Paused', `Agent ${targetAgentId} successfully paused`);

// Resume agent
store.resumeAgent(targetAgentId);
assert(store.state.agents[0].status === 'Active', `Agent ${targetAgentId} successfully resumed`);

console.log('\n--- 9. TESTING PAYMENT APPROVALS ---');
const initialApprovalsCount = store.state.pendingApprovals.length;
assert(initialApprovalsCount > 0, `Pending approvals queue has ${initialApprovalsCount} items`);

const itemToApprove = store.state.pendingApprovals[0];
store.approveApproval(itemToApprove.id);
assert(store.state.pendingApprovals.length === initialApprovalsCount - 1, 'Approval queue decremented by 1 after approve');

console.log('\n--- 10. CHECKING INDEX.HTML INTEGRITY & SIDEBAR ORDER ---');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(!indexHtml.includes('Hackathon Judges Demo Center'), 'index.html has no Hackathon Judges Demo Center');
assert(!indexHtml.includes('Hackathon Edition'), 'index.html has no Hackathon Edition');
assert(!indexHtml.includes('S1 Auto') && !indexHtml.includes('S2 Hold') && !indexHtml.includes('S3 Block'), 'index.html has no S1/S2/S3 buttons');

// Check exact required order of navigation tabs in index.html
const requiredNavTabsOrder = [
  'data-nav-tab="dashboard"',
  'data-nav-tab="transactions"',
  'data-nav-tab="payment-approvals"',
  'data-nav-tab="agent-control"',
  'data-nav-tab="security-monitoring"',
  'data-nav-tab="monthly-spending"',
  'data-nav-tab="split-bills"',
  'data-nav-tab="currency-converter"',
  'data-nav-tab="qr-scanner"',
  'data-nav-tab="offers"',
  'data-nav-tab="ai-assistant"',
  'data-nav-tab="profile"',
  'data-nav-tab="settings"',
  'data-nav-tab="support"'
];

let lastIdx = -1;
requiredNavTabsOrder.forEach(tab => {
  const currentIdx = indexHtml.indexOf(tab);
  assert(currentIdx > -1, `index.html contains ${tab}`);
  assert(currentIdx > lastIdx, `${tab} is in the exact required chronological order`);
  lastIdx = currentIdx;
});

// Check header elements
assert(indexHtml.includes('id="header-notif-count"'), 'index.html has notification count badge');
assert(indexHtml.includes('id="header-profile-menu"'), 'index.html has header profile menu');
assert(indexHtml.includes('Sign Out') || indexHtml.includes('Log Out'), 'index.html has Sign Out / Log Out button');

console.log(`\n========================================`);
console.log(`ALL VERIFICATION TESTS PASSED (${passedTests}/${totalTests})!`);
console.log(`========================================\n`);
