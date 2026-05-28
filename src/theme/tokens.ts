/**
 * Kleegr theme tokens — SINGLE SOURCE OF TRUTH for branding.
 *
 * ⚠️ PLACEHOLDER VALUES. These are NOT Kleegr's verified brand tokens.
 * Per the product plan (§13), the real palette/logo/fonts must be extracted
 * directly from https://kleegr.com and https://crm.kleegr.com (DevTools →
 * computed styles / CSS variables) and confirmed with Kleegr marketing.
 *
 * To re-theme the entire app, change values here. They are injected as CSS
 * variables at runtime (see applyTheme) and consumed by Tailwind (see
 * tailwind.config.js) so every component re-themes from one place.
 *
 * TODO(branding): replace all values flagged `placeholder: true`.
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
    // Sidebar (GHL uses a dark rail)
    sidebar: '15 23 42',
    'sidebar-fg': '203 213 225',
    'sidebar-active': '31 111 235',
    // Status
    good: '18 152 99',
    warn: '217 145 17',
    bad: '217 54 62',
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
