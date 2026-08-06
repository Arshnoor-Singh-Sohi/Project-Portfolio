// src/components/QuickNav.jsx
// A small fixed comic-badge in the corner with Home/Blog links. The
// homepage is a scroll-driven story with no persistent nav bar by
// design, so once a reader is a few sections down — or deep inside a
// blog post — this is the only way back without hitting the browser's
// back button.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/comic.css';

function NavPill({ to, label, active }) {
  return (
    <Link
      to={to}
      className="quick-nav-badge"
      aria-current={active ? 'page' : undefined}
      style={{
        border: '2px solid var(--ink)',
        background: active ? 'var(--gold)' : 'var(--paper)',
        color: 'var(--ink)',
        padding: '0.5rem 0.9rem',
        textDecoration: 'none',
        boxShadow: 'var(--shadow-pop-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        letterSpacing: '0.06em',
        borderRadius: '2px',
        pointerEvents: active ? 'none' : 'auto',
        opacity: active ? 0.5 : 1,
      }}
    >
      {label}
    </Link>
  );
}

export default function QuickNav() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isBlog = location.pathname.startsWith('/blog');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 300,
        display: 'flex',
        gap: '0.5rem',
      }}
    >
      <NavPill to="/" label="HOME" active={isHome} />
      <NavPill to="/blog" label="BLOG" active={isBlog} />
    </div>
  );
}
