/**
 * HelpBadgeLayer — the "what is this?" affordance layer.
 *
 * When Help Mode is on, this component finds every element in the DOM that
 * already carries a `data-tour` attribute, keeps the ones that have a matching
 * entry in the Developer 1 help catalog (`getHelp`), and floats a small
 * question-mark badge over each. Clicking a badge opens that entry's help via
 * the store (`openHelp`).
 *
 * Why this approach: it lets contextual help cover the whole app *today* by
 * reusing the `data-tour` anchors that already exist — without editing every
 * module. As Developer 5 instruments more anchors, more badges light up for
 * free. Keys with no help entry (and the dynamic tutorial selector) are skipped
 * gracefully.
 *
 * Performance: the layer is event-driven (scroll in capture phase so it tracks
 * the nested `<main>` scroller, resize, and a debounced MutationObserver) rather
 * than running a permanent animation loop. Re-measures are coalesced into a
 * single rAF, and we bail out of `setState` when nothing moved, so React only
 * re-renders when badge positions actually change.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { getHelp, type HelpTier, type HelpImportance } from '@/help';
import { cx } from '@/utils';

interface BadgeItem {
  key: string;
  label: string;
  tier: HelpTier;
  importance: HelpImportance;
  top: number;
  left: number;
}

const BADGE = 18; // px — badge diameter
const MARGIN = 2; // keep badges this far inside the viewport

/** Place container/section badges top-left and control badges top-right so a
 *  container's badge does not collide with its own child-control badges. */
function badgePosition(tier: HelpTier, r: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const topRight = tier === 'control';
  const rawLeft = topRight ? r.left + r.width - BADGE + 5 : r.left - 5;
  const rawTop = r.top - 5;
  const left = Math.min(Math.max(MARGIN, rawLeft), vw - BADGE - MARGIN);
  const top = Math.min(Math.max(MARGIN, rawTop), vh - BADGE - MARGIN);
  return { top, left };
}

function sameItems(a: BadgeItem[], b: BadgeItem[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.key !== y.key || Math.abs(x.top - y.top) > 0.5 || Math.abs(x.left - y.left) > 0.5) {
      return false;
    }
  }
  return true;
}

export function HelpBadgeLayer({ onSelect }: { onSelect: (key: string) => void }) {
  const [items, setItems] = useState<BadgeItem[]>([]);
  const activeKey = useStore((s) => s.activeHelpKey);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-tour]');
      const seen = new Set<string>();
      const next: BadgeItem[] = [];
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      nodes.forEach((el) => {
        const key = el.getAttribute('data-tour');
        if (!key || seen.has(key)) return;
        const entry = getHelp(key);
        if (!entry) return; // no help copy → no badge (graceful)
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return; // hidden / not laid out
        // Skip anything fully outside the viewport so we do not render offscreen badges.
        if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
        seen.add(key);
        const { top, left } = badgePosition(entry.tier, r);
        next.push({
          key,
          label: entry.label,
          tier: entry.tier,
          importance: entry.importance ?? 'secondary',
          top,
          left,
        });
      });

      setItems((prev) => (sameItems(prev, next) ? prev : next));
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };

    // Initial measure + a few delayed passes to catch content that mounts or
    // animates in just after Help Mode is enabled.
    measure();
    const timers = [setTimeout(measure, 60), setTimeout(measure, 240), setTimeout(measure, 600)];

    window.addEventListener('resize', schedule);
    // capture: true so we also catch scrolling inside the <main> scroll area.
    window.addEventListener('scroll', schedule, true);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-tour'],
    });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      mo.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[45]" aria-hidden={false}>
      {items.map((it) => {
        const isActive = activeKey === it.key;
        const primary = it.importance === 'primary';
        return (
          <button
            key={it.key}
            type="button"
            data-help-badge={it.key}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(it.key);
            }}
            title={`What is this? — ${it.label}`}
            aria-label={`Explain: ${it.label}`}
            className={cx(
              'pointer-events-auto absolute grid place-items-center rounded-full text-[11px] font-bold leading-none shadow-pop ring-2 transition-transform duration-100 animate-pop hover:scale-125 focus:outline-none focus-visible:scale-125',
              isActive
                ? 'bg-brand text-white ring-white scale-125'
                : primary
                  ? 'bg-brand text-white ring-white/90'
                  : 'bg-surface text-brand ring-brand/30',
            )}
            style={{ top: it.top, left: it.left, width: BADGE, height: BADGE }}
          >
            ?
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
