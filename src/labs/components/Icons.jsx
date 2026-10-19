// src/labs/components/Icons.jsx
// Small inline icons (24 px grid, stroke = currentColor).
import React from 'react';

function Svg({ children, size = 16, title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export const IconPlay = (p) => <Svg {...p}><path d="M7 4v16l13-8z" fill="currentColor" stroke="none" /></Svg>;
export const IconPlayAll = (p) => <Svg {...p}><path d="M4 5v14l8-7z" fill="currentColor" stroke="none" /><path d="M12 5v14l8-7z" fill="currentColor" stroke="none" /></Svg>;
export const IconStop = (p) => <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" /></Svg>;
export const IconRestart = (p) => <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></Svg>;
export const IconUp = (p) => <Svg {...p}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></Svg>;
export const IconDown = (p) => <Svg {...p}><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></Svg>;
export const IconTrash = (p) => <Svg {...p}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></Svg>;
export const IconPin = (p) => <Svg {...p}><path d="M9 4h6l-1 6 4 4H6l4-4z" /><path d="M12 14v6" /></Svg>;
export const IconPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconMore = (p) => <Svg {...p}><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></Svg>;
export const IconHistory = (p) => <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></Svg>;
export const IconBack = (p) => <Svg {...p}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></Svg>;
export const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
export const IconX = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconEdit = (p) => <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Svg>;
export const IconFlask = (p) => <Svg {...p}><path d="M9 3h6" /><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7 15h10" /></Svg>;
export const IconEraser = (p) => <Svg {...p}><path d="M16 3l5 5-11 11H5l-2-2z" /><path d="M11 8l5 5" /><path d="M5 21h16" /></Svg>;
