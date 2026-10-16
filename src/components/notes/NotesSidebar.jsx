// src/components/notes/NotesSidebar.jsx
// Left column of /notes. It fills the full height under the top bar:
//
//   1. Head: search box, Home and Review links, tree tools.
//   2. Tree: the only part that scrolls. Folders open and close. The
//      folders above the current page open automatically, and the
//      current row scrolls into view. Arrow keys move through the tree.
//   3. Foot: status legend and overall progress.
//
// While the search box has text, matching notes replace the tree.
// NotesPage.jsx owns the layout state (collapsed, width, phone drawer).
// When the tree is collapsed on a wide screen, CSS shows the narrow
// rail of icon buttons instead of the panel. The open folders are kept
// in localStorage, so they survive a page reload.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getNotesRoot,
  getNoteItem,
  getAncestors,
  getDueNotes,
  searchNotes,
  todayString,
  STATUS_LABELS,
  STATUSES,
  REVIEW_PATH,
} from '../../lib/notes';
import { StatusDot, PrivateBadge } from './NoteMeta';

const OPEN_KEY = 'notes.sidebar.open';

function readOpenPaths() {
  try {
    const value = JSON.parse(window.localStorage.getItem(OPEN_KEY) || '[]');
    return Array.isArray(value) ? value.filter((p) => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

function writeOpenPaths(open) {
  try {
    window.localStorage.setItem(OPEN_KEY, JSON.stringify([...open]));
  } catch {
    // Storage can be full or blocked. The tree still works without it.
  }
}

// The folders that must be open to show `currentPath`. For a folder
// page, this includes the folder itself.
function pathsToOpen(currentPath) {
  const item = currentPath == null ? null : getNoteItem(currentPath);
  if (!item) return [];
  return getAncestors(item)
    .filter((node) => node.type === 'folder' && node.path !== '')
    .map((node) => node.path);
}

function allFolderPaths(folder, out = []) {
  for (const child of folder.children) {
    if (child.type === 'folder') {
      out.push(child.path);
      allFolderPaths(child, out);
    }
  }
  return out;
}

// Per folder: the notes that have a status, and how many are mastered.
let statsCache = null;
function folderStats() {
  if (statsCache) return statsCache;
  const map = new Map();
  (function walk(folder) {
    let total = 0;
    let mastered = 0;
    for (const child of folder.children) {
      if (child.type === 'note') {
        if (child.status) total += 1;
        if (child.status === 'mastered') mastered += 1;
      } else {
        const s = walk(child);
        total += s.total;
        mastered += s.mastered;
      }
    }
    const stats = { total, mastered };
    map.set(folder.path, stats);
    return stats;
  })(getNotesRoot());
  statsCache = map;
  return map;
}

// The rows that are visible with the current open folders, in order.
function visibleRowPaths(folder, open, out = []) {
  for (const child of folder.children) {
    out.push(child.path);
    if (child.type === 'folder' && open.has(child.path)) visibleRowPaths(child, open, out);
  }
  return out;
}

// "01 Background: …" -> ["01", "Background: …"], "L2: Subagents" ->
// ["L2", "Subagents"]. Other titles stay whole.
function splitNumber(title) {
  const match = /^(L\d+|\d{1,2}(?:\.\d+)*)[:.]?\s+(.+)$/.exec(title);
  return match ? [match[1], match[2]] : [null, title];
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, terms }) {
  if (terms.length === 0) return text;
  const parts = text.split(new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi'));
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>));
}

// ---------- icons (inline, 16 px, stroke = currentColor) ----------
function Icon({ children, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}
export const IconSearch = () => (
  <Icon>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.4 10.4 14 14" />
  </Icon>
);
export const IconHome = () => (
  <Icon>
    <path d="M2.5 7.2 8 2.5l5.5 4.7" />
    <path d="M4 6v7.5h8V6" />
  </Icon>
);
export const IconReview = () => (
  <Icon>
    <path d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1" />
    <path d="M13.5 2.5v3.2h-3.2" />
  </Icon>
);
export const IconPanel = () => (
  <Icon>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M6 2.5v11" />
  </Icon>
);
const IconChevron = () => (
  <Icon size={12}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </Icon>
);
const IconExpandAll = () => (
  <Icon>
    <path d="M4.5 6 8 2.5 11.5 6" />
    <path d="M4.5 10 8 13.5 11.5 10" />
  </Icon>
);
const IconCollapseAll = () => (
  <Icon>
    <path d="M4.5 2.5 8 6 11.5 2.5" />
    <path d="M4.5 13.5 8 10 11.5 13.5" />
  </Icon>
);
const IconClose = () => (
  <Icon size={14}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Icon>
);
const IconHide = () => (
  <Icon>
    <path d="M10 4 6 8l4 4" />
  </Icon>
);

// ---------- tree ----------
function TreeNode({ item, depth, ctx }) {
  const { currentPath, open, onToggle, onOpen, trail, tabbablePath } = ctx;
  const active = item.path === currentPath;
  const tabIndex = item.path === tabbablePath ? 0 : -1;
  const [num, text] = splitNumber(item.title);
  const style = { '--depth': depth };

  if (item.type === 'note') {
    return (
      <li role="none">
        <Link
          to={item.url}
          role="treeitem"
          aria-level={depth + 1}
          aria-selected={active}
          aria-current={active ? 'page' : undefined}
          data-tree-row=""
          data-path={item.path}
          tabIndex={tabIndex}
          title={item.title}
          className={`nt-row nt-note${active ? ' is-active' : ''}`}
          style={style}
        >
          <span className="nt-icon">
            <StatusDot status={item.status} />
          </span>
          {num && <span className="nt-num">{num}</span>}
          <span className="nt-text">{text}</span>
          <PrivateBadge show={item.private} />
        </Link>
      </li>
    );
  }

  const isOpen = open.has(item.path);
  const onTrail = trail.has(item.path);
  const stats = folderStats().get(item.path);
  return (
    <li role="none">
      <div
        className={`nt-row nt-folder${depth === 0 ? ' nt-area' : ''}${active ? ' is-active' : ''}${onTrail ? ' is-trail' : ''}`}
        style={style}
      >
        <button
          type="button"
          className={`nt-chevron${isOpen ? ' is-open' : ''}`}
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => onToggle(item.path)}
        >
          <IconChevron />
        </button>
        <Link
          to={item.url}
          role="treeitem"
          aria-level={depth + 1}
          aria-expanded={isOpen}
          aria-selected={active}
          aria-current={active ? 'page' : undefined}
          data-tree-row=""
          data-folder=""
          data-path={item.path}
          tabIndex={tabIndex}
          title={item.title}
          className="nt-label"
          onClick={() => onOpen(item.path)}
        >
          {num && <span className="nt-num">{num}</span>}
          <span className="nt-text">{text}</span>
        </Link>
        {stats && stats.total > 0 && (
          <span className="nt-count" title={`${stats.mastered} of ${stats.total} notes mastered`}>
            {stats.mastered}/{stats.total}
          </span>
        )}
      </div>
      {isOpen && item.children.length > 0 && (
        <ul role="group" className={`nt-group${onTrail ? ' is-trail' : ''}`} style={style}>
          {item.children.map((child) => (
            <TreeNode key={child.path} item={child} depth={depth + 1} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------- search results ----------
function SearchResults({ results, terms, currentPath, onPick, onExit }) {
  const onKeyDown = (e) => {
    const hits = [...e.currentTarget.querySelectorAll('.nt-hit')];
    const i = hits.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i < hits.length - 1) {
      e.preventDefault();
      hits[i + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (i > 0) hits[i - 1].focus();
      else onExit(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onExit(true);
    }
  };

  return (
    <div className="nt-results" aria-live="polite">
      <p className="nt-section-label">
        {results.length === 0 ? 'No matches' : `${results.length} match${results.length === 1 ? '' : 'es'}`}
      </p>
      {results.length === 0 ? (
        <p className="nt-empty">Try fewer words, or a word from the page text.</p>
      ) : (
        <ul className="nt-hits" onKeyDown={onKeyDown}>
          {results.map(({ note, snippet }) => {
            const where = getAncestors(note)
              .slice(1, -1)
              .map((n) => n.title)
              .join(' › ');
            return (
              <li key={note.path}>
                <Link
                  to={note.url}
                  className={`nt-hit${note.path === currentPath ? ' is-active' : ''}`}
                  onClick={onPick}
                >
                  <span className="nt-hit-title">
                    <span className="nt-icon">
                      <StatusDot status={note.status} />
                    </span>
                    <span>
                      <Highlight text={note.title} terms={terms} />
                    </span>
                  </span>
                  {where && <span className="nt-hit-path">{where}</span>}
                  <span className="nt-hit-snippet">
                    <Highlight text={snippet} terms={terms} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- the sidebar ----------
export default function NotesSidebar({ currentPath, onCollapse, onExpand }) {
  const root = getNotesRoot();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set([...readOpenPaths(), ...pathsToOpen(currentPath)]));
  const [focusPath, setFocusPath] = useState(currentPath);
  const [shadow, setShadow] = useState({ top: false, bottom: false });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // When the page changes, open the folders above it (during render, so
  // the scroll effect below already sees the open folders).
  const [prevPath, setPrevPath] = useState(currentPath);
  if (prevPath !== currentPath) {
    setPrevPath(currentPath);
    setFocusPath(currentPath);
    const needed = pathsToOpen(currentPath).filter((p) => !open.has(p));
    if (needed.length > 0) setOpen(new Set([...open, ...needed]));
  }

  useEffect(() => writeOpenPaths(open), [open]);

  const trail = useMemo(() => new Set(pathsToOpen(currentPath)), [currentPath]);
  const visible = useMemo(() => visibleRowPaths(root, open), [root, open]);
  const tabbablePath = visible.includes(focusPath) ? focusPath : visible[0];

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = terms.length > 0 ? searchNotes(query) : null;
  const dueCount = useMemo(() => getDueNotes(todayString()).length, []);

  const progress = useMemo(() => folderStats().get(''), []);

  const toggle = (path) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  const openOne = (path) => setOpen((prev) => (prev.has(path) ? prev : new Set([...prev, path])));
  const expandAll = () => setOpen(new Set(allFolderPaths(root)));
  const collapseAll = () => setOpen(new Set());

  // Keep the current row in view after a page change.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const row = box.querySelector('.nt-row.is-active');
    if (!row) return;
    const b = box.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    if (r.top < b.top + 8 || r.bottom > b.bottom - 8) {
      box.scrollTop += r.top - b.top - b.height / 2 + r.height / 2;
    }
  }, [currentPath]);

  // Soft shadows under the head and above the foot while the tree can scroll.
  const updateShadow = () => {
    const box = scrollRef.current;
    if (!box) return;
    const top = box.scrollTop > 2;
    const bottom = box.scrollTop + box.clientHeight < box.scrollHeight - 2;
    setShadow((s) => (s.top === top && s.bottom === bottom ? s : { top, bottom }));
  };
  useEffect(() => {
    updateShadow();
    window.addEventListener('resize', updateShadow);
    return () => window.removeEventListener('resize', updateShadow);
  });

  const onTreeKeyDown = (e) => {
    const rows = [...e.currentTarget.querySelectorAll('[data-tree-row]')];
    const i = rows.indexOf(document.activeElement);
    if (i === -1) return;
    const row = rows[i];
    const path = row.dataset.path;
    const isFolder = 'folder' in row.dataset;
    let target = null;
    switch (e.key) {
      case 'ArrowDown':
        target = rows[i + 1];
        break;
      case 'ArrowUp':
        target = rows[i - 1];
        break;
      case 'Home':
        target = rows[0];
        break;
      case 'End':
        target = rows[rows.length - 1];
        break;
      case 'ArrowRight':
        if (!isFolder) return;
        if (!open.has(path)) toggle(path);
        else if (rows[i + 1] && rows[i + 1].dataset.path.startsWith(`${path}/`)) target = rows[i + 1];
        break;
      case 'ArrowLeft': {
        if (isFolder && open.has(path)) {
          toggle(path);
          break;
        }
        const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : null;
        target = rows.find((r) => r.dataset.path === parent && 'folder' in r.dataset) || null;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    if (target) {
      setFocusPath(target.dataset.path);
      target.focus();
    }
  };

  const clearSearch = (focusInput) => {
    setQuery('');
    if (focusInput) inputRef.current?.focus();
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (query) setQuery('');
      else e.currentTarget.blur();
    } else if (e.key === 'ArrowDown' && results && results.length > 0) {
      e.preventDefault();
      resultsRef.current?.querySelector('.nt-hit')?.focus();
    } else if (e.key === 'Enter' && results && results.length > 0) {
      e.preventDefault();
      navigate(results[0].note.url);
      setQuery('');
    }
  };

  const ctx = { currentPath, open, onToggle: toggle, onOpen: openOne, trail, tabbablePath };
  const pct = progress && progress.total > 0 ? Math.round((progress.mastered / progress.total) * 100) : 0;

  return (
    <>
      {/* Narrow rail: shown by CSS only while the tree is collapsed on a wide screen. */}
      <div className="notes-rail" aria-label="Notes tree (collapsed)">
        <button type="button" className="notes-rail-button" onClick={() => onExpand()} title="Show the notes tree  [" aria-label="Show the notes tree">
          <IconPanel />
        </button>
        <button
          type="button"
          className="notes-rail-button"
          onClick={() => onExpand({ focusSearch: true })}
          title="Search notes  /"
          aria-label="Search notes"
        >
          <IconSearch />
        </button>
        <Link to="/notes" className={`notes-rail-button${currentPath === '' ? ' is-active' : ''}`} title="Notes home" aria-label="Notes home">
          <IconHome />
        </Link>
        <Link
          to="/notes/review"
          className={`notes-rail-button${currentPath === REVIEW_PATH ? ' is-active' : ''}`}
          title={`Review${dueCount ? ` (${dueCount} due)` : ''}`}
          aria-label={`Review${dueCount ? `, ${dueCount} due` : ''}`}
        >
          <IconReview />
          {dueCount > 0 && <span className="notes-rail-dot" aria-hidden="true" />}
        </Link>
      </div>

      <nav
        className={`notes-panel${shadow.top ? ' has-shadow-top' : ''}${shadow.bottom ? ' has-shadow-bottom' : ''}`}
        aria-label="Notes"
      >
        <div className="notes-panel-head">
          <div className="nt-search">
            <span className="nt-search-icon">
              <IconSearch />
            </span>
            <input
              id="notes-search"
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Search notes"
              aria-label="Search notes"
              autoComplete="off"
              spellCheck="false"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
            />
            {query ? (
              <button type="button" className="nt-search-clear" onClick={() => clearSearch(true)} aria-label="Clear the search">
                <IconClose />
              </button>
            ) : (
              <kbd className="nt-kbd" aria-hidden="true">
                /
              </kbd>
            )}
          </div>

          <div className="nt-quick">
            <Link
              to="/notes"
              className={`nt-quick-link${currentPath === '' ? ' is-active' : ''}`}
              aria-current={currentPath === '' ? 'page' : undefined}
            >
              <IconHome />
              <span>Home</span>
            </Link>
            <Link
              to="/notes/review"
              className={`nt-quick-link${currentPath === REVIEW_PATH ? ' is-active' : ''}`}
              aria-current={currentPath === REVIEW_PATH ? 'page' : undefined}
            >
              <IconReview />
              <span>Review</span>
              {dueCount > 0 && (
                <span className="nt-badge" title={`${dueCount} note${dueCount === 1 ? '' : 's'} due today`}>
                  {dueCount}
                </span>
              )}
            </Link>
          </div>

          {!results && (
            <div className="nt-toolbar">
              <span className="nt-section-label">Contents</span>
              <span className="nt-tools">
                <button type="button" className="nt-tool" onClick={expandAll} title="Open all folders" aria-label="Open all folders">
                  <IconExpandAll />
                </button>
                <button type="button" className="nt-tool" onClick={collapseAll} title="Close all folders" aria-label="Close all folders">
                  <IconCollapseAll />
                </button>
                <button
                  type="button"
                  className="nt-tool nt-tool-hide"
                  onClick={onCollapse}
                  title="Hide the notes tree  ["
                  aria-label="Hide the notes tree"
                >
                  <IconHide />
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="notes-panel-scroll" ref={scrollRef} onScroll={updateShadow}>
          {results ? (
            <div ref={resultsRef}>
              <SearchResults
                results={results}
                terms={terms}
                currentPath={currentPath}
                onPick={() => setQuery('')}
                onExit={clearSearch}
              />
            </div>
          ) : (
            <ul
              className="nt-tree"
              role="tree"
              aria-label="Notes tree"
              onKeyDown={onTreeKeyDown}
              onFocus={(e) => {
                const p = e.target?.dataset?.path;
                if (p !== undefined) setFocusPath(p);
              }}
            >
              {root.children.map((child) => (
                <TreeNode key={child.path} item={child} depth={0} ctx={ctx} />
              ))}
            </ul>
          )}
        </div>

        <div className="notes-panel-foot">
          <ul className="nt-legend" aria-label="Status colors">
            {STATUSES.map((s) => (
              <li key={s}>
                <StatusDot status={s} />
                <span>{STATUS_LABELS[s].toLowerCase()}</span>
              </li>
            ))}
          </ul>
          {progress && progress.total > 0 && (
            <div className="nt-progress" title={`${progress.mastered} of ${progress.total} notes mastered`}>
              <span className="nt-progress-text">
                <span>Mastered</span>
                <span>
                  {progress.mastered} / {progress.total}
                </span>
              </span>
              <span
                className="nt-progress-bar"
                role="progressbar"
                aria-label="Notes mastered"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <span style={{ width: `${pct}%` }} />
              </span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
