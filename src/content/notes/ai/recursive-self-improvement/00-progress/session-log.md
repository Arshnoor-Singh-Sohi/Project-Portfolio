---
title: "Session log"
order: 1
summary: "What happened in each session, newest first."
status: in-progress
---

## Session 0: 2026-10-19

**Topic:** subject setup. Research, curriculum and the full build of the subject.

### Request

Build a complete learning section on recursive self-improvement (RSI) in AI agents, from zero background to research level. Work independently. Use primary sources, verify every citation, and keep demonstrated results, theory and speculation apart.

### Sources read

- Eight research fact sheets, written for this subject on 2026-10-19 from primary sources. They cover history and theory, inference-time refinement and memory, prompt and workflow search, and self-modifying code agents. They also cover training-time methods and meta-learning, safety and evaluation, code walkthroughs, and videos. About 100,000 words in total.
- Eight code repositories, read at pinned commits and never run: the Darwin Gödel Machine, ADAS, STOP, SICA, Gödel Agent, OpenEvolve, Reflexion and Self-Refine.
- 47 videos, each checked for its title, channel and topic.

### Decisions

| Question | Decision |
|---|---|
| Location | New subject `ai/recursive-self-improvement` in the AI area |
| Structure | 10 parts, 73 pages, plus a course plan, a glossary, a sources page and a video guide |
| Paper pages | One page per paper inside Part 6 of this subject, not in the Papers area, because they serve this course |
| Learner code | Eight Labs templates (`rsi-01` to `rsi-08`) for Part 9. No lab folders on the computer. |
| Toy problem for the projects | Online bin packing, the problem that FunSearch used. A seeded random proposer stands in for a language model, so every result repeats and no API key is needed. |
| Complete implementations | On a separate [reference solutions](/notes/ai/recursive-self-improvement/09-build-it/solutions) page, to open only after an attempt. The templates hold no solutions. |
| Evidence | Five labels: Measured, Claimed, Theory, Speculation, Our interpretation |
| Sources that disagree | STOP's venue: one fact sheet confirmed COLM 2024 from the accepted-papers list, another could not. The pages follow the confirmed one. The DGM run cost of about USD 22,000 comes from the paper's first version and is marked as not confirmed elsewhere. |

### Build

| Item | Count |
|---|---|
| Lesson and paper pages | 73 |
| Words in the pages, without code | about 357,000 (about 33 hours of reading) |
| Check questions | 395 |
| Glossary terms | 743 |
| SVG figures, each checked before saving | 9 |
| Animations | 2 |
| Labs templates, each solved once in a test run | 8 |

Every page passed the format check and the plain-language check on 2026-10-19.

### Open

1. **Diagnostic.** Eight questions, one at a time, to decide where to start in Part 1:
   1. What is the difference between training a model and using it?
   2. What does an agent do in one step of its loop?
   3. A loop multiplies a change by 1.2 on each pass. What happens after many passes?
   4. What is a local optimum?
   5. Why must a function that calls itself have a base case?
   6. Why do we keep a test set that we never use to choose anything?
   7. An agent goes from 20/100 to 26/100 solved tasks. Is it better? What else do you need to know?
   8. Name one thing that can improve without the system that produced it changing.
2. **Labs.** Open each template once in the browser and click **Run all**. It must stop at the first exercise. The test run used ordinary Python, not the browser runtime.
3. **Not verified.** Each page names the facts that the research could not confirm. The [sources page](/notes/ai/recursive-self-improvement/sources) lists them in its Verification section.
