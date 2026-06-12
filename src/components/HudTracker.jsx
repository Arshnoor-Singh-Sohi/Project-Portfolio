// HudTracker.jsx — Iron Man JARVIS-style section tracker
// Fixed bottom-right overlay. Shows current section + scroll progress.
// Read-only — touches nothing in the existing layout.

import React, { useEffect, useState, useRef } from 'react';

const SECTIONS = [
  { id: 'home',            label: 'COVER'        },
  { id: 'origin',          label: 'ORIGIN'       },
  { id: 'projects',        label: 'CASE FILES'   },
  { id: 'blog',            label: 'PRESS ROOM'   },
  { id: 'certifications',  label: 'RECORDS'      },
  { id: 'arsenal',         label: 'ARMORY'       },
];

// Blinking scan line animation — pure CSS string injected once
const STYLE = `
@keyframes hud-scan {
  0%   { transform: translateY(-100%); opacity: 0.4; }
  100% { transform: translateY(100%);  opacity: 0;   }
}
@keyframes hud-blink {
  0%, 100% { opacity: 1;   }
  50%       { opacity: 0.4; }
}
@keyframes hud-appear {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.hud-root {
  animation: hud-appear 0.6s ease forwards;
}
.hud-blink { animation: hud-blink 2s ease infinite; }
`;

export default function HudTracker() {
  const [active,   setActive]   = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    // Inject keyframes once
    const tag = document.createElement('style');
    tag.textContent = STYLE;
    document.head.appendChild(tag);

    // Show HUD after user scrolls a little
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total    = document.body.scrollHeight - window.innerHeight;
      const pct      = total > 0 ? Math.round((scrolled / total) * 100) : 0;

      setProgress(pct);
      setVisible(scrolled > 80);

      // Find active section
      let current = 0;
      SECTIONS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5) current = i;
      });
      setActive(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on mount

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const sec = SECTIONS[active];

  return (
    <div
      className="hud-root"
      style={{
        position:   'fixed',
        bottom:     '1.5rem',
        right:      '1.25rem',
        zIndex:     9997,
        width:      172,
        fontFamily: 'var(--font-mono)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Outer frame */}
      <div style={{
        border:     '2px solid var(--cyan)',
        background: 'rgba(16,13,18,0.82)',
        backdropFilter: 'blur(6px)',
        boxShadow:  '0 0 18px rgba(56,225,255,0.25), inset 0 0 12px rgba(56,225,255,0.06)',
        padding:    '0.6rem 0.75rem',
        position:   'relative',
        overflow:   'hidden',
      }}>

        {/* Scan line */}
        <div style={{
          position:   'absolute',
          left: 0, right: 0,
          height:     2,
          background: 'linear-gradient(90deg, transparent, rgba(56,225,255,0.5), transparent)',
          animation:  'hud-scan 2.4s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Top label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--cyan)', letterSpacing: '0.12em' }}>
            SYS.NAV
          </span>
          <span className="hud-blink" style={{ fontSize: '0.55rem', color: 'var(--gold)', letterSpacing: '0.1em' }}>
            ● ACTIVE
          </span>
        </div>

        {/* Current section name */}
        <div style={{
          fontSize:      '0.95rem',
          fontWeight:    600,
          color:         'var(--cream)',
          letterSpacing: '0.08em',
          marginBottom:  '0.5rem',
          textShadow:    '0 0 8px rgba(56,225,255,0.6)',
        }}>
          {sec.label}
        </div>

        {/* Section dots */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.55rem' }}>
          {SECTIONS.map((s, i) => (
            <div key={s.id} style={{
              width:        i === active ? 14 : 6,
              height:       4,
              background:   i === active ? 'var(--cyan)' : 'rgba(56,225,255,0.25)',
              boxShadow:    i === active ? '0 0 6px var(--cyan)' : 'none',
              transition:   'width 0.3s ease, background 0.3s ease',
            }} />
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '0.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.5rem', color: 'rgba(56,225,255,0.6)', letterSpacing: '0.1em' }}>
              SCROLL
            </span>
            <span style={{ fontSize: '0.5rem', color: 'var(--gold)', letterSpacing: '0.08em' }}>
              {String(progress).padStart(3, '0')}%
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(56,225,255,0.15)', position: 'relative' }}>
            <div style={{
              position:   'absolute',
              left: 0, top: 0, bottom: 0,
              width:      `${progress}%`,
              background: 'var(--cyan)',
              boxShadow:  '0 0 6px var(--cyan)',
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>

        {/* Corner brackets */}
        {[
          { top: 0, left: 0,  borderTop: '1px solid var(--gold)', borderLeft:  '1px solid var(--gold)', width: 8, height: 8 },
          { top: 0, right: 0, borderTop: '1px solid var(--gold)', borderRight: '1px solid var(--gold)', width: 8, height: 8 },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', ...s }} />
        ))}
      </div>

      {/* Bottom bracket */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '0.2rem 0.1rem 0',
      }}>
        <div style={{ width: 8, height: 8, borderBottom: '1px solid var(--gold)', borderLeft:  '1px solid var(--gold)' }} />
        <span style={{ fontSize: '0.45rem', color: 'rgba(56,225,255,0.4)', letterSpacing: '0.12em', alignSelf: 'center' }}>
          DATA·STORM·001
        </span>
        <div style={{ width: 8, height: 8, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)' }} />
      </div>
    </div>
  );
}
