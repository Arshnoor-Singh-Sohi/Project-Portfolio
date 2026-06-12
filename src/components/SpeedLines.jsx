// SpeedLines.jsx — manga-style speed lines that fire on fast scroll
// Self-contained canvas overlay. Add <SpeedLines /> to ComicPortfolio page root.
// Nothing renders when scrolling slowly — only kicks in above a velocity threshold.

import { useEffect, useRef } from 'react';

const THRESHOLD   = 18;   // px/frame before lines appear
const LINE_COUNT  = 52;   // max lines in a burst
const FADE_SPEED  = 0.06; // how fast lines fade per frame (0–1)
const COLOR_CYCLE = [     // alternates between bursts for comic energy
  'rgba(224,49,43,',      // crimson
  'rgba(255,197,30,',     // gold
  'rgba(56,225,255,',     // cyan
];

export default function SpeedLines() {
  const canvasRef  = useRef(null);
  const raf        = useRef(null);
  const lastScroll = useRef(window.scrollY);
  const alpha      = useRef(0);       // current opacity of the burst
  const colorIdx   = useRef(0);
  const lines      = useRef([]);      // pre-generated line angles

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Pre-generate randomised line angles once
    const buildLines = () => {
      lines.current = Array.from({ length: LINE_COUNT }, (_, i) => ({
        angle:     (i / LINE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.18,
        width:     0.6 + Math.random() * 1.8,
        lengthMul: 0.45 + Math.random() * 0.55,  // fraction of max radius
        gapMul:    0.12 + Math.random() * 0.18,  // inner gap fraction
      }));
    };
    buildLines();

    const onScroll = () => {
      const current  = window.scrollY;
      const velocity = Math.abs(current - lastScroll.current);
      lastScroll.current = current;

      if (velocity > THRESHOLD) {
        // Map velocity to alpha — clamp at 1
        const boost = Math.min((velocity - THRESHOLD) / 60, 1);
        alpha.current = Math.min(alpha.current + boost * 0.7, 0.92);
        // New burst → regenerate lines + advance colour
        if (alpha.current < 0.2) {
          buildLines();
          colorIdx.current = (colorIdx.current + 1) % COLOR_CYCLE.length;
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (alpha.current > 0.01) {
        const cx      = canvas.width  / 2;
        const cy      = canvas.height / 2;
        const maxR    = Math.sqrt(cx * cx + cy * cy);
        const color   = COLOR_CYCLE[colorIdx.current];

        lines.current.forEach(l => {
          const innerR = maxR * l.gapMul;
          const outerR = maxR * l.lengthMul;

          const x0 = cx + Math.cos(l.angle) * innerR;
          const y0 = cy + Math.sin(l.angle) * innerR;
          const x1 = cx + Math.cos(l.angle) * outerR;
          const y1 = cy + Math.sin(l.angle) * outerR;

          // Soft glow pass
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = `${color}${alpha.current * 0.25})`;
          ctx.lineWidth   = l.width * 5;
          ctx.lineCap     = 'round';
          ctx.stroke();

          // Sharp core line
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = `${color}${alpha.current})`;
          ctx.lineWidth   = l.width;
          ctx.stroke();
        });

        // Tiny centre flash circle
        const flashR = 28 * alpha.current;
        ctx.beginPath();
        ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${alpha.current * 0.18})`;
        ctx.fill();

        // Fade out
        alpha.current = Math.max(0, alpha.current - FADE_SPEED);
      }

      raf.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,           // just below the cursor trail (9999)
        mixBlendMode: 'screen', // blends with page colours like print ink
      }}
    />
  );
}
