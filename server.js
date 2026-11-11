// AgentGuard Full-Stack Server
// Serves static frontend AND provides REST API endpoints specified in Section 15
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// In-memory backend database for demo
let mockAgents = [
  { id: 'AGT-1044-PROC', name: 'ProcurementBot v4', model: 'Claude 3.5 Sonnet', status: 'active', txLimit: 5000, monthlyCap: 15000, monthlySpent: 9120, whitelistedDomains: ['aws.amazon.com', 'datadoghq.com', 'github.com', 'vercel.com'] },
  { id: 'AGT-8412-TRV', name: 'TravelDesk AI', model: 'Gemini 1.5 Pro', status: 'active', txLimit: 1500, monthlyCap: 8000, monthlySpent: 6770, whitelistedDomains: ['delta.com', 'united.com', 'marriott.com'] },
  { id: 'AGT-5120-DVP', name: 'DevOpsProvisioner', model: 'GPT-4 Turbo', status: 'active', txLimit: 4000, monthlyCap: 25000, monthlySpent: 18400, whitelistedDomains: ['aws.amazon.com', 'hetzner.com'] },
  { id: 'AGT-8711-DDG', name: 'CloudBillingAgent', model: 'Claude 3 Haiku', status: 'active', txLimit: 2000, monthlyCap: 10000, monthlySpent: 3650, whitelistedDomains: ['datadoghq.com', 'slack.com'] },
  { id: 'AGT-3390-SLS', name: 'SalesOps Bot', model: 'Mistral Large', status: 'quarantined', txLimit: 1000, monthlyCap: 5000, monthlySpent: 1200, whitelistedDomains: ['salesforce.com'] },
  { id: 'AGT-7721-MKT', name: 'MarketingAdSpender AI', model: 'Llama 3.3 70B', status: 'throttled', txLimit: 500, monthlyCap: 10000, monthlySpent: 4850, whitelistedDomains: ['google.com/ads'] }
];

let mockApprovals = [
  { id: 'TXN-9024-DAL', agentId: 'AGT-8412-TRV', agentName: 'TravelDesk AI', merchant: 'Delta Air Lines', amount: 2150.00, currency: 'USD', status: 'WAITING_HUMAN_APPROVAL', reason: 'Exceeds agent single-tx cap ($1,500)' },
  { id: 'TXN-9921-PRC', agentId: 'AGT-1044-PROC', agentName: 'ProcurementBot v4', merchant: 'Vercel Inc.', amount: 2400.00, currency: 'USD', status: 'WAITING_HUMAN_APPROVAL', reason: 'First-time domain whitelist hold' }
];

let mockTransactions = [
  { id: 'TXN-8841-AWS', merchant: 'Amazon Web Services', initiator: 'DevOpsProvisioner', amount: -8940.20, status: 'Successful', currency: 'USD' },
  { id: 'TXN-8711-OA', merchant: 'OpenAI API Platform', initiator: 'Customer Agent Swarm', amount: -4215.00, status: 'Successful', currency: 'USD' },
  { id: 'TXN-9024-DAL', merchant: 'Delta Air Lines', initiator: 'TravelDesk AI', amount: -2150.00, status: 'Awaiting Approval', currency: 'USD' }
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // ==================== REST API ENDPOINTS (SECTION 15) ====================
  if (pathname.startsWith('/api') || pathname.startsWith('/agents') || pathname.startsWith('/transactions') || pathname.startsWith('/approvals') || pathname.startsWith('/payment')) {
    
    // Normalize path (handle both /api/... and root /...)
    const route = pathname.replace(/^\/api/, '');

    // GET /health
    if (route === '/health') {
      return sendJson(res, 200, { status: 'ok', service: 'AgentGuard Policy Gateway', mode: 'PayPal Sandbox' });
    }

    // 1. GET /agents
    if (route === '/agents' && req.method === 'GET') {
      return sendJson(res, 200, mockAgents);
    }

    // 2. POST /agents
    if (route === '/agents' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const newAgent = {
        id: body.id || ('AGT-' + Math.floor(1000 + Math.random() * 9000) + '-API'),
        name: body.name || 'New Autonomous Agent',
        model: body.model || 'Claude 3.5 Sonnet',
        status: 'active',
        txLimit: body.txLimit || 1000,
        monthlyCap: body.monthlyCap || 10000,
        monthlySpent: 0,
        whitelistedDomains: body.whitelistedDomains || ['aws.amazon.com']
      };
      mockAgents.push(newAgent);
      return sendJson(res, 201, newAgent);
    }

    // 3. GET /transactions
    if (route === '/transactions' && req.method === 'GET') {
      return sendJson(res, 200, mockTransactions);
    }

    // 4. POST /payment/request
    if (route === '/payment/request' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      // Independent policy evaluation
      const amount = parseFloat(body.amount) || 0;
      const isOverLimit = amount > 1500;
      
      const response = {
        requestId: 'REQ-' + Math.floor(10000 + Math.random() * 90000),
        status: isOverLimit ? 'HELD_FOR_HUMAN_APPROVAL' : 'AUTO_APPROVED',
        reason: isOverLimit ? 'Amount exceeds autonomous policy ceiling' : 'Satisfies merchant allowlist and limits',
        fidoRequired: isOverLimit
      };
      return sendJson(res, 200, response);
    }

    // 5. GET /approvals
    if (route === '/approvals' && req.method === 'GET') {
      return sendJson(res, 200, mockApprovals);
    }

    // 6. POST /approvals/{id}
    if (route.startsWith('/approvals/') && req.method === 'POST') {
      const txnId = decodeURIComponent(route.split('/')[2]);
      const body = await parseJsonBody(req);
      const idx = mockApprovals.findIndex(a => a.id === txnId);
      if (idx !== -1) {
        mockApprovals.splice(idx, 1);
      }
      return sendJson(res, 200, {
        id: txnId,
        decision: body.decision || 'approved',
        status: body.decision === 'approve' ? 'RELEASED_TO_PAYPAL' : 'CANCELLED',
        hmacSignature: '0x' + Math.random().toString(16).slice(2, 18),
        timestamp: new Date().toISOString()
      });
    }

    // 7. GET /agent/logs
    if (route === '/agent/logs' && req.method === 'GET') {
      return sendJson(res, 200, [
        { id: 'LOG-1', level: 'INFO', message: 'HMAC validation passed for AWS micro-spend', latency: '42ms' },
        { id: 'LOG-2', level: 'WARN', message: 'TravelDesk AI transaction held: exceeds $1,500 cap', latency: '110ms' },
        { id: 'LOG-3', level: 'ALERT', message: 'Prompt injection neutralized on SalesOps Bot', latency: '18ms' }
      ]);
    }

    // 8. POST /agents/{id}/pause
    if (route.match(/^\/agents\/([^\/]+)\/pause$/) && req.method === 'POST') {
      const agentId = decodeURIComponent(route.split('/')[2]);
      const body = await parseJsonBody(req);
      const agent = mockAgents.find(a => a.id === agentId);
      if (agent) {
        agent.status = body.paused ? 'paused' : 'active';
        return sendJson(res, 200, { id: agentId, status: agent.status });
      }
      return sendJson(res, 404, { error: 'Agent not found' });
    }
  }

  // ==================== STATIC FILE HANDLER ====================
  let reqPath = pathname;
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`AgentGuard Server running at http://localhost:${PORT}/`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
