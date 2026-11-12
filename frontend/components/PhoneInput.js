// International Phone Number Component with Searchable Worldwide Country Selector
(function(window) {
  'use strict';

  const COUNTRIES = [
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', format: '(###) ###-####', placeholder: '(555) 019-2834' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', format: '#### ######', placeholder: '7911 123456' },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', format: '##### #####', placeholder: '98765 43210' },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', format: '(###) ###-####', placeholder: '(416) 555-0199' },
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', format: '### ### ###', placeholder: '412 345 678' },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', format: '#### ########', placeholder: '1512 3456789' },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', format: '# ## ## ## ##', placeholder: '6 12 34 56 78' },
    { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪', format: '## ### ####', placeholder: '50 123 4567' },
    { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬', format: '#### ####', placeholder: '9123 4567' },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', format: '## #### ####', placeholder: '90 1234 5678' },
    { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', format: '## ### ## ##', placeholder: '79 123 45 67' },
    { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱', format: '# ########', placeholder: '6 12345678' },
    { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', format: '### #######', placeholder: '312 3456789' },
    { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', format: '### ### ###', placeholder: '612 345 678' },
    { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪', format: '##-### ## ##', placeholder: '70-123 45 67' },
    { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', format: '### ## ###', placeholder: '412 34 567' },
    { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', format: '## ## ## ##', placeholder: '20 12 34 56' },
    { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮', format: '### #######', placeholder: '412 3456789' },
    { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪', format: '## #######', placeholder: '85 1234567' },
    { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿', format: '## ### ####', placeholder: '21 123 4567' },
    { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', format: '(##) #####-####', placeholder: '(11) 91234-5678' },
    { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', format: '### ### ####', placeholder: '551 234 5678' },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', format: '## ### ####', placeholder: '71 123 4567' },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', format: '## ### ####', placeholder: '50 123 4567' },
    { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦', format: '#### ####', placeholder: '3312 3456' },
    { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼', format: '#### ####', placeholder: '5123 4567' },
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷', format: '##-####-####', placeholder: '10-1234-5678' },
    { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰', format: '#### ####', placeholder: '9123 4567' },
    { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾', format: '##-### ####', placeholder: '12-345 6789' },
    { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩', format: '###-####-####', placeholder: '812-3456-7890' },
    { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭', format: '### ### ####', placeholder: '917 123 4567' },
    { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭', format: '##-###-####', placeholder: '81-234-5678' },
    { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳', format: '### ### ####', placeholder: '912 345 678' },
    { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', format: '### ### ###', placeholder: '512 345 678' },
    { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹', format: '### #######', placeholder: '664 1234567' },
    { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪', format: '### ## ## ##', placeholder: '470 12 34 56' },
    { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', format: '### ### ###', placeholder: '912 345 678' },
    { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱', format: '##-###-####', placeholder: '50-123-4567' },
    { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬', format: '### ### ####', placeholder: '100 123 4567' },
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', format: '### ### ####', placeholder: '803 123 4567' }
  ];

  function renderPhoneInput(id, initialCountry = 'US', initialValue = '') {
    const defaultCountry = COUNTRIES.find(c => c.code === initialCountry) || COUNTRIES[0];

    return `
      <div id="${id}-wrapper" class="relative flex items-center rounded-xl border border-surface-border bg-white dark:bg-slate-900 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-xs transition-all">
        <!-- Country Selector Trigger -->
        <div class="relative">
          <button type="button" id="${id}-country-btn" onclick="window.PhoneInputComponent.toggleDropdown('${id}')" class="flex items-center gap-1.5 h-10 px-3 border-r border-surface-border text-xs font-semibold text-text-main dark:text-slate-200 hover:bg-surface-bg dark:hover:bg-slate-800 transition-colors rounded-l-xl select-none">
            <span id="${id}-flag" class="text-base">${defaultCountry.flag}</span>
            <span id="${id}-dial" class="font-mono text-text-muted dark:text-slate-400 text-xs">${defaultCountry.dial}</span>
            <svg class="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <!-- Searchable Dropdown Menu -->
          <div id="${id}-dropdown" class="absolute left-0 top-11 z-50 hidden w-72 max-h-64 overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-surface-border shadow-2xl py-1 text-xs">
            <!-- Search Filter Bar -->
            <div class="p-2 border-b border-surface-border">
              <input 
                type="text" 
                placeholder="Search country or code..." 
                oninput="window.PhoneInputComponent.filterCountries('${id}', this.value)"
                class="w-full h-8 px-2.5 rounded-lg bg-surface-bg dark:bg-slate-800 border border-surface-border text-xs text-text-main dark:text-slate-100 placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <!-- Country List -->
            <div id="${id}-country-list" class="max-h-48 overflow-y-auto divide-y divide-surface-border/40">
              ${renderCountryList(id, COUNTRIES)}
            </div>
          </div>
        </div>

        <!-- Phone Input Field -->
        <input 
          id="${id}-number" 
          type="tel" 
          value="${initialValue}" 
          placeholder="${defaultCountry.placeholder}"
          data-country="${defaultCountry.code}"
          oninput="window.PhoneInputComponent.handleInput('${id}', this.value)"
          class="w-full h-10 px-3 text-xs font-mono font-medium text-text-main dark:text-slate-100 bg-transparent focus:outline-none placeholder:text-text-muted"
        />

        <!-- Validation Status Indicator -->
        <div id="${id}-validation" class="pr-3 text-xs font-mono hidden">
          <span class="text-status-approved">✓ Valid</span>
        </div>
      </div>
    `;
  }

  function renderCountryList(id, list) {
    return list.map(c => `
      <button type="button" onclick="window.PhoneInputComponent.selectCountry('${id}', '${c.code}')" class="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-bg dark:hover:bg-slate-800 text-text-main dark:text-slate-200 transition-colors">
        <span class="flex items-center gap-2">
          <span class="text-base">${c.flag}</span>
          <span class="font-medium truncate max-w-[150px]">${c.name}</span>
        </span>
        <span class="font-mono font-semibold text-text-muted text-[11px]">${c.dial}</span>
      </button>
    `).join('');
  }

  function filterCountries(id, query) {
    const listEl = document.getElementById(`${id}-country-list`);
    if (!listEl) return;
    const q = query.toLowerCase().trim();
    const filtered = COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.dial.includes(q) || 
      c.code.toLowerCase().includes(q)
    );
    listEl.innerHTML = renderCountryList(id, filtered);
  }

  function toggleDropdown(id) {
    const dropdown = document.getElementById(`${id}-dropdown`);
    if (dropdown) dropdown.classList.toggle('hidden');
  }

  function selectCountry(id, countryCode) {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (!country) return;

    const flagEl = document.getElementById(`${id}-flag`);
    const dialEl = document.getElementById(`${id}-dial`);
    const inputEl = document.getElementById(`${id}-number`);
    const dropdown = document.getElementById(`${id}-dropdown`);

    if (flagEl) flagEl.textContent = country.flag;
    if (dialEl) dialEl.textContent = country.dial;
    if (inputEl) {
      inputEl.placeholder = country.placeholder;
      inputEl.setAttribute('data-country', country.code);
      handleInput(id, inputEl.value);
    }
    if (dropdown) dropdown.classList.add('hidden');
  }

  function handleInput(id, value) {
    const validEl = document.getElementById(`${id}-validation`);
    const digits = value.replace(/\D/g, '');
    const isValid = digits.length >= 7 && digits.length <= 14;

    if (validEl) {
      if (digits.length >= 7) {
        validEl.classList.remove('hidden');
        validEl.innerHTML = `<span class="${isValid ? 'text-status-approved font-bold' : 'text-accent-orange font-bold'} text-[11px]">✓</span>`;
      } else {
        validEl.classList.add('hidden');
      }
    }
  }

  function getFullNumber(id) {
    const inputEl = document.getElementById(`${id}-number`);
    const dialEl = document.getElementById(`${id}-dial`);
    if (!inputEl) return '';
    const dial = dialEl ? dialEl.textContent.trim() : '';
    const rawVal = inputEl.value.trim();
    if (!rawVal) return '';
    return `${dial} ${rawVal}`;
  }

  window.PhoneInputComponent = {
    COUNTRIES,
    render: renderPhoneInput,
    toggleDropdown,
    selectCountry,
    filterCountries,
    handleInput,
    getFullNumber
  };
})(window);
