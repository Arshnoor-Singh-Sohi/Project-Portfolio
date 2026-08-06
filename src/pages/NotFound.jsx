// src/pages/NotFound.jsx
// Catch-all for any URL that doesn't match a real route. Styled to
// match the comic theme instead of the blank screen a plain SPA
// shows by default when react-router has nothing to render.
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/comic.css';

export default function NotFound() {
  return (
    <div className="comic-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="comic-grid-overlay" aria-hidden />
      <section className="c-section" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <p className="c-mono" style={{ color: 'var(--crimson)', marginBottom: '0.5rem' }}>
          — ISSUE MISSING FROM THE ARCHIVE —
        </p>
        <h1
          className="c-display"
          style={{
            fontSize: 'clamp(4rem, 18vw, 9rem)',
            color: 'var(--ink)',
            textShadow: '6px 6px 0 var(--gold)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <p
          className="c-heavy"
          style={{ fontSize: '1.1rem', margin: '1.5rem 0 0.5rem', color: 'var(--ink)' }}
        >
          This page got lost between panels.
        </p>
        <p style={{ opacity: 0.7, marginBottom: '2.5rem' }}>
          Whatever you were looking for isn't at this address — it may have moved, or never existed.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            className="c-cta c-heavy"
            style={{
              background: 'var(--ink)',
              color: 'var(--gold)',
              border: '3px solid var(--ink)',
              padding: '0.9rem 2rem',
              boxShadow: 'var(--shadow-pop)',
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ← BACK TO HOME
          </Link>
          <Link
            to="/blog"
            className="c-cta c-heavy"
            style={{
              background: 'var(--paper)',
              color: 'var(--ink)',
              border: '3px solid var(--ink)',
              padding: '0.9rem 2rem',
              boxShadow: 'var(--shadow-pop)',
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            READ THE BLOG
          </Link>
        </div>
      </section>
    </div>
  );
}
