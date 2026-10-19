// src/labs/components/Menu.jsx
// A small accessible dropdown menu: a button that opens a list of
// actions. Arrow keys move, Enter selects, Escape closes.
import React, { useEffect, useId, useRef, useState } from 'react';

export default function Menu({ label, items, icon, buttonText, className = '', align = 'right' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    const first = listRef.current && listRef.current.querySelector('[role="menuitem"]:not([disabled])');
    if (first) first.focus();
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const visible = items.filter(Boolean);

  const onKeyDown = (e) => {
    const enabled = [...listRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
    const i = enabled.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      enabled[(i + 1) % enabled.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      enabled[(i - 1 + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      enabled[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      enabled[enabled.length - 1]?.focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <span ref={rootRef} className={`labs-menu ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonText ? 'labs-button' : 'labs-icon-button'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={buttonText ? undefined : label}
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {icon}
        {buttonText}
      </button>
      {open && (
        <div ref={listRef} id={id} role="menu" aria-label={label} className={`labs-menu-list is-${align}`} onKeyDown={onKeyDown}>
          {visible.map((item, i) =>
            item.separator ? (
              <div key={`sep-${i}`} role="separator" className="labs-menu-sep" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`labs-menu-item${item.danger ? ' is-danger' : ''}`}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && <kbd>{item.shortcut}</kbd>}
              </button>
            ),
          )}
        </div>
      )}
    </span>
  );
}
