// src/pages/LabsPage.jsx
// ============================================================
// Everything under /labs:
//   /labs            all labs (LabsHome)
//   /labs/new        the same page with the new-lab dialog open
//                    (?template=<id> or ?note=<notes path>)
//   /labs/:labId     one lab (LabWorkspace)
// Labs are private: the page first asks /api/labs/session and shows
// a sign-in form or a "not configured" message when needed.
// Architecture: LABS_ARCHITECTURE.md. How to add labs: LABS_GUIDE.md.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { labsApi } from '../labs/api';
import { useLabsHead } from '../labs/hooks';
import LabsHome from '../labs/components/LabsHome';
import LabWorkspace from '../labs/components/LabWorkspace';
import '../styles/comic.css';
import '../styles/blog.css';
import '../styles/notes.css';
import '../styles/labs.css';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

function SignIn({ onSignedIn }) {
  useLabsHead('Sign in');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="labs-center">
      <form
        className="c-panel labs-panel labs-signin"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await labsApi.signIn(password);
            setPassword('');
            onSignedIn();
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="c-heavy">Labs are private</h1>
        <p>Sign in with the Labs password to open your labs.</p>
        <label className="labs-field">
          <span className="labs-field-label">Password</span>
          <input type="password" autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p className="labs-error-text" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="labs-button is-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="labs-muted">
          Looking for the study notes? <Link to="/notes">They are public</Link>.
        </p>
      </form>
    </div>
  );
}

function NotConfigured({ problems }) {
  useLabsHead('Not configured');
  return (
    <div className="labs-center">
      <div className="c-panel labs-panel">
        <h1 className="c-heavy">Labs is not set up on this server yet</h1>
        <p>The owner must add these environment variables in the Vercel project, then deploy again:</p>
        <ul className="labs-problems">
          {problems.map((p) => (
            <li key={p}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
        <p className="labs-muted">The steps are in LABS_GUIDE.md, section “Deploy”.</p>
      </div>
    </div>
  );
}

function WorkspaceRoute({ session }) {
  const { labId } = useParams();
  // key: a new lab id mounts a fresh workspace (new document, new Python).
  return <LabWorkspace key={labId} labId={labId} session={session} />;
}

export default function LabsPage() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const check = useCallback(async () => {
    setError(null);
    try {
      setSession(await labsApi.session());
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const signOut = async () => {
    try {
      await labsApi.signOut();
    } finally {
      check();
    }
  };

  let body;
  if (error) {
    body = (
      <div className="labs-center">
        <div className="c-panel labs-panel" role="alert">
          <h1 className="c-heavy">Labs cannot reach the server</h1>
          <p>{error.message}</p>
          <button type="button" className="labs-button is-primary" onClick={check}>
            Try again
          </button>
        </div>
      </div>
    );
  } else if (!session) {
    body = (
      <p className="labs-center labs-muted" role="status">
        Loading Labs…
      </p>
    );
  } else if (!session.configured.storage || !session.configured.auth) {
    body = <NotConfigured problems={session.problems} />;
  } else if (!session.authenticated) {
    body = <SignIn onSignedIn={check} />;
  } else {
    body = (
      <Routes>
        <Route index element={<LabsHome session={session} createOpen={false} />} />
        <Route path="new" element={<LabsHome session={session} createOpen />} />
        <Route path=":labId" element={<WorkspaceRoute session={session} />} />
      </Routes>
    );
  }

  return (
    <div className="comic-root labs-root">
      <div className="comic-grid-overlay" aria-hidden />
      <nav className="labs-topbar" aria-label="Site">
        <Link to="/labs" className="c-heavy labs-brand">
          LABS
        </Link>
        <span className="labs-topbar-links">
          <Link to="/notes" className="c-mono">
            NOTES
          </Link>
          <Link to="/blog" className="c-mono">
            BLOG
          </Link>
          <Link to="/" className="c-mono">
            HOME
          </Link>
          {session && session.authenticated && session.mode !== 'dev' && (
            <button type="button" className="c-mono labs-topbar-button" onClick={signOut}>
              SIGN OUT
            </button>
          )}
        </span>
      </nav>
      <div className="labs-page">{body}</div>
    </div>
  );
}
