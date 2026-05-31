/**
 * Kleegr theme tokens — SINGLE SOURCE OF TRUTH for branding.
 *
 * STRUCTURE reference: real GoHighLevel sub-account portal (dark navy left
 * rail + light content + dark "banner" strip behind the top-right action
 * cluster). BRAND layer: Kleegr's blue/violet identity.
 *
 * BRAND COLORS ARE NOW VERIFIED against two first-party inputs:
 *   1. The official Kleegr wordmark logo (public/kleegr-logo.svg) — a
 *      violet → blue horizontal gradient (#9E22F6 → ~#4F8FC9).
 *   2. The Kleegr brand CSS direction (login + portal): deep navy #002D69,
 *      mid blue #004882, cyan #00D4FF / #55BFE7, teal #02B0AC.
 * The palette below blends those: a contrast-safe blue primary, the logo's
 * violet as the AI/accent hue, and the navy→cyan family for the sidebar rail
 * and top banner. `placeholder` is now false.
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
    // Brand — primary action blue, derived from the logo's blue terminus and
    // the brand CSS blues, darkened just enough to keep white text >= 4.5:1.
    brand: '33 115 201', // #2173C9
    'brand-fg': '255 255 255',
    'brand-soft': '231 241 251', // #E7F1FB
    // Text
    ink: '16 24 40',
    'ink-muted': '71 84 103',
    'ink-subtle': '152 162 179',
    // Surfaces
    surface: '255 255 255',
    'surface-raised': '255 255 255',
    'surface-sunken': '247 248 250',
    line: '228 231 236',
    // Sidebar — flat DARK navy rail with light text, rendered as a subtle
    // top→bottom navy gradient via the three stop tokens below. Stops are
    // taken from the brand CSS navy family (#002D69 / #004882).
    sidebar: '0 56 110', // #00386E — solid fallback (gradient mid-tone)
    'sidebar-fg': '226 232 240', // #E2E8F0 — light slate text
    'sidebar-active': '85 191 231', // #55BFE7 — brand CSS active/cyan accent
    'sidebar-from': '0 32 65', // #002041 — deep navy (top)
    'sidebar-via': '0 45 105', // #002D69 — brand navy
    'sidebar-to': '0 72 130', // #004882 — brand mid blue (bottom)
    // Status
    good: '18 152 99',
    warn: '217 145 17',
    bad: '217 54 62',
    // AI / wordmark accent — Kleegr's violet (logo left terminus + "Ask AI")
    ai: '158 34 246', // #9E22F6
    'ai-soft': '243 232 254', // #F3E8FE
    // Top banner (dark navy strip with a cyan diagonal accent) — brand CSS
    banner: '0 45 105', // #002D69
    'banner-accent': '0 212 255', // #00D4FF
  },
  fonts: {
    // Neutral geometric sans in the spirit of the GHL portal + Kleegr wordmark.
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
