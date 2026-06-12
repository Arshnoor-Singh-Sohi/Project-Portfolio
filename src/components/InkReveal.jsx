// InkReveal.jsx — ink bleed scroll reveal
// Wraps any element. When it enters the viewport, an ink blot
// expands from a random corner and reveals the content beneath.
//
// Usage:
//   import InkReveal from '../components/InkReveal';
//   <InkReveal><YourComponent /></InkReveal>

import React, { useRef, useState, useEffect } from 'react';

// Four corner origins (% based so they work at any size)
const CORNERS = [
  { cx: '0%',   cy: '0%'   },  // top-left
  { cx: '100%', cy: '0%'   },  // top-right
  { cx: '0%',   cy: '100%' },  // bottom-left
  { cx: '100%', cy: '100%' },  // bottom-right
];

// Pick a random corner that changes per element
function randomCorner() {
  return CORNERS[Math.floor(Math.random() * CORNERS.length)];
}

export default function InkReveal({ children, delay = 0 }) {
  const ref      = useRef(null);
  const [phase, setPhase] = useState('hidden'); // hidden | bleeding | done
  const corner   = useRef(randomCorner());

  useEffect(() => {
    // Respect reduced motion — skip straight to visible
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && phase === 'hidden') {
          setTimeout(() => setPhase('bleeding'), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [phase, delay]);

  // After animation ends mark as done (removes the clip entirely)
  const onAnimEnd = () => setPhase('done');

  const { cx, cy } = corner.current;

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Content — always rendered, clipped until blot covers it */}
      <div
        style={{
          opacity:    phase === 'hidden' ? 0 : 1,
          transition: phase === 'bleeding' ? 'opacity 0.05s' : 'none',
        }}
      >
        {children}
      </div>

      {/* Ink blot overlay — starts covering everything, shrinks away */}
      {phase !== 'done' && (
        <div
          onAnimationEnd={onAnimEnd}
          style={{
            position:  'absolute',
            inset:     0,
            background: 'var(--ink)',
            // The blot is a radial clip that expands from the chosen corner
            // We animate clipPath from a tiny circle to a huge one
            clipPath:  phase === 'hidden'
              ? `circle(0% at ${cx} ${cy})`
              : `circle(150% at ${cx} ${cy})`,
            transition: phase === 'bleeding'
              ? `clip-path 0.75s cubic-bezier(0.22, 1, 0.36, 1)`
              : 'none',
            zIndex: 2,
            // Rough ink edge via SVG filter
            filter: 'url(#ink-rough)',
          }}
        />
      )}

      {/* SVG filter for rough ink edge — defined once, reused everywhere */}
      {phase === 'bleeding' && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="ink-rough" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.04"
                numOctaves="4"
                seed="8"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="18"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
    </div>
  );
}
