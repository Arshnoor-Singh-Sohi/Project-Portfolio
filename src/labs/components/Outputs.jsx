// src/labs/components/Outputs.jsx
// Renders the output items of a code cell. Item types are defined in
// src/lib/labs/schema.js (OUTPUT_TYPES). To add a new kind of output,
// add a renderer to RENDERERS and its normalizer in schema.js.
import React, { memo, useMemo } from 'react';
import { sanitizeHtml } from '../util';

function Stream({ item }) {
  return <pre className={`labs-out-stream${item.name === 'stderr' ? ' is-stderr' : ''}`}>{item.text}</pre>;
}

function Result({ item }) {
  return <pre className="labs-out-result">{item.text}</pre>;
}

function Html({ item }) {
  const clean = useMemo(() => sanitizeHtml(item.html), [item.html]);
  // Safe: sanitizeHtml keeps table and text tags only, with no attributes.
  return <div className="labs-out-html" dangerouslySetInnerHTML={{ __html: clean }} />;
}

function Image({ item }) {
  return (
    <img
      className="labs-out-image"
      src={`data:${item.mime};base64,${item.data}`}
      alt="Figure made by the code in this cell"
      width={item.width || undefined}
      height={item.width && item.height ? item.height : undefined}
      loading="lazy"
    />
  );
}

function ErrorOut({ item }) {
  return (
    <div className="labs-out-error" role="alert">
      <p className="labs-out-error-head">
        <strong>{item.ename}</strong>
        {item.evalue ? `: ${item.evalue}` : ''}
      </p>
      {item.traceback && item.traceback.trim() !== `${item.ename}: ${item.evalue}`.trim() && <pre>{item.traceback}</pre>}
    </div>
  );
}

function Check({ item }) {
  return (
    <div className={`labs-out-check ${item.passed ? 'is-pass' : 'is-fail'}`}>
      <span className="labs-out-check-badge c-mono">{item.passed ? '✓ PASS' : '✗ FAIL'}</span>
      <span className="labs-out-check-name">{item.name}</span>
      {!item.passed && (
        <dl className="labs-out-check-detail">
          <dt>expected</dt>
          <dd>
            <code>{item.expected}</code>
          </dd>
          <dt>actual</dt>
          <dd>
            <code>{item.actual}</code>
          </dd>
          {item.detail && (
            <>
              <dt>note</dt>
              <dd>{item.detail}</dd>
            </>
          )}
        </dl>
      )}
      {item.passed && item.detail && <span className="labs-out-check-note">{item.detail}</span>}
    </div>
  );
}

function Inspect({ item }) {
  return (
    <div className="labs-out-inspect">
      {item.name && <p className="c-mono labs-out-inspect-name">inspect · {item.name}</p>}
      <table>
        <tbody>
          {item.rows.map(([k, v], i) => (
            <tr key={i}>
              <th scope="row">{k}</th>
              <td>
                <pre>{v}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Info({ item }) {
  return <p className="labs-out-info">{item.text}</p>;
}

const RENDERERS = { stream: Stream, result: Result, html: Html, image: Image, error: ErrorOut, check: Check, inspect: Inspect, info: Info };

const Outputs = memo(function Outputs({ outputs, label }) {
  if (!outputs || outputs.length === 0) return null;
  const checks = outputs.filter((o) => o.type === 'check');
  const passed = checks.filter((o) => o.passed).length;
  return (
    <div className="labs-outputs" role="region" aria-label={label}>
      {checks.length > 1 && (
        <p className={`c-mono labs-out-summary ${passed === checks.length ? 'is-pass' : 'is-fail'}`}>
          {passed} OF {checks.length} CHECKS PASS
        </p>
      )}
      {outputs.map((item, i) => {
        const Renderer = RENDERERS[item.type];
        return Renderer ? <Renderer key={i} item={item} /> : null;
      })}
    </div>
  );
});

export default Outputs;
