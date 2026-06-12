// CursorTrail.jsx — glowing circuit-board cursor trail
// Self-contained. Add <CursorTrail /> anywhere in ComicPortfolio's page root.
// Desktop only — auto-hides on touch devices.

import React, { useEffect, useRef } from 'react';

const TRAIL_LENGTH = 28;   // number of trail segments kept
const DOT_LIFETIME = 520;  // ms before a segment fully fades
const SEGMENT_GAP  = 10;   // px — min distance before adding a new point

// Snap movement to 45-degree angles (circuit board routing feel)
function snapAngle(dx, dy) {
  const angle = Math.atan2(dy, dx);
  const snap  = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const dist  = Math.sqrt(dx * dx + dy * dy);
  return { sx: Math.cos(snap) * dist, sy: Math.sin(snap) * dist };
}

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const points    = useRef([]);
  const raf       = useRef(null);
  const lastPt    = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      const cx = e.clientX, cy = e.clientY;
      const dx = cx - lastPt.current.x;
      const dy = cy - lastPt.current.y;
      if (Math.sqrt(dx*dx + dy*dy) < SEGMENT_GAP) return;

      const { sx, sy } = snapAngle(dx, dy);
      const nx = lastPt.current.x + sx;
      const ny = lastPt.current.y + sy;

      points.current.push({ x: nx, y: ny, t: performance.now() });
      if (points.current.length > TRAIL_LENGTH) points.current.shift();
      lastPt.current = { x: nx, y: ny };
    };

    window.addEventListener('mousemove', onMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();
      points.current = points.current.filter(p => now - p.t < DOT_LIFETIME);

      const pts = points.current;

      // Draw connecting lines
      for (let i = 1; i < pts.length; i++) {
        const p0   = pts[i - 1];
        const p1   = pts[i];
        const life = 1 - (now - p1.t) / DOT_LIFETIME;

        // Outer glow
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(56,225,255,${life * 0.22})`;
        ctx.lineWidth   = 7;
        ctx.lineCap     = 'round';
        ctx.stroke();

        // Core trace
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(56,225,255,${life * 0.9})`;
        ctx.lineWidth   = 1.6;
        ctx.stroke();
      }

      // Solder-joint dots every 4th point
      pts.forEach((p, i) => {
        if (i % 4 !== 0) return;
        const life = 1 - (now - p.t) / DOT_LIFETIME;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,225,255,${life * 0.18})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,197,30,${life})`;   // gold node
        ctx.fill();
      });

      raf.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
}
