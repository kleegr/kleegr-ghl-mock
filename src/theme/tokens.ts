/**
 * Kleegr theme tokens — SINGLE SOURCE OF TRUTH for branding.
 *
 * STRUCTURE reference: real GoHighLevel sub-account portal (dark navy left
 * rail + light content + dark "banner" strip behind the top-right action
 * cluster). BRAND layer: Kleegr's blue/violet identity.
 *
 * ⚠️ BRAND COLORS ARE STILL UNVERIFIED. Public Kleegr brand assets
 * (kleegr.com / crm.kleegr.com) were not retrievable during research, so the
 * palette below is the established demo identity — the documented fallback.
 * When real assets are available, extract the palette (DevTools → computed
 * styles) and replace the values flagged `placeholder: true`.
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
  placeholder: true,
  brandName: 'Kleegr',
  wordmark: 'Kleegr',
  // One confirmed line from public research (plan §13):
  tagline: 'Transform how you run your business.',
  colors: {
    // Brand — placeholder blue. Replace with verified Kleegr primary.
    brand: '31 111 235',
    'brand-fg': '255 255 255',
    'brand-soft': '232 240 254',
    // Text
    ink: '16 24 40',
    'ink-muted': '71 84 103',
    'ink-subtle': '152 162 179',
    // Surfaces
    surface: '255 255 255',
    'surface-raised': '255 255 255',
    'surface-sunken': '247 248 250',
    line: '228 231 236',
    // Sidebar — real GHL uses a flat DARK navy/slate rail with light text.
    // The rail is rendered as a subtle top→bottom navy gradient driven by the
    // three stop tokens below (consumed via arbitrary utilities in Sidebar.tsx).
    sidebar: '12 31 58', // #0c1f3a — solid fallback (matches the gradient mid-tone)
    'sidebar-fg': '226 232 240', // #e2e8f0 — light slate text
    'sidebar-active': '31 111 235', // brand blue — active nav pill
    'sidebar-from': '8 23 45', // #08172d — deep navy (top)
    'sidebar-via': '12 31 58', // #0c1f3a
    'sidebar-to': '16 40 72', // #102848 — only marginally lighter (flat, GHL-like)
    // Status
    good: '18 152 99',
    warn: '217 145 17',
    bad: '217 54 62',
    // AI / wordmark accent — Kleegr's violet (logo + "Ask AI")
    ai: '124 58 237',
    'ai-soft': '237 233 254',
    // Top banner (dark navy strip with a cyan diagonal accent)
    banner: '11 31 64',
    'banner-accent': '56 189 248',
  },
  fonts: {
    // Placeholder. GHL itself leans on a neutral sans; swap for Kleegr's.
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
