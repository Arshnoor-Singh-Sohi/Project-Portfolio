// src/pages/SubscribeStatus.jsx
// Landing page the /api/confirm and /api/unsubscribe serverless
// functions redirect to once they've done their work — mirrors
// NotFound.jsx's styling so it doesn't feel like a bare server response.
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import '../styles/comic.css';

const COPY = {
  confirmed: {
    kicker: '— SUBSCRIPTION CONFIRMED —',
    title: "You're in.",
    body: "You'll get an email whenever a new post goes up. No spam, unsubscribe any time from the link in every email.",
  },
  unsubscribed: {
    kicker: '— UNSUBSCRIBED —',
    title: 'Done.',
    body: "You won't get any more emails from this blog. Sorry to see you go — you can always resubscribe from the blog page.",
  },
  invalid: {
    kicker: '— LINK EXPIRED —',
    title: 'Hmm.',
    body: "That confirmation or unsubscribe link isn't valid anymore. If you were trying to subscribe, just try again from the blog page.",
  },
};

export default function SubscribeStatus() {
  const { status } = useParams();
  const copy = COPY[status];
  if (!copy) return <Navigate to="/blog" replace />;

  return (
    <div className="comic-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="comic-grid-overlay" aria-hidden />
      <section className="c-section" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <p className="c-mono" style={{ color: 'var(--crimson)', marginBottom: '0.5rem' }}>
          {copy.kicker}
        </p>
        <h1
          className="c-display"
          style={{
            fontSize: 'clamp(2.6rem, 10vw, 4.5rem)',
            color: 'var(--ink)',
            textShadow: '5px 5px 0 var(--gold)',
            margin: 0,
          }}
        >
          {copy.title}
        </h1>
        <p style={{ opacity: 0.75, margin: '1.5rem 0 2.5rem' }}>{copy.body}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/blog"
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
            ← BACK TO THE BLOG
          </Link>
        </div>
      </section>
    </div>
  );
}
