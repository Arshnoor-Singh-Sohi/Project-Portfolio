// src/components/MermaidDiagram.jsx
// Renders a ```mermaid code block as an actual diagram (flowchart,
// sequence diagram, etc.) instead of raw text — the same behavior
// Notion and Obsidian give you in preview mode. The mermaid library
// itself is fairly large, so it's dynamically imported here and only
// ever loads on a post that actually has a mermaid block.
import React, { useEffect, useRef, useState } from 'react';

let mermaidDiagramCounter = 0;
function useDiagramId() {
  const idRef = useRef(null);
  if (idRef.current === null) {
    mermaidDiagramCounter += 1;
    idRef.current = `mermaid-diagram-${mermaidDiagramCounter}`;
  }
  return idRef.current;
}

// Matches the comic theme's ink/cream/gold/crimson/cyan palette so
// diagrams look like part of the site rather than a generic embed.
const MERMAID_THEME_VARIABLES = {
  background: '#FBF4E4',
  primaryColor: '#F4E9D4',
  primaryTextColor: '#100D12',
  primaryBorderColor: '#100D12',
  secondaryColor: '#FFC51E',
  secondaryTextColor: '#100D12',
  secondaryBorderColor: '#100D12',
  tertiaryColor: '#FBF4E4',
  lineColor: '#100D12',
  textColor: '#100D12',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: '14px',
};

export default function MermaidDiagram({ code }) {
  const id = useDiagramId();
  const containerRef = useRef(null);
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: MERMAID_THEME_VARIABLES,
        securityLevel: 'strict',
      });

      mermaid
        .render(id, code)
        .then(({ svg: renderedSvg, bindFunctions }) => {
          if (cancelled) return;
          setSvg(renderedSvg);
          setError(null);
          // Only relevant for diagrams with click/interaction bindings;
          // harmless no-op for plain flowcharts/sequence diagrams.
          if (bindFunctions && containerRef.current) {
            bindFunctions(containerRef.current);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err && err.message ? err.message : 'Could not render this diagram.');
        });
    });

    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="mermaid-error">
        <p style={{ margin: '0 0 0.75rem' }}>
          Couldn't render this diagram — check the mermaid syntax. ({error})
        </p>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return <div className="mermaid-loading">Rendering diagram…</div>;
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram"
      // eslint-disable-next-line react/no-danger -- mermaid's own SVG output, not user/network HTML
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
