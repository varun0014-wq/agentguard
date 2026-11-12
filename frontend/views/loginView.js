// View: Premium PayPal-Inspired Login & Authentication Experience
(function(window) {
  'use strict';

  let currentAuthTab = 'signin'; // 'signin' | 'signup' | 'forgot'
  let showPassword = false;
  let rememberMe = true;
  let showCountryDropdown = false;
  let countrySearchQuery = '';
  let selectedCountry = { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' };

  // Comprehensive Worldwide Country Catalog (40+ Active Countries)
  const AVAILABLE_COUNTRIES = [
    { code: 'IN', name: 'India', dialCode: '+91' },
    { code: 'US', name: 'United States', dialCode: '+1' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
    { code: 'DE', name: 'Germany', dialCode: '+49' },
    { code: 'CA', name: 'Canada', dialCode: '+1' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'FR', name: 'France', dialCode: '+33' },
    { code: 'SG', name: 'Singapore', dialCode: '+65' },
    { code: 'JP', name: 'Japan', dialCode: '+81' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31' },
    { code: 'IT', name: 'Italy', dialCode: '+39' },
    { code: 'ES', name: 'Spain', dialCode: '+34' },
    { code: 'SE', name: 'Sweden', dialCode: '+46' },
    { code: 'NO', name: 'Norway', dialCode: '+47' },
    { code: 'DK', name: 'Denmark', dialCode: '+45' },
    { code: 'FI', name: 'Finland', dialCode: '+358' },
    { code: 'IE', name: 'Ireland', dialCode: '+353' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
    { code: 'BR', name: 'Brazil', dialCode: '+55' },
    { code: 'MX', name: 'Mexico', dialCode: '+52' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
    { code: 'QA', name: 'Qatar', dialCode: '+974' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965' },
    { code: 'KR', name: 'South Korea', dialCode: '+82' },
    { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62' },
    { code: 'PH', name: 'Philippines', dialCode: '+63' },
    { code: 'TH', name: 'Thailand', dialCode: '+66' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84' },
    { code: 'PL', name: 'Poland', dialCode: '+48' },
    { code: 'AT', name: 'Austria', dialCode: '+43' },
    { code: 'BE', name: 'Belgium', dialCode: '+32' },
    { code: 'PT', name: 'Portugal', dialCode: '+351' },
    { code: 'IL', name: 'Israel', dialCode: '+972' },
    { code: 'EG', name: 'Egypt', dialCode: '+20' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234' }
  ];

  // Pure Vector SVG Flags for All Supported Countries (Crisp on all devices, matching PayPal official styling)
  function getFlagSvg(code, className = "w-6 h-4 rounded-[2px] shadow-2xs inline-block shrink-0") {
    switch(code) {
      case 'IN':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF9933" d="M0 0h640v160H0z"/>
          <path fill="#FFFFFF" d="M0 160h640v160H0z"/>
          <path fill="#128807" d="M0 320h640v160H0z"/>
          <g transform="translate(320 240)">
            <circle r="44" fill="none" stroke="#000088" stroke-width="6"/>
            <circle r="8" fill="#000088"/>
            <g stroke="#000088" stroke-width="2.2">
              <line x1="0" y1="-44" x2="0" y2="44"/><line x1="-44" y1="0" x2="44" y2="0"/>
              <line x1="-31.1" y1="-31.1" x2="31.1" y2="31.1"/><line x1="-31.1" y1="31.1" x2="31.1" y2="-31.1"/>
              <line x1="-16.8" y1="-40.6" x2="16.8" y2="40.6"/><line x1="-40.6" y1="-16.8" x2="40.6" y2="16.8"/>
              <line x1="-40.6" y1="16.8" x2="40.6" y2="-16.8"/><line x1="-16.8" y1="40.6" x2="16.8" y2="-40.6"/>
            </g>
          </g>
        </svg>`;
      case 'US':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#B22234" d="M0 0h640v480H0z"/>
          <path stroke="#FFFFFF" stroke-width="37" d="M0 55.4h640M0 129.2h640M0 203.1h640M0 276.9h640M0 350.8h640M0 424.6h640"/>
          <path fill="#3C3B6E" d="M0 0h260v258.5H0z"/>
          <g fill="#FFFFFF">
            <circle cx="35" cy="30" r="8"/><circle cx="85" cy="30" r="8"/><circle cx="135" cy="30" r="8"/><circle cx="185" cy="30" r="8"/><circle cx="235" cy="30" r="8"/>
            <circle cx="60" cy="65" r="8"/><circle cx="110" cy="65" r="8"/><circle cx="160" cy="65" r="8"/><circle cx="210" cy="65" r="8"/>
            <circle cx="35" cy="100" r="8"/><circle cx="85" cy="100" r="8"/><circle cx="135" cy="100" r="8"/><circle cx="185" cy="100" r="8"/><circle cx="235" cy="100" r="8"/>
            <circle cx="60" cy="135" r="8"/><circle cx="110" cy="135" r="8"/><circle cx="160" cy="135" r="8"/><circle cx="210" cy="135" r="8"/>
            <circle cx="35" cy="170" r="8"/><circle cx="85" cy="170" r="8"/><circle cx="135" cy="170" r="8"/><circle cx="185" cy="170" r="8"/><circle cx="235" cy="170" r="8"/>
            <circle cx="60" cy="205" r="8"/><circle cx="110" cy="205" r="8"/><circle cx="160" cy="205" r="8"/><circle cx="210" cy="205" r="8"/>
          </g>
        </svg>`;
      case 'GB':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#012169" d="M0 0h640v480H0z"/>
          <path stroke="#FFFFFF" stroke-width="60" d="M0 0l640 480M0 480L640 0"/>
          <path stroke="#C8102E" stroke-width="32" d="M0 0l640 480M0 480L640 0"/>
          <path stroke="#FFFFFF" stroke-width="100" d="M320 0v480M0 240h640"/>
          <path stroke="#C8102E" stroke-width="60" d="M320 0v480M0 240h640"/>
        </svg>`;
      case 'DE':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#000000" d="M0 0h640v160H0z"/>
          <path fill="#DD0000" d="M0 160h640v160H0z"/>
          <path fill="#FFCE00" d="M0 320h640v160H0z"/>
        </svg>`;
      case 'FR':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#002395" d="M0 0h213.3v480H0z"/>
          <path fill="#FFFFFF" d="M213.3 0h213.4v480H213.3z"/>
          <path fill="#ED2939" d="M426.7 0h213.3v480H426.7z"/>
        </svg>`;
      case 'IT':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#009246" d="M0 0h213.3v480H0z"/>
          <path fill="#FFFFFF" d="M213.3 0h213.4v480H213.3z"/>
          <path fill="#CE2B37" d="M426.7 0h213.3v480H426.7z"/>
        </svg>`;
      case 'JP':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFFFFF" d="M0 0h640v480H0z"/>
          <circle cx="320" cy="240" r="120" fill="#BC002D"/>
        </svg>`;
      case 'CA':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#D52B1E" d="M0 0h640v480H0z"/>
          <path fill="#FFFFFF" d="M160 0h320v480H160z"/>
          <path fill="#D52B1E" d="M320 120l20 50 45-20-20 40 50 20-40 25 25 35-50-5-5 50-25-30-25 30-5-50-50 5 25-35-40-25 50-20-20-40 45 20z"/>
        </svg>`;
      case 'AE':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#00732F" d="M0 0h640v160H0z"/>
          <path fill="#FFFFFF" d="M0 160h640v160H0z"/>
          <path fill="#000000" d="M0 320h640v160H0z"/>
          <path fill="#FF0000" d="M0 0h160v480H0z"/>
        </svg>`;
      case 'AU':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#00008B" d="M0 0h640v480H0z"/>
          <path fill="#012169" d="M0 0h320v240H0z"/>
          <path stroke="#FFF" stroke-width="30" d="M0 0l320 240M0 240L320 0"/>
          <path stroke="#C8102E" stroke-width="16" d="M0 0l320 240M0 240L320 0"/>
          <path stroke="#FFF" stroke-width="50" d="M160 0v240M0 120h320"/>
          <path stroke="#C8102E" stroke-width="30" d="M160 0v240M0 120h320"/>
          <circle cx="480" cy="100" r="10" fill="#FFF"/>
          <circle cx="540" cy="180" r="10" fill="#FFF"/>
          <circle cx="480" cy="340" r="10" fill="#FFF"/>
          <circle cx="420" cy="220" r="10" fill="#FFF"/>
          <circle cx="510" cy="260" r="6" fill="#FFF"/>
          <circle cx="160" cy="360" r="26" fill="#FFF"/>
        </svg>`;
      case 'SG':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ED2939" d="M0 0h640v240H0z"/>
          <path fill="#FFFFFF" d="M0 240h640v240H0z"/>
          <circle cx="120" cy="120" r="55" fill="#FFFFFF"/>
          <circle cx="140" cy="120" r="45" fill="#ED2939"/>
          <circle cx="155" cy="95" r="7" fill="#FFFFFF"/>
          <circle cx="170" cy="115" r="7" fill="#FFFFFF"/>
          <circle cx="165" cy="140" r="7" fill="#FFFFFF"/>
          <circle cx="145" cy="145" r="7" fill="#FFFFFF"/>
          <circle cx="140" cy="100" r="7" fill="#FFFFFF"/>
        </svg>`;
      case 'CH':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#D52B1E" d="M0 0h640v480H0z"/>
          <path fill="#FFFFFF" d="M260 120h120v240H260zM160 200h320v80H160z"/>
        </svg>`;
      case 'NL':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#AE1C28" d="M0 0h640v160H0z"/>
          <path fill="#FFFFFF" d="M0 160h640v160H0z"/>
          <path fill="#21468B" d="M0 320h640v160H0z"/>
        </svg>`;
      case 'ES':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#AA151B" d="M0 0h640v120H0z"/>
          <path fill="#F1BF00" d="M0 120h640v240H0z"/>
          <path fill="#AA151B" d="M0 360h640v120H0z"/>
          <circle cx="180" cy="240" r="36" fill="#AA151B" opacity="0.8"/>
        </svg>`;
      case 'SE':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#006AA7" d="M0 0h640v480H0z"/>
          <path fill="#FECC00" d="M200 0h80v480h-80zM0 200h640v80H0z"/>
        </svg>`;
      case 'NO':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#BA0C2F" d="M0 0h640v480H0z"/>
          <path fill="#FFFFFF" d="M180 0h120v480H180zM0 180h640v120H0z"/>
          <path fill="#00205B" d="M210 0h60v480h-60zM0 210h640v60H0z"/>
        </svg>`;
      case 'DK':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#C60C30" d="M0 0h640v480H0z"/>
          <path fill="#FFFFFF" d="M190 0h70v480h-70zM0 205h640v70H0z"/>
        </svg>`;
      case 'FI':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFFFFF" d="M0 0h640v480H0z"/>
          <path fill="#002F6C" d="M190 0h90v480h-90zM0 195h640v90H0z"/>
        </svg>`;
      case 'IE':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#169B62" d="M0 0h213.3v480H0z"/>
          <path fill="#FFFFFF" d="M213.3 0h213.4v480H213.3z"/>
          <path fill="#FF883E" d="M426.7 0h213.3v480H426.7z"/>
        </svg>`;
      case 'NZ':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#00247D" d="M0 0h640v480H0z"/>
          <path fill="#012169" d="M0 0h320v240H0z"/>
          <path stroke="#FFF" stroke-width="30" d="M0 0l320 240M0 240L320 0"/>
          <path stroke="#C8102E" stroke-width="16" d="M0 0l320 240M0 240L320 0"/>
          <path stroke="#FFF" stroke-width="50" d="M160 0v240M0 120h320"/>
          <path stroke="#C8102E" stroke-width="30" d="M160 0v240M0 120h320"/>
          <circle cx="480" cy="110" r="12" fill="#C8102E" stroke="#FFF" stroke-width="3"/>
          <circle cx="540" cy="200" r="12" fill="#C8102E" stroke="#FFF" stroke-width="3"/>
          <circle cx="480" cy="350" r="14" fill="#C8102E" stroke="#FFF" stroke-width="3"/>
          <circle cx="420" cy="220" r="12" fill="#C8102E" stroke="#FFF" stroke-width="3"/>
        </svg>`;
      case 'BR':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#009B3A" d="M0 0h640v480H0z"/>
          <polygon points="320,40 600,240 320,440 40,240" fill="#FEDF00"/>
          <circle cx="320" cy="240" r="95" fill="#002776"/>
          <path d="M230 248a100 100 0 0 1 180-20" stroke="#FFF" stroke-width="10" fill="none"/>
        </svg>`;
      case 'MX':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#006847" d="M0 0h213.3v480H0z"/>
          <path fill="#FFFFFF" d="M213.3 0h213.4v480H213.3z"/>
          <path fill="#CE1126" d="M426.7 0h213.3v480H426.7z"/>
          <circle cx="320" cy="240" r="30" fill="#8B5A2B"/>
        </svg>`;
      case 'ZA':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#007749" d="M0 0h640v480H0z"/>
          <path fill="#E03C31" d="M240 0h400v160H320z"/>
          <path fill="#001489" d="M240 480h400v-160H320z"/>
          <polygon points="0,0 200,240 0,480" fill="#000000"/>
          <polygon points="0,15 150,240 0,465" fill="#FFB81C"/>
          <polygon points="0,35 120,240 0,445" fill="#000000"/>
        </svg>`;
      case 'SA':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#006C35" d="M0 0h640v480H0z"/>
          <rect x="180" y="270" width="280" height="14" fill="#FFFFFF" rx="4"/>
          <rect x="230" y="190" width="180" height="24" fill="#FFFFFF" rx="6" opacity="0.9"/>
        </svg>`;
      case 'QA':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#8D1B3D" d="M0 0h640v480H0z"/>
          <polygon points="0,0 200,0 240,40 200,80 240,120 200,160 240,200 200,240 240,280 200,320 240,360 200,400 240,440 200,480 0,480" fill="#FFFFFF"/>
        </svg>`;
      case 'KW':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#007A3D" d="M0 0h640v160H0z"/>
          <path fill="#FFFFFF" d="M0 160h640v160H0z"/>
          <path fill="#CE1126" d="M0 320h640v160H0z"/>
          <polygon points="0,0 160,160 160,320 0,480" fill="#000000"/>
        </svg>`;
      case 'KR':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFFFFF" d="M0 0h640v480H0z"/>
          <g transform="translate(320 240)">
            <path d="M0-90a90 90 0 0 1 0 180 45 45 0 0 1 0-90 45 45 0 0 0 0-90z" fill="#CD2E3A"/>
            <path d="M0 90a90 90 0 0 1 0-180 45 45 0 0 1 0 90 45 45 0 0 0 0 90z" fill="#0047A0"/>
          </g>
        </svg>`;
      case 'HK':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EE1C25" d="M0 0h640v480H0z"/>
          <circle cx="320" cy="240" r="75" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="320" cy="240" r="50" fill="#EE1C25"/>
        </svg>`;
      case 'MY':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#CC0000" d="M0 0h640v480H0z"/>
          <path stroke="#FFF" stroke-width="34" d="M0 51h640M0 119h640M0 187h640M0 255h640M0 323h640M0 391h640M0 459h640"/>
          <path fill="#000066" d="M0 0h320v272H0z"/>
          <circle cx="150" cy="136" r="60" fill="#FFCC00"/>
          <circle cx="170" cy="136" r="50" fill="#000066"/>
          <circle cx="210" cy="136" r="28" fill="#FFCC00"/>
        </svg>`;
      case 'ID':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF0000" d="M0 0h640v240H0z"/>
          <path fill="#FFFFFF" d="M0 240h640v240H0z"/>
        </svg>`;
      case 'PL':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFFFFF" d="M0 0h640v240H0z"/>
          <path fill="#DC143C" d="M0 240h640v240H0z"/>
        </svg>`;
      case 'AT':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ED2939" d="M0 0h640v160H0z"/>
          <path fill="#FFFFFF" d="M0 160h640v160H0z"/>
          <path fill="#ED2939" d="M0 320h640v160H0z"/>
        </svg>`;
      case 'BE':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#000000" d="M0 0h213.3v480H0z"/>
          <path fill="#FDDA24" d="M213.3 0h213.4v480H213.3z"/>
          <path fill="#EF3340" d="M426.7 0h213.3v480H426.7z"/>
        </svg>`;
      case 'PT':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#046A38" d="M0 0h256v480H0z"/>
          <path fill="#DA291C" d="M256 0h384v480H256z"/>
          <circle cx="256" cy="240" r="65" fill="#FFCC00"/>
          <circle cx="256" cy="240" r="42" fill="#DA291C"/>
        </svg>`;
      case 'TH':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#A51931" d="M0 0h640v80H0zM0 400h640v80H0z"/>
          <path fill="#FFFFFF" d="M0 80h640v80H0zM0 320h640v80H0z"/>
          <path fill="#2D2A4A" d="M0 160h640v160H0z"/>
        </svg>`;
      case 'VN':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#DA251D" d="M0 0h640v480H0z"/>
          <polygon points="320,110 357,224 477,224 380,295 417,410 320,339 223,410 260,295 163,224 283,224" fill="#FFFF00"/>
        </svg>`;
      case 'PH':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#0038A8" d="M0 0h640v240H0z"/>
          <path fill="#CE1126" d="M0 240h640v240H0z"/>
          <polygon points="0,0 340,240 0,480" fill="#FFFFFF"/>
          <circle cx="110" cy="240" r="28" fill="#FCD116"/>
        </svg>`;
      case 'IL':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFFFFF" d="M0 0h640v480H0z"/>
          <path fill="#0038B8" d="M0 50h640v50H0zM0 380h640v50H0z"/>
          <polygon points="320,170 380,274 260,274" fill="none" stroke="#0038B8" stroke-width="12"/>
          <polygon points="320,310 380,206 260,206" fill="none" stroke="#0038B8" stroke-width="12"/>
        </svg>`;
      case 'EG':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#CE1126" d="M0 0h640v160H0z"/>
          <path fill="#FFFFFF" d="M0 160h640v160H0z"/>
          <path fill="#000000" d="M0 320h640v160H0z"/>
          <circle cx="320" cy="240" r="26" fill="#C09A3E"/>
        </svg>`;
      case 'NG':
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <path fill="#008751" d="M0 0h213.3v480H0z"/>
          <path fill="#FFFFFF" d="M213.3 0h213.4v480H213.3z"/>
          <path fill="#008751" d="M426.7 0h213.3v480H426.7z"/>
        </svg>`;
      default:
        return `<svg class="${className}" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="480" fill="#0070BA" rx="10"/>
          <text x="320" y="270" font-size="120" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#FFFFFF">${code || 'FX'}</text>
        </svg>`;
    }
  }

  function render(state) {
    const getIcon = window.AgentGuardIcons.get;
    const paypalWordmark = window.AgentGuardIcons.paypalWordmark('text-3xl sm:text-4xl');

    return `
      <div class="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 select-none transition-colors">
        
        <!-- Header Spacer / Minimal Top Bar -->
        <div class="w-full flex justify-end max-w-4xl mx-auto px-4">
          <button 
            type="button" 
            onclick="window.AgentGuardStore.toggleTheme()" 
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Toggle Light / Dark Mode">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </button>
        </div>

        <!-- Center Login Container -->
        <div class="sm:mx-auto sm:w-full sm:max-w-[440px] my-auto">
          
          <!-- Premium Minimal Login Card -->
          <div class="bg-white dark:bg-slate-900 py-10 px-7 sm:px-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_35px_-5px_rgba(0,112,186,0.1),0_8px_16px_-6px_rgba(20,44,76,0.06)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md space-y-6">
            
            <!-- 1. Main Branding: PayPal Centered (Primary Brand) -->
            <div class="flex flex-col items-center text-center space-y-2">
              <div class="pt-1">
                ${paypalWordmark}
              </div>

              <!-- 2. AgentGuard Integration: Small secondary security badge below logo -->
              <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <svg class="w-3.5 h-3.5 text-[#0070BA] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>Protected by <strong class="text-primary font-bold">AgentGuard AI Security</strong></span>
              </div>
            </div>

            <!-- 3. Form Content -->
            ${currentAuthTab === 'signin' ? `
              <form onsubmit="window.AgentGuardViews.handleSignInSubmit(event)" class="space-y-4 pt-2">
                
                <!-- Email or Mobile Number Input -->
                <div class="space-y-1">
                  <div class="relative">
                    <input 
                      id="signin-identifier"
                      type="text" 
                      required 
                      placeholder="Email or mobile number"
                      value="advaitd0110@gmail.com"
                      class="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA] focus:ring-1 focus:ring-[#0070BA] transition-all"
                    />
                  </div>
                </div>

                <!-- Password Input with Show/Hide -->
                <div class="space-y-1">
                  <div class="relative">
                    <input 
                      id="signin-password"
                      type="${showPassword ? 'text' : 'password'}" 
                      required 
                      placeholder="Password"
                      value="••••••••••••"
                      class="w-full h-12 pl-4 pr-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA] focus:ring-1 focus:ring-[#0070BA] transition-all"
                    />
                    <button 
                      type="button" 
                      onclick="window.AgentGuardViews.togglePasswordVisibility()" 
                      class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      ${showPassword ? getIcon('eye-off', 'w-4 h-4') : getIcon('eye', 'w-4 h-4')}
                    </button>
                  </div>
                </div>

                <!-- Forgotten Password Link & Remember Me -->
                <div class="flex items-center justify-between text-xs pt-0.5">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                    <input 
                      type="checkbox" 
                      ${rememberMe ? 'checked' : ''} 
                      onchange="window.AgentGuardViews.toggleRememberMe(this.checked)"
                      class="w-4 h-4 rounded border-slate-300 text-[#0070BA] focus:ring-[#0070BA]" 
                    />
                    <span>Remember this device</span>
                  </label>

                  <button 
                    type="button" 
                    onclick="window.AgentGuardViews.setAuthTab('forgot')"
                    class="text-[#0070BA] dark:text-sky-400 font-bold hover:underline">
                    Forgotten password?
                  </button>
                </div>

                <!-- Prominent Blue Log In Button (#0070BA / #003087) -->
                <div class="pt-2">
                  <button 
                    type="submit" 
                    class="w-full h-12 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center">
                    <span>Log In</span>
                  </button>
                </div>

                <!-- Divider: line with 'or' -->
                <div class="relative flex items-center justify-center py-2">
                  <div class="w-full border-t border-slate-200 dark:border-slate-800"></div>
                  <span class="absolute px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    or
                  </span>
                </div>

                <!-- Outlined Sign Up Button -->
                <div>
                  <button 
                    type="button" 
                    onclick="window.AgentGuardViews.setAuthTab('signup')"
                    class="w-full h-12 rounded-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-900 dark:border-slate-300 text-sm font-bold transition-all active:scale-[0.99]">
                    Sign Up
                  </button>
                </div>

              </form>
            ` : ''}

            <!-- SIGN UP FORM -->
            ${currentAuthTab === 'signup' ? `
              <form onsubmit="window.AgentGuardViews.handleSignUpSubmit(event)" class="space-y-3.5 pt-1">
                <div>
                  <input 
                    id="signup-name" 
                    type="text" 
                    required 
                    placeholder="Full Legal Name"
                    class="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]" 
                  />
                </div>
                <div>
                  <input 
                    id="signup-email" 
                    type="email" 
                    required 
                    placeholder="Business or Personal Email"
                    class="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]" 
                  />
                </div>
                <div>
                  <input 
                    id="signup-phone" 
                    type="tel" 
                    required 
                    placeholder="Mobile Phone Number"
                    class="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]" 
                  />
                </div>
                <div>
                  <input 
                    id="signup-password" 
                    type="password" 
                    required 
                    placeholder="Create a strong password"
                    class="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]" 
                  />
                </div>

                <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  By clicking Agree & Sign Up, you agree to create a PayPal-backed account protected by AgentGuard financial guardrails.
                </div>

                <button 
                  type="submit" 
                  class="w-full h-12 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-sm font-bold shadow-md transition-all">
                  Agree & Sign Up
                </button>

                <div class="text-center pt-2">
                  <button 
                    type="button" 
                    onclick="window.AgentGuardViews.setAuthTab('signin')" 
                    class="text-xs font-semibold text-[#0070BA] hover:underline">
                    Already have an account? Log In
                  </button>
                </div>
              </form>
            ` : ''}

            <!-- FORGOT PASSWORD FORM -->
            ${currentAuthTab === 'forgot' ? `
              <form onsubmit="window.AgentGuardViews.handleForgotSubmit(event)" class="space-y-4 pt-1">
                <p class="text-xs text-slate-600 dark:text-slate-400 text-center">
                  Enter your email address and we'll send a secure password reset link.
                </p>
                <div>
                  <input 
                    id="forgot-email" 
                    type="email" 
                    required 
                    placeholder="Enter your email"
                    class="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]" 
                  />
                </div>

                <button 
                  type="submit" 
                  class="w-full h-12 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-sm font-bold shadow-md transition-all">
                  Send Recovery Email
                </button>

                <div class="text-center pt-2">
                  <button 
                    type="button" 
                    onclick="window.AgentGuardViews.setAuthTab('signin')" 
                    class="text-xs font-semibold text-[#0070BA] hover:underline">
                    Back to Log In
                  </button>
                </div>
              </form>
            ` : ''}

          </div>

          <!-- 4. Country Flag Option Below the Login Card (As in user reference image) -->
          <div class="relative flex flex-col items-center mt-6">
            <button 
              type="button" 
              onclick="window.AgentGuardViews.toggleCountryDropdown()" 
              aria-label="${selectedCountry.name} ${selectedCountry.flag}"
              data-flag="${selectedCountry.flag}"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span class="inline-flex items-center">${getFlagSvg(selectedCountry.code, 'w-6 h-4 rounded-xs shadow-2xs')}</span>
              <span>${selectedCountry.name}</span>
              <span class="sr-only">${selectedCountry.flag}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>

            <!-- Quick Popular Country Flags Row -->
            <div class="flex items-center justify-center gap-1.5 mt-3 flex-wrap max-w-sm">
              ${AVAILABLE_COUNTRIES.slice(0, 12).map(c => `
                <button 
                  type="button" 
                  onclick="window.AgentGuardViews.selectCountry('${c.code}')" 
                  title="${c.name} (${c.dialCode})" 
                  class="p-1 rounded-lg border transition-all ${c.code === selectedCountry.code ? 'border-primary ring-2 ring-primary/20 scale-105 bg-blue-50/50' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:scale-105'}">
                  ${getFlagSvg(c.code, 'w-5 h-3.5 rounded-xs shadow-2xs')}
                </button>
              `).join('')}
            </div>

            <!-- Country Selection Dropdown List with Search -->
            ${showCountryDropdown ? `
              <div class="absolute bottom-16 z-50 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 max-h-80 overflow-hidden flex flex-col animate-fade-in text-xs">
                <div class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <span>Select Country / Region</span>
                  <button type="button" onclick="window.AgentGuardViews.toggleCountryDropdown()" class="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                </div>
                <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                  <input 
                    type="text" 
                    placeholder="Search country or code..." 
                    value="${countrySearchQuery}"
                    oninput="window.AgentGuardViews.filterCountrySearch(this.value)"
                    class="w-full h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                  />
                </div>
                <div class="overflow-y-auto max-h-56 p-1 space-y-1">
                  ${(countrySearchQuery ? AVAILABLE_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearchQuery) || c.dialCode.includes(countrySearchQuery) || c.code.toLowerCase().includes(countrySearchQuery)) : AVAILABLE_COUNTRIES).map(c => `
                    <button 
                      type="button" 
                      onclick="window.AgentGuardViews.selectCountry('${c.code}')" 
                      class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${c.code === selectedCountry.code ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0070BA] font-bold' : 'text-slate-700 dark:text-slate-300'}">
                      <span class="flex items-center gap-2.5">
                        ${getFlagSvg(c.code, 'w-6 h-4 rounded-xs shadow-2xs')}
                        <span>${c.name}</span>
                      </span>
                      <span class="font-mono text-slate-400 text-[11px]">${c.dialCode}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

        </div>

        <!-- 5. Footer: Contact Us, Privacy, Legal, Worldwide (Matching PayPal's signature footer) -->
        <footer class="w-full max-w-xl mx-auto pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            <a href="#" onclick="window.AgentGuardApp.showToast('Support: support@agentguard.paypal.com', 'info'); return false;" class="hover:underline">Contact Us</a>
            <a href="#" onclick="window.AgentGuardApp.showToast('Privacy Policy: End-to-end encrypted financial data.', 'info'); return false;" class="hover:underline">Privacy</a>
            <a href="#" onclick="window.AgentGuardApp.showToast('Legal Agreements: Authorized commercial AI agent firewall.', 'info'); return false;" class="hover:underline">Legal</a>
            <a href="#" onclick="window.AgentGuardViews.toggleCountryDropdown(); return false;" class="hover:underline">Worldwide</a>
          </div>
          <div class="mt-2 text-[11px] text-slate-400">
            PayPal commercial agent guardrails powered by AgentGuard.
          </div>
        </footer>

      </div>
    `;
  }

  window.AgentGuardViews = window.AgentGuardViews || {};
  window.AgentGuardViews['login'] = render;

  window.AgentGuardViews.setAuthTab = function(tab) {
    currentAuthTab = tab;
    showCountryDropdown = false;
    if (window.AgentGuardApp && typeof window.AgentGuardApp.renderActiveView === 'function') {
      window.AgentGuardApp.renderActiveView();
    }
  };

  window.AgentGuardViews.togglePasswordVisibility = function() {
    showPassword = !showPassword;
    if (window.AgentGuardApp && typeof window.AgentGuardApp.renderActiveView === 'function') {
      window.AgentGuardApp.renderActiveView();
    }
  };

  window.AgentGuardViews.toggleRememberMe = function(val) {
    rememberMe = val;
  };

  window.AgentGuardViews.toggleCountryDropdown = function() {
    showCountryDropdown = !showCountryDropdown;
    if (window.AgentGuardApp && typeof window.AgentGuardApp.renderActiveView === 'function') {
      window.AgentGuardApp.renderActiveView();
    }
  };

  window.AgentGuardViews.filterCountrySearch = function(q) {
    countrySearchQuery = (q || '').toLowerCase();
    if (window.AgentGuardApp && typeof window.AgentGuardApp.renderActiveView === 'function') {
      window.AgentGuardApp.renderActiveView();
      setTimeout(() => {
        const inp = document.querySelector('input[placeholder="Search country or code..."]');
        if (inp) {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        }
      }, 10);
    }
  };

  window.AgentGuardViews.selectCountry = function(code) {
    const found = AVAILABLE_COUNTRIES.find(c => c.code === code);
    if (found) {
      selectedCountry = found;
      showCountryDropdown = false;
      countrySearchQuery = '';
      if (window.AgentGuardApp) {
        window.AgentGuardApp.showToast(`Region updated to ${found.name}`, 'info');
        window.AgentGuardApp.renderActiveView();
      }
    }
  };

  window.AgentGuardViews.handleSignInSubmit = function(e) {
    e.preventDefault();
    const identifier = document.getElementById('signin-identifier') ? document.getElementById('signin-identifier').value.trim() : '';
    const password = document.getElementById('signin-password') ? document.getElementById('signin-password').value : '';

    if (!identifier) {
      window.AgentGuardApp.showToast('Please enter your email or mobile number', 'warning');
      return;
    }

    const user = window.AgentGuardStore.login({
      emailOrPhone: identifier,
      password: password,
      country: selectedCountry.code
    });

    window.AgentGuardApp.showToast(`Welcome, ${user.name}!`, 'success');
  };

  window.AgentGuardViews.handleSignUpSubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name') ? document.getElementById('signup-name').value.trim() : '';
    const email = document.getElementById('signup-email') ? document.getElementById('signup-email').value.trim() : '';
    const phone = document.getElementById('signup-phone') ? document.getElementById('signup-phone').value.trim() : '';
    const password = document.getElementById('signup-password') ? document.getElementById('signup-password').value : '';

    if (!name || !email) {
      window.AgentGuardApp.showToast('Please fill in your name and email', 'warning');
      return;
    }

    const user = window.AgentGuardStore.signup({
      name,
      email,
      phone,
      password,
      country: selectedCountry.code
    });

    window.AgentGuardApp.showToast(`Account created! Welcome, ${name}!`, 'success');
  };

  window.AgentGuardViews.handleForgotSubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email') ? document.getElementById('forgot-email').value.trim() : '';
    window.AgentGuardApp.showToast(`Recovery link sent to ${email}`, 'info');
    currentAuthTab = 'signin';
    window.AgentGuardApp.renderActiveView();
  };

})(window);