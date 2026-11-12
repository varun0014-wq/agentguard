// View 10: Dedicated AI Financial Assistant (Clean, Helpful, Non-Technical Chat)
(function(window) {
  'use strict';

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    const chatList = state.chatMessages || [
      {
        id: 'msg-1',
        sender: 'ai',
        text: "Hello! I am your **AgentGuard Financial Assistant**. I can help you understand your spending, check pending approvals, explain budget limits, and review your AI assistants. What would you like to know today?",
        time: 'Just now'
      }
    ];

    return `
      <div class="max-w-[1100px] mx-auto space-y-6 pb-16 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-xs shrink-0">
              ${getIcon('bot', 'w-6 h-6')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-extrabold text-primary-dark dark:text-white tracking-tight">AI Financial Assistant</h1>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-approved-bg text-status-approved uppercase font-mono">
                  Active Assistant
                </span>
              </div>
              <p class="text-xs text-text-muted dark:text-slate-400 mt-1">
                Ask questions in plain English about your transactions, spending trends, or AI agent permissions.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button"
              onclick="window.AgentGuardViews.clearChatHistory()"
              class="px-3.5 py-2 rounded-xl bg-surface-bg dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-text-muted dark:text-slate-300 border border-surface-border dark:border-slate-700 transition-colors">
              Clear Conversation
            </button>
          </div>
        </div>

        <!-- Suggested Question Prompts -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-text-muted dark:text-slate-400">Suggested Questions (Click to Ask):</span>
          <div class="flex flex-wrap items-center gap-2">
            <button 
              type="button"
              onclick="window.AgentGuardViews.sendAssistantPrompt('How much did I spend this month?')" 
              class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs text-primary dark:text-sky-400 hover:border-primary hover:bg-blue-50/50 transition-all shadow-2xs font-semibold">
              💰 How much did I spend this month?
            </button>
            <button 
              type="button"
              onclick="window.AgentGuardViews.sendAssistantPrompt('Check pending payment approvals')" 
              class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs text-primary dark:text-sky-400 hover:border-primary hover:bg-blue-50/50 transition-all shadow-2xs font-semibold">
              ⏳ Check pending payments
            </button>
            <button 
              type="button"
              onclick="window.AgentGuardViews.sendAssistantPrompt('Identify unusual transactions')" 
              class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs text-primary dark:text-sky-400 hover:border-primary hover:bg-blue-50/50 transition-all shadow-2xs font-semibold">
              🛡️ Identify unusual transactions
            </button>
            <button 
              type="button"
              onclick="window.AgentGuardViews.sendAssistantPrompt('Understand my monthly budget')" 
              class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs text-primary dark:text-sky-400 hover:border-primary hover:bg-blue-50/50 transition-all shadow-2xs font-semibold">
              📊 Understand my monthly budget
            </button>
            <button 
              type="button"
              onclick="window.AgentGuardViews.sendAssistantPrompt('Tell me about my AI agents')" 
              class="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs text-primary dark:text-sky-400 hover:border-primary hover:bg-blue-50/50 transition-all shadow-2xs font-semibold">
              🤖 Tell me about my AI agents
            </button>
          </div>
        </div>

        <!-- Chat Window Container -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-surface-border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[520px]">
          
          <!-- Message Feed -->
          <div id="ai-chat-feed" class="flex-1 p-6 overflow-y-auto space-y-4">
            ${chatList.map(msg => `
              <div class="flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in">
                ${msg.sender === 'ai' ? `
                  <div class="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    ${getIcon('bot', 'w-4 h-4')}
                  </div>
                ` : ''}

                <div class="max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white shadow-xs rounded-tr-none' 
                    : 'bg-surface-bg dark:bg-slate-800 text-text-main dark:text-slate-100 border border-surface-border dark:border-slate-700 rounded-tl-none'
                }">
                  <div class="whitespace-pre-wrap">${msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                  <div class="text-[9px] ${msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-text-muted dark:text-slate-400'} font-mono">${msg.time}</div>
                </div>

                ${msg.sender === 'user' ? `
                  <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-text-main dark:text-slate-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    ${getIcon('user', 'w-4 h-4')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Input Footer -->
          <div class="p-4 bg-surface-bg dark:bg-slate-800/80 border-t border-surface-border dark:border-slate-800">
            <div class="flex items-center gap-2">
              <input 
                id="ai-chat-input"
                type="text" 
                placeholder="Ask anything about your spending, budget, or agents..." 
                onkeydown="if(event.key === 'Enter') window.AgentGuardViews.sendCurrentInput()"
                class="flex-1 h-12 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary shadow-2xs"
              />
              <button 
                type="button"
                onclick="window.AgentGuardViews.sendCurrentInput()"
                class="h-12 px-6 rounded-2xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2">
                <span>Send</span>
                ${getIcon('send', 'w-3.5 h-3.5')}
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['ai-assistant'] = render;

  window.AgentGuardViews.sendAssistantPrompt = function(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) input.value = promptText;
    window.AgentGuardViews.sendCurrentInput();
  };

  window.AgentGuardViews.sendCurrentInput = function() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const state = window.AgentGuardStore.state;
    state.chatMessages = state.chatMessages || [];
    state.chatMessages.push({ id: 'msg-' + Date.now(), sender: 'user', text, time: nowTime });

    // Generate plain-English helpful responses based on store data
    let botResponse = '';
    const lower = text.toLowerCase();

    if (lower.includes('spend') && (lower.includes('month') || lower.includes('how much'))) {
      const spent = state.financials.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const cap = state.financials.monthlyCap.toLocaleString('en-US');
      const left = (state.financials.monthlyCap - state.financials.monthlySpend).toLocaleString('en-US', { minimumFractionDigits: 2 });
      botResponse = `This month, you have spent a total of **$${spent} USD** out of your **$${cap} USD** spending limit.\n\nYou have **$${left} USD** remaining, and your current expenditures are safely within your budget cap.`;
    } else if (lower.includes('pending') || lower.includes('approval')) {
      const count = state.pendingApprovals.length;
      if (count === 0) {
        botResponse = `You have **no pending payments** waiting for your approval right now. Everything is up to date!`;
      } else {
        const details = state.pendingApprovals.map(p => `• **$${p.amount.toFixed(2)} USD** to ${p.recipient} (${p.agentName})`).join('\n');
        botResponse = `You currently have **${count} payments** waiting for your approval:\n\n${details}\n\nYou can review and approve them on the **Payment Approvals** page.`;
      }
    } else if (lower.includes('unusual') || lower.includes('blocked') || lower.includes('suspicious')) {
      const blockedCount = state.blockedPayments.length;
      botResponse = `Our firewall has stopped **${blockedCount} suspicious payment attempts** recently:\n\n• **$1,200.00 USD** to an unverified private address was blocked.\n• **$5,040.00 USD** with an unusual price surge was held.\n\nAll your balance was completely protected, and zero unauthorized funds left your account.`;
    } else if (lower.includes('budget') || lower.includes('limit')) {
      const cap = state.financials.monthlyCap.toLocaleString('en-US');
      const spent = state.financials.monthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 });
      botResponse = `Your monthly spending limit is currently set to **$${cap} USD**.\n\nSo far, you have utilized **${((state.financials.monthlySpend / state.financials.monthlyCap) * 100).toFixed(1)}%** of this limit. You can adjust your budget at any time on the **Monthly Spending** page.`;
    } else if (lower.includes('agent') || lower.includes('bot')) {
      const active = state.agents.filter(a => a.status === 'Active').length;
      const paused = state.agents.filter(a => a.status === 'Paused').length;
      botResponse = `You have **6 connected AI assistants**:\n• **${active} are Active** and managing tasks within their limits.\n• **${paused} is Paused** for your review.\n\nEach assistant has strict per-transaction and monthly caps configured in the **Agent Control** panel.`;
    } else {
      botResponse = `I've analyzed your financial status: Your total balance is **$${state.financials.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD**, and all systems are safe. You have **${state.pendingApprovals.length} pending payments** to review. Let me know if you would like me to explain any specific expense or agent limit!`;
    }

    state.chatMessages.push({ id: 'msg-' + (Date.now() + 1), sender: 'ai', text: botResponse, time: nowTime });

    window.AgentGuardApp.renderActiveView();

    // Auto-scroll chat to bottom
    setTimeout(() => {
      const feed = document.getElementById('ai-chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 50);
  };

  window.AgentGuardViews.clearChatHistory = function() {
    window.AgentGuardStore.state.chatMessages = [
      {
        id: 'msg-start',
        sender: 'ai',
        text: 'Conversation cleared. How can I help you with your spending or agents today?',
        time: 'Just now'
      }
    ];
    window.AgentGuardApp.renderActiveView();
  };

})(window);
