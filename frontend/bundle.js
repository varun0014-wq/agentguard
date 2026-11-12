const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
let html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');

const scripts = [
  'data/store.js',
  'views/dashboardView.js',
  'views/paymentApprovalsView.js',
  'views/securityMonitoringView.js',
  'views/monthlySpendsView.js',
  'views/agentControlView.js',
  'views/aiAssistantView.js',
  'views/extraViews.js',
  'app.js'
];

let inlinedScripts = '';
scripts.forEach(s => {
  const content = fs.readFileSync(path.join(baseDir, s), 'utf8');
  inlinedScripts += `\n<!-- Inlined: ${s} -->\n<script>\n${content}\n</script>\n`;
});

const scriptTagsStart = html.indexOf('<script src="data/store.js">');
const scriptTagsEnd = html.indexOf('<script src="app.js"></script>') + '<script src="app.js"></script>'.length;

if (scriptTagsStart !== -1 && scriptTagsEnd !== -1) {
  html = html.substring(0, scriptTagsStart) + inlinedScripts + html.substring(scriptTagsEnd);
}

const desktopPath = 'C:\\Users\\Hp\\OneDrive\\Desktop\\paypal-agentguard-standalone.html';
fs.writeFileSync(desktopPath, html, 'utf8');
fs.writeFileSync(path.join(baseDir, 'paypal-agentguard-standalone.html'), html, 'utf8');

console.log('Successfully created standalone HTML bundle at:');
console.log(desktopPath);
