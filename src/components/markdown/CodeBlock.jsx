// src/components/markdown/CodeBlock.jsx
// Overrides the default <pre> so every fenced code block gets a
// header showing the language plus a "copy" button. Handles multiple
// languages per post automatically — the label comes from whatever
// the fence was tagged with (```python, ```js, ```bash, etc.).
//
// ```mermaid and ```plot blocks are special cases: instead of showing
// the raw text, the body renders as an actual diagram/graph (like
// Notion/Obsidian's preview mode) via MermaidDiagram or FunctionPlot —
// the header and copy button stay exactly the same either way, copying
// the source (mermaid syntax / plot spec) rather than an image.
//
// `blocks` (optional) adds more special fences without touching the
// blog: a map of language tag -> { label, Component }. Component gets
// the raw fence text as `code`. /blog passes nothing, so blog posts
// render exactly as before; /notes passes ```video and ```check.
import React, { useState } from 'react';
import { copyToClipboard } from '../../lib/clipboard';
import { getTextContent } from '../../lib/markdown-utils';
import MermaidDiagram from '../MermaidDiagram';
import FunctionPlot from '../FunctionPlot';

// Friendly display names for the language badge on code blocks.
// Falls back to the raw (uppercased) language tag if not listed here.
const LANGUAGE_LABELS = {
  js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX',
  py: 'Python', python: 'Python', sh: 'Shell', bash: 'Bash', shell: 'Shell',
  json: 'JSON', css: 'CSS', html: 'HTML', xml: 'XML', sql: 'SQL',
  yaml: 'YAML', yml: 'YAML', md: 'Markdown', java: 'Java', go: 'Go',
  rust: 'Rust', c: 'C', cpp: 'C++', csharp: 'C#', php: 'PHP',
  ruby: 'Ruby', kotlin: 'Kotlin', swift: 'Swift', docker: 'Dockerfile',
  txt: 'Text', text: 'Text', plaintext: 'Text',
};

export default function CodeBlock({ children, blocks }) {
  const [copied, setCopied] = useState(false);
  const codeElement = Array.isArray(children) ? children[0] : children;
  const className = (codeElement && codeElement.props && codeElement.props.className) || '';
  const match = /language-(\w+)/.exec(className);
  const langKey = match ? match[1].toLowerCase() : null;
  const isMermaid = langKey === 'mermaid';
  const isPlot = langKey === 'plot';
  const extra = blocks && langKey && Object.prototype.hasOwnProperty.call(blocks, langKey) ? blocks[langKey] : null;
  const label = isMermaid
    ? 'MERMAID DIAGRAM'
    : isPlot
    ? 'FUNCTION GRAPH'
    : extra
    ? extra.label
    : langKey
    ? (LANGUAGE_LABELS[langKey] || langKey.toUpperCase())
    : 'TEXT';
  const codeText = getTextContent(children);

  const handleCopy = () => {
    copyToClipboard(codeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const ExtraComponent = extra ? extra.Component : null;

  return (
    <div className={isMermaid || isPlot || extra ? 'code-block mermaid-block' : 'code-block'}>
      <div className="code-block-header">
        <span className="code-block-lang">{label}</span>
        <button type="button" className="code-block-copy" onClick={handleCopy}>
          {copied ? 'COPIED ✓' : 'COPY'}
        </button>
      </div>
      {isMermaid ? (
        <MermaidDiagram code={codeText} />
      ) : isPlot ? (
        <FunctionPlot code={codeText} />
      ) : ExtraComponent ? (
        <ExtraComponent code={codeText} />
      ) : (
        <pre>{children}</pre>
      )}
    </div>
  );
}
