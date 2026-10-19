import { useRef } from 'react';
import { X } from 'lucide-react';
import useDialogAccessibility from '../hooks/useDialogAccessibility';
export default function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useDialogAccessibility(ref, onClose);
  return <div className="clinic-modal-backdrop"><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="clinic-modal">
    <header className="clinic-modal-header"><h2>{title}</h2><button className="clinic-modal-close" type="button" onClick={onClose} aria-label="Đóng cửa sổ"><X size={16} strokeWidth={1.8} aria-hidden="true" /></button></header>
    <div className="clinic-modal-body">{children}</div>
  </section></div>;
}
