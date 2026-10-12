// src/pages/NotesPage.jsx
// Everything under /notes: the home page (_index.md), folder pages,
// note pages and /notes/review. Unlisted: nothing outside /notes links
// here, and every page sets <meta name="robots" content="noindex">.
// Content model and block syntax: NOTES_GUIDE.md.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  getNoteItem,
  getAncestors,
  getAdjacentNotes,
  getDueNotes,
  extractCheckBlocks,
  todayString,
  REVIEW_PATH,
} from '../lib/notes';
import { extractHeadings } from '../lib/markdown-utils';
import NotesMarkdown from '../components/markdown/NotesMarkdown';
import TableOfContents from '../components/markdown/TableOfContents';
import CheckBlock from '../components/markdown/CheckBlock';
import NotesSidebar from '../components/notes/NotesSidebar';
import { StatusDot, StatusBadge, Confidence, ReviewDue, PrivateBadge } from '../components/notes/NoteMeta';
import '../styles/comic.css';
import '../styles/blog.css';
import '../styles/notes.css';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

// Adds <meta name="robots" content="noindex"> while any /notes page is
// mounted, and restores the document title on the way out.
function useNotesHead(title) {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    document.title = title ? `${title} · Notes` : 'Notes';
  }, [title]);
}

function Breadcrumbs({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="notes-breadcrumbs">
      <ol>
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={crumb.url}>
              {last ? (
                <span aria-current="page">{crumb.title}</span>
              ) : (
                <Link to={crumb.url}>{crumb.title}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function trailFor(item) {
  return getAncestors(item).map((node) => ({ url: node.url, title: node.path === '' ? 'Notes' : node.title }));
}

function countNotes(folder) {
  return folder.children.reduce((n, child) => n + (child.type === 'note' ? 1 : countNotes(child)), 0);
}

function ChildList({ folder, today }) {
  if (folder.children.length === 0) return null;
  return (
    <section className="notes-children" aria-label="Contents">
      <p className="c-mono notes-section-label">— IN THIS FOLDER —</p>
      <ul>
        {folder.children.map((child) => (
          <li key={child.path}>
            <Link to={child.url} className="notes-child-row">
              <span className="notes-child-main">
                <span className="notes-child-title">
                  {child.type === 'note' ? <StatusDot status={child.status} /> : <span className="notes-folder-icon" aria-hidden>▸</span>}
                  {child.title}
                  {child.type === 'note' && <PrivateBadge show={child.private} />}
                </span>
                {child.summary && <span className="notes-child-summary">{child.summary}</span>}
              </span>
              <span className="notes-child-meta">
                {child.type === 'folder' ? (
                  <span className="c-mono notes-muted">
                    FOLDER · {countNotes(child)} NOTE{countNotes(child) === 1 ? '' : 'S'}
                  </span>
                ) : (
                  <>
                    <StatusBadge status={child.status} />
                    <Confidence value={child.confidence} />
                    <ReviewDue date={child.reviewDue} today={today} />
                  </>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FolderView({ folder }) {
  const today = todayString();
  const isHome = folder.path === '';
  const due = isHome ? getDueNotes(today).length : 0;
  return (
    <article>
      <Breadcrumbs trail={trailFor(folder)} />
      <header className="notes-header">
        <h1 className="c-display notes-h1">{folder.title}</h1>
        {folder.summary && <p className="notes-lead">{folder.summary}</p>}
        {isHome && (
          <Link to="/notes/review" className="c-mono notes-review-cta">
            ↻ REVIEW · {due} NOTE{due === 1 ? '' : 'S'} DUE TODAY
          </Link>
        )}
      </header>
      {folder.content.trim() && (
        <div className="blog-prose notes-prose">
          <NotesMarkdown content={folder.content} />
        </div>
      )}
      <ChildList folder={folder} today={today} />
    </article>
  );
}

function AdjacentCard({ note, label, align }) {
  if (!note) return <div className="notes-adjacent-empty" />;
  return (
    <Link to={note.url} className="c-panel notes-adjacent" style={{ textAlign: align }}>
      <span className="c-mono notes-adjacent-label">{label}</span>
      <span className="c-heavy">{note.title}</span>
    </Link>
  );
}

function NoteView({ note }) {
  const today = todayString();
  const headings = useMemo(() => extractHeadings(note.content), [note]);
  const { prev, next } = getAdjacentNotes(note);
  return (
    <article>
      <Breadcrumbs trail={trailFor(note)} />
      <header className="notes-header">
        <h1 className="c-display notes-h1 notes-h1-note">{note.title}</h1>
        {note.summary && <p className="notes-lead">{note.summary}</p>}
        <div className="notes-meta-row">
          <StatusBadge status={note.status} />
          <Confidence value={note.confidence} />
          {note.learned && <span className="c-mono notes-muted-strong">LEARNED {note.learned}</span>}
          <ReviewDue date={note.reviewDue} today={today} />
          <PrivateBadge show={note.private} />
        </div>
        {note.tags.length > 0 && (
          <div className="notes-tags">
            {note.tags.map((t) => (
              <span key={t} className="c-mono notes-tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>
      <TableOfContents headings={headings} />
      <div className="blog-prose notes-prose">
        <NotesMarkdown content={note.content} />
      </div>
      <div className="notes-adjacent-row">
        <AdjacentCard note={prev} label="← PREVIOUS" align="left" />
        <AdjacentCard note={next} label="NEXT →" align="right" />
      </div>
    </article>
  );
}

function ReviewView() {
  const today = todayString();
  const due = getDueNotes(today);
  const checks = due.flatMap((note) => extractCheckBlocks(note.content).map((code) => ({ note, code })));
  const [index, setIndex] = useState(0);
  const current = checks[Math.min(index, checks.length - 1)];

  return (
    <article>
      <Breadcrumbs trail={[{ url: '/notes', title: 'Notes' }, { url: '/notes/review', title: 'Review' }]} />
      <header className="notes-header">
        <h1 className="c-display notes-h1">Review</h1>
        <p className="notes-lead">
          Notes with a review date on or before today ({today}), oldest first.
        </p>
      </header>

      {due.length === 0 ? (
        <p className="c-panel notes-empty">Nothing is due. Come back on the next review date.</p>
      ) : (
        <ol className="notes-review-list">
          {due.map((note) => (
            <li key={note.path}>
              <Link to={note.url} className="notes-child-row">
                <span className="notes-child-main">
                  <span className="notes-child-title">
                    <StatusDot status={note.status} />
                    {note.title}
                  </span>
                  <span className="notes-child-summary">{trailFor(note).slice(1, -1).map((c) => c.title).join(' / ')}</span>
                </span>
                <span className="notes-child-meta">
                  <ReviewDue date={note.reviewDue} today={today} />
                  <StatusBadge status={note.status} />
                  <Confidence value={note.confidence} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <section className="notes-quiz" aria-label="Quiz">
        <p className="c-mono notes-section-label">— QUIZ MODE —</p>
        {checks.length === 0 ? (
          <p className="notes-muted-strong">The due notes have no check questions.</p>
        ) : (
          <>
            <div className="notes-quiz-bar">
              <span className="c-mono">
                QUESTION {Math.min(index, checks.length - 1) + 1} OF {checks.length}
              </span>
              <Link to={current.note.url} className="c-mono notes-quiz-source">
                FROM: {current.note.title}
              </Link>
            </div>
            <div className="blog-prose notes-prose">
              <div className="code-block mermaid-block">
                <div className="code-block-header">
                  <span className="code-block-lang">CHECK YOURSELF</span>
                </div>
                <CheckBlock key={index} code={current.code} />
              </div>
            </div>
            <div className="notes-quiz-actions">
              <button type="button" className="notes-button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                ← PREVIOUS
              </button>
              <button
                type="button"
                className="notes-button notes-button-strong"
                disabled={index >= checks.length - 1}
                onClick={() => setIndex((i) => i + 1)}
              >
                NEXT QUESTION →
              </button>
            </div>
          </>
        )}
      </section>
    </article>
  );
}

function MissingView({ path }) {
  return (
    <article>
      <Breadcrumbs trail={[{ url: '/notes', title: 'Notes' }, { url: `/notes/${path}`, title: 'Not found' }]} />
      <header className="notes-header">
        <h1 className="c-display notes-h1">Not found</h1>
        <p className="notes-lead">
          No note or folder at <code>/notes/{path}</code>. Use the tree or the search box.
        </p>
      </header>
    </article>
  );
}

export default function NotesPage() {
  const params = useParams();
  const location = useLocation();
  const path = (params['*'] || '').replace(/\/+$/, '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isReview = path === REVIEW_PATH;
  const item = isReview ? null : getNoteItem(path);
  useNotesHead(isReview ? 'Review' : item ? (item.path === '' ? '' : item.title) : 'Not found');

  // Close the phone drawer after navigation; jump to the top of a new page.
  useEffect(() => {
    setDrawerOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  let view;
  if (isReview) view = <ReviewView />;
  else if (!item) view = <MissingView path={path} />;
  else if (item.type === 'folder') view = <FolderView folder={item} />;
  else view = <NoteView key={item.path} note={item} />;

  return (
    <div className="comic-root notes-root">
      <div className="comic-grid-overlay" aria-hidden />
      <div className="notes-topbar">
        <button
          type="button"
          className="notes-button notes-drawer-button"
          aria-expanded={drawerOpen}
          aria-controls="notes-sidebar"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {drawerOpen ? '✕ CLOSE' : '☰ NOTES TREE'}
        </button>
        <Link to="/notes" className="c-heavy notes-brand">
          NOTES
        </Link>
        <span className="notes-topbar-links">
          <Link to="/" className="c-mono">HOME</Link>
          <Link to="/blog" className="c-mono">BLOG</Link>
        </span>
      </div>

      <div className="notes-layout">
        {drawerOpen && <div className="notes-backdrop" aria-hidden onClick={() => setDrawerOpen(false)} />}
        <aside id="notes-sidebar" className={`notes-sidebar${drawerOpen ? ' is-open' : ''}`}>
          <NotesSidebar currentPath={isReview ? REVIEW_PATH : item ? item.path : null} />
        </aside>
        <main className="notes-main">{view}</main>
      </div>
    </div>
  );
}
