import { useEffect } from 'react';
// Existing record/catalog dialogs retain their layout while sharing keyboard behavior.
export default function LegacyDialogSupport() {
  useEffect(() => {
    let current = null, previous = null;
    const find = () => {
      const candidates = [...document.querySelectorAll('[style]')].filter(node => node.style.position === 'fixed' && node.style.backgroundColor.startsWith('rgba') && node.getClientRects().length && !node.closest('[role=dialog]'));
      return candidates.at(-1) || null;
    };
    const controls = root => [...root.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const update = () => {
      if (current && !current.isConnected) { previous?.focus?.(); current = null; }
      if (current) return;
      const next = find(); if (!next) return;
      previous = document.activeElement; current = next;
      next.setAttribute('role', 'dialog'); next.setAttribute('aria-modal', 'true'); next.setAttribute('aria-label', next.querySelector('h2,h3')?.textContent || 'Cửa sổ thông tin'); next.tabIndex = -1;
      (controls(next)[0] || next).focus();
    };
    const observer = new MutationObserver(update); observer.observe(document.body, { childList: true, subtree: true });
    const key = event => {
      if (!current?.isConnected) return;
      if (event.key === 'Escape') { const icon = current.querySelector('.lucide-x,.lucide-circle-x'); const button = icon?.closest('button') || icon || controls(current).find(el => /đóng|hủy/i.test(el.textContent)); button?.click(); event.preventDefault(); }
      if (event.key === 'Tab') { const list = controls(current); const first = list[0], last = list.at(-1); if (!first) { event.preventDefault(); current.focus(); } else if (event.shiftKey && (document.activeElement === first || !current.contains(document.activeElement))) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && (document.activeElement === last || !current.contains(document.activeElement))) { event.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', key);
    return () => { observer.disconnect(); document.removeEventListener('keydown', key); };
  }, []);
  return null;
}
