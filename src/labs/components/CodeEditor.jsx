// src/labs/components/CodeEditor.jsx
// CodeMirror 6 editor for one code cell. The editor owns its text
// while you type and reports every change with onChange. When `value`
// changes from outside (a # @param control, reset, restore), the
// editor takes the new text as one undoable change.
import React, { useEffect, useRef } from 'react';
import { Annotation, EditorState, Compartment, Prec } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  highlightSpecialChars,
  placeholder as placeholderExt,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { tags as t } from '@lezer/highlight';
import { getRuntime } from '../runtimes';

// Marks changes that came from `value`, so they are not echoed back.
const External = Annotation.define();

const theme = EditorView.theme(
  {
    '&': { color: '#F4E9D4', backgroundColor: '#17131B', fontSize: '0.88rem' },
    '.cm-content': { fontFamily: "'IBM Plex Mono', ui-monospace, monospace", caretColor: '#FFC51E', padding: '0.6rem 0' },
    '.cm-scroller': { fontFamily: "'IBM Plex Mono', ui-monospace, monospace", lineHeight: '1.55' },
    '&.cm-focused': { outline: 'none' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#FFC51E', borderLeftWidth: '2px' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(56, 225, 255, 0.28)',
    },
    '.cm-gutters': { backgroundColor: '#17131B', color: 'rgba(244, 233, 212, 0.38)', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#FFC51E' },
    '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
    '.cm-matchingBracket': { backgroundColor: 'rgba(255, 197, 30, 0.25)', outline: 'none' },
    '.cm-selectionMatch': { backgroundColor: 'rgba(255, 197, 30, 0.15)' },
    '.cm-placeholder': { color: 'rgba(244, 233, 212, 0.35)' },
    '.cm-panels': { backgroundColor: '#100D12', color: '#F4E9D4' },
    '.cm-panels input, .cm-panels button': { fontFamily: "'IBM Plex Mono', monospace" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: '#FF8FA3' },
  { tag: [t.string, t.special(t.string)], color: '#B5E48C' },
  { tag: [t.number, t.bool, t.null], color: '#38E1FF' },
  { tag: t.comment, color: 'rgba(244, 233, 212, 0.48)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#FFC51E' },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: '#FFD966' },
  { tag: [t.className, t.typeName], color: '#C77DFF' },
  { tag: [t.self, t.special(t.variableName)], color: '#FF8FA3' },
  { tag: t.operator, color: '#F4E9D4' },
  { tag: t.propertyName, color: '#9AD1FF' },
]);

export default function CodeEditor({ value, onChange, onRun, onRunAdvance, onRunInsert, onFocus, language = 'python', label, autoFocus }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const handlers = useRef({});
  handlers.current = { onChange, onRun, onRunAdvance, onRunInsert, onFocus };
  const langCompartment = useRef(new Compartment());

  useEffect(() => {
    const runKeys = Prec.highest(
      keymap.of([
        { key: 'Shift-Enter', run: () => (handlers.current.onRunAdvance?.(), true) },
        { key: 'Mod-Enter', run: () => (handlers.current.onRun?.(), true) },
        { key: 'Alt-Enter', run: () => (handlers.current.onRunInsert?.(), true) },
      ]),
    );
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          runKeys,
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, indentWithTab]),
          syntaxHighlighting(highlight),
          theme,
          placeholderExt('# Write Python here. Shift+Enter runs the cell.'),
          EditorView.contentAttributes.of({ 'aria-label': label || 'Code' }),
          langCompartment.current.of([]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !update.transactions.some((tr) => tr.annotation(External))) {
              handlers.current.onChange?.(update.state.doc.toString());
            }
            if (update.focusChanged && update.view.hasFocus) handlers.current.onFocus?.();
          }),
        ],
      }),
    });
    viewRef.current = view;
    if (autoFocus) view.focus();
    let cancelled = false;
    getRuntime(language)
      .loadEditorLanguage()
      .then((ext) => {
        if (!cancelled) view.dispatch({ effects: langCompartment.current.reconfigure(ext) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once; `value` changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Take outside changes (controls, reset, restore) without losing the
  // cursor more than needed.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    let from = 0;
    while (from < current.length && from < value.length && current[from] === value[from]) from++;
    let endA = current.length;
    let endB = value.length;
    while (endA > from && endB > from && current[endA - 1] === value[endB - 1]) {
      endA--;
      endB--;
    }
    view.dispatch({ changes: { from, to: endA, insert: value.slice(from, endB) }, annotations: External.of(true) });
  }, [value]);

  return <div ref={hostRef} className="labs-editor" />;
}
