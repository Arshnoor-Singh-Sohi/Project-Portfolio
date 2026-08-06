// src/components/SubscribeForm.jsx
// Email signup box for new-post notifications. Posts to /api/subscribe
// (a Vercel serverless function) which stores the address in Upstash
// Redis and sends a confirmation email via Resend — nothing happens
// here except the client-side form + status handling. This only works
// on a real Vercel deploy with RESEND_API_KEY + UPSTASH_REDIS_REST_*
// env vars set; on `vite dev`/`vite preview` the fetch will 404, which
// is expected (see BLOG_GUIDE.md).
import React, { useState } from 'react';

const inputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--ink)',
  background: 'var(--paper)',
  border: '2px solid var(--ink)',
  padding: '0.6rem 0.9rem',
  borderRadius: '2px',
  flex: '1 1 220px',
  minWidth: 0,
  boxSizing: 'border-box',
};

const buttonStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  background: 'var(--ink)',
  border: '2px solid var(--ink)',
  padding: '0.6rem 1.1rem',
  borderRadius: '2px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export default function SubscribeForm({ heading = 'GET NEW POSTS BY EMAIL' }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot — real people leave this blank
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;

    if (company) {
      // Bot filled the honeypot field — pretend success, do nothing.
      setStatus('done');
      setMessage("Check your inbox to confirm.");
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('done');
        setMessage(data.message || "Check your inbox to confirm.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong — try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Could not reach the server — try again in a moment.');
    }
  };

  if (status === 'done') {
    return (
      <div className="c-mono" style={{ color: 'var(--ink)', opacity: 0.75 }}>
        ✓ {message}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-start' }}
    >
      {heading && (
        <div
          className="c-mono"
          style={{ flexBasis: '100%', color: 'var(--ink)', opacity: 0.55, marginBottom: '0.15rem' }}
        >
          {heading}
        </div>
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        style={inputStyle}
      />
      {/* Honeypot — hidden from real users via CSS, left blank by them,
          often auto-filled by bots. Not a form-visible field. */}
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <button type="submit" disabled={status === 'loading'} style={buttonStyle}>
        {status === 'loading' ? 'SENDING…' : 'SUBSCRIBE'}
      </button>
      {status === 'error' && (
        <div className="c-mono" style={{ flexBasis: '100%', color: 'var(--crimson)', fontSize: '0.75rem' }}>
          {message}
        </div>
      )}
    </form>
  );
}
