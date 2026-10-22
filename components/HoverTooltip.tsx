// App-wide hover/focus tooltips on web. Any control with an accessible label
// (accessibilityLabel → aria-label) shows that label after a short hover, or right
// away when reached by keyboard — so icon-only buttons explain themselves without
// each one wiring up a tooltip. Controls whose visible text already says the same
// thing are skipped. Mounted once in app/_layout; renders nothing on native, where
// the same labels are read by VoiceOver/TalkBack.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const HOVER_DELAY_MS = 500;
const FOCUS_DELAY_MS = 150;
const GAP = 8;
// Explicit control roles, plus anything focusable with a label (RN-web gives pressables a
// tabindex even when no accessibilityRole is set).
const INTERACTIVE = 'button, a, [role="button"], [role="link"], [role="radio"], [role="tab"], [role="checkbox"], [role="switch"], [role="menuitem"], [tabindex][aria-label]';

/** Words only — punctuation and spacing differences don't count as different text. */
const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** The labelled control under `target`, or null if it has nothing extra to say. */
function labelled(target: EventTarget | null): { el: HTMLElement; label: string } | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest<HTMLElement>(INTERACTIVE);
  if (!el || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('title')) return null;
  const label = el.getAttribute('aria-label')?.trim();
  if (!label) return null;
  // A control whose visible text already says everything in its label needs no tooltip.
  const shown = norm(el.innerText);
  if (shown && shown.includes(norm(label))) return null;
  return { el, label };
}

export function HoverTooltip() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const tip = document.createElement('div');
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('aria-hidden', 'true'); // the label is already announced from aria-label
    Object.assign(tip.style, {
      position: 'fixed', zIndex: '2147483647', pointerEvents: 'none', maxWidth: '260px',
      padding: '6px 10px', borderRadius: '8px', fontFamily: 'Raleway_500Medium, system-ui, sans-serif',
      fontSize: '12px', lineHeight: '16px', whiteSpace: 'normal', overflowWrap: 'break-word',
      background: isDark ? colors.textDark : '#2C2A3A', color: isDark ? colors.appBackground : '#FFFFFF',
      boxShadow: '0 4px 14px rgba(0,0,0,0.25)', opacity: '0', transition: 'opacity 120ms ease', top: '0', left: '0',
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(tip);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: HTMLElement | null = null;

    const hide = () => {
      clearTimeout(timer);
      current = null;
      tip.style.opacity = '0';
    };

    const show = (el: HTMLElement, label: string) => {
      if (!el.isConnected) return;
      tip.textContent = label;
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const left = Math.min(Math.max(GAP, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - GAP);
      // Below the control, or above it when there's no room underneath.
      const below = r.bottom + GAP;
      const top = below + t.height > window.innerHeight - GAP ? r.top - t.height - GAP : below;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
      tip.style.opacity = '1';
    };

    const schedule = (target: EventTarget | null, delay: number) => {
      const hit = labelled(target);
      if (!hit) { hide(); return; }
      if (hit.el === current) return;
      hide();
      current = hit.el;
      timer = setTimeout(() => show(hit.el, hit.label), delay);
    };

    const onOver = (e: PointerEvent) => { if (e.pointerType === 'mouse') schedule(e.target, HOVER_DELAY_MS); };
    const onOut = (e: PointerEvent) => {
      if (current && !(e.relatedTarget instanceof Node && current.contains(e.relatedTarget))) hide();
    };
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target.matches(':focus-visible')) schedule(e.target, FOCUS_DELAY_MS);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      hide();
      tip.remove();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, [colors, isDark]);

  return null;
}
