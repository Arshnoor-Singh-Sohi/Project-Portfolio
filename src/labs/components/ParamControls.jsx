// src/labs/components/ParamControls.jsx
// Controls for the "# @param" lines of a code cell (syntax:
// src/lib/labs/params.js). A change calls onChange(param, value);
// the cell writes the new literal into its code.
import React, { useEffect, useState } from 'react';

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(6)));
}

// Text and number fields keep their own text while you type, and
// report only valid values.
function NumberField({ param, onChange, id }) {
  const [text, setText] = useState(String(param.value));
  useEffect(() => setText(String(param.value)), [param.value]);
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      className="labs-param-number"
      value={text}
      step={param.step || (param.integer ? 1 : 'any')}
      min={param.min}
      max={param.max}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(param, param.integer ? Math.round(n) : n);
      }}
    />
  );
}

function TextField({ param, onChange, id }) {
  const [text, setText] = useState(param.value);
  useEffect(() => setText(param.value), [param.value]);
  return (
    <input
      id={id}
      type="text"
      className="labs-param-text"
      value={text}
      spellCheck={false}
      onChange={(e) => {
        setText(e.target.value);
        onChange(param, e.target.value);
      }}
    />
  );
}

export default function ParamControls({ cellId, params, onChange }) {
  if (!params.length) return null;
  return (
    <div className="labs-params" role="group" aria-label="Parameters of this cell">
      {params.map((p) => {
        const id = `param-${cellId}-${p.name}`;
        return (
          <div key={`${p.line}-${p.name}`} className={`labs-param labs-param-${p.type}`}>
            <label htmlFor={id} className="labs-param-label">
              {p.label}
            </label>
            {p.type === 'slider' && (
              <span className="labs-param-slider">
                <input
                  id={id}
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={p.value}
                  onChange={(e) => onChange(p, Number(e.target.value))}
                />
                <output htmlFor={id} className="c-mono">
                  {formatNumber(p.value)}
                </output>
              </span>
            )}
            {(p.type === 'number' || p.type === 'integer') && <NumberField param={p} onChange={onChange} id={id} />}
            {p.type === 'boolean' && (
              <input id={id} type="checkbox" checked={p.value} onChange={(e) => onChange(p, e.target.checked)} />
            )}
            {p.type === 'string' && <TextField param={p} onChange={onChange} id={id} />}
            {p.type === 'select' && (
              <select
                id={id}
                value={String(p.value)}
                onChange={(e) => onChange(p, p.options.find((o) => String(o) === e.target.value))}
              >
                {!p.options.some((o) => String(o) === String(p.value)) && <option value={String(p.value)}>{String(p.value)}</option>}
                {p.options.map((o) => (
                  <option key={String(o)} value={String(o)}>
                    {String(o)}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
