const fs = require('fs');
const path = require('path');

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const scriptsToInline = [
  'utils/icons.js',
  'components/PhoneInput.js',
  'services/api.js',
  'data/store.js',
  'views/loginView.js',
  'views/dashboardView.js',
  'views/agentControlView.js',
  'views/paymentApprovalsView.js',
  'views/securityMonitoringView.js',
  'views/transactionsView.js',
  'views/monthlySpendsView.js',
  'views/spendingAnalyticsView.js',
  'views/splitBillsView.js',
  'views/currencyConverterView.js',
  'views/qrScannerView.js',
  'views/offersView.js',
  'views/profileSettingsView.js',
  'views/aiAssistantView.js',
  'app.js'
];

let inlined = '<script>\n// Embedded AgentGuard Application Scripts\n';
for (const s of scriptsToInline) {
  inlined += '// === ' + s + ' ===\n' + fs.readFileSync(path.join(__dirname, s), 'utf8') + '\n\n';
}
inlined += '</script>';

for (const s of scriptsToInline) {
  html = html.replace(`<script src="${s}"></script>`, '');
}

html = html.replace('</body>', () => inlined + '\n</body>');
fs.writeFileSync(path.join(__dirname, 'paypal-agentguard-standalone.html'), html, 'utf8');
console.log('✓ paypal-agentguard-standalone.html updated successfully! Size:', html.length);
