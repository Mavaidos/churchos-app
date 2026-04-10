import { createContext, useContext, useState, useEffect } from 'react';

// ─── Font Pairs ───────────────────────────────────────────────────────────────
export const FONT_PAIRS = {
  default: {
    label:    'Classic (Default)',
    headline: 'Manrope',
    body:     'Inter',
    url:      'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap',
  },
  modern: {
    label:    'Modern',
    headline: 'Plus Jakarta Sans',
    body:     'DM Sans',
    url:      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap',
  },
  elegant: {
    label:    'Elegant',
    headline: 'Cormorant Garamond',
    body:     'Lato',
    url:      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@400;700&display=swap',
  },
  bold: {
    label:    'Bold & Friendly',
    headline: 'Sora',
    body:     'Nunito',
    url:      'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Nunito:wght@400;600;700&display=swap',
  },
  minimal: {
    label:    'Minimal',
    headline: 'Space Grotesk',
    body:     'Work Sans',
    url:      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Work+Sans:wght@400;500;600&display=swap',
  },
};

// ─── Color Presets ────────────────────────────────────────────────────────────
export const COLOR_PRESETS = [
  { label: 'Slate (Default)', hex: '#515f74' },
  { label: 'Royal Blue',      hex: '#2563eb' },
  { label: 'Indigo',          hex: '#4f46e5' },
  { label: 'Violet',          hex: '#7c3aed' },
  { label: 'Emerald',         hex: '#059669' },
  { label: 'Teal',            hex: '#0d9488' },
  { label: 'Rose',            hex: '#e11d48' },
  { label: 'Amber',           hex: '#d97706' },
];

export const LOGO_ICONS = [
  'church', 'star', 'favorite', 'bolt', 'verified',
  'diversity_3', 'groups', 'brightness_5', 'auto_awesome',
  'flare', 'emoji_events', 'local_florist',
];

// ─── Default Branding ─────────────────────────────────────────────────────────
export const DEFAULT_BRANDING = {
  orgName:    'ChurchOS',
  tagline:    'Sanctuary Management',
  logoType:   'icon',    // 'icon' | 'text'
  logoIcon:   'church',
  primaryHex: '#515f74',
  fontPair:   'default',
  mode:       'light',   // 'light' | 'dark'
};

// ─── Color helpers ────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgbStr(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
}

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

function buildPalette(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [h, s, l]   = rgbToHsl(r, g, b);
  const isDark       = l < 50;

  return {
    '--c-primary':                `${r} ${g} ${b}`,
    '--c-primary-dim':            hslToRgbStr(h, s, clamp(l + 10, 0, 92)),
    '--c-primary-container':      hslToRgbStr(h, clamp(s - 15, 5, 100), clamp(l + 42, 0, 95)),
    '--c-on-primary':             isDark ? '255 255 255' : '26 28 30',
    '--c-on-primary-container':   hslToRgbStr(h, s, clamp(l - 30, 5, 100)),
    '--c-secondary':              hslToRgbStr(h, clamp(s - 8, 0, 100), l),
    '--c-secondary-container':    hslToRgbStr(h, clamp(s - 20, 5, 100), clamp(l + 40, 0, 95)),
    '--c-on-secondary-container': hslToRgbStr(h, s, clamp(l - 28, 5, 100)),
    '--c-tertiary':               hslToRgbStr((h + 12) % 360, clamp(s - 12, 0, 100), l),
    '--c-tertiary-container':     hslToRgbStr((h + 12) % 360, clamp(s - 20, 5, 100), clamp(l + 40, 0, 95)),
    '--c-on-tertiary-container':  hslToRgbStr((h + 12) % 360, s, clamp(l - 28, 5, 100)),
  };
}

// ─── Apply to DOM ─────────────────────────────────────────────────────────────
export function applyBranding(b) {
  const root = document.documentElement;

  // Colors
  const palette = buildPalette(b.primaryHex);
  Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));

  // Dark mode
  root.classList.toggle('dark', b.mode === 'dark');

  // Fonts
  const pair = FONT_PAIRS[b.fontPair] ?? FONT_PAIRS.default;
  let link = document.getElementById('branding-fonts');
  if (!link) {
    link = document.createElement('link');
    link.id  = 'branding-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = pair.url;
  root.style.setProperty('--font-headline', `"${pair.headline}", sans-serif`);
  root.style.setProperty('--font-body',     `"${pair.body}", sans-serif`);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const BrandingCtx = createContext(null);

export function BrandingProvider({ children }) {
  const [branding, setBrandingRaw] = useState(() => {
    try {
      const s = localStorage.getItem('cos_branding');
      return s ? { ...DEFAULT_BRANDING, ...JSON.parse(s) } : { ...DEFAULT_BRANDING };
    } catch {
      return { ...DEFAULT_BRANDING };
    }
  });

  const setBranding = (patch) => {
    const next = { ...branding, ...patch };
    setBrandingRaw(next);
    localStorage.setItem('cos_branding', JSON.stringify(next));
    applyBranding(next);
  };

  // Apply on first load
  useEffect(() => { applyBranding(branding); }, []);

  return (
    <BrandingCtx.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingCtx.Provider>
  );
}

export function useBranding() { return useContext(BrandingCtx); }