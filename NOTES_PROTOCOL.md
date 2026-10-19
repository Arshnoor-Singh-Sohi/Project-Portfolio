# Notes protocol

This file is for Claude. It tells Claude how to teach a subject and how to keep the study notes.

- Read this file at the start of every study session.
- Read `NOTES_GUIDE.md` for the exact file format. If `NOTES_GUIDE.md` is missing, use section 9 of this file.
- Subject-specific rules (color legend, conventions, source folders) live in `src/content/notes/<subject>/_folder.md`.
- Research papers have their own rules in section 10.

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
| Paper notes | `src/content/notes/papers/<topic>/<year>-<short-name>/` |
| Paper media | `public/notes/media/papers/<year>-<short-name>/`, with the sub-folders `figures/` and `manim/` |
| File format | `NOTES_GUIDE.md` (repository root) |
| Site URL | `/notes` (unlisted: no links from other pages, noindex) |
| Labs (learner code) | `/labs` on the site (private, saves online). Templates: `src/labs/templates/`. Rules: section 11 and `LABS_GUIDE.md`. |

## 3. Tools and limits

1. Use the Filesystem tools to read and write files on the learner's Windows computer. In chat, load them with a tool search for "Filesystem list_allowed_directories list_directory read_text_file write_file create_directory".
2. `create_directory` makes one level only. Create a parent folder before its child folder.
3. `write_file` replaces the whole file. Read the file first. Keep every old line that must stay.
4. The bash sandbox cannot see the Windows disk.
5. Do not run npm or git from chat. The learner commits and pushes.
6. Write notes only inside `src/content/notes/`, and media only inside `public/notes/media/`. Edit site code from chat only for a small fix that you first reproduce and test in the sandbox. Tell the learner every site file that changed.
7. Use Claude Code only for Manim videos, and for site-code tasks that need a shell (build, file deletion). Do all other file work from chat. Write a prompt for Claude Code. The learner runs it in the background and keeps studying.
8. Tell the learner to run only one Claude Code session on this repository at a time. Two sessions that edit the same files can erase each other's changes.
9. The bash sandbox runs `/bin/sh`. Brace expansion (`{a,b}`) and process substitution (`<(...)`) do not work.
10. `copy_file_user_to_claude` puts every file in `/mnt/user-data/uploads/` under its own name. Files with the same name (for example `_folder.md`) overwrite each other. Copy one, rename it, then copy the next.
11. If the session has the device file tools (stage and commit) and the repository folder is connected, write new files in the sandbox first. Run the check there. Then copy the files from `/mnt/user-data/outputs/` to the repository with the commit tool. This writes each file once, not twice.
12. Chat makes every figure as SVG. Write the SVG in the sandbox, render it to PNG with Chromium, and look at the PNG before you save the SVG. Fix every overlap of text.

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
8. **Learner code.** The learner writes it in a lab (section 11). Hints come in three levels: idea, pseudocode, partial code.
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
7. Code (a link to the learner's lab, or a short excerpt that the learner wrote)
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
4. The output path: `public/notes/media/<subject>/manim/<name>.mp4`. For a paper: `public/notes/media/papers/<paper folder>/manim/<name>.mp4`.
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

## 10. Papers

The area `papers/` explains research papers from first principles. The teaching rules of sections 4, 6 and 7 apply. This section adds the rules for papers.

### Layout

```text
src/content/notes/papers/
├── _folder.md            area page: rules, topics, catalog, reading queue        (order 2)
├── 00-progress/          ONE session log, mistakes page, weak-areas page for ALL papers (order 0)
├── reading-method.md     the method and the page set of every paper folder       (order 1)
├── glossary.md           ONE glossary for ALL papers, alphabetical, with links   (order 2)
└── <topic>/              one folder for each topic, for example long-context     (order 10)
    ├── _folder.md        the main question of the topic, and its papers table
    └── <year>-<short-name>/          one folder for each paper              (order = year)
        ├── _folder.md                paper card: citation, result in 3 sentences, reading order, colors, media
        ├── 00-paper-on-one-page.md   revision and teaching page
        ├── 01-..., 02-...            background pages
        └── NN-<slug>.md              question, design, results, why, engineering, limits, reproduce

public/notes/media/papers/<year>-<short-name>/
├── figures/        SVG figures made in chat
└── manim/          videos from Claude Code
```

The media path has no topic. So a paper can move to another topic without broken media.

### Start a new paper

1. Read the full PDF, page by page. List every figure and every table.
2. Search for the official venue, the code repository and the later work. Check each claim at the source.
3. Pick the topic of the main question of the paper. If the topic folder does not exist, create it with a `_folder.md`.
4. Create the paper folder and its `_folder.md`. Use the paper card of `papers/long-context/2023-lost-in-the-middle/_folder.md` as the model.
5. Write the pages in the order of `papers/reading-method.md`, section 5. Omit a page that the paper does not need. Write a background page only for ideas that no other note covers. Link to the other notes for the rest.
6. Add every new term to `papers/glossary.md`, in alphabetical order, with a "First seen" link.
7. Add the paper to the catalog in `papers/_folder.md` and to the table of its topic. Add its important later work to the reading queue.
8. Add a session to `papers/00-progress/session-log.md`.
9. Make the figures in chat (see below). Give the learner the Claude Code prompt for Manim videos.
10. Run the check of section 7 on every new and changed file.
11. Start a short diagnostic on the background pages. Ask one question at a time.

### Rules for paper pages

1. **Three kinds of statements.** Keep them apart, and label them: what the paper measured, what later work found, and the interpretation of these notes.
2. **Exact and approximate numbers.** Take numbers from the tables and the text of the paper. A value read by eye from a figure is approximate. Say "approximate" in the plot title.
3. **No copies of the paper's figures.** Rebuild each plot from the numbers with a `plot` block. Draw new diagrams as SVG or Mermaid.
4. **No PDF in `public/`.** The site is public. Link to the paper instead.
5. **Status.** Every page starts as `not-started`. Set `learned`, `confidence` and `reviewDue` only after the learner studies the page and passes its gate.
6. **Status table.** Update the status column of the reading-order table in the paper `_folder.md`, and the status in the catalog, when a page starts or ends.

### Figures

Chat makes every figure. Do not use AI image generators (for example PaperBanana). They can misspell labels and change numbers.

1. Write the SVG with a script in the sandbox. Use the color legend of the paper `_folder.md`.
2. Use a viewBox about 1280 px wide, and text of 19 px or more. The page shows a figure at about 760 px wide.
3. Take every label and every number from the notes.
4. Render the SVG to PNG with Chromium. Look at the PNG. Fix every overlap, every cut-off text and every wrong number.
5. Save the SVG in `public/notes/media/papers/<paper folder>/figures/`.
6. Give each paper at least two figures: an overview for its `_folder.md`, and a method figure for its experiment-design page.

A note can link to a Manim video before the video exists. Tell the learner which videos are missing until the prompt runs.

## 11. Labs

Learner code lives in Labs at `/labs`, not in folders on the computer. A lab is a page of text cells and Python cells. Python runs in the browser, and the lab saves online. The old lab folders (`C:\Users\ASohi\Downloads\AI\*-lab`) are not used for new work.

1. **Give the learner a lab for a lesson.** Use one of these:
   - A template that fits: give the link `/labs/new?template=<id>`. The templates are in `src/labs/templates/`.
   - No template fits: give the link `/labs/new?note=<notes path>`, for example `/labs/new?note=maths/fft-signal-processing/02-signals-and-frequency/l2-period-and-frequency`. The lab links back to the note and starts with its goal. Every note page also has an **OPEN A LAB** link.
2. **Exercises in a lesson page** (section 7, "Code"): say what to build and how to test it. Do not give a folder path. After the learner builds it, link to the lab: `[Lab: <title>](/labs/<id>)`.
3. **A new template** is useful when the same kind of experiment will repeat, or when a subject needs a demo with controls. Write it with the rules in `LABS_GUIDE.md` section 2: explore first, then stubs with `raise NotImplementedError`, then `lab.check` tests, hints in `check` blocks, and an Observations cell. Never put the solution in the template.
4. **Check a new template** in the sandbox: `node --test "tests/labs/*.test.mjs"` (it parses every template). Then solve it once in a lab, to prove that the tests can pass. Do not save the solution.
5. **Learner tools in a lab:** `# @param` controls, `lab.check`, `lab.inspect`, pinned results, versions and reset. Explain them to the learner the first time they are useful.
6. **Mistakes** that the learner makes in a lab go to `00-progress/mistakes.md`, as for any other mistake. Quote the learner's code exactly.
