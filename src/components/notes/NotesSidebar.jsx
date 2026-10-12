// src/components/notes/NotesSidebar.jsx
// Left column of /notes: a search box above the note tree. Folders
// open and close; the folders above the current page open
// automatically. While the search box has text, matching notes
// replace the tree.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotesRoot, getNoteItem, getAncestors, searchNotes, STATUS_LABELS, STATUSES } from '../../lib/notes';
import { StatusDot, PrivateBadge } from './NoteMeta';

function ancestorPaths(currentPath) {
  const item = currentPath == null ? null : getNoteItem(currentPath);
  if (!item) return [];
  return getAncestors(item)
    .filter((node) => node.type === 'folder')
    .map((node) => node.path);
}

function TreeNode({ item, currentPath, open, onToggle }) {
  const active = item.path === currentPath;

  if (item.type === 'note') {
    return (
      <li>
        <Link
          to={item.url}
          className={`notes-tree-link${active ? ' is-active' : ''}`}
          aria-current={active ? 'page' : undefined}
        >
          <StatusDot status={item.status} />
          <span className="notes-tree-label">{item.title}</span>
          <PrivateBadge show={item.private} />
        </Link>
      </li>
    );
  }

  const isOpen = open.has(item.path);
  return (
    <li>
      <div className={`notes-tree-folder${active ? ' is-active' : ''}`}>
        <button
          type="button"
          className="notes-tree-toggle"
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Close' : 'Open'} ${item.title}`}
          onClick={() => onToggle(item.path)}
        >
          {isOpen ? '▾' : '▸'}
        </button>
        <Link to={item.url} className="notes-tree-folder-link" aria-current={active ? 'page' : undefined}>
          {item.title}
        </Link>
      </div>
      {isOpen && (
        <ul className="notes-tree-list">
          {item.children.map((child) => (
            <TreeNode key={child.path} item={child} currentPath={currentPath} open={open} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function NotesSidebar({ currentPath }) {
  const root = getNotesRoot();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set(ancestorPaths(currentPath)));

  // Open the folders above the current page whenever the page changes.
  useEffect(() => {
    setOpen((prev) => {
      const next = new Set(prev);
      ancestorPaths(currentPath).forEach((p) => next.add(p));
      return next;
    });
  }, [currentPath]);

  const toggle = (path) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const results = query.trim() ? searchNotes(query) : null;

  return (
    <nav className="notes-sidebar-inner" aria-label="Notes">
      <label className="c-mono notes-search-label" htmlFor="notes-search">
        SEARCH NOTES
      </label>
      <div className="notes-search">
        <input
          id="notes-search"
          type="search"
          value={query}
          placeholder="Title or text…"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('');
          }}
        />
      </div>

      {results ? (
        <div className="notes-search-results" aria-live="polite">
          <p className="c-mono notes-search-count">
            {results.length === 0 ? 'NO MATCHES' : `${results.length} MATCH${results.length === 1 ? '' : 'ES'}`}
          </p>
          <ul className="notes-tree-list notes-tree-root">
            {results.map(({ note, snippet }) => (
              <li key={note.path}>
                <Link
                  to={note.url}
                  className={`notes-tree-link notes-search-hit${note.path === currentPath ? ' is-active' : ''}`}
                  onClick={() => setQuery('')}
                >
                  <span className="notes-search-hit-title">
                    <StatusDot status={note.status} />
                    <span className="notes-tree-label">{note.title}</span>
                  </span>
                  <span className="notes-search-snippet">{snippet}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <Link
            to="/notes"
            className={`notes-tree-home${currentPath === '' ? ' is-active' : ''}`}
            aria-current={currentPath === '' ? 'page' : undefined}
          >
            ⌂ NOTES HOME
          </Link>
          <Link
            to="/notes/review"
            className={`notes-tree-home${currentPath === 'review' ? ' is-active' : ''}`}
            aria-current={currentPath === 'review' ? 'page' : undefined}
          >
            ↻ REVIEW
          </Link>
          <ul className="notes-tree-list notes-tree-root">
            {root.children.map((child) => (
              <TreeNode key={child.path} item={child} currentPath={currentPath} open={open} onToggle={toggle} />
            ))}
          </ul>
        </>
      )}

      <ul className="notes-legend" aria-label="Status colors">
        {STATUSES.map((s) => (
          <li key={s}>
            <StatusDot status={s} /> <span className="c-mono">{STATUS_LABELS[s]}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
