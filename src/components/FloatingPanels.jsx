// FloatingPanels.jsx — ghost comic panels drifting in the hero background
// Drop inside the Hero <header> as the first child, behind everything else.

import React, { useEffect, useRef } from 'react';

const PANELS = [
  { x: 0.08, y: 0.12, w: 180, h: 120, rot: -14, speed: 0.018, opacity: 0.07, dots: true  },
  { x: 0.75, y: 0.08, w: 130, h: 90,  rot:  10, speed: 0.012, opacity: 0.06, dots: false },
  { x: 0.82, y: 0.55, w: 160, h: 110, rot: -8,  speed: 0.022, opacity: 0.08, dots: true  },
  { x: 0.05, y: 0.65, w: 110, h: 80,  rot:  16, speed: 0.015, opacity: 0.06, dots: false },
  { x: 0.55, y: 0.78, w: 200, h: 130, rot: -5,  speed: 0.010, opacity: 0.05, dots: true  },
  { x: 0.38, y: 0.04, w: 100, h: 70,  rot:  12, speed: 0.020, opacity: 0.07, dots: false },
];

export default function FloatingPanels() {
  const canvasRef = useRef(null);
  const raf       = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Each panel gets its own float offset so they move independently
    const offsets = PANELS.map((_, i) => ({
      y: Math.random() * Math.PI * 2,   // phase offset
      x: Math.random() * Math.PI * 2,
    }));

    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;

      PANELS.forEach((p, i) => {
        const off = offsets[i];
        const floatY = Math.sin(t * p.speed + off.y) * 18;
        const floatX = Math.cos(t * p.speed * 0.7 + off.x) * 10;

        const px = p.x * W + floatX;
        const py = p.y * H + floatY;

        ctx.save();
        ctx.translate(px + p.w / 2, py + p.h / 2);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;

        // Panel fill
        ctx.fillStyle = '#F4E9D4';
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

        // Halftone dots
        if (p.dots) {
          const gap = 9;
          ctx.fillStyle = 'rgba(16,13,18,0.55)';
          for (let row = -p.h / 2; row < p.h / 2; row += gap) {
            for (let col = -p.w / 2; col < p.w / 2; col += gap) {
              ctx.beginPath();
              ctx.arc(col + gap / 2, row + gap / 2, 1.1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Ink border
        ctx.strokeStyle = '#100D12';
        ctx.lineWidth   = 2.5;
        ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);

        // Inner margin line (classic comic panel inset)
        ctx.strokeStyle = 'rgba(16,13,18,0.35)';
        ctx.lineWidth   = 1;
        ctx.strokeRect(-p.w / 2 + 5, -p.h / 2 + 5, p.w - 10, p.h - 10);

        ctx.restore();
      });

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
