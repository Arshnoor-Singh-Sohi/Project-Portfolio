// src/components/markdown/CheckBlock.jsx
// Renders a ```check fence: { "question", "hint", "answer" }.
// The question shows at once. SHOW HINT and REVEAL ANSWER show the
// other two fields. All three render as Markdown with KaTeX.
import React, { useState } from 'react';
import BlockError from './BlockError';
import { parseJsonBlock } from '../../lib/json-block';
import MiniMarkdown from './MiniMarkdown';

function readSpec(code) {
  const { spec, error } = parseJsonBlock(code);
  if (error) return { error };
  if (typeof spec.question !== 'string' || !spec.question.trim()) return { error: '"question" is required.' };
  if (spec.hint !== undefined && typeof spec.hint !== 'string') return { error: '"hint" must be a string.' };
  if (typeof spec.answer !== 'string' || !spec.answer.trim()) return { error: '"answer" is required.' };
  return { question: spec.question, hint: spec.hint || '', answer: spec.answer };
}

export default function CheckBlock({ code }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const check = readSpec(code);

  if (check.error) return <BlockError what="check" message={check.error} code={code} />;

  return (
    <div className="notes-check">
      <div className="notes-check-question">
        <MiniMarkdown>{check.question}</MiniMarkdown>
      </div>
      <div className="notes-check-actions">
        {check.hint && (
          <button type="button" className="notes-button" aria-expanded={showHint} onClick={() => setShowHint((v) => !v)}>
            {showHint ? 'HIDE HINT' : 'SHOW HINT'}
          </button>
        )}
        <button
          type="button"
          className="notes-button notes-button-strong"
          aria-expanded={showAnswer}
          onClick={() => setShowAnswer((v) => !v)}
        >
          {showAnswer ? 'HIDE ANSWER' : 'REVEAL ANSWER'}
        </button>
      </div>
      {showHint && check.hint && (
        <div className="notes-check-panel notes-check-hint">
          <span className="notes-check-label">HINT</span>
          <MiniMarkdown>{check.hint}</MiniMarkdown>
        </div>
      )}
      {showAnswer && (
        <div className="notes-check-panel notes-check-answer">
          <span className="notes-check-label">ANSWER</span>
          <MiniMarkdown>{check.answer}</MiniMarkdown>
        </div>
      )}
    </div>
  );
}
