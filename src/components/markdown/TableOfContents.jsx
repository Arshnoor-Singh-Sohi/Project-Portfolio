// src/components/markdown/TableOfContents.jsx
// "TABLE OF CONTENTS" box built from extractHeadings(). Hidden when a
// page has fewer than two h2/h3 headings.
import React from 'react';

export default function TableOfContents({ headings }) {
  if (headings.length < 2) return null;
  return (
    <nav
      className="c-panel"
      aria-label="Table of contents"
      style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}
    >
      <p className="c-mono" style={{ color: 'var(--crimson)', marginBottom: '0.75rem' }}>
        — TABLE OF CONTENTS —
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.depth === 3 ? '1.25rem' : 0 }}>
            <a
              href={`#${h.id}`}
              className="c-mono"
              style={{
                color: 'var(--ink)',
                opacity: 0.75,
                textDecoration: 'none',
                fontSize: h.depth === 3 ? '0.65rem' : '0.72rem',
              }}
            >
              {h.depth === 3 ? '· ' : ''}
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
