// src/components/FunctionPlot.jsx
// Renders a ```plot code block as an actual function graph (trig
// curves, parabolas, derivatives, etc.) via the `function-plot`
// library (D3 under the hood). The code block's content is a small
// JSON spec matching function-plot's own options object (minus
// `target`, which this component supplies) — see BLOG_GUIDE.md for
// the full syntax and examples. Dynamically imported, same as
// MermaidDiagram, so it only loads on a post that actually uses it.
import React, { useEffect, useRef, useState } from 'react';

// Cycled onto data series that don't specify their own `color`, so a
// plot with several functions doesn't default to function-plot's own
// (theme-mismatched) palette.
const DEFAULT_COLORS = ['#C81D25', '#1E6091', '#B8860B', '#100D12', '#6A4C93'];

let plotCounter = 0;
function usePlotId() {
  const idRef = useRef(null);
  if (idRef.current === null) {
    plotCounter += 1;
    idRef.current = `function-plot-${plotCounter}`;
  }
  return idRef.current;
}

export default function FunctionPlot({ code }) {
  const id = usePlotId();
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  let spec = null;
  let parseError = null;
  try {
    spec = JSON.parse(code);
  } catch (err) {
    parseError = err && err.message ? err.message : 'Invalid JSON.';
  }

  useEffect(() => {
    if (parseError || !spec) {
      setError(parseError || 'Invalid plot spec.');
      return;
    }

    let cancelled = false;
    let plotInstance = null;
    let resizeObserver = null;

    import('function-plot').then(({ default: functionPlot }) => {
      if (cancelled || !containerRef.current) return;

      const draw = () => {
        if (!containerRef.current) return;
        const width = Math.max(containerRef.current.clientWidth, 280);
        containerRef.current.innerHTML = '';
        try {
          plotInstance = functionPlot({
            target: containerRef.current,
            width,
            height: spec.height || 320,
            grid: spec.grid !== undefined ? spec.grid : true,
            // `title` is intentionally NOT passed to function-plot here.
            // function-plot draws it as a single fixed-size SVG <text>
            // element with no line-wrapping, so anything longer than a
            // couple of words clips off the edge of the chart at normal
            // post widths. We render it as a normal HTML caption above
            // the graph instead (see the JSX below) — that wraps exactly
            // like any other text on the page, at any screen width.
            xAxis: spec.xAxis,
            yAxis: spec.yAxis,
            disableZoom: spec.disableZoom,
            annotations: spec.annotations,
            data: (spec.data || []).map((datum, i) => ({
              color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
              ...datum,
            })),
          });
          if (!cancelled) {
            setError(null);
            setReady(true);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err && err.message ? err.message : 'Could not render this graph.');
          }
        }
      };

      draw();

      // function-plot's SVG has a fixed pixel width — redraw on
      // container resize so it stays legible on narrow screens instead
      // of overflowing or getting clipped.
      resizeObserver = new ResizeObserver(() => draw());
      if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
    });

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the source code block text changes
  }, [code]);

  if (error) {
    return (
      <div className="plot-error">
        <p style={{ margin: '0 0 0.75rem' }}>Couldn't render this graph — check the spec. ({error})</p>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="function-plot-diagram" style={{ minHeight: ready ? undefined : 100 }}>
      {spec && spec.title && <p className="function-plot-title">{spec.title}</p>}
      {!ready && <div className="plot-loading">Rendering graph…</div>}
      <div id={id} ref={containerRef} />
    </div>
  );
}
