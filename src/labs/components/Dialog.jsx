// src/labs/components/Dialog.jsx
// Modal dialog on the native <dialog> element: the browser traps
// focus, Escape closes it, and the page behind it is inert.
import React, { useEffect, useRef } from 'react';

export default function Dialog({ open, title, onClose, children, footer, wide = false, labelledBy }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  const titleId = labelledBy || `dialog-title-${title ? title.replace(/\W+/g, '-').toLowerCase() : 'x'}`;
  return (
    <dialog
      ref={ref}
      className={`labs-dialog${wide ? ' is-wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="labs-dialog-body">
          <h2 id={titleId} className="labs-dialog-title">
            {title}
          </h2>
          {children}
          {footer && <div className="labs-dialog-footer">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

// "Are you sure?" with one strong action.
export function ConfirmDialog({ open, title, children, confirmLabel, danger = false, busy = false, onConfirm, onClose }) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="labs-button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`labs-button ${danger ? 'is-danger' : 'is-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="labs-dialog-text">{children}</div>
    </Dialog>
  );
}
