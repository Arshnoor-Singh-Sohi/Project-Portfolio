// src/components/markdown/MiniMarkdown.jsx
// Small Markdown renderer (GFM + KaTeX) for text that lives inside a
// JSON block, such as the question, hint and answer of a ```check.
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function MiniMarkdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  );
}
