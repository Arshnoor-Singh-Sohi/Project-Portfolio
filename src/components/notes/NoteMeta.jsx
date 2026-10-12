// src/components/notes/NoteMeta.jsx
// Small status / confidence / date badges shared by the /notes tree,
// folder pages, note pages and the review page.
import React from 'react';
import { STATUS_LABELS } from '../../lib/notes';

export function StatusDot({ status }) {
  const label = status ? STATUS_LABELS[status] : 'NO STATUS';
  return (
    <span
      className={`notes-dot notes-dot-${status || 'none'}`}
      role="img"
      aria-label={`Status: ${label.toLowerCase()}`}
      title={label}
    />
  );
}

export function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`c-mono notes-status notes-status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function Confidence({ value }) {
  if (!value) return null;
  return (
    <span className="c-mono notes-confidence" title={`Confidence ${value} of 5`} aria-label={`Confidence ${value} of 5`}>
      {'●'.repeat(value)}
      <span className="notes-confidence-empty">{'○'.repeat(5 - value)}</span>
    </span>
  );
}

export function ReviewDue({ date, today }) {
  if (!date) return null;
  const due = today && date <= today;
  return (
    <span className={`c-mono notes-due${due ? ' notes-due-now' : ''}`}>
      {due ? 'REVIEW DUE ' : 'REVIEW '}
      {date}
    </span>
  );
}

export function PrivateBadge({ show }) {
  if (!show) return null;
  return (
    <span className="c-mono notes-private" title="Private: shown in npm run dev only, never built">
      PRIVATE
    </span>
  );
}
