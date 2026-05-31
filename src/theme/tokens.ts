/**
 * Kleegr theme tokens — SINGLE SOURCE OF TRUTH for branding.
 *
 * STRUCTURE reference: real GoHighLevel sub-account portal (dark navy left
 * rail + light content + dark "banner" strip behind the top-right action
 * cluster). BRAND layer: Kleegr's violet→blue identity.
 *
 * BRAND SOURCE: grounded in the official Kleegr logo (violet→blue wordmark,
 * see public/kleegr-logo.svg) and the production GoHighLevel brand stylesheet
 * (accent cyan #55bfe7, mid-blue #004882, deep navy #002d69). The blue half of
 * the wordmark drives the primary/sidebar/accent palette; the violet half is
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
    'surface-sunken': '247 248 250',
    line: '228 231 236',
    // Sidebar — dark navy rail with light text, matching the brand stylesheet's
    // deep navy (#002d69 / #004882). Rendered as a top→bottom navy→blue lift via
    // the three stop tokens below (consumed via arbitrary utilities in Sidebar.tsx).
    sidebar: '0 42 82', // #002a52 — solid fallback (navy, brand-stylesheet family)
    'sidebar-fg': '219 231 243', // #dbe7f3 — light slate text
    'sidebar-active': '26 127 201', // #1a7fc9 — brand azure, active nav pill
    'sidebar-from': '0 37 74', // #00254a — deep navy (top)
    'sidebar-via': '1 53 96', // #013560
    'sidebar-to': '2 73 127', // #02497f — mid-blue lift toward #004882 (bottom)
    // Status
    good: '18 152 99',
    warn: '217 145 17',
    bad: '217 54 62',
    // AI / secondary accent — Kleegr's violet (the left half of the wordmark;
    // also "Ask AI"). Kept as the brand's secondary hue.
    ai: '124 58 237',
    'ai-soft': '237 233 254',
    // Top banner (dark navy strip with the brand-stylesheet cyan diagonal accent)
    banner: '0 35 68', // #002344
    'banner-accent': '85 191 231', // #55bfe7 — brand-stylesheet accent cyan
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
