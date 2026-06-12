// IronManScroll.jsx
// Scroll down → figure tilts head-down (rotate +25deg, pivot center)
// Scroll up   → figure tilts head-up   (rotate -25deg)
// Stopped     → straightens back to 0

import React, { useEffect, useRef, useState } from 'react';

export default function IronManScroll() {
  const [scrollPct,  setScrollPct]  = useState(0);
  const [tilt,       setTilt]       = useState(0);
  const [flameScale, setFlameScale] = useState(1);

  const lastScrollY  = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const stopTimer    = useRef(null);
  const frameRef     = useRef(null);
  const flameT       = useRef(0);
  const movingRef    = useRef(false);
  const directionRef = useRef(0); // +1 down, -1 up

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const total   = document.body.scrollHeight - window.innerHeight;
      const pct     = total > 0 ? current / total : 0;
      const delta   = current - lastScrollY.current;

      setScrollPct(pct);
      lastScrollY.current = current;

      if (Math.abs(delta) > 1) {
        const dir = delta > 0 ? 1 : -1;
        directionRef.current = dir;
        movingRef.current    = true;
        // down = head tips forward = positive rotation
        // up   = head tips back    = negative rotation
        setTilt(dir * 25);
      }

      clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => {
        movingRef.current = false;
        setTilt(0);
      }, 180);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const animFlame = () => {
      flameT.current += movingRef.current ? 0.22 : 0.06;
      setFlameScale(1 + Math.sin(flameT.current) * (movingRef.current ? 0.35 : 0.1));
      frameRef.current = requestAnimationFrame(animFlame);
    };
    frameRef.current = requestAnimationFrame(animFlame);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(stopTimer.current);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const TOP_PAD    = 40;
  const BOTTOM_PAD = 100;
  const travel     = window.innerHeight - TOP_PAD - BOTTOM_PAD;
  const topPx      = TOP_PAD + scrollPct * travel;

  return (
    <div
      aria-hidden
      style={{
        position:      'fixed',
        right:         '1rem',
        top:           topPx,
        zIndex:        9990,
        pointerEvents: 'none',
        width:         52,
        // Rotate around the CENTER of the figure so head goes forward/back
        transformOrigin: '26px 230px',
        transform:     `rotate(${tilt}deg)`,
        transition:    'top 0.1s linear, transform 0.38s cubic-bezier(0.34,1.4,0.64,1)',
      }}
    >
      <svg viewBox="0 0 180 460" width="52" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="im-reactor" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#38E1FF" stopOpacity="1"/>
            <stop offset="100%" stopColor="#38E1FF" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="im-thruster" cx="50%" cy="0%" r="100%">
            <stop offset="0%"   stopColor="#FFC51E" stopOpacity="1"/>
            <stop offset="50%"  stopColor="#E0312B" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#E0312B" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* HELMET */}
        <rect x="30" y="0"   width="120" height="88" rx="18" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1.5"/>
        <rect x="36" y="42"  width="108" height="50" rx="8"  fill="#12275E" stroke="#38E1FF" strokeWidth="1"/>
        <rect x="44" y="46"  width="36"  height="10" rx="5"  fill="#38E1FF" opacity="0.9"/>
        <rect x="100" y="46" width="36"  height="10" rx="5"  fill="#38E1FF" opacity="0.9"/>
        <rect x="54" y="66"  width="72"  height="18" rx="4"  fill="#1E3A8A" stroke="#38E1FF" strokeWidth="0.8"/>
        <rect x="36" y="44"  width="12"  height="38" rx="3"  fill="#12275E" stroke="#38E1FF" strokeWidth="0.5"/>
        <rect x="132" y="44" width="12"  height="38" rx="3"  fill="#12275E" stroke="#38E1FF" strokeWidth="0.5"/>

        {/* NECK */}
        <rect x="62" y="88" width="56" height="18" rx="4" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1"/>

        {/* CHEST */}
        <rect x="14"  y="106" width="152" height="126" rx="10" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1.5"/>
        <rect x="46"  y="114" width="88"  height="110" rx="6"  fill="#12275E" stroke="#38E1FF" strokeWidth="0.8"/>
        <rect x="14"  y="114" width="30"  height="58"  rx="4"  fill="#12275E" stroke="#38E1FF" strokeWidth="0.6"/>
        <rect x="136" y="114" width="30"  height="58"  rx="4"  fill="#12275E" stroke="#38E1FF" strokeWidth="0.6"/>
        <circle cx="90" cy="148" r="20" fill="url(#im-reactor)" stroke="#38E1FF" strokeWidth="1.5"/>
        <circle cx="90" cy="148" r="5"  fill="#38E1FF" opacity="0.95"/>
        <rect x="56" y="192" width="68" height="34" rx="4" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="0.8"/>
        <line x1="90" y1="192" x2="90"  y2="226" stroke="#38E1FF" strokeWidth="0.5" opacity="0.5"/>
        <line x1="56" y1="209" x2="124" y2="209" stroke="#38E1FF" strokeWidth="0.5" opacity="0.5"/>

        {/* SHOULDERS */}
        <rect x="-24" y="102" width="44" height="34" rx="10" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1.2"/>
        <rect x="160" y="102" width="44" height="34" rx="10" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1.2"/>

        {/* ARMS */}
        <rect x="-18" y="134" width="30" height="70" rx="8" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1"/>
        <rect x="-14" y="210" width="26" height="64" rx="6" fill="#12275E" stroke="#38E1FF" strokeWidth="1"/>
        <rect x="-16" y="272" width="30" height="24" rx="6" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1"/>
        <circle cx="-1" cy="284" r="6" fill="#38E1FF" opacity="0.5"/>
        <circle cx="-1" cy="284" r="3" fill="#38E1FF"/>

        <rect x="168" y="134" width="30" height="70" rx="8" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1"/>
        <rect x="168" y="210" width="26" height="64" rx="6" fill="#12275E" stroke="#38E1FF" strokeWidth="1"/>
        <rect x="166" y="272" width="30" height="24" rx="6" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1"/>
        <circle cx="181" cy="284" r="6" fill="#38E1FF" opacity="0.5"/>
        <circle cx="181" cy="284" r="3" fill="#38E1FF"/>

        {/* WAIST */}
        <rect x="28" y="230" width="124" height="30" rx="6" fill="#12275E" stroke="#38E1FF" strokeWidth="1"/>

        {/* LEGS */}
        <rect x="22"  y="258" width="52" height="78" rx="8" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1.2"/>
        <rect x="106" y="258" width="52" height="78" rx="8" fill="#1E3A8A" stroke="#38E1FF" strokeWidth="1.2"/>
        <rect x="26"  y="334" width="44" height="74" rx="6" fill="#12275E" stroke="#38E1FF" strokeWidth="1"/>
        <rect x="110" y="334" width="44" height="74" rx="6" fill="#12275E" stroke="#38E1FF" strokeWidth="1"/>

        {/* BOOTS */}
        <rect x="20"  y="406" width="56" height="28" rx="6" fill="#1E3A8A" stroke="#FFC51E" strokeWidth="1.5"/>
        <rect x="104" y="406" width="56" height="28" rx="6" fill="#1E3A8A" stroke="#FFC51E" strokeWidth="1.5"/>

        {/* FLAMES */}
        <g transform={`translate(48,438) scale(1,${flameScale})`}>
          <ellipse cx="0" cy="0" rx="13" ry="20" fill="url(#im-thruster)" opacity="0.9"/>
          <ellipse cx="0" cy="-4" rx="7"  ry="11" fill="#FFC51E" opacity="0.85"/>
          <ellipse cx="0" cy="-8" rx="3"  ry="5"  fill="#fff"    opacity="0.7"/>
        </g>
        <g transform={`translate(132,438) scale(1,${flameScale})`}>
          <ellipse cx="0" cy="0" rx="13" ry="20" fill="url(#im-thruster)" opacity="0.9"/>
          <ellipse cx="0" cy="-4" rx="7"  ry="11" fill="#FFC51E" opacity="0.85"/>
          <ellipse cx="0" cy="-8" rx="3"  ry="5"  fill="#fff"    opacity="0.7"/>
        </g>
      </svg>
    </div>
  );
}
