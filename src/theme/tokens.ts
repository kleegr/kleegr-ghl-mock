/**
 * Kleegr theme tokens — SINGLE SOURCE OF TRUTH for branding.
 *
 * STRUCTURE reference: real GoHighLevel sub-account portal (dark navy left
 * rail + light content + dark "banner" strip behind the top-right action
 * cluster). BRAND layer: Kleegr's violet→blue identity.
 *
 * BRAND SOURCE: grounded in the official Kleegr logo (violet→blue wordmark — the
 * raster master lives at the GHL company-photos URL referenced in Sidebar.tsx, and
 * public/kleegr-logo.svg / kleegr-logo-white.svg are the vector forms of it) and
 * the production GoHighLevel brand stylesheet (accent cyan #55bfe7→#55c7ee, mid-blue
 * #004882, deep navy #002d69). The sidebar gradient and active-cyan pill, plus the
 * top-bar wedge, are tuned to match the live GHL sub-account portal. The blue half
 * of the wordmark drives the primary/sidebar/accent palette; the violet half is
 * retained as the secondary "AI" accent. Re-derive from those two assets if the
 * brand changes — do not invent new hues here.
 *
 * To re-theme the entire app, change values here. They are injected as CSS
 * variables at runtime (see applyTheme) and consumed by Tailwind (see
 * tailwind.config.js) AND by the gradient utilities in Sidebar.tsx, so every
 * surface re-themes from one place. Keep index.css :root fallbacks in sync.
 */

export type ThemeTokens = {
  placeholder: boolean;
  brandName: string;
  wordmark: string;
  tagline: string;
  /** RGB triplets "r g b" (no commas) so Tailwind can apply <alpha-value>. */
  colors: Record<string, string>;
  fonts: { sans: string; display: string };
};

export const kleegrTheme: ThemeTokens = {
  placeholder: false,
  brandName: 'Kleegr',
  wordmark: 'Kleegr',
  // One confirmed line from public research (plan §13):
  tagline: 'Transform how you run your business.',
  colors: {
    // Brand — azure drawn from the blue half of the Kleegr wordmark, sitting
    // between the brand stylesheet's accent cyan (#55bfe7) and mid-blue
    // (#004882). Readable with white text (~4.2:1). Drives primary buttons,
    // links, active states and the focus ring.
    brand: '26 127 201', // #1a7fc9
    'brand-fg': '255 255 255',
    'brand-soft': '226 240 251', // #e2f0fb — light azure tint (chips / active rows)
    // Text
    ink: '16 24 40',
    'ink-muted': '71 84 103',
    'ink-subtle': '152 162 179',
    // Surfaces
    surface: '255 255 255',
    'surface-raised': '255 255 255',
    'surface-sunken': '243 245 248', // #f3f5f8 — live dashboard canvas
    line: '221 226 233',
    // Sidebar — deep-navy→rich-blue rail with light text, tuned to the live GHL
    // sub-account portal: deep navy at the top lifting to a richer blue toward the
    // bottom (top→bottom gradient via the three stop tokens below, consumed via
    // arbitrary utilities in Sidebar.tsx). The active nav pill is the GHL accent
    // cyan (not azure) so it reads like the real CRM's highlighted item.
    sidebar: '7 55 121', // #073779 — solid fallback
    'sidebar-fg': '219 231 243', // #dbe7f3 — light slate text
    'sidebar-active': '84 192 229', // #54c0e5 — selected rail row
    'sidebar-from': '5 43 101', // #052b65 — deep navy (top)
    'sidebar-via': '6 92 151', // #065c97 — rich blue (middle)
    'sidebar-to': '0 185 217', // #00b9d9 — Kleegr cyan at the foot
    // Status
    good: '18 152 99',
    warn: '217 145 17',
    bad: '217 54 62',
    // AI / secondary accent — Kleegr's violet (the left half of the wordmark;
    // also "Ask AI"). Kept as the brand's secondary hue.
    ai: '124 58 237',
    'ai-soft': '237 233 254',
    // Dark surface reused by modules for white-text strips (Opportunities header,
    // Automations "Beta" badge). KEEP THIS DARK — the bright top-bar wedge lives in
    // TopBar.tsx as a cyan→blue gradient, NOT in this token.
    banner: '5 47 111', // #052f6f — live Kleegr header navy
    'banner-accent': '0 185 217', // #00b9d9 — live cyan wedge
  },
  fonts: {
    // Neutral geometric sans pairing the wordmark's clean lowercase forms.
    sans: "'Plus Jakarta Sans'",
    display: "'Plus Jakarta Sans'",
  },
};

/** Inject tokens as CSS variables on :root. Call once at boot. */
export function applyTheme(theme: ThemeTokens = kleegrTheme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([k, v]) => {
    root.style.setProperty(`--${k}`, v);
  });
  root.style.setProperty('--font-sans', theme.fonts.sans);
  root.style.setProperty('--font-display', theme.fonts.display);
}
