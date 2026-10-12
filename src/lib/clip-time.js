// src/lib/clip-time.js
// Time helpers for ```video blocks. A time is "m:ss", "h:mm:ss" or a
// number of seconds. parseClipTime returns null when the value is empty
// and NaN when it is not a valid time.

export function parseClipTime(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : NaN;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  if (!/^\d+(:\d{1,2}){1,2}(\.\d+)?$/.test(text)) return NaN;
  return text.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

export function formatClipTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
