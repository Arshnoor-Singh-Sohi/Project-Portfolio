// src/components/markdown/NotesMarkdown.jsx
// Markdown renderer for /notes pages. Same base as the blog (GFM,
// KaTeX, highlight.js, mermaid, plot, heading anchors) plus the
// study blocks: ```video, ```check and Obsidian-style callouts.
// GFM task lists render as disabled (read-only) checkboxes.
import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { createHeadingIdAssigner } from '../../lib/markdown-utils';
import remarkCallouts from '../../lib/remark-callouts';
import CodeBlock from './CodeBlock';
import MarkdownImage from './MarkdownImage';
import Callout from './Callout';
import VideoBlock from './VideoBlock';
import CheckBlock from './CheckBlock';
import { makeHeadingRenderer } from './headings';

const NOTES_BLOCKS = {
  video: { label: 'VIDEO CLIP', Component: VideoBlock },
  check: { label: 'CHECK YOURSELF', Component: CheckBlock },
};

function NotesCodeBlock(props) {
  return <CodeBlock {...props} blocks={NOTES_BLOCKS} />;
}

// Site-internal links ("/notes/...") navigate inside the app instead
// of reloading the page. Media files (/notes/media/...) and external
// links stay plain anchors.
function NotesLink({ href, children }) {
  if (href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/notes/media/')) {
    return <Link to={href}>{children}</Link>;
  }
  const external = href && /^https?:\/\//.test(href);
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

export default function NotesMarkdown({ content }) {
  // Fresh assigner every render so heading ids match extractHeadings().
  const idAssigner = createHeadingIdAssigner();
  const components = {
    pre: NotesCodeBlock,
    img: MarkdownImage,
    a: NotesLink,
    blockquote: Callout,
    h2: makeHeadingRenderer('h2', idAssigner),
    h3: makeHeadingRenderer('h3', idAssigner),
  };
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkCallouts]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
