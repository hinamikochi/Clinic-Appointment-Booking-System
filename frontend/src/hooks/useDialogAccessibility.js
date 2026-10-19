import { useEffect } from 'react';
export default function useDialogAccessibility(rootRef, onClose, enabled = true) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    const previous = document.activeElement;
    const focusable = () => [...root.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(e => !e.disabled && e.getClientRects().length);
    (focusable()[0] || root).focus();
    const handler = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const list = focusable(), first = list[0], last = list[list.length - 1];
        if (!first) { event.preventDefault(); root.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    const containFocus = event => { if (!root.contains(event.target)) (focusable()[0] || root).focus(); };
    document.addEventListener('keydown', handler);
    document.addEventListener('focusin', containFocus);
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('focusin', containFocus); previous?.focus?.(); };
  }, [rootRef, onClose, enabled]);
}
