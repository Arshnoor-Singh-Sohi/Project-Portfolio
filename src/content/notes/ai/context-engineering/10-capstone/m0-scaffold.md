---
title: "M0: Scaffold"
order: 1
summary: "The repository, the project files and the evaluation set that every later milestone needs: a uv project, CLAUDE.md, INITIAL.md for the ResearchSession, the PRP skills in the current Claude Code format, a hook, pre-commit checks and a 20-case ground truth set."
status: not-started
tags: [capstone, scaffold, claude-md, initial-md, prp, evaluation]
---

## 1. Goal

M0 adds no feature. It builds the frame in which every feature gets built and measured. In production terms, it answers three questions before any code exists:

1. **What does the agent need to know about this project?** CLAUDE.md answers it, so that no session starts from zero (lesson [9.2](/notes/ai/context-engineering/09-production/l2-the-project-files)).
2. **What exactly must the first feature do, including its failures?** INITIAL.md answers it for the `ResearchSession` class.
3. **How will you know that a change made the system better?** The 20-case ground truth set answers it. You write it now, before the system exists, so that the system cannot shape its own test.

The handbook (Session 7, §6.1) asks for CLAUDE.md, INITIAL.md, `create-prp` and `execute-prp` before the capstone starts. This milestone adds the current Claude Code format for the commands, a hook that enforces "fix, don't disable", pre-commit checks and the evaluation set.

## 2. Builds on

- [Lesson 9.2: The project files](/notes/ai/context-engineering/09-production/l2-the-project-files): the six CLAUDE.md sections, the specificity test, INITIAL.md.
- [Lesson 9.3: The PRP workflow](/notes/ai/context-engineering/09-production/l3-the-prp-workflow): the six PRP sections and the review checklist.
- [Lesson 9.4: Validation loops](/notes/ai/context-engineering/09-production/l4-validation-loops): checks in order from cheap to expensive.
- [Lesson 9.5: Commands, skills and hooks](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks): skills, frontmatter, `$ARGUMENTS`, PreToolUse hooks.
- [Lesson 9.6: Evaluation](/notes/ai/context-engineering/09-production/l6-evaluation): the ground truth set, required and forbidden elements.
- [Lesson 5.8: Measure retrieval and answers](/notes/ai/context-engineering/05-retrieval-quality/l8-measure-retrieval): labels for retrieval metrics, abstention cases.

## 3. Spec

### 3.1 Repository layout

The lab repository holds the exercises of Parts 1 to 9. The capstone is a separate uv project inside it, so that the Docker image of M7 contains only the capstone.

```text
context-engineering-lab/
  pyproject.toml              lab project (uv)
  .env.example                every key, no values
  .gitignore
  .pre-commit-config.yaml     one local hook: python capstone/scripts/check.py
  src/  tests/  notebooks/    exercises of Parts 1 to 9
  capstone/
    pyproject.toml            the research assistant (uv), Python 3.12
    CLAUDE.md                 project context, under 200 lines
    INITIAL.md                the current feature spec
    PRPs/
      templates/prp_base.md   the six-section PRP template
      initial/                archived INITIAL files, one per milestone
    .claude/
      settings.json           shared hooks and permissions (in git)
      hooks/block_suppressions.py
      skills/create-prp/SKILL.md
      skills/execute-prp/SKILL.md
    examples/
      module_example.py       one module in the house style
      test_example.py         one test module with the fake LLM client
    src/research_assistant/   empty package now, filled from M1 on
    evals/
      schema.py               the Case model and load_cases()
      gtx.jsonl               the 20 cases
    scripts/
      check.py                level 1 and level 2 checks, in order
      lint_claude_md.py       the linter of lesson 9.2, exercise 2.2
    tests/
    data/                     corpus, index, memory, summaries (not in git)
```

### 3.2 Dependencies and tools

| Item | Requirement |
|---|---|
| Python | 3.12 |
| Package manager | uv. Commit `uv.lock`. Install with `uv sync`. |
| Runtime dependencies now | `pydantic` (v2) only. Later milestones add their own. |
| Dev dependencies | `pytest`, `ruff`, `mypy` |
| Type checking | `mypy --strict` on `src/` |
| Pytest markers | `paid`: the test calls a paid API. Register the marker in `pyproject.toml`, so that a typo fails. |

### 3.3 CLAUDE.md

The file has six sections, in this order: Summary, Architecture, Conventions, Common mistakes, Key files, Commands. Keep it under 200 lines. Lesson 9.2 explains why the handbook's 200 to 400 lines is wrong. Together, the sections answer the handbook's five questions (Session 7, §6.2).

| Section | Required content for this project |
|---|---|
| Summary | Two or three sentences: a research assistant over a local corpus, with citations, a token budget and memory across sessions. |
| Architecture | One line per package: `llm`, `context`, `retrieval`, `tools`, `agent`, `compress`, `memory`, `evals`. The layer rule: only `llm/client.py` imports a provider SDK. `tools/core.py` has no MCP import. `tools/server.py` is a thin adapter. |
| Conventions | Python 3.12, type hints, `mypy --strict`. Neutral message objects everywhere except in the adapters. Token counts only from `llm/tokens.py`. Configuration only from `config.py`. Prices only from `prices.json`. Errors subclass `ResearchAssistantError`. Tests use the fake LLM client. |
| Common mistakes | One line each, with the reason: no timestamps or IDs in the system rules (they break the cache). Never split a tool call from its result. Never estimate tokens as characters divided by 4. Never retry a 400 error. Never store a memory from tool or document text. Never write outside `data/`. |
| Key files | The files to read before a change: `context/builder.py`, `llm/client.py`, `session.py`, the two example files. |
| Commands | `uv sync`, the lint, type and test commands, `python scripts/check.py`, and the commands that later milestones add. |

### 3.4 INITIAL.md for the ResearchSession

Use the five sections of lesson 9.2: FEATURE with numbered specific requirements, EXAMPLES, DOCUMENTATION and OTHER CONSIDERATIONS. The file specifies the whole public interface. M1 builds its skeleton, and M2 to M5 fill it.

The interface that INITIAL.md must state:

```python
class ResearchSession:
    """One research conversation about one topic over a fixed set of documents."""

    def __init__(self, topic: str, document_paths: Sequence[Path], *,
                 settings: Settings, llm: LLMClient, counter: TokenCounter,
                 user_id: str = "local", session_id: str | None = None) -> None:
        """Validate the inputs and load the documents. Make no model call."""
        ...

    def ask(self, question: str) -> Answer:
        """Answer one question with citations. Commit the turn only after success."""
        ...

    def compress(self, *, force: bool = False) -> CompressionReport:
        """Clear used tool results, then compact if utilization >= the trigger."""
        ...

    def save_summary(self, directory: Path) -> Path:
        """Write <session_id>.summary.json atomically. Return its path."""
        ...

    def close(self) -> Path:
        """Save the summary, store the session in memory, return the summary path."""
        ...
```

The handbook's self-check (Session 7, §6.3) names an empty document list and LLM errors. The threshold and the disk write come from the feature list of the same section. Each row gives the behavior that INITIAL.md must require:

| Edge case | Required behavior |
|---|---|
| Empty document list | `__init__` raises `EmptyCorpusError` before any index work or model call. |
| Missing or unsupported paths | `DocumentNotFoundError` names every missing path in one message. Extensions other than `.md` and `.txt` raise `UnsupportedFormatError`. A path outside the corpus root is rejected. |
| LLM errors | Rate limits, server errors and timeouts: at most 3 attempts with exponential backoff and jitter, then `LLMUnavailableError`. A 400 error is never retried. A failed turn is not added to the history. `max_tokens` sets `Answer.truncated`. `refusal` sets `Answer.refused`. |
| Compression threshold | In tokens, never in messages. Utilization is the estimated next input divided by the input allowance. Compress at 0.80, down to at most 0.60. Keep at least the last 4 messages, starting with real user text. Never split a tool pair. |
| Disk-write failure | `save_summary` writes a temporary file in the same folder, then `os.replace`. Any `OSError` raises `SummaryWriteError` and leaves no `.json` and no temporary file. The session stays open, so the user can retry. |

Apply the specificity test of lesson 9.2 to every requirement. "Compress when the context is large" fails it. The row above passes it.

### 3.5 The PRP skills in the current Claude Code format

Commands are now skills (lesson 9.5, Claude Code docs checked on 2026-10-12). Write two skills.

**`.claude/skills/create-prp/SKILL.md`.** Start from the worked example of lesson 9.5, section 4.5. Requirements:

1. Frontmatter: `description`, `argument-hint`, `disable-model-invocation: true`.
2. It stops with a message when the file in `$ARGUMENTS` does not exist.
3. It writes one file `PRPs/<slug>.md` with the six sections of lesson 9.3: Goal, Success Criteria, Context to Assemble, Implementation Blueprint, Validation Checkpoints, Known Risks.
4. It takes every command from the Commands section of CLAUDE.md, and it changes no code.

**`.claude/skills/execute-prp/SKILL.md`.** Requirements:

1. Frontmatter: `description`, `argument-hint: <path to a PRP>`, `disable-model-invocation: true`.
2. It stops when the PRP lacks one of the six sections.
3. It reads every file in Context to Assemble before the first edit.
4. It follows the Implementation Order exactly, and it runs level 1 after each step.
5. After the last step, it runs level 2, then level 3, with the commands of the PRP.
6. On a failure, it fixes the cause. It never adds a suppression, and it never skips, deletes or weakens a test.
7. After 3 failed attempts on the same check, or when it finds a design flaw, it stops and proposes a PRP change.
8. Its final report lists each command that it ran and the result.

**The hook.** Copy `block_suppressions.py` from exercise 5.3 of lesson 9.5, in its fixed version that scans only the new text. Register it in `.claude/settings.json` as a PreToolUse hook on `Edit|Write`. The PRP template `PRPs/templates/prp_base.md` holds the six section headings with one line of guidance each.

### 3.6 The ground truth set

Each line of `evals/gtx.jsonl` is one case. The schema:

```python
class Evidence(BaseModel):
    doc_id: str        # the document path in the corpus, without the extension
    quote: str         # an exact substring of the cleaned document text

class Case(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str                           # pattern [a-z0-9-]{3,40}, unique
    question: str
    answerable: bool
    required_facts: list[list[str]]   # groups of regex alternatives: every group must match
    forbidden_claims: list[str]       # regexes: none may match
    relevant_doc_ids: list[str]
    evidence: list[Evidence]          # chunk-independent retrieval labels
    reference_answer: str
    tags: list[str]
    critical: bool = False

def load_cases(path: Path, *, corpus_root: Path) -> list[Case]:
    """Validate every line. Ids are unique, every regex compiles, every doc_id exists,
    every quote occurs in its document. Answerable cases have at least one evidence
    item. Unanswerable cases have none."""
    ...
```

One case, a trap built from a corrected handbook claim:

```json
{
  "id": "trap-004",
  "question": "What cache hit rate did Shopify report for its just-in-time instructions?",
  "answerable": true,
  "required_facts": [["none of these numbers", "no (such )?(number|figure|rate)", "does not (report|give|state)"]],
  "forbidden_claims": ["shopify (reported|measured|achieved|saw) (a |an )?95"],
  "relevant_doc_ids": ["09-production/l9-seven-anti-patterns"],
  "evidence": [{"doc_id": "09-production/l9-seven-anti-patterns", "quote": "Shopify's post contains none of these numbers"}],
  "reference_answer": "Shopify's post gives no cache hit rate. The 95% figure is the handbook's illustration.",
  "tags": ["trap", "handbook-claim", "single-doc", "paraphrase"],
  "critical": true
}
```

Why evidence quotes and not chunk IDs: chunk IDs change when the chunker changes. A quote stays valid, and M2 counts a chunk as relevant when its text span overlaps the quote (lesson [4.5](/notes/ai/context-engineering/04-write-and-rag/l5-chunking), section 4.7).

The case mix of the 20 cases. Tags can overlap.

| Tag | At least | Purpose |
|---|---|---|
| `single-doc` | 12 | One document holds the answer. |
| `multi-doc` | 3 | The answer needs evidence from two or more documents. |
| `calculation` | 2 | A number that the model must compute from the corpus |
| unanswerable (`answerable: false`) | 3 | The corpus does not answer it. The correct answer says so (lesson 5.8, abstention tests). |
| `trap` | 4 | A handbook claim that the notes correct |
| `keyword` and `paraphrase` | 5 each | Exact identifiers against reworded questions, for the split of lesson 5.2 |
| `critical: true` | 5 | A regression on one of these blocks a merge in M6. |

Write each question in your own words. A question copied from a note sentence makes retrieval look better than it is.

### 3.7 Pre-commit checks and environment files

`scripts/check.py` runs these commands inside `capstone/`, in this order, and stops at the first failure:

1. `uv run ruff check .` and `uv run ruff format --check .`
2. `uv run mypy src`
3. `uv run python scripts/lint_claude_md.py CLAUDE.md`
4. `uv run python -m evals.schema evals/gtx.jsonl`
5. `uv run pytest -q -m "not paid"`

The pre-commit hook at the lab root calls this script, so the same checks run on every commit.

| File | Requirement |
|---|---|
| `.env.example` | Every key that `config.py` reads, with an empty value and a comment line above it. No real value. |
| `.gitignore` | `.env`, `CLAUDE.local.md`, `.claude/settings.local.json`, `capstone/data/`, `.venv/`, caches of pytest, mypy and ruff |

## 4. Acceptance tests

1. **Fresh clone.** On a clean clone, `uv sync` and `python capstone/scripts/check.py` pass with the empty package and the two example files.
2. **Commit gate.** A commit that adds a type error to `src/` fails in the pre-commit hook, with the mypy message.
3. **CLAUDE.md.** It has fewer than 200 lines and the six `##` sections in order. `lint_claude_md.py` reports 0 issues: no generic phrases, no missing paths, no secret patterns.
4. **INITIAL.md.** It states the interface of section 3.4 and all five rows of its edge-case table. Give it to a fresh Claude Code session and ask for every open question. Rewrite until the list is empty. Record the number of rounds.
5. **create-prp.** `/create-prp missing.md` stops and creates no file. `/create-prp INITIAL.md` creates exactly one file in `PRPs/`, and `git status` shows no other change. The PRP checker of lesson 9.3, exercise 3.2, reports no problem.
6. **execute-prp.** Give the skill a toy PRP whose blueprint causes one type error. The skill fixes the error without `# type: ignore`. Its report lists the commands that it ran.
7. **Hook.** `tests/test_hooks.py` pipes three payloads into the hook. An edit that adds `# type: ignore` exits with 2. A clean edit exits with 0. An edit that removes a suppression exits with 0.
8. **Ground truth set.** `load_cases` accepts all 20 cases, and the case mix of section 3.6 holds. For every case, each required group matches the reference answer and no forbidden pattern matches it. This self-test catches a broken regex before it can fail a correct answer.
9. **Secrets.** `git check-ignore .env` prints the path. `git ls-files` lists no `.env`, no `CLAUDE.local.md` and no `settings.local.json`.

## 5. Measurements to record

Record these in `notebooks/capstone-m0.ipynb`:

- **Artifact table.** One row per artifact (CLAUDE.md, INITIAL.md, each skill, the hook, the 20 cases). Columns: minutes spent, lines, tokens with `o200k_base` as an estimate, review rounds, open questions in each round.
- **Case-mix table.** One row per tag. Columns: target count, actual count, number of critical cases.
- **PRP review log.** One row per problem that you found in the first generated PRP. Columns: PRP section, problem, checklist item of lesson 9.3 that caught it, fix.

The minutes per artifact give the first data point for a rule of thumb of lesson 9.3. It says that INITIAL.md takes 15 to 30 minutes and saves hours. Measure it again in every milestone.

## 6. Production review

This works. Would you deploy it?

| Concern | Check before you continue | Evidence to show |
|---|---|---|
| Cost | CLAUDE.md loads in every session. Each line must change what the agent does. | Token count of CLAUDE.md, and the lines that you deleted |
| Reliability | Rules that must hold are enforced by the hook and by `check.py`, not only stated in CLAUDE.md. | The hook tests and a blocked commit |
| Security | No key in any tracked file. The evaluation set contains no confidential work data. | `git ls-files` output, a secret scan of the history |
| Observability | Every decision has a written place: the PRP for the plan, the commit for the change. | The first PRP and its review log |
| Evaluation | The 20 cases exist before the system. The traps and the unanswerable cases are in the set. | The case-mix table |

## 7. Stretch goals

1. Add the read-only `prp-reviewer` subagent of lesson 9.5, section 4.10. Run it on every PRP before your own review, and count the problems that it finds and that you miss.
2. Add the Stop hook of exercise 5.4 of lesson 9.5, so that Claude cannot end a turn while `check.py` fails.
3. Move the security rules of `tools/` into a path-scoped rules file in `.claude/rules/`. Measure how many lines CLAUDE.md loses.
4. Ask a colleague to label the 20 reference answers as correct or not. Compute Cohen's kappa between you and the colleague (lesson 9.6).

## 8. Check questions

```check
{
  "question": "A trap case asks about Shopify's cache hit rate. A correct answer says: \"The handbook claims 95%, but Shopify's post gives no number.\" Why is the forbidden pattern \"shopify (reported|measured|achieved|saw) (a |an )?95\" and not \"95%\"?",
  "hint": "Lesson 9.6, section 4.3: what must a forbidden element be?",
  "answer": "A forbidden element must be a specific wrong claim, not a bare value. The pattern 95% also matches the correct answer, because a good answer can quote the wrong claim to correct it. The longer pattern matches only the false assertion that Shopify measured 95%. If a correct answer could still match, tag the case for the judge."
}
```

```check
{
  "question": "Why does check.py run ruff and mypy before pytest, and why does the pre-commit hook exclude tests with the marker paid?",
  "answer": "The order follows lesson 9.4: cheap checks first. Lint and type errors appear in seconds and often explain a test failure, so running them first saves time. Tests marked paid call a real API. They cost money on every commit, they need secrets, and their results vary from run to run. They run only in a separate, deliberate job (M6)."
}
```

```check
{
  "question": "INITIAL.md could say \"handle an empty document list gracefully\". Why does the spec require EmptyCorpusError at construction instead?",
  "answer": "\"Gracefully\" fails the specificity test of lesson 9.2. An agent could read it as: allow an empty session, log a warning, return an empty answer, or crash later in the retriever. Each reading gives different code and different tests. A named exception at a named point is one behavior that a test can check. It also fails before any index work or model call, so it costs nothing."
}
```

## 9. Links

- Overview: [Capstone overview](/notes/ai/context-engineering/10-capstone/capstone-overview)
- Next: [M1: Context builder](/notes/ai/context-engineering/10-capstone/m1-context-builder)
- [Lesson 9.2: The project files](/notes/ai/context-engineering/09-production/l2-the-project-files)
- [Lesson 9.3: The PRP workflow](/notes/ai/context-engineering/09-production/l3-the-prp-workflow)
- [Lesson 9.5: Commands, skills and hooks](/notes/ai/context-engineering/09-production/l5-commands-skills-and-hooks)
- [Lesson 9.6: Evaluation](/notes/ai/context-engineering/09-production/l6-evaluation)
- [Glossary](/notes/ai/context-engineering/glossary)
