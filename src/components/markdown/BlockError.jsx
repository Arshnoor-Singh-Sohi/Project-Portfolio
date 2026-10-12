// src/components/markdown/BlockError.jsx
// Error box for JSON fence blocks (```video, ```check): shows what is
// wrong plus the raw text, the same fallback ```plot uses.
import React from 'react';

export default function BlockError({ what, message, code }) {
  return (
    <div className="plot-error">
      <p style={{ margin: '0 0 0.75rem' }}>
        Couldn&apos;t render this {what} — check the JSON. ({message})
      </p>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
    </div>
  );
}
