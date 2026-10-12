// src/pages/BlogPost.jsx
// Renders a single post at /blog/:slug. Content is plain markdown
// (from src/content/blog/<slug>.md) rendered through react-markdown.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import {
  getPostBySlug,
  resolvePostImage,
  getAdjacentPosts,
  getRelatedPosts,
  formatIssue,
} from '../lib/posts';
import { copyToClipboard } from '../lib/clipboard';
import { extractHeadings, createHeadingIdAssigner } from '../lib/markdown-utils';
import { SITE_URL } from '../lib/site';
import CodeBlock from '../components/markdown/CodeBlock';
import MarkdownImage from '../components/markdown/MarkdownImage';
import TableOfContents from '../components/markdown/TableOfContents';
import { makeHeadingRenderer } from '../components/markdown/headings';
// Email subscriptions are temporarily disabled (see BlogList.jsx for the
// matching change) — the backend (Resend/Upstash) isn't fully set up yet,
// so the form would just show a "not set up" error. Re-enable by
// restoring this import and the <SubscribeForm /> panel below.
// import SubscribeForm from '../components/SubscribeForm';
import '../styles/comic.css';
import '../styles/blog.css';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

// Shared markdown renderers (also used by /notes). Blog posts pass no
// extra fence types to CodeBlock, so they render exactly as before.
function BlogImage(props) {
  return <MarkdownImage {...props} resolve={resolvePostImage} />;
}

// Fixed bar at the very top of the viewport that fills as the reader
// scrolls through the article body (tracked via `targetRef`, the
// .blog-prose container — not the whole page, so share buttons/related
// posts below the article don't skew the percentage).
function ReadingProgressBar({ targetRef }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = targetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      setProgress(pct);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);

  return (
    <div
      aria-hidden
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(16,13,18,0.12)', zIndex: 200 }}
    >
      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--crimson)', transition: 'width 0.1s linear' }} />
    </div>
  );
}

const shareButtonStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
  background: 'var(--paper)',
  border: '2px solid var(--ink)',
  padding: '0.5rem 0.9rem',
  borderRadius: '2px',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  boxShadow: 'var(--shadow-pop-sm)',
};

function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const handleCopyLink = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', margin: '3rem 0' }}>
      <span className="c-mono" style={{ opacity: 0.55 }}>SHARE:</span>
      <a href={tweetHref} target="_blank" rel="noopener noreferrer" style={shareButtonStyle}>
        SHARE ON X
      </a>
      <a href={linkedinHref} target="_blank" rel="noopener noreferrer" style={shareButtonStyle}>
        SHARE ON LINKEDIN
      </a>
      <button type="button" onClick={handleCopyLink} style={shareButtonStyle}>
        {copied ? 'LINK COPIED ✓' : 'COPY LINK'}
      </button>
    </div>
  );
}

function AdjacentPostCard({ post, label, align }) {
  if (!post) return <div style={{ flex: 1 }} />;
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="c-panel"
      style={{
        flex: 1,
        minWidth: 200,
        padding: '1rem 1.25rem',
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        textAlign: align,
      }}
    >
      <span className="c-mono" style={{ fontSize: '0.6rem', color: 'var(--crimson)' }}>{label}</span>
      <span className="c-heavy" style={{ fontSize: '0.9rem' }}>{post.title}</span>
    </Link>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const proseRef = useRef(null);

  const headings = useMemo(() => extractHeadings(post ? post.content : ''), [post]);
  const { newer, older } = useMemo(() => getAdjacentPosts(slug), [slug]);
  const related = useMemo(() => getRelatedPosts(slug, 3), [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Fresh assigner every render so ids always match the headings above,
  // regardless of how many times this component re-renders.
  const idAssigner = createHeadingIdAssigner();
  const HeadingH2 = makeHeadingRenderer('h2', idAssigner);
  const HeadingH3 = makeHeadingRenderer('h3', idAssigner);

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <div className="comic-root">
      <ReadingProgressBar targetRef={proseRef} />
      <div className="comic-grid-overlay" aria-hidden />
      <article className="c-section" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/blog" className="c-mono" style={{ color: 'var(--crimson)', textDecoration: 'none' }}>
          ← ALL ARTICLES
        </Link>

        <header style={{ margin: '2rem 0 3rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span className="c-mono" style={{ color: 'var(--gold)', background: 'var(--ink)', padding: '0.2rem 0.5rem' }}>
              {formatIssue(post.issue)}
            </span>
            <span className="c-mono" style={{ color: 'var(--crimson)' }}>{post.date}</span>
            <span className="c-mono" style={{ opacity: 0.55 }}>{post.readTime}</span>
          </div>
          <h1
            className="c-display"
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
              color: 'var(--ink)',
              textShadow: '4px 4px 0 var(--gold)',
              margin: 0,
            }}
          >
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.25rem' }}>
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="c-mono"
                  style={{
                    border: '1px solid var(--crimson)',
                    color: 'var(--crimson)',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.6rem',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt=""
            style={{
              width: '100%',
              border: '3px solid var(--ink)',
              boxShadow: 'var(--shadow-pop)',
              marginBottom: '2.5rem',
            }}
          />
        )}

        <TableOfContents headings={headings} />

        <div className="blog-prose" ref={proseRef}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
            components={{ pre: CodeBlock, img: BlogImage, h2: HeadingH2, h3: HeadingH3 }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <ShareButtons url={canonicalUrl} title={post.title} />

        {/* Email subscriptions temporarily disabled — see the import
            comment above. Restore this block to bring the form back:
        <div
          className="c-panel"
          style={{ padding: '1.5rem', margin: '0 0 2.5rem', maxWidth: 420 }}
        >
          <SubscribeForm heading="LIKED THIS? GET NEW POSTS BY EMAIL" />
        </div>
        */}

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', paddingTop: '2rem', borderTop: '3px solid var(--ink)' }}>
          <AdjacentPostCard post={older} label="← OLDER ISSUE" align="left" />
          <AdjacentPostCard post={newer} label="NEWER ISSUE →" align="right" />
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <p className="c-mono" style={{ color: 'var(--crimson)', marginBottom: '1rem' }}>
              — RELATED ISSUES —
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1.25rem' }}>
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="c-panel"
                  style={{ padding: '1rem', textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <span className="c-mono" style={{ fontSize: '0.55rem', color: 'var(--crimson)' }}>
                    {formatIssue(p.issue)}
                  </span>
                  <p className="c-heavy" style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>{p.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
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
            ← BACK TO ALL ARTICLES
          </Link>
        </div>
      </article>
    </div>
  );
}
