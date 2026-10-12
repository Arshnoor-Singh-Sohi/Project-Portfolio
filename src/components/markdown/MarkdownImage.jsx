// src/components/markdown/MarkdownImage.jsx
// Markdown image renderer. `resolve` maps the path written in the
// markdown to the real URL — /blog passes resolvePostImage (so a
// relative Obsidian attachment like images/foo.png finds its hashed
// build URL). Without a resolver the path is used as written.
import React from 'react';

export default function MarkdownImage({ src, alt, resolve }) {
  const url = resolve ? resolve(src) : src;
  return <img src={url} alt={alt || ''} loading="lazy" />;
}
