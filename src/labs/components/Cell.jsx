// src/labs/components/Cell.jsx
// One cell of the workspace: a Markdown text cell or a code cell with
// its parameter controls, outputs and pinned results.
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import NotesMarkdown from '../../components/markdown/NotesMarkdown';
import { parseParams } from '../../lib/labs/params';
import CodeEditor from './CodeEditor';
import Outputs from './Outputs';
import ParamControls from './ParamControls';
import { IconDown, IconMore, IconPin, IconPlay, IconTrash, IconUp, IconX } from './Icons';
import Menu from './Menu';
import { formatDuration, timeAgo } from '../util';
import { useTicker } from '../hooks';

function RunGutter({ cell, runState, startedAt }) {
  useTicker(250, runState === 'running');
  if (runState === 'running') {
    return (
      <span className="labs-gutter-count is-running" title="Running">
        [*] <span className="labs-gutter-time">{formatDuration(Date.now() - startedAt)}</span>
      </span>
    );
  }
  if (runState === 'queued') return <span className="labs-gutter-count is-queued" title="Waiting to run">[…]</span>;
  const ex = cell.execution;
  if (!ex) return <span className="labs-gutter-count">[ ]</span>;
  return (
    <span className={`labs-gutter-count is-${ex.status}`} title={ex.finishedAt ? `Ran ${timeAgo(ex.finishedAt)}` : undefined}>
      [{ex.count ?? ' '}]
      {Number.isFinite(ex.durationMs) && <span className="labs-gutter-time">{formatDuration(ex.durationMs)}</span>}
    </span>
  );
}

function PinnedResults({ cell, actions }) {
  if (!cell.pins || cell.pins.length === 0) return null;
  return (
    <section className="labs-pins" aria-label="Pinned results for comparison">
      <p className="c-mono labs-pins-title">COMPARE · NOW vs PINNED</p>
      <div className="labs-pins-grid">
        <div className="labs-pin is-now">
          <p className="labs-pin-label">Now</p>
          <Outputs outputs={cell.outputs} label="Current result" />
        </div>
        {cell.pins.map((pin) => (
          <div key={pin.id} className="labs-pin">
            <p className="labs-pin-label">
              <span title={pin.label}>{pin.label}</span>
              <button type="button" className="labs-icon-button" aria-label={`Remove pinned result ${pin.label}`} onClick={() => actions.unpin(cell.id, pin.id)}>
                <IconX size={14} />
              </button>
            </p>
            <Outputs outputs={pin.outputs} label={`Pinned result: ${pin.label}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CodeCell({ cell, index, runState, startedAt, progress, actions, starterDiffers, autoFocus }) {
  const params = useMemo(() => parseParams(cell.source), [cell.source]);
  const label = `Code cell ${index + 1}`;
  const menuItems = [
    { label: 'Run this cell', shortcut: 'Ctrl+Enter', onSelect: () => actions.run(cell.id) },
    { label: 'Run all cells above, then this one', onSelect: () => actions.runUpTo(cell.id) },
    { label: 'Pin the result to compare', disabled: !cell.outputs || cell.outputs.length === 0, onSelect: () => actions.pin(cell.id, params) },
    { label: 'Clear the output', disabled: !cell.outputs || cell.outputs.length === 0, onSelect: () => actions.clearOutputs(cell.id) },
    { label: 'Reset to the starter code', disabled: !starterDiffers, onSelect: () => actions.resetCell(cell.id) },
    { label: 'Change to a text cell', onSelect: () => actions.setType(cell.id, 'markdown') },
    { label: cell.collapsed ? 'Show the code' : 'Hide the code', onSelect: () => actions.toggleCollapsed(cell.id) },
  ];
  return (
    <>
      <div className="labs-cell-head">
        <RunGutter cell={cell} runState={runState} startedAt={startedAt} />
        <span className="c-mono labs-cell-kind">PYTHON</span>
        {runState === 'running' && progress && <span className="labs-cell-progress">{progress}</span>}
        <span className="labs-cell-tools">
          <button type="button" className="labs-icon-button is-run" aria-label={`Run ${label}`} title="Run (Shift+Enter)" onClick={() => actions.run(cell.id)}>
            <IconPlay />
          </button>
          <button type="button" className="labs-icon-button" aria-label={`Pin the result of ${label}`} title="Pin the result to compare" disabled={!cell.outputs || !cell.outputs.length} onClick={() => actions.pin(cell.id, params)}>
            <IconPin />
          </button>
          <CellMoveDelete cell={cell} label={label} actions={actions} />
          <Menu label={`More actions for ${label}`} items={menuItems} icon={<IconMore />} />
        </span>
      </div>
      {params.length > 0 && <ParamControls cellId={cell.id} params={params} onChange={(p, v) => actions.paramChange(cell.id, p, v)} />}
      {cell.collapsed ? (
        <button type="button" className="labs-collapsed" onClick={() => actions.toggleCollapsed(cell.id)}>
          Code hidden ({cell.source.split('\n').length} lines). Show it.
        </button>
      ) : (
        <CodeEditor
          value={cell.source}
          label={label}
          autoFocus={autoFocus}
          onChange={(text) => actions.changeSource(cell.id, text)}
          onRun={() => actions.run(cell.id)}
          onRunAdvance={() => actions.runAdvance(cell.id)}
          onRunInsert={() => actions.runInsert(cell.id)}
          onFocus={() => actions.focus(cell.id)}
        />
      )}
      <Outputs outputs={cell.outputs} label={`Output of ${label}`} />
      <PinnedResults cell={cell} actions={actions} />
    </>
  );
}

function CellMoveDelete({ cell, label, actions }) {
  return (
    <>
      <button type="button" className="labs-icon-button" aria-label={`Move ${label} up`} title="Move up" onClick={() => actions.move(cell.id, -1)}>
        <IconUp />
      </button>
      <button type="button" className="labs-icon-button" aria-label={`Move ${label} down`} title="Move down" onClick={() => actions.move(cell.id, 1)}>
        <IconDown />
      </button>
      <button type="button" className="labs-icon-button is-danger" aria-label={`Delete ${label}`} title="Delete the cell" onClick={() => actions.remove(cell.id)}>
        <IconTrash />
      </button>
    </>
  );
}

function MarkdownCell({ cell, index, actions, starterDiffers, autoFocus }) {
  const [editing, setEditing] = useState(() => autoFocus || !cell.source.trim());
  const areaRef = useRef(null);
  const label = `Text cell ${index + 1}`;

  useEffect(() => {
    const el = areaRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [editing, cell.source]);

  useEffect(() => {
    if (editing && autoFocus && areaRef.current) areaRef.current.focus();
  }, [editing, autoFocus]);

  const finish = (advance) => {
    setEditing(false);
    if (advance) actions.focusNext(cell.id);
  };

  const menuItems = [
    { label: editing ? 'Show the formatted text' : 'Edit the text', onSelect: () => setEditing((v) => !v) },
    { label: 'Reset to the starter text', disabled: !starterDiffers, onSelect: () => actions.resetCell(cell.id) },
    { label: 'Change to a code cell', onSelect: () => actions.setType(cell.id, 'code') },
  ];

  return (
    <>
      <div className="labs-cell-head">
        <span className="c-mono labs-cell-kind">TEXT</span>
        <span className="labs-cell-tools">
          {editing ? (
            <button type="button" className="labs-text-button" onClick={() => finish(false)}>
              Done
            </button>
          ) : (
            <button type="button" className="labs-text-button" onClick={() => setEditing(true)} aria-label={`Edit ${label}`}>
              Edit
            </button>
          )}
          <CellMoveDelete cell={cell} label={label} actions={actions} />
          <Menu label={`More actions for ${label}`} items={menuItems} icon={<IconMore />} />
        </span>
      </div>
      {editing ? (
        <textarea
          ref={areaRef}
          className="labs-md-editor"
          aria-label={label}
          value={cell.source}
          spellCheck
          placeholder="Write notes, instructions or observations. Markdown, $math$ and ```mermaid work."
          onFocus={() => actions.focus(cell.id)}
          onChange={(e) => actions.changeSource(cell.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              finish(e.shiftKey);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              finish(false);
            }
          }}
        />
      ) : (
        <div
          className="blog-prose notes-prose labs-md"
          onDoubleClick={() => setEditing(true)}
          title="Double-click to edit"
        >
          {cell.source.trim() ? <NotesMarkdown content={cell.source} /> : <p className="labs-muted">Empty text cell. Double-click to write.</p>}
        </div>
      )}
    </>
  );
}

const Cell = memo(function Cell(props) {
  const { cell, isActive, runState } = props;
  return (
    <article
      className={`labs-cell labs-cell-${cell.type}${isActive ? ' is-active' : ''}${runState ? ` is-${runState}` : ''}`}
      data-cell-id={cell.id}
      aria-label={`${cell.type === 'code' ? 'Code' : 'Text'} cell ${props.index + 1} of ${props.total}`}
      onPointerDown={() => props.actions.focus(cell.id)}
    >
      {cell.type === 'code' ? <CodeCell {...props} /> : <MarkdownCell {...props} />}
    </article>
  );
});

export function InsertBar({ afterId, actions, always = false }) {
  return (
    <div className={`labs-insert${always ? ' is-always' : ''}`}>
      <button type="button" className="labs-insert-button" onClick={() => actions.insert(afterId, 'code')}>
        + Code
      </button>
      <button type="button" className="labs-insert-button" onClick={() => actions.insert(afterId, 'markdown')}>
        + Text
      </button>
    </div>
  );
}

export default Cell;
