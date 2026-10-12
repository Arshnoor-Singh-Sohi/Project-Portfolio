// src/components/markdown/Callout.jsx
// Blockquote renderer. Blockquotes marked by src/lib/remark-callouts.js
// render as a labeled, colored callout. Every other blockquote renders
// as a normal blockquote. Used by /notes (the blog does not pass it).
import React from 'react';

const CALLOUTS = {
  key: { label: 'KEY IDEA', icon: '★' },
  trap: { label: 'TRAP', icon: '⚠' },
  mistake: { label: 'COMMON MISTAKE', icon: '✗' },
  analogy: { label: 'ANALOGY', icon: '≈' },
  example: { label: 'EXAMPLE', icon: '#' },
  note: { label: 'NOTE', icon: 'i' },
};

export default function Callout({ node, children }) {
  const props = (node && node.properties) || {};
  const type = props.dataCallout || props['data-callout'];
  const config = type ? CALLOUTS[type] : null;
  if (!config) return <blockquote>{children}</blockquote>;

  const title = props.dataCalloutTitle || props['data-callout-title'];
  return (
    <aside className={`notes-callout notes-callout-${type}`} role="note">
      <p className="notes-callout-label">
        <span aria-hidden className="notes-callout-icon">{config.icon}</span>
        {config.label}
        {title ? <span className="notes-callout-title"> — {title}</span> : null}
      </p>
      <div className="notes-callout-body">{children}</div>
    </aside>
  );
}
