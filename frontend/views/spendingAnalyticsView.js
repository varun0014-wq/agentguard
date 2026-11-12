// View alias: Spending Analytics maps directly to the enhanced Monthly Spending View
(function(window) {
  'use strict';
  // Both routes 'spending-analytics' and 'monthly-spending' use the same controller
  window.AgentGuardViews = window.AgentGuardViews || {};
  if (window.AgentGuardViews['monthly-spending']) {
    window.AgentGuardViews['spending-analytics'] = window.AgentGuardViews['monthly-spending'];
  }
})(window);
