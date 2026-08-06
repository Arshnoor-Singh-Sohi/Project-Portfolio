// src/lib/clipboard.js
// Shared copy-to-clipboard helper (used by the code-block copy button
// and the "copy link" share button), with a fallback for browsers/
// contexts where navigator.clipboard isn't available.

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (e) {
    // no-op — clipboard just won't work in this environment
  }
  document.body.removeChild(textarea);
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  fallbackCopy(text);
  return Promise.resolve();
}
