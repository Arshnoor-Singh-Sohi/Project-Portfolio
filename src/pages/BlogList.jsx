// src/pages/BlogList.jsx
// The /blog index — pulls every post from src/content/blog (via
// src/lib/posts.js) and renders them as cards in the same comic-book
// style as the homepage's "Press Room" section. Includes a client-side
// search box and tag filter since everything's already in memory.
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts, formatIssue } from '../lib/posts';
// Email subscriptions are temporarily disabled (see BlogPost.jsx for the
// matching change) — the backend (Resend/Upstash) isn't fully set up yet,
// so the form would just show a "not set up" error. Re-enable by
// restoring this import and the <SubscribeForm /> block below.
// import SubscribeForm from '../components/SubscribeForm';
import '../styles/comic.css';
import '../styles/blog.css';

const inputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--ink)',
  background: 'var(--paper)',
  border: '2px solid var(--ink)',
  padding: '0.6rem 0.9rem',
  borderRadius: '2px',
  width: '100%',
  boxSizing: 'border-box',
};

export default function BlogList() {
  const posts = getAllPosts();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const allTags = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !activeTag || p.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [posts, query, activeTag]);

  const hasFilters = query.trim() !== '' || activeTag !== null;

  return (
    <div className="comic-root">
      <div className="comic-grid-overlay" aria-hidden />
      <section className="c-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link
            to="/"
            className="c-mono"
            style={{ color: 'var(--crimson)', textDecoration: 'none' }}
          >
            ← BACK TO HOME
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="c-mono" style={{ color: 'var(--crimson)', marginBottom: '0.5rem' }}>
            — THE PRESS ROOM —
          </p>
          <h1
            className="c-display"
            style={{
              fontSize: 'clamp(2.8rem, 8vw, 5rem)',
              color: 'var(--ink)',
              textShadow: '5px 5px 0 var(--gold)',
              margin: 0,
            }}
          >
            The Blog
          </h1>
        </div>

        {/* Email subscriptions temporarily disabled — see the import
            comment above. Restore this block to bring the form back:
        <div style={{ maxWidth: 420, margin: '0 auto 2.5rem', textAlign: 'left' }}>
          <SubscribeForm />
        </div>
        */}

        {posts.length > 0 && (
          <div style={{ maxWidth: 640, margin: '0 auto 2.5rem' }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH ARTICLES…"
              aria-label="Search articles"
              style={{ ...inputStyle, marginBottom: allTags.length > 0 ? '1rem' : 0 }}
            />
            {allTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {allTags.map((tag) => {
                  const isActive = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(isActive ? null : tag)}
                      className="c-mono"
                      style={{
                        border: '1px solid var(--crimson)',
                        background: isActive ? 'var(--crimson)' : 'transparent',
                        color: isActive ? 'var(--paper)' : 'var(--crimson)',
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.62rem',
                        cursor: 'pointer',
                        borderRadius: '2px',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setActiveTag(null); }}
                    className="c-mono"
                    style={{
                      border: '1px solid var(--ink)',
                      background: 'transparent',
                      color: 'var(--ink)',
                      opacity: 0.6,
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.62rem',
                      cursor: 'pointer',
                      borderRadius: '2px',
                    }}
                  >
                    CLEAR FILTERS ✕
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="c-mono" style={{ textAlign: 'center', opacity: 0.6 }}>
            NO ISSUES PUBLISHED YET — CHECK BACK SOON
          </p>
        ) : filtered.length === 0 ? (
          <p className="c-mono" style={{ textAlign: 'center', opacity: 0.6 }}>
            NO ARTICLES MATCH THAT SEARCH
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '2rem',
            }}
          >
            {filtered.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  className="c-panel"
                  style={{
                    padding: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt=""
                      loading="lazy"
                      style={{
                        width: '100%',
                        aspectRatio: '16 / 9',
                        objectFit: 'cover',
                        borderBottom: '3px solid var(--ink)',
                        display: 'block',
                      }}
                    />
                  )}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap',
                        gap: '0.3rem',
                      }}
                    >
                      <span className="c-mono" style={{ fontSize: '0.6rem', color: 'var(--crimson)' }}>
                        {formatIssue(post.issue)}
                      </span>
                      <span className="c-mono" style={{ fontSize: '0.6rem', opacity: 0.55 }}>
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="c-heavy" style={{ fontSize: '1.05rem', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                      {post.title}
                    </h2>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.7, flexGrow: 1, opacity: 0.8 }}>
                      {post.excerpt}
                    </p>
                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
                        {post.tags.map((t) => (
                          <span
                            key={t}
                            className="c-mono"
                            style={{
                              border: '1px solid var(--crimson)',
                              color: 'var(--crimson)',
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.55rem',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                      <span className="c-heavy" style={{ fontSize: '0.78rem', color: 'var(--crimson)' }}>
                        READ MORE
                      </span>
                      <span style={{ color: 'var(--crimson)', fontSize: '1rem' }}>→</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
