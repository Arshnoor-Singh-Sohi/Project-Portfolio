// ============================================================
// ComicPortfolio.jsx — "DATA STORM #001"
// Drop-in page. Works alongside existing App.jsx setup.
// Fonts + design tokens: src/styles/comic.css
// Content: src/data/comicData.js
// ============================================================
import React, { useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ISSUES, PROJECTS, VAULTS, CONTACT } from '../data/comicData';
import { getAllPosts, formatIssue } from '../lib/posts';
import '../styles/comic.css';
import CursorTrail from '../components/CursorTrail';

/* ----------------------------------------------------------
   Scroll-reveal — panels "slam" into view from below.
   ---------------------------------------------------------- */
const slam = {
  initial:     { opacity: 0, y: 55, scale: 0.97 },
  whileInView: { opacity: 1, y: 0,  scale: 1    },
  viewport:    { once: true, amount: 0.2         },
  transition:  { type: 'spring', stiffness: 240, damping: 20 },
};

/* ----------------------------------------------------------
   Reusable: section header
   ---------------------------------------------------------- */
const SectionHeader = ({ kicker, title, dark }) => (
  <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
    <p className="c-mono" style={{ color: dark ? 'var(--gold)' : 'var(--crimson)', marginBottom: '0.5rem' }}>
      — {kicker} —
    </p>
    <h2
      className="c-display"
      style={{
        fontSize: 'clamp(2.8rem, 8vw, 5rem)',
        color: dark ? 'var(--cream)' : 'var(--ink)',
        textShadow: dark ? '5px 5px 0 var(--crimson)' : '5px 5px 0 var(--gold)',
        WebkitTextStroke: 0,
        margin: 0,
      }}
    >
      {title}
    </h2>
  </div>
);

/* ============================================================
   1. HERO — comic book cover with mouse-parallax tilt
   ============================================================ */
const Hero = () => {
  const prefersReduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 130, damping: 16 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 130, damping: 16 });
  const bx  = useSpring(useTransform(mx, [-0.5, 0.5], [20, -20]), { stiffness: 80, damping: 18 });
  const by  = useSpring(useTransform(my, [-0.5, 0.5], [15, -15]), { stiffness: 80, damping: 18 });

  const onMove = useCallback((e) => {
    if (prefersReduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  }, [mx, my, prefersReduced]);
  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  const scrollDown = () => document.getElementById('origin')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <header
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1rem',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Halftone dots */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(244,233,212,0.4) 1px, transparent 1.6px)',
        backgroundSize: '11px 11px',
      }} />

      {/* Sunburst (parallax) */}
      <motion.div aria-hidden style={{
        position: 'absolute',
        width: '140vmin', height: '140vmin',
        borderRadius: '50%',
        background: 'repeating-conic-gradient(var(--crimson) 0deg 9deg, transparent 9deg 18deg)',
        opacity: 0.15,
        x: bx, y: by,
      }} />

      {/* Cover card */}
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
        className="c-panel halftone"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div style={{
          maxWidth: 720, width: '100%',
          padding: 'clamp(1.5rem, 5vw, 3rem)',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="c-caption">DATA STORM #001</span>
            <span className="c-caption" style={{ background: 'var(--paper)' }}>FIRST ISSUE · 2026</span>
          </div>

          <p className="c-mono" style={{ color: 'var(--crimson)', marginBottom: '0.5rem' }}>THE INCREDIBLE</p>

          <h1
            className="c-display"
            style={{
              fontSize: 'clamp(2.8rem, 10vw, 6rem)',
              color: 'var(--gold)',
              margin: '0 0 0.3rem',
            }}
          >
            {CONTACT.name.split(' ').slice(0, 2).join(' ')}
            <span style={{ display: 'block', color: 'var(--crimson)' }}>
              {CONTACT.name.split(' ').slice(2).join(' ')}
            </span>
          </h1>

          <p className="c-heavy" style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.25rem)', margin: '1rem 0 0.5rem' }}>
            {CONTACT.title}
          </p>
          <p className="c-mono" style={{ opacity: 0.65, marginBottom: '2rem', lineHeight: 1.8 }}>
            LLM PIPELINES · MCP GATEWAYS · HALLUCINATION VALIDATORS · MULTI-AGENT SYSTEMS
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={scrollDown}
              className="c-cta"
              style={{
                background: 'var(--crimson)',
                color: 'var(--paper)',
                borderColor: 'var(--ink)',
                borderWidth: 3,
                fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                padding: '1rem 2rem',
                boxShadow: 'var(--shadow-pop)',
              }}
            >
              ENTER THE ARCHIVE ⚡
            </button>
            <a
              href="https://arshnoor-projects.vercel.app/#projects"
              target="_blank"
              rel="noopener noreferrer"
              className="c-cta"
              style={{
                background: 'var(--gold)',
                color: 'var(--ink)',
                borderColor: 'var(--ink)',
                borderWidth: 3,
                fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                padding: '1rem 2rem',
                boxShadow: 'var(--shadow-pop)',
                textDecoration: 'none',
              }}
            >
              VIEW ALL PROJECTS →
            </a>
          </div>

          {/* Corner blurb */}
          <div
            className="c-caption"
            style={{
              position: 'absolute', top: '-1rem', right: '-1rem',
              background: 'var(--cyan)', transform: 'rotate(6deg)',
              display: 'none', /* shown via media query below */
            }}
            id="hero-corner-blurb"
          >
            13 PLANTS. ONE GATEWAY.
          </div>
        </div>
      </motion.div>

      {/* Arrow */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: 'absolute', bottom: '2rem', left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--gold)', fontSize: '2rem', cursor: 'pointer',
        }}
        onClick={scrollDown}
        aria-label="Scroll down"
      >
        ↓
      </motion.div>
    </header>
  );
};

/* ============================================================
   2. SCHEMATIC SVG — animated blueprint for cards + timeline
   ============================================================ */
const Schematic = ({ nodes, edges, height = 220 }) => {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height, display: 'block', background: 'var(--blueprint)' }}
      role="img" aria-label="System architecture schematic"
    >
      <defs>
        <pattern id="bpg" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M6 0H0V6" fill="none" stroke="rgba(56,225,255,0.15)" strokeWidth="0.25"/>
        </pattern>
      </defs>
      <rect width="100" height="60" fill="url(#bpg)"/>

      {edges.map(([a, b], i) => {
        const n1 = byId[a], n2 = byId[b];
        if (!n1 || !n2) return null;
        return (
          <line key={i}
            x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
            stroke="var(--cyan)" strokeWidth="0.7"
            className="c-flow-line"
          />
        );
      })}

      {nodes.map(n => (
        <g key={n.id} className="c-node-pulse">
          <rect x={n.x-9} y={n.y-4.5} width="18" height="9" rx="1"
            fill="var(--ink-blue)" stroke="var(--cyan)" strokeWidth="0.6"/>
          <text x={n.x} y={n.y+1.3} textAnchor="middle" fontSize="2.5"
            fill="var(--cream)"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ============================================================
   3. ORIGIN TIMELINE
   ============================================================ */
const CommandCenter = ({ item }) => (
  <motion.div {...slam}
    className="c-panel"
    style={{ background: 'var(--blueprint)', padding: 0, overflow: 'hidden' }}
  >
    {/* Header */}
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1.25rem',
      borderBottom: '3px solid var(--ink)',
      background: 'var(--gold)',
    }}>
      <span className="c-caption" style={{ background: 'var(--crimson)', color: 'var(--paper)' }}>
        {item.issue} · CURRENT ARC
      </span>
      <span className="c-mono" style={{ fontSize: '0.65rem' }}>{item.period}</span>
    </div>

    <div style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', color: 'var(--cream)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h3 className="c-display" style={{
            fontSize: 'clamp(2rem, 7vw, 3.5rem)',
            color: 'var(--cyan)', textShadow: '4px 4px 0 var(--ink)', margin: 0,
          }}>{item.title}</h3>
          <p className="c-heavy" style={{ color: 'var(--gold)', marginTop: '0.4rem', fontSize: '0.95rem' }}>{item.org}</p>
        </div>
        <span className="c-stamp" style={{ fontSize: '0.85rem' }}>IN PRODUCTION</span>
      </div>

      <p style={{ maxWidth: 680, fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', opacity: 0.9 }}>{item.body}</p>

      {/* System consoles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {item.consoles.map(c => (
          <div key={c.code} style={{ border: '2px solid var(--cyan)', padding: '0.75rem', background: 'rgba(56,225,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span className="c-mono" style={{ color: 'var(--cyan)', fontSize: '0.6rem' }}>{c.code}</span>
              <span className="c-mono" style={{
                color: c.status === 'IN PRODUCTION' ? 'var(--gold)' : 'var(--cream)',
                fontSize: '0.6rem'
              }}>● {c.status}</span>
            </div>
            <p className="c-heavy" style={{ fontSize: '0.9rem', margin: '0 0 0.25rem' }}>{c.name}</p>
            <p style={{ fontSize: '0.72rem', opacity: 0.75, margin: 0, fontFamily: 'var(--font-body)' }}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Platform schematic */}
      <div style={{ border: '2px solid var(--cyan)', marginBottom: '1.25rem' }}>
        <Schematic height={180} nodes={[
          { id:'fac', x:10, y:30, label:'Factory Data' },
          { id:'dbx', x:34, y:30, label:'Databricks'   },
          { id:'mcp', x:60, y:12, label:'MCP Gateway'  },
          { id:'llm', x:60, y:48, label:'LLM Agents'   },
          { id:'ppl', x:88, y:30, label:'Plant Teams'  },
        ]} edges={[['fac','dbx'],['dbx','mcp'],['dbx','llm'],['mcp','ppl'],['llm','ppl']]}/>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {item.tags.map(t => (
          <span key={t} className="c-mono" style={{
            border: '1px solid var(--cyan)', color: 'var(--cyan)',
            padding: '0.2rem 0.5rem', fontSize: '0.6rem',
          }}>{t}</span>
        ))}
      </div>
    </div>
  </motion.div>
);

const OriginTimeline = () => (
  <section id="origin" className="c-section" style={{ maxWidth: 860, margin: '0 auto' }}>
    <SectionHeader kicker="THE LEGEND TIMELINE" title="Origin Story"/>

    <div style={{ position: 'relative' }}>
      {/* Spine */}
      <div aria-hidden style={{
        position: 'absolute', left: 8, top: 0, bottom: 0,
        width: 3, background: 'var(--ink)',
      }}/>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingLeft: 36 }}>
        {ISSUES.map((item, i) =>
          item.commandCenter
            ? <div key={item.issue}><CommandCenter item={item}/></div>
            : (
              <motion.article key={item.issue} {...slam} className="c-panel c-taped" style={{ padding: '1.25rem 1.5rem' }}>
                {/* Spine dot */}
                <span aria-hidden style={{
                  position: 'absolute', left: -43, top: 24,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--gold)', border: '3px solid var(--ink)',
                  display: 'block',
                }}/>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="c-caption">{item.issue}</span>
                  <span className="c-mono" style={{ opacity: 0.65, fontSize: '0.62rem' }}>{item.period}</span>
                </div>

                <h3 className="c-display" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', color: 'var(--crimson)', margin: '0 0 0.25rem' }}>
                  {item.title}
                </h3>
                <p className="c-heavy" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>{item.org}</p>

                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.72rem',
                  fontStyle: 'italic', border: '2px solid var(--ink)',
                  borderRadius: '1rem', padding: '0.4rem 0.75rem',
                  display: 'inline-block', background: 'var(--cream)', marginBottom: '0.75rem',
                }}>"{item.bubble}"</p>

                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>{item.body}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {item.tags.map(t => (
                    <span key={t} className="c-mono" style={{
                      border: '2px solid var(--ink)', background: 'var(--gold)',
                      padding: '0.2rem 0.5rem', fontSize: '0.6rem',
                    }}>{t}</span>
                  ))}
                </div>
              </motion.article>
            )
        )}
      </div>
    </div>
  </section>
);

/* ============================================================
   4. PROJECT PANES — flip cards with schematic backs
   ============================================================ */
const accentMap = {
  crimson: { bg: 'var(--crimson)', fg: 'var(--paper)' },
  gold:    { bg: 'var(--gold)',    fg: 'var(--ink)'   },
  blue:    { bg: 'var(--ink-blue)',fg: 'var(--paper)' },
};

const ProjectCard = ({ p }) => {
  const [flipped, setFlipped] = useState(false);
  const ac = accentMap[p.accent] || accentMap.crimson;

  return (
    <motion.div {...slam} className="c-flip-scene" style={{ height: 430 }}>
      <div className={`c-flip-inner${flipped ? ' is-flipped' : ''}`}>

        {/* FRONT */}
        <div className="c-flip-face c-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span className="c-caption" style={{ background: ac.bg, color: ac.fg }}>{p.code}</span>
          </div>

          <h3 className="c-display" style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            color: 'var(--ink)', textShadow: '3px 3px 0 var(--gold)',
            WebkitTextStroke: 0, margin: '0 0 0.25rem',
          }}>{p.name}</h3>

          <p className="c-heavy" style={{ color: 'var(--crimson)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{p.tagline}</p>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, flexGrow: 1 }}>{p.story}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.75rem 0' }}>
            {p.badges.map(b => (
              <span key={b} className="c-mono" style={{
                border: '2px solid var(--ink)', background: 'var(--cream)',
                padding: '0.15rem 0.45rem', fontSize: '0.58rem',
              }}>{b}</span>
            ))}
          </div>

          <button
            onClick={() => setFlipped(true)}
            className="c-heavy"
            style={{
              background: 'var(--ink-blue)', color: 'var(--cyan)',
              border: '3px solid var(--ink)', padding: '0.75rem',
              boxShadow: '4px 4px 0 var(--ink)', cursor: 'pointer',
              fontSize: '0.8rem', letterSpacing: '0.05em',
              minHeight: 48, transition: 'transform 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translate(-2px,-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = ''}
          >
            REVEAL SCHEMATIC ▸
          </button>
        </div>

        {/* BACK */}
        <div className="c-flip-face c-flip-back c-panel"
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--blueprint)', padding: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.6rem 1rem', borderBottom: '3px solid var(--ink)', background: 'var(--gold)',
          }}>
            <span className="c-heavy" style={{ fontSize: '0.72rem' }}>{p.name} — SCHEMATIC</span>
            <span className="c-mono" style={{ fontSize: '0.58rem' }}>FIG. {p.code.slice(-2)}</span>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Schematic nodes={p.schematic.nodes} edges={p.schematic.edges} height={300}/>
          </div>

          <button
            onClick={() => setFlipped(false)}
            className="c-heavy"
            style={{
              background: 'var(--crimson)', color: 'var(--paper)',
              border: 'none', borderTop: '3px solid var(--ink)',
              padding: '0.75rem', cursor: 'pointer',
              fontSize: '0.8rem', letterSpacing: '0.05em', minHeight: 48,
            }}
          >◂ BACK TO CASE FILE</button>
        </div>
      </div>
    </motion.div>
  );
};

const ProjectPanes = () => (
  <section id="projects" className="c-section" style={{ background: 'var(--ink)', maxWidth: 'none' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader kicker="THE ROGUE GALLERY" title="Case Files" dark/>
      <p className="c-mono" style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '2.5rem', opacity: 0.7, color: 'var(--cream)' }}>
        TAP A PANEL TO REVEAL ITS SCHEMATIC
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: '2rem',
      }}>
        {PROJECTS.map(p => <ProjectCard key={p.id} p={p}/>)}
      </div>
    </div>
  </section>
);

/* ============================================================
   5. TECHNICAL ARSENAL
   ============================================================ */
const TechArsenal = () => (
  <section id="arsenal" className="c-section" style={{ maxWidth: 1000, margin: '0 auto' }}>
    <SectionHeader kicker="THE ARMORY" title="Technical Arsenal"/>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: '2rem' }}>
      {VAULTS.map((v, i) => (
        <motion.div key={v.vault} {...slam} className="c-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span className="c-caption" style={{
              background: i % 2 ? 'var(--crimson)' : 'var(--gold)',
              color: i % 2 ? 'var(--paper)' : 'var(--ink)',
            }}>{v.vault}</span>
            <h3 className="c-heavy" style={{ margin: 0, fontSize: '1rem' }}>{v.name}</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {v.skills.map(s => <span key={s} tabIndex={0} className="c-badge">{s}</span>)}
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);


/* ============================================================
   6. BLOG — comic newspaper clippings grid
   To add more articles: push to the ARTICLES array below.
   ============================================================ */
const BlogSection = () => {
  const navigate = useNavigate();
  // Pulls the 3 newest posts from src/content/blog/*.md — the full
  // archive lives at /blog. Add a new .md file there to publish.
  const posts = getAllPosts().slice(0, 3);

  return (
    <section id="blog" className="c-section" style={{ maxWidth: 'none', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader kicker="THE PRESS ROOM" title="Latest Articles"/>

        {posts.length === 0 ? (
          <p className="c-mono" style={{ textAlign: 'center', opacity: 0.6 }}>
            FIRST ISSUE DROPPING SOON — CHECK BACK
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '2rem',
            marginTop: '1rem',
          }}>
            {posts.map((post) => (
              <motion.article
                key={post.slug} {...slam}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="c-panel"
                style={{ padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                whileHover={{ y: -6 }}
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderBottom: '3px solid var(--ink)', display: 'block' }}
                  />
                )}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <span className="c-mono" style={{ fontSize: '0.6rem', color: 'var(--crimson)' }}>{formatIssue(post.issue)}</span>
                    <span className="c-mono" style={{ fontSize: '0.6rem', opacity: 0.55 }}>{post.readTime}</span>
                  </div>
                  <h3 className="c-heavy" style={{ fontSize: '1.05rem', marginBottom: '0.6rem', lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.7, flexGrow: 1, opacity: 0.8 }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                    <span className="c-heavy" style={{ fontSize: '0.78rem', color: 'var(--crimson)' }}>READ MORE</span>
                    <span style={{ color: 'var(--crimson)', fontSize: '1rem' }}>→</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link
            to="/blog"
            className="c-cta c-heavy"
            style={{
              background: 'var(--ink)', color: 'var(--gold)',
              border: '3px solid var(--ink)', padding: '0.9rem 2rem',
              boxShadow: 'var(--shadow-pop)', fontSize: '0.9rem',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            ALL ARTICLES →
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   7. CERTIFICATIONS — badge wall
   To add more certs: push to the CERTS array below.
   ============================================================ */
const CERTS = [
  { name: 'Advanced Java Development',  issuer: 'Oracle',                date: 'Dec 2023',    url: 'https://drive.google.com/file/d/1MM0BTzOPKK7tGCrweh-HjKYbqQzEjM6y/view?usp=sharing' },
  { name: 'Full Stack Web Development', issuer: 'Venus Multi Media',     date: 'Dec 2023',    url: 'https://drive.google.com/file/d/13D39rT6HaxW4JSRWNXxFmDPxW-zwbwgy/view' },
  { name: 'Machine Learning',           issuer: 'Venus Multi Media',     date: 'Aug 2022',    url: 'https://drive.google.com/file/d/1Yogi1FAutSs4jrDVZJO6vLfGheECsrnL/view?usp=sharing' },
  { name: 'Cybersecurity Workshop',     issuer: 'EC-Council',            date: '2025',        url: 'https://drive.google.com/file/d/1YOpDV58gkoxA_MW5JyWYKjy3RJzFuhA1/view?usp=sharing' },
  { name: 'NLP & LLM Workshop — 1st Place', issuer: 'Univ. of Windsor', date: 'Winter 2025', url: 'https://drive.google.com/file/d/1XSF_JgHjDvNGtM-t8V6a0GuBmMG0Ml01/view' },
];

const CertsSection = () => (
  <section id="certifications" className="c-section" style={{ maxWidth: 'none', background: 'var(--ink)' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeader kicker="THE HALL OF RECORDS" title="Certifications" dark/>
      {/* auto-fill grid: add certs to CERTS array, layout handles itself */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        gap: '1.5rem',
        marginTop: '1rem',
      }}>
        {CERTS.map((c, i) => (
          <motion.div
            key={i} {...slam}
            onClick={() => window.open(c.url, '_blank', 'noopener,noreferrer')}
            className="c-panel-sm"
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              background: 'var(--paper)',
              border: '3px solid var(--gold)',
              boxShadow: '5px 5px 0 var(--gold)',
            }}
            whileHover={{ y: -5, boxShadow: '7px 7px 0 var(--crimson)', transition: { duration: 0.15 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <span className="c-caption" style={{
                background: i % 2 === 0 ? 'var(--crimson)' : 'var(--ink-blue)',
                color: 'var(--paper)', fontSize: '0.58rem',
              }}>CERT #{String(i + 1).padStart(2, '0')}</span>
              <span className="c-mono" style={{ fontSize: '0.58rem', opacity: 0.65 }}>{c.date}</span>
            </div>
            <h3 className="c-heavy" style={{ fontSize: '0.95rem', marginBottom: '0.3rem', lineHeight: 1.3 }}>{c.name}</h3>
            <p className="c-mono" style={{ fontSize: '0.62rem', opacity: 0.7, marginBottom: '0.75rem' }}>{c.issuer}</p>
            <span className="c-mono" style={{ fontSize: '0.6rem', color: 'var(--crimson)' }}>VIEW CERTIFICATE ↗</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ============================================================
   8. FOOTER
   ============================================================ */
const Footer = () => (
  <footer style={{
    background: 'var(--ink)', borderTop: '3px solid var(--ink)',
    padding: '4rem 1rem', textAlign: 'center',
  }}>
    <p className="c-mono" style={{ color: 'var(--gold)', marginBottom: '0.75rem' }}>NEXT ISSUE</p>
    <h2 className="c-display" style={{
      fontSize: 'clamp(2rem, 8vw, 4rem)',
      color: 'var(--cream)', textShadow: '4px 4px 0 var(--crimson)',
      marginBottom: '2rem',
    }}>Let's Build It Together</h2>

    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
      {[
        { href: `mailto:${CONTACT.email}`, label: `✉ ${CONTACT.email}`, bg: 'var(--gold)', fg: 'var(--ink)', shadow: 'var(--crimson)' },
        { href: CONTACT.github,   label: 'GITHUB',   bg: 'transparent', fg: 'var(--cream)', shadow: 'var(--crimson)' },
        { href: CONTACT.linkedin, label: 'LINKEDIN', bg: 'transparent', fg: 'var(--cream)', shadow: 'var(--cyan)'    },
      ].map(l => (
        <a key={l.href} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="c-heavy c-cta"
          style={{
            background: l.bg, color: l.fg,
            border: '3px solid var(--cream)',
            boxShadow: `5px 5px 0 ${l.shadow}`,
            padding: '1rem 1.75rem',
            fontSize: 'clamp(0.8rem, 2vw, 1rem)',
            minHeight: 48, textDecoration: 'none',
          }}
        >{l.label}</a>
      ))}
    </div>

    <p className="c-mono" style={{ marginTop: '3rem', opacity: 0.4, fontSize: '0.6rem', color: 'var(--cream)' }}>
      © {new Date().getFullYear()} {CONTACT.name} · DATA STORM #001 · PRINTED ON IMAGINARY NEWSPRINT
    </p>
  </footer>
);

/* ============================================================
   PAGE ROOT
   ============================================================ */
export default function ComicPortfolio() {
  return (
    <div className="comic-root">
      {/* Grid-paper overlay (explicit div, avoids ::before issues) */}
      <div className="comic-grid-overlay" aria-hidden/>
      <CursorTrail/>
      <Hero/>
      <OriginTimeline/>
      <ProjectPanes/>
      <BlogSection/>
      <CertsSection/>
      <TechArsenal/>
      <Footer/>
    </div>
  );
}