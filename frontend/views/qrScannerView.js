// View: QR Code Point-of-Sale Scanner
(function(window) {
  'use strict';

  let scannedResult = null;
  let isCameraActive = false;

  const SAMPLE_PRESETS = [
    {
      merchant: 'Blue Bottle Coffee',
      category: 'Food & Beverage',
      amount: 4.75,
      currency: 'USD',
      note: 'Espresso + Oat Milk Cortado',
      verified: true
    },
    {
      merchant: 'Apple Store Downtown',
      category: 'Hardware & Electronics',
      amount: 199.00,
      currency: 'USD',
      note: 'USB-C Display Adapters & Cables',
      verified: true
    },
    {
      merchant: 'WeWork Office Space',
      category: 'Workspace Rental',
      amount: 65.00,
      currency: 'USD',
      note: 'Team Conference Room (2 Hours)',
      verified: true
    },
    {
      merchant: 'Apex Cloud Hardware',
      category: 'IT Infrastructure',
      amount: 320.00,
      currency: 'USD',
      note: 'Rackmount Power Distributor',
      verified: true
    }
  ];

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;

    return `
      <div class="max-w-[1100px] mx-auto space-y-6 pb-12 animate-fade-in">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-surface-border dark:border-slate-800 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-primary-dark dark:text-white">QR Code Scanner</h1>
            <p class="text-xs text-text-muted dark:text-slate-400 mt-0.5">
              Scan point-of-sale invoices, vendor tags, and merchant QR codes with instant verification.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-slate-800 text-primary border border-primary/20 flex items-center gap-1.5">
            ${getIcon('qr-code', 'w-3.5 h-3.5')}
            Point of Sale (POS)
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Column: Scanner Viewfinder (Cols 1-7) -->
          <div class="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-4">
            
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <span>Camera Viewfinder</span>
              </h3>
              <div class="flex items-center gap-2">
                <button 
                  type="button"
                  onclick="window.AgentGuardViews.toggleCameraStream()"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold ${isCameraActive ? 'bg-red-50 text-status-blocked' : 'bg-surface-bg dark:bg-slate-800 text-text-main dark:text-slate-200'} hover:opacity-80 transition-all flex items-center gap-1.5">
                  ${getIcon('camera', 'w-3.5 h-3.5')}
                  <span>${isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                </button>
              </div>
            </div>

            <!-- Viewfinder Area -->
            <div class="relative w-full aspect-4/3 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
              
              <!-- Video Stream Element -->
              <video id="qr-video-element" class="absolute inset-0 w-full h-full object-cover ${isCameraActive ? '' : 'hidden'}" autoplay playsinline muted></video>

              <!-- Simulated Background Graphic when camera off -->
              ${!isCameraActive ? `
                <div class="text-center p-6 space-y-3 z-10">
                  <div class="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-white/70">
                    ${getIcon('qr-code', 'w-8 h-8')}
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white">Camera Standby</div>
                    <p class="text-xs text-slate-400 mt-1 max-w-xs">
                      Click 'Start Camera' to open your webcam, or select a sample invoice below to simulate an instant scan.
                    </p>
                  </div>
                </div>
              ` : ''}

              <!-- Viewfinder Target Reticle -->
              <div class="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-primary/60 rounded-2xl pointer-events-none z-20 flex items-center justify-center">
                <!-- Reticle Corners -->
                <div class="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div class="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div class="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                
                <!-- Laser scan animation -->
                <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse"></div>
              </div>

            </div>

            <!-- Preset Invoices for Testing -->
            <div class="space-y-2 pt-2">
              <span class="text-xs font-bold text-text-muted dark:text-slate-400 block">
                Quick Scan Simulation (Click to test):
              </span>
              <div class="grid grid-cols-2 gap-2">
                ${SAMPLE_PRESETS.map((preset, idx) => `
                  <button 
                    type="button"
                    onclick="window.AgentGuardViews.selectQrPreset(${idx})"
                    class="p-2.5 rounded-xl bg-surface-bg dark:bg-slate-800 hover:border-primary border border-surface-border dark:border-slate-700 text-left transition-all">
                    <div class="font-bold text-primary-dark dark:text-white text-xs truncate">${preset.merchant}</div>
                    <div class="flex items-center justify-between text-[11px] text-text-muted mt-0.5">
                      <span class="font-mono font-semibold text-primary">$${preset.amount.toFixed(2)}</span>
                      <span class="text-[10px] bg-blue-50 dark:bg-slate-700 text-primary px-1.5 py-0.2 rounded font-semibold">Scan</span>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- Right Column: Scanned Invoice & Confirmation (Cols 8-12) -->
          <div class="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-surface-border dark:border-slate-800 shadow-xs space-y-5">
            <h3 class="text-base font-bold text-primary-dark dark:text-white">Scanned Payment Invoice</h3>

            ${scannedResult ? `
              <div class="space-y-4">
                
                <!-- Verified Status Pill -->
                <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-status-approved/20 flex items-center gap-2.5">
                  ${getIcon('check-circle', 'w-5 h-5 text-status-approved shrink-0')}
                  <div>
                    <div class="text-xs font-bold text-status-approved">Verified Merchant Invoice</div>
                    <div class="text-[11px] text-text-muted dark:text-slate-400">Authenticated through PayPal Merchant Directory</div>
                  </div>
                </div>

                <!-- Invoice Details -->
                <div class="p-4 rounded-xl bg-surface-bg dark:bg-slate-800 border border-surface-border dark:border-slate-700 space-y-3 text-xs">
                  <div class="flex justify-between items-start pb-2 border-b border-surface-border dark:border-slate-700">
                    <div>
                      <span class="text-text-muted text-[11px]">Merchant</span>
                      <div class="text-base font-bold text-primary-dark dark:text-white">${scannedResult.merchant}</div>
                      <span class="text-[11px] text-text-muted">${scannedResult.category}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-text-muted text-[11px]">Amount</span>
                      <div class="text-xl font-mono font-black text-primary-dark dark:text-white">
                        $${scannedResult.amount.toFixed(2)}
                      </div>
                      <span class="text-[10px] font-mono font-bold text-primary">${scannedResult.currency}</span>
                    </div>
                  </div>

                  <div class="flex justify-between items-center text-xs">
                    <span class="text-text-muted">Description:</span>
                    <strong class="text-text-main dark:text-slate-200">${scannedResult.note}</strong>
                  </div>

                  <div class="flex justify-between items-center text-xs">
                    <span class="text-text-muted">Payment Source:</span>
                    <span class="font-semibold text-primary">PayPal Primary Vault</span>
                  </div>

                  <div class="flex justify-between items-center text-xs">
                    <span class="text-text-muted">Approval Status:</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-status-approved-bg text-status-approved">
                      Pre-Approved
                    </span>
                  </div>
                </div>

                <!-- Human Confirmation Action -->
                <div class="space-y-2 pt-2">
                  <button 
                    type="button"
                    onclick="window.AgentGuardViews.confirmQrPayment()"
                    class="w-full py-3 px-4 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2">
                    ${getIcon('check', 'w-4 h-4')}
                    <span>Authorize & Pay $${scannedResult.amount.toFixed(2)} USD</span>
                  </button>

                  <button 
                    type="button"
                    onclick="window.AgentGuardViews.clearScannedResult()"
                    class="w-full py-2 text-xs font-semibold text-text-muted hover:text-text-main transition-colors">
                    Cancel & Scan Another
                  </button>
                </div>

              </div>
            ` : `
              <div class="p-8 text-center rounded-xl bg-surface-bg dark:bg-slate-800 border border-dashed border-surface-border dark:border-slate-700 space-y-2">
                <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-700 text-primary mx-auto flex items-center justify-center">
                  ${getIcon('qr-code', 'w-6 h-6')}
                </div>
                <div class="text-xs font-bold text-primary-dark dark:text-white">No QR Code Scanned Yet</div>
                <p class="text-[11px] text-text-muted dark:text-slate-400 max-w-xs mx-auto">
                  Aim your camera at a merchant QR code or click any quick simulation button on the left.
                </p>
              </div>
            `}

            <!-- Security Assurance Note -->
            <div class="p-3.5 rounded-xl bg-surface-bg dark:bg-slate-800/50 border border-surface-border dark:border-slate-700 text-[11px] text-text-muted dark:text-slate-400 space-y-1">
              <strong class="text-primary-dark dark:text-white block font-semibold">Explicit Confirmation Protected:</strong>
              <p>Funds are never disbursed automatically without your explicit review and one-tap authorization.</p>
            </div>

          </div>

        </div>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['qr-scanner'] = render;

  window.AgentGuardViews.selectQrPreset = function(idx) {
    scannedResult = SAMPLE_PRESETS[idx];
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.clearScannedResult = function() {
    scannedResult = null;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.confirmQrPayment = function() {
    if (!scannedResult) return;
    const { merchant, amount } = scannedResult;
    window.AgentGuardApp.showToast(`Paid $${amount.toFixed(2)} USD to ${merchant} successfully.`, 'success');
    scannedResult = null;
    window.AgentGuardApp.renderActiveView();
  };

  window.AgentGuardViews.toggleCameraStream = async function() {
    isCameraActive = !isCameraActive;
    window.AgentGuardApp.renderActiveView();

    if (isCameraActive) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          const video = document.getElementById('qr-video-element');
          if (video) {
            video.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Camera access unavailable:', err);
        window.AgentGuardApp.showToast('Camera access unavailable. Use quick simulation buttons.', 'info');
      }
    } else {
      const video = document.getElementById('qr-video-element');
      if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
    }
  };

})(window);
