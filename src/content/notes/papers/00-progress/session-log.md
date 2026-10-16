---
title: "Session log"
order: 1
summary: "What happened in each paper session, newest first."
status: in-progress
---

## Session 3: 2026-10-15

**Paper:** [PagedAttention (2023)](/notes/papers/llm-serving/2023-pagedattention)

**Topic:** a new topic, LLM serving, and the notes for the third paper. These notes are part of the study guide [LLM Systems Deep Dive](/notes/ai/llm-systems).

### My request

> "Please plan out everything build an extensive study guide in note no matter how many images videos you need I dont care explain them from first principles anything which is required to master those concepts has to be added in the notes"

### Decisions

- A new topic folder `llm-serving/` sits next to `long-context/` and `reasoning-models/`.
- The paper folder is `2023-pagedattention/`. The year is the year of the first arXiv version (September 2023) and of SOSP 2023.
- The paper folder has two background pages: 01 on virtual memory and paging, and 02 on LLM serving before vLLM. The pages do not repeat the background on attention and the KV cache. They link to part 02 (attention) and part 03 (the KV cache) of the LLM Systems Deep Dive subject.
- 21 figures: `figures/overview.svg` for the paper card and 20 figures for pages 01 to 11.
- Five videos are planned, `p01` to `p05`, one each on pages 03, 04, 05, 06 and 09.

### Findings to check later

- The paper's "800 KB" per OPT-13B token is exactly 800 KiB: $2 \times 5120 \times 40 \times 2 = 819{,}200$ bytes.
- The paper's "1.6 GB" for a 2048-token request is exactly 1.5625 GiB: $1{,}677{,}721{,}600$ bytes, about 1.68 GB.
- The "GB" of Table 1 means GiB. 12 GiB gives the printed 15.7K slots, and $12 \times 10^9$ bytes would give 14.6K (pages 03 and 09).
- The denominator of Equation 4 has a "1" ($\mathbf{1}$) that the paper does not define. Page 04 reads it as the sum of the exponentials of one block.
- The printed equation numbers are (3) for attention of one token and (4) for the block-wise form. But the text calls the per-token formula "Eq. 4", in §2.1 and in §4.1 (page 04).
- §7.3 says that "recomputation overhead is never higher than 20% of swapping's latency". Page 09 reads it as "recomputation is at most 20% slower than swapping". The literal reading contradicts the first half of the same sentence.
- Figure 2 prints its values as labels inside stacked bars. Page 03 assigns some of them to the bars by their printed order. The text confirms only 20.4% and 38.2%.
- The default of `gpu_memory_utilization` was 0.90 in vLLM v0.2.0. It is 0.92 in vLLM v0.31.0 (page 05).

### Open

- Diagnostic for the background pages 01 and 02: not started.
- Videos `p01` to `p05`: not made yet.

## Session 2: 2026-10-14

**Paper:** [Why Reasoning Models Loop (2025)](/notes/papers/reasoning-models/2025-why-reasoning-models-loop)

**Topic:** a new topic, Reasoning models, and the notes for the second paper.

### My request

> "Update my notes and add this paper https://arxiv.org/html/2512.12895v1 ... Go in detail explain every concept from first principles assuming zero background knowledge. ... Elaborate. Go in papers section"

### Decisions

- A new topic folder `reasoning-models/` sits next to `long-context/`.
- The paper folder is `2025-why-reasoning-models-loop/`. The year is the year of the first arXiv version (December 2025). The paper was published at ICML 2026.
- The request asks for zero background knowledge. So the paper folder has four background pages (01 to 04) before the question: probability, decoding, training and reasoning models.
- The glossary has 146 new terms. "WRML" is the short name of this paper in the "First seen" column.
- Two figures: `figures/overview.svg` for the paper card and `figures/star-graph-task.svg` for page 06. The node and edge counts in the figure match page 06: 22 nodes and 21 edges.
- Six videos are planned, `m01` to `m06`, one each on pages 02, 06, 08, 09, 10 and 11.

### Findings to check later

- The perfect-learner length 27.7 of §4 does not match an exact computation: 29 moves or 30 nodes. Pages 11 and 13 explain the check.
- From the paper's own numbers, the second blowup is $44.7 / 27.7 \approx 1.61$. The paper writes "≈ 1.5×".
- The paper does not name the unit of response length in the graph task. It does not say whether an n-gram counts tokens or words.
- The paper says that Phi-4-reasoning learned from o4-mini data. The Phi-4-reasoning technical report says o3-mini. Page 04 has the details.
- Duan et al. (2026) find no link between looping and scale or distillation. This is in tension with §2 of the paper. Page 13 has the details.

### Open

- Diagnostic for the background pages 01 to 04: not started.
- Videos `m01` to `m06`: not made yet.

## Session 1: 2026-10-12

**Paper:** [Lost in the Middle (2023)](/notes/papers/long-context/2023-lost-in-the-middle)

**Topic:** the Papers area was created, and the notes for the first paper were written.

### My request

> "Manage the resources really properly find best way maybe in papers folder on folder of this paper and section furher in sit however you feel like think of system design percpective as in future we will add more sectioons and keep on expanding the notes."

### Decisions

- A new area `papers/` sits next to `maths/`.
- Inside `papers/`, each topic has a folder. The first topic is `long-context/`.
- Each paper has a folder whose name starts with the year: `2023-lost-in-the-middle/`.
- Every paper folder uses the same set of pages. [How to read a paper](/notes/papers/reading-method) lists them.
- All papers share one glossary and one `00 Progress` folder.
- Media for a paper goes in `/notes/media/papers/<paper folder>/`. It has two sub-folders: `figures/` for images and `manim/` for videos.
- The plots use exact numbers from the tables in the paper's appendix. A plot that uses numbers read from a figure says "approximate" in its title.

### Change of plan for the figures

PaperBanana could not run: the program was not installed, and no image API key was set. My instruction:

> "Forget banana you create images and store them there"

- The two figures are SVG files: `figures/overview.svg` and `figures/experiment-design.svg`. Every label comes from the notes.
- PaperBanana is no longer part of the notes system.

### Open

- Diagnostic for the background pages: not started.
- Manim videos: not made yet.
