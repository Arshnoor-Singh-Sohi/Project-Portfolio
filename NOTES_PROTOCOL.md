# Notes protocol

This file is for Claude. It tells Claude how to teach a subject and how to keep the study notes.

- Read this file at the start of every study session.
- Read `NOTES_GUIDE.md` for the exact file format. If `NOTES_GUIDE.md` is missing, use section 9 of this file.
- Subject-specific rules (color legend, conventions, source folders) live in `src/content/notes/<subject>/_folder.md`.

## 1. Purpose

The learner studies one subject at a time with Claude in chat. Claude teaches. Claude also writes and maintains all notes. The learner does not edit notes by hand.

The notes have two jobs:

1. **Revision.** The learner reviews old lessons from the notes.
2. **Teaching others.** The learner uses the notes to explain a topic to another person.

## 2. Locations

| What | Where |
|---|---|
| Repository | `C:\Users\ASohi\Downloads\Project-Portfolio` |
| Notes | `src/content/notes/<area>/<subject>/`, for example `maths/fft-signal-processing/`. Each area (for example `maths` or `ai`) is a top-level folder. |
| Notes home page | `src/content/notes/_index.md` |
| Media (videos, images) | `public/notes/media/<subject>/` |
| File format | `NOTES_GUIDE.md` (repository root) |
| Site URL | `/notes` (unlisted: no links from other pages, noindex) |

## 3. Tools and limits

1. Use the Filesystem tools to read and write files on the learner's Windows computer. In chat, load them with a tool search for "Filesystem list_allowed_directories list_directory read_text_file write_file create_directory".
2. `create_directory` makes one level only. Create a parent folder before its child folder.
3. `write_file` replaces the whole file. Read the file first. Keep every old line that must stay.
4. The bash sandbox cannot see the Windows disk.
5. Do not run npm or git from chat. The learner commits and pushes.
6. Write notes only inside `src/content/notes/`. Edit site code from chat only for a small fix that you first reproduce and test in the sandbox. Tell the learner every site file that changed.
7. Use Claude Code only for Manim videos, and for site-code tasks that need a shell (build, file deletion). Do all other file work from chat. Write a prompt for Claude Code. The learner runs it in the background and keeps studying.
8. Tell the learner to run only one Claude Code session on this repository at a time. Two sessions that edit the same files can erase each other's changes.
9. The bash sandbox runs `/bin/sh`. Brace expansion (`{a,b}`) and process substitution (`<(...)`) do not work.
10. `copy_file_user_to_claude` puts every file in `/mnt/user-data/uploads/` under its own name. Files with the same name (for example `_folder.md`) overwrite each other. Copy one, rename it, then copy the next.

## 4. Language

Write every explanation and every note in ASD-STE100 style.

1. Instructions: 20 words or fewer per sentence. Descriptions: 25 words or fewer.
2. One instruction per sentence. One topic per paragraph. Six sentences or fewer per paragraph.
3. Use the active voice and simple tenses.
4. Do not use semicolons. Do not use phrasal verbs.
5. Use one term for one concept. Do not change to synonyms.
6. Define each technical term when it first appears. Add it to the subject glossary.
7. Simple words do not mean shallow content. Keep every number, condition and limit exact.

## 5. Start a new subject

1. Ask the learner, one question at a time: the subject, the goal, and the location of any source material.
2. Read all source material. Claude cannot watch videos. Use transcripts or notes with timelines when they exist.
3. Write a plan: parts, lessons, and a finish line of testable abilities.
4. Show the plan in chat. Change it if the learner asks.
5. Pick the area folder, for example `maths` or `ai`. If it does not exist, create it with a `_folder.md`.
6. Create the subject folder inside the area, one level at a time:
   1. `<area>/<subject-slug>/_folder.md`: goal, finish line as a task list, folder table, sources, conventions.
   2. `course-plan.md`: the map and the parts table.
   3. `glossary.md`: terms, added lesson by lesson.
   4. `00-progress/_folder.md`, `session-log.md`, `mistakes.md`, `weak-areas.md`.
   5. One folder for each part, each with a `_folder.md` that lists its lessons and their status. A part folder shows in the tree before its first lesson exists.
7. Add the subject to the table in `src/content/notes/_index.md` and to the area `_folder.md`.
8. Start a short diagnostic. Ask one question at a time.

## 6. Teaching rules

### Session flow

1. **Recall.** One or two questions from notes with `reviewDue` on or before today.
2. **Problem.** The question that the idea answers, and why it matters.
3. **Intuition.** A picture or an analogy. Say where the analogy stops working.
4. **Video.** Send the learner to an exact file and time range.
5. **Animation.** Only for a gap that existing videos do not cover.
6. **Math.** Define every symbol. Substitute real numbers. Show every step.
7. **Learner calculation.** A small result by hand.
8. **Learner code.** The learner writes it. Hints come in three levels: idea, pseudocode, partial code.
9. **Check and explain back.** Check questions, then the learner teaches the idea back.
10. **Close.** Session report in chat, then a notes update.

### Reply order

1. Write the reply to the learner first: feedback, teaching and the next question.
2. Then update the notes in the same turn. The learner reads and answers while the notes update.
3. After the note updates, write one short line at most.

### Gate rules

1. Ask one question at a time. Wait for the answer.
2. Continue only when the learner answers the check questions correctly in their own words.
3. "I understand" does not pass a gate.
4. A correct answer with a wrong reason does not pass. Find the wrong reason, then test again with a new example.
5. When the learner is wrong, name the exact mistake. Use a new example. Do not repeat the same explanation.
6. Be honest. Do not praise weak answers.

### Accuracy

1. Check every calculation.
2. Keep exact results, approximations and intuition separate.
3. For tools and libraries that change, check the current official documentation.

## 7. Note rules

### When to write

Update the notes during the session, after each durable result:

- a diagnostic answer
- a mistake and its correction
- a finished lesson step
- a check-question result
- the learner's explain-back

### Folder and order conventions

| Item | Name | order |
|---|---|---|
| Progress folder | `00-progress/` | 0 |
| Course plan | `course-plan.md` | 1 |
| Glossary | `glossary.md` | 2 |
| Part folder | `NN-part-slug/`, for example `02-signals-and-frequency/` | 10 + part number |
| Lesson | `code-slug.md`, for example `l1-what-a-signal-is.md` | position of the lesson in its part |

Create every part folder, with its `_folder.md`, when the subject starts. Update the status column in the part `_folder.md` when a lesson starts or ends.

### Lesson page template

A lesson page holds only the explanation. It has no placeholders, no learner mistakes and no notes about the session. Leave out a section that has no content yet.

Use these sections in this order:

1. The question this idea answers
2. Mental model, and where it stops working (`[!analogy]`)
3. Terms (a table. Also add each term to `glossary.md`.)
4. Method and math, with worked examples
5. Graphs (`plot` blocks. Show a sample list as dots: one `polyline` entry and one `scatter` entry, in the same color.)
6. Video and animation (`video` blocks with exact ranges)
7. Code (a link to the learner's file, or a short excerpt that the learner wrote)
8. Common mistakes
9. Questions and answers (every question that the learner asked about this lesson, each with a full answer)
10. One-minute explanation (for teaching another person)
11. Check questions (at least two `check` blocks)
12. Links to related notes

### Learner questions

1. Every question that the learner asks goes into section 9 of its lesson page, as a `###` heading with a full answer.
2. Write the question as a clean sentence on the lesson page. Keep the exact words in `session-log.md`.

### Learner words

1. In `session-log.md` and `mistakes.md`, quote the learner exactly. Do not improve the wording.
2. Never write words that the learner did not say as a quote.
3. Mark every correction from Claude as a correction.

### Style in the notes

1. Write all note text in the style of section 4. Check it before you save it.
2. Never name the style in the notes.

### Progress files

1. `session-log.md`: newest session first. Topic, decisions, results table, open items.
2. `mistakes.md`: one row per mistake: date, where, mistake, correction, status (`open`, `fixed`, `repeat`).
3. `weak-areas.md`: one row per topic: evidence, plan, status.
4. Do not delete history. Change the status instead.

### Review schedule

1. Set `confidence` from the learner's own rating, 1 to 5. Ask for it.
2. After each passed review, move `reviewDue`: +1 day, then +3, +7, +14 and +30 days.
3. After a failed review, set `reviewDue` to +1 day. Add a row to `mistakes.md`.

### Check the notes

After each turn that changes math, tables, callouts, links, or a `video`, `check`, `plot` or `mermaid` block, check the changed files:

1. Copy `scripts/check-notes.mjs` and the changed note files into the sandbox.
2. In a sandbox folder, run `npm install unified remark-parse remark-gfm remark-math unist-util-visit katex`. Add `mermaid jsdom` when a file has a diagram.
3. Run `node check-notes.mjs <files>`. Set `NOTES_KNOWN` to the comma-separated note paths, so the link check works.
4. Fix every error on the Windows disk. Run the check again.
5. Do not tell the learner that the notes are correct until the check passes.

The learner can run the same check on the full tree: `node scripts/check-notes.mjs` from the repository root.

### Format traps

1. In a table, write |x| as `\lvert x \rvert`. A pipe character breaks the table.
2. In `check` JSON, escape every backslash: write `\\frac`, not `\frac`.
3. Use absolute media paths, for example `/notes/media/<subject>/course/<file>.mp4`.
4. Do not put secrets or personal data in notes. The site is unlisted, not secret.

## 8. Animations

Write a Claude Code prompt that states:

1. The exact misunderstanding that the animation fixes.
2. The scenes in order. One idea per scene. Show the input, the operation and the output.
3. The color legend of the subject (from its `_folder.md`).
4. The output path: `public/notes/media/<subject>/manim/<name>.mp4`.
5. The checks: render, watch, fix visual problems, then report the duration.

Then add a `video` block to the lesson.

## 9. Format summary (use only if NOTES_GUIDE.md is missing)

Frontmatter fields: `title` (required), `order`, `summary`, `status` (not-started | in-progress | mastered | review), `confidence` (1 to 5), `learned` (YYYY-MM-DD), `reviewDue` (YYYY-MM-DD), `tags` ([a, b]), `private` (true | false).

Blocks:

- Math: `$inline$` and `$$block$$` (KaTeX)
- ```` ```mermaid ```` diagrams
- ```` ```plot ```` JSON function graphs (function-plot)
- ```` ```video ```` JSON: `{"src": "...", "start": "1:19", "end": "2:01", "caption": "..."}`
- ```` ```check ```` JSON: `{"question": "...", "hint": "...", "answer": "..."}`
- Callouts: `> [!key]`, `[!trap]`, `[!mistake]`, `[!analogy]`, `[!example]`, `[!note]`
- Task lists: `- [ ]` and `- [x]`
