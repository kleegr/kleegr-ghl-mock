/**
 * DemoDisclaimer — a polished, non-alarming info banner rendered inside the
 * AppShell above page content.  Styled to match the Kleegr/GHL design system
 * (brand tokens, Plus Jakarta Sans, muted azure palette).
 */
export function DemoDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Demo portal notice"
      className="
        mx-3 mt-2 mb-0 flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between sm:gap-4
        rounded-xl border border-brand/20 bg-brand-soft
        px-4 py-3 shadow-sm
      "
      style={{ borderColor: 'rgb(var(--brand) / 0.2)', background: 'rgb(var(--brand-soft))' }}
    >
      {/* Left: icon + copy */}
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        {/* Info icon */}
        <span
          className="mt-0.5 flex-shrink-0 sm:mt-0"
          style={{ color: 'rgb(var(--brand))' }}
          aria-hidden
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 9v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <circle cx="10" cy="6.5" r="0.875" fill="currentColor" />
          </svg>
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug" style={{ color: 'rgb(var(--ink))' }}>
            Demo Portal
          </p>
          <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'rgb(var(--ink-muted))' }}>
            This portal is for demo purposes only. The real system may look a little different and
            includes many more features and options.
          </p>
        </div>
      </div>

      {/* Right: CTA */}
      <a
        href="https://kleegr.com/book-demo"
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-2
          text-sm font-semibold text-white shadow-sm
          transition-opacity hover:opacity-90 active:opacity-80
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        "
        style={{
          background: 'rgb(var(--brand))',
          outlineColor: 'rgb(var(--brand))',
        }}
      >
        Book a Free Demo →
      </a>
    </div>
  );
}
