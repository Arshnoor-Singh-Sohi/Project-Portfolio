# Claude Code prompts: LLM Context Engineering media

Four prompts. Run them one at a time, in this order. Use one Claude Code session on the Project-Portfolio repository at a time, because two sessions can erase each other's changes.

| # | Prompt | Makes | Output folder |
|---|---|---|---|
| 1 | Part 01 Manim | M01–M04 | `public/notes/media/context-engineering/manim/` |
| 2 | Parts 04–06 Manim | M05–M11 | `public/notes/media/context-engineering/manim/` |
| 3 | Parts 07–09 Manim | M12–M17 | `public/notes/media/context-engineering/manim/` |
| 4 | PaperBanana figures | F01–F11 | `public/notes/media/context-engineering/paperbanana/` |

When a prompt finishes, tell chat Claude. Chat Claude then adds the videos and figures to their lessons and updates the media queue.

---

## Prompt 1: Part 01 Manim (M01–M04)

Copy everything between the two fence lines into a new Claude Code session.

`````text
You are working in the repository `C:\Users\ASohi\Downloads\Project-Portfolio`. Make four Manim Community Edition videos for the study-notes subject `ai/context-engineering`.

Rules:
- Do not edit any file in `src/content/notes/`. Chat Claude updates the notes.
- Put the Python scene files in `C:\Users\ASohi\Downloads\context_engineering_manim\part01\`.
- Render to `public/notes/media/context-engineering/manim/` with these exact names: `m01-payload-grows.mp4`, `m02-attention-pairs.mp4`, `m03-position-vs-length.mp4`, `m04-prefix-cache.mp4`.
- 1920×1080, 30 fps. Background `#FAFAF7`. Text color `#100D12`. Font size large enough to read on a laptop. Short sentences on screen.
- One idea per scene. Show the input, the operation and the output. Pause about 1.5 s after each key result.
- Color legend (use it exactly): system instructions purple `#6A4C93`; user input blue `#1E6091`; conversation history gray `#8A8A8A`; retrieved knowledge gold `#B8860B`; tools teal `#2A9D8F`; state and memory green `#2D6A4F`; output reserve white with an ink outline; warning, waste, cache miss red `#C81D25`; cache hit green `#2D6A4F`.
- Do not invent data. Use only the numbers given below. Where a shape is only schematic, write "schematic" on screen.

## M01 `m01-payload-grows.mp4` (about 45–60 s)
Misunderstanding it fixes: "The model remembers the chat."
1. Title: "Each API call is stateless".
2. Two boxes: "Application" (left) and "Model" (right). Call 1: blocks travel from the app to the model: purple "system 300", blue "U1 30". A counter shows "input: 330 tokens". The model returns a gray block "A1 80". Then the Model box flashes empty with the text "The model keeps nothing".
3. Call 2: the app sends purple system, blue U1, gray A1, blue U2 30. Counter: 440. Reply A2 80.
4. Call 3: counter 550. Then fast-forward calls 4 to 10 with the rule input = 330 + 110 × (k − 1). Call 10 shows 1,320.
5. Beside the boxes, a bar chart grows one bar per call (per-call input, a straight-line staircase). Under it, a running total shows the cumulative input after each call (330, 770, 1,320, … up to 8,250 after call 10).
6. End text: "The application remembers. The model reads everything again on every call."

## M02 `m02-attention-pairs.mp4` (about 60 s)
Misunderstanding it fixes: "Twice the tokens means twice the work."
1. A row of 4 token squares. Draw causal attention arcs from each token to itself and to every earlier token. Count them: 10 = 4 × 5 / 2.
2. Morph into a 4 × 4 grid with only the lower triangle filled (10 cells). Then grow to 8 × 8 (36 cells) and 16 × 16 (136 cells). A table on the right shows n, pairs = n(n + 1)/2, and the ratio to the previous size: 36/10 = 3.6, 136/36 ≈ 3.8. Text: "Double n → about 4× the pairs".
3. Prefill: all rows of a 6 × 6 lower triangle light up at the same time. Each token drops a small "K,V" card onto a shelf labeled "KV cache". Label: "Prefill: all input tokens in parallel".
4. Decode: one new row appears at the bottom. Its query reads every card on the shelf (arrows), then adds its own card. Repeat for 3 new tokens. Label: "Decode: one token per step, reads the whole cache".
5. End text: "Attention work grows with n². Most providers still bill a flat price per token."

## M03 `m03-position-vs-length.mp4` (about 75 s)
Misunderstanding it fixes: "Lost in the middle and context rot are the same thing."
1. Scene A, title "Position effect (length fixed)". 20 document cards in a row, ink outlines. One card is gold (the answer). Move the gold card to positions 1, 5, 10, 15, 20. After each move, add a red point on a plot: position 1 → 75.8%, 5 → 57.2%, 10 → 53.8%, 15 → 55.4%, 20 → 63.2%. Join the points with a red line. Add a dashed purple line at 56.1% labeled "no documents (closed-book)". Caption: "GPT-3.5-Turbo, 20 documents. Liu et al., TACL 2024."
2. Scene B, title "Length effect (position fixed)". Keep the gold card at position 1. Add gray filler cards so the label grows "1K → 8K → 32K tokens". Draw a downward arrow labeled "accuracy tends to drop (schematic, varies by model)". Caption: "Chroma 2025: 18 models. NoLiMa 2025: 11 of 13 models below half of their short-input score at 32K."
3. Scene C, title "Stale context (content problem)". Two cards: red "code was 4471 (old)" early, gold "code changed to 9025 today" later. A question "What is the current code?" and a wrong answer "4471" in red. Then remove the red card and the answer turns to "9025".
4. End: a three-row table. Position → put key facts at the start or end, question last. Length → send fewer tokens. Stale → remove or replace old content.

## M04 `m04-prefix-cache.mp4` (about 60 s)
Misunderstanding it fixes: "Caching works if the same text appears anywhere."
1. Request 1: blocks left to right: teal "tools", purple "system", gold "policy document", gray "history", blue "new message". A stamp "cache write ×1.25" covers tools to history. A cost meter shows the price.
2. Request 2, within 5 minutes: the same blocks plus one new gray turn and a new blue message. The cached blocks glow green with "read ×0.1". Only the new part is full price. The cost meter shows a much smaller bar.
3. Request 3: a red block "time: 14:03:22" appears at the start of the system block. Everything to its right turns red "miss". Text: "One changed token invalidates everything after it."
4. Request 4: the policy document block moves after the history. Red "miss" from that point on. Text: "Only an exact prefix can be reused."
5. A 5:00 countdown runs to zero with no calls. The next request is all red. Text: "The cache expired (TTL)."
6. End text: "Stable content first. Changing content last."

Checks before you finish:
1. Render each video.
2. Extract a frame every 3 seconds with ffmpeg and look at each frame. Fix any overlap of text, any text outside the frame and any wrong number.
3. Report the path and the duration of each video. Do not change anything else in the repository.
`````

---

## Prompt 2: Parts 04–06 Manim (M05–M11)

Copy everything between the two fence lines into a new Claude Code session.

`````text
You are working in the repository `C:\Users\ASohi\Downloads\Project-Portfolio`. Make seven Manim Community Edition videos for the study-notes subject `ai/context-engineering`.

Rules:
- Do not edit any file in `src/content/notes/`. Chat Claude updates the notes.
- Put the Python scene files in `C:\Users\ASohi\Downloads\context_engineering_manim\part04-06\`.
- Render to `public/notes/media/context-engineering/manim/` with these exact names: `m05-chunking-window.mp4`, `m06-cosine-vs-distance.mp4`, `m07-rrf-fusion.mp4`, `m08-mmr-picks.mp4`, `m09-tool-loop.mp4`, `m10-react-fills-window.mp4`, `m11-n-by-m.mp4`.
- 1920×1080, 30 fps. Background `#FAFAF7`. Text color `#100D12`. Font size large enough to read on a laptop. Short sentences on screen.
- On-screen text: no semicolons. No phrasal verbs (for example "set up", "look up", "break down", "add up", "light up"). Plain words. Use the quoted on-screen text below exactly.
- One idea per scene. Show the input, the operation and the output. Pause about 1.5 s after each key result.
- Each video is 45 to 90 seconds long.
- Color legend (use it exactly): system instructions purple `#6A4C93`; user input blue `#1E6091`; conversation history gray `#8A8A8A`; retrieved knowledge gold `#B8860B`; tools teal `#2A9D8F`; state and memory green `#2D6A4F`; output reserve white with an ink outline; warning, waste, cache miss red `#C81D25`; cache hit green `#2D6A4F`.
- Do not invent data. Use only the numbers given below. Where a shape is only schematic, write "schematic" on screen.
- A "Python step" is a calculation that the animation must show on screen: first the inputs, then the formula, then the result. In the scene file, compute each result with Python from the inputs. Then `assert` that it equals the value in this prompt, rounded to the digits shown. Do not type a result by hand.
- Write numbers as the lessons write them: "," for thousands and "." for decimals.

## M05 `m05-chunking-window.mp4` (about 75 s)
Misunderstanding it fixes: "Overlap is free."
Source: lesson 4.5, `04-write-and-rag/l5-chunking.md`, section 4.4 and Exercise 5.1.
1. Title: "Chunk size, overlap and stride". Subtitle: "Overlap has a benefit and a cost."
2. Scene "The window". A horizontal token strip with ink outline, labeled "L = 950 tokens", with tick marks at 0, 450, 500 and 950. A gold window of width C = 500 covers 0 to 500 and becomes "chunk 1". The window moves right by the stride and covers 450 to 950. It becomes "chunk 2". Shade the shared part 450 to 500 and label it "overlap O = 50".
   - Python step "stride": `s = C − O` = 500 − 50 = 450.
   - Python step "number of chunks": `n = ⌈(L − O) / (C − O)⌉` = ⌈(950 − 50) / (500 − 50)⌉ = ⌈2.0⌉ = 2.
   - Text: "The last chunk reaches the end. Stop. 2 chunks."
3. Scene "The benefit". Keep the two chunks. A green bar "40-token sentence" moves along the strip across the overlap. At every position it is whole inside chunk 1 or chunk 2. A green tick follows it. Then a red bar "120-token definition" stops across the boundary, starting before 450 and ending after 500. It is whole in neither chunk. Show a red cross and the text "Cut."
   - Python step "longest span that is always whole": `O + 1` = 50 + 1 = 51 tokens.
   - Text: "Any span of up to O + 1 = 51 tokens is whole in at least one chunk. A longer span can be cut."
4. Scene "The cost". New title: "100,000 tokens, 512-token chunks, 15% overlap".
   - Python step "overlap in tokens": `O = 0.15 × 512` = 76.8, rounded to 77.
   - Python step "stride": `s = 512 − 77` = 435.
   - Python step "number of chunks": `n = ⌈(100,000 − 77) / 435⌉` = ⌈229.7⌉ = 230.
   - Python step "last chunk": it starts at 229 × 435 = 99,615 and holds 100,000 − 99,615 = 385 tokens.
   - Python step "stored tokens": 229 × 512 + 385 = 117,633.
   - Two horizontal bars to scale. Gold bar "text: 100,000 tokens". Below it a gold bar of the same 100,000 plus a red part, labeled "stored: 117,633 tokens". Label the red part "+17.6%".
   - Python step "storage factor, exact": 117,633 / 100,000 = 1.176. Python step "storage factor, formula": `1 / (1 − o)` = 1 / (1 − 77/512) = 1.177.
   - Text: "Storage and embedding cost grow by the same factor. This overlap protects spans of up to 78 tokens."
5. Scene "The factor grows faster than the overlap". A plot: x axis "overlap ratio o" from 0 to 0.6, y axis "stored tokens ÷ original tokens" from 1 to 2.6. Draw the red curve `1 / (1 − o)` and a dashed ink line `1 + o` labeled "estimate: storage grows by o". Mark four points on the red curve and show a table beside the plot:
   - 10% → 1.111. 15% → 1.176. 20% → 1.250. 50% → 2.000.
   - At o = 0.5, mark the dashed line at 1.5 and draw a red gap between 1.5 and 2.0.
   - Caption: "OpenAI file search default: 800-token chunks, 400-token overlap. o = 50%, so every token is stored about twice."
6. End text: "Overlap is not free. It protects only short spans. It multiplies storage and embedding cost by 1 / (1 − o)."

## M06 `m06-cosine-vs-distance.mp4` (about 80 s)
Misunderstanding it fixes: "Cosine and Euclidean distance always rank differently."
Source: lesson 4.6, `04-write-and-rag/l6-embeddings-and-similarity.md`, sections 4.2 to 4.4.
1. Title: "Cosine, dot product and distance".
2. Scene "Three arrows". 3D axes with a fixed camera angle and a slow small rotation. Draw a = (1, 2, 2) in blue, b = (2, 1, 2) in gold and c = (2, −2, 1) in gold. Show the coordinates next to each arrow.
   - Python step "length": `‖a‖ = √(1 + 4 + 4)` = 3. Then "‖b‖ = 3" and "‖c‖ = 3".
   - Python step "dot product": `a · b = 1·2 + 2·1 + 2·2` = 8.
   - Python step "cosine": `cos(a, b) = (a · b) / (‖a‖ ‖b‖)` = 8 / (3 × 3) = 0.889.
   - Python step "dot product": `a · c = 2 − 4 + 2` = 0, so cos(a, c) = 0. Draw a right-angle mark between a and c.
   - Text: "b is a close match. c is unrelated."
3. Scene "The identity". Show the expansion line by line:
   - `‖a − b‖² = ‖a‖² + ‖b‖² − 2 a · b`
   - For unit vectors: `‖a − b‖² = 2 − 2 cos(a, b)`
   - Python step "normalize": â = a / 3 = (1/3, 2/3, 2/3) and b̂ = b / 3 = (2/3, 1/3, 2/3).
   - Python step "squared distance, direct": â − b̂ = (−1/3, 1/3, 0), so 1/9 + 1/9 + 0 = 2/9 ≈ 0.222.
   - Python step "squared distance, identity": 2 − 2 × 8/9 = 2/9 ≈ 0.222.
   - Both results appear side by side with a green "=" between them.
   - Caption: "Chroma 1.5.9: default space l2 returned 0.2222. Space "cosine" returned 1 − 8/9 = 0.1111."
4. Scene "Same ranking on unit vectors". A plot: x axis "cosine similarity" from −1 to 1, y axis "distance" from 0 to 4. Solid ink line "squared L2 = 2 − 2 cos". Dashed ink line "cosine distance = 1 − cos". A dot at cos = 0.889 on the solid line with the label "0.222".
   - Text: "Both distances fall when the cosine rises. For unit vectors, all three measures give the same ranking."
5. Scene "Different lengths". Same 3D axes. Query q = (1, 2, 2) in blue. Chunk 1 d1 = (2, 1, 2) in gold. Chunk 2 d2 = (4, 0, 4) in gold, a visibly longer arrow. Build a table one row at a time, with columns "Measure", "Chunk 1", "Chunk 2", "Winner":
   - Python step "length of chunk 2": `‖d2‖ = √32` ≈ 5.66.
   - Python step "dot product": q · d1 = 8, q · d2 = 12. Winner "Chunk 2" in red, with the note "only because d2 is longer".
   - Python step "cosine": 8/9 = 0.889 and 12 / (3 × 5.66) = 0.707. Winner "Chunk 1".
   - Python step "squared L2": ‖q − d1‖² = 1 + 1 + 0 = 2 and ‖q − d2‖² = 9 + 4 + 4 = 17. Winner "Chunk 1".
   - Text: "The lengths differ. Now the dot product disagrees."
6. Scene "Normalize first". d2 shrinks along its own direction to length 1 (d2 / 5.66). q and d1 shrink to length 1 too. The table rows change:
   - Python step "dot product of unit vectors = cosine": 0.889 and 0.707. Winner "Chunk 1".
   - Python step "squared L2 = 2 − 2 cos": 2 − 2 × 0.889 = 0.222 and 2 − 2 × 0.707 = 0.586. Winner "Chunk 1".
   - All three "Winner" cells turn green.
   - Text: "After normalization, all three measures agree."
7. End text: "Unit vectors: cosine, dot product and distance give the same ranking. Check the vector lengths first."

## M07 `m07-rrf-fusion.mp4` (about 80 s)
Misunderstanding it fixes: "You can add raw scores from two retrievers."
Source: lesson 5.2, `05-retrieval-quality/l2-hybrid-search-and-rrf.md`, sections 4.2 to 4.4.
1. Title: "Two retrievers, two scales".
2. Scene "Two ranked lists". Two columns of gold chunk cards with ink headers.
   - "Dense (cosine)": 1 C3 0.82, 2 C7 0.79, 3 C1 0.77, 4 C9 0.74, 5 C4 0.70.
   - "BM25 (score)": 1 C1 12.4, 2 C4 9.8, 3 C12 7.1, 4 C3 6.5, 5 C20 2.0.
   - Text: "Cosine stays below 1. BM25 has no fixed range."
3. Scene "Add the raw scores". One horizontal bar chart on one scale from 0 to 14. Each bar has a thin dense part and a BM25 part. A chunk missing from a list gets 0 from that list.
   - Python step "raw sum": `score = cosine + BM25 score`. C1 0.77 + 12.4 = 13.17. C4 0.70 + 9.8 = 10.50. C3 0.82 + 6.5 = 7.32. C12 0 + 7.1 = 7.10. C20 0 + 2.0 = 2.00. C7 0.79 + 0 = 0.79. C9 0.74 + 0 = 0.74.
   - Sort the bars: C1, C4, C3, C12, C20, C7, C9. Highlight C7 in red: "Dense rank 2. Merged rank 6."
   - Text: "BM25 decides almost alone."
4. Scene "Use the rank, not the score". The scores on the cards disappear. The rank numbers stay. Show the formula with the caption "Cormack, Clarke and Büttcher, SIGIR 2009":
   - `RRF(d) = Σ 1 / (k + r(d))`, with k = 60.
   - Python step "RRF score = sum over the lists of 1 / (60 + rank)":
     - C1: dense rank 3, BM25 rank 1: 1/63 + 1/61 = 0.015873 + 0.016393 = 0.032266.
     - C3: dense rank 1, BM25 rank 4: 1/61 + 1/64 = 0.016393 + 0.015625 = 0.032018.
     - C4: dense rank 5, BM25 rank 2: 1/65 + 1/62 = 0.015385 + 0.016129 = 0.031514.
     - C7: 1/62 = 0.016129. C12: 1/63 = 0.015873. C9: 1/64 = 0.015625. C20: 1/65 = 0.015385.
   - Text: "A chunk missing from a list gets no vote from that list."
5. Scene "The fused list". The cards move into one column in this order: C1, C3, C4, C7, C12, C9, C20, with their RRF scores. Mark C1, C3 and C4 with the tag "found by both". An arrow shows C7 move from rank 6 (raw sum) to rank 4.
6. Scene "What k does". Two cards: X "rank 1 in one list" and Y "rank 5 in both lists".
   - Python step "X": `1 / (k + 1)`. Python step "Y": `2 / (k + 5)`.
   - A table appears one row at a time, with columns "k", "X", "Y", "Winner": k = 0: 1.0000, 0.4000, X. k = 3: 0.2500, 0.2500, tie. k = 10: 0.0909, 0.1333, Y. k = 60: 0.0164, 0.0308, Y.
   - Python step "rule": rank r in both lists beats rank 1 in one list when `r < k + 2`. With k = 60: 2/121 = 0.016529 > 1/61 = 0.016393.
   - Text: "A small k rewards one strong vote. k = 60 rewards agreement."
7. End text: "Do not add raw scores from two retrievers. Fuse their ranks."

## M08 `m08-mmr-picks.mp4` (about 80 s)
Misunderstanding it fixes: "Top-k is always the best set."
Source: lesson 5.5, `05-retrieval-quality/l5-diversity-with-mmr.md`, sections 4.2 to 4.5 and Exercise 5.1.
1. Title: "Top-k can repeat itself".
2. Scene "Four candidates". Four gold cards with their relevance Sim1: A 0.90, B 0.88, C 0.75, D 0.60. A thick red link between A and B with the label "Sim2 = 0.95: near-duplicates". In a corner, show the Sim2 table: A–B 0.95, A–C 0.30, A–D 0.20, B–C 0.35, B–D 0.25, C–D 0.40.
   - Plain top 3 by relevance: A, B, C. B turns red with the label "repeats A".
3. Scene "The MMR rule". Show the formula with the caption "Carbonell and Goldstein, SIGIR 1998":
   - `MMR value = λ × Sim1 − (1 − λ) × max Sim2 to the chosen set`
   - Text: "Pick the highest value. Add it to the set. Compute again."
   - Text: "An empty set gives a redundancy of 0."
4. Scene "λ = 0.5, step 1". The chosen set is empty.
   - Python step "value = 0.5 × Sim1": A 0.450, B 0.440, C 0.375, D 0.300. A gets a gold frame. Text: "Pick A."
5. Scene "Step 2". Chosen set {A}. Redundancy is the similarity to A.
   - Python step: B 0.5 × 0.88 − 0.5 × 0.95 = 0.440 − 0.475 = −0.035 (in red).
   - Python step: C 0.5 × 0.75 − 0.5 × 0.30 = 0.375 − 0.150 = 0.225.
   - Python step: D 0.5 × 0.60 − 0.5 × 0.20 = 0.300 − 0.100 = 0.200.
   - Text: "Pick C."
6. Scene "Step 3". Chosen set {A, C}. Redundancy is the larger similarity to A or C.
   - Python step: D's redundancy changes from 0.20 to max(0.20, 0.40) = 0.40, because C is now in the set. Animate the 0.20 changing to 0.40.
   - Python step: B max(0.95, 0.35) = 0.95, so 0.440 − 0.475 = −0.035.
   - Python step: D 0.300 − 0.200 = 0.100.
   - Text: "Pick D."
   - Show two rows: "Plain top 3: A, B, C" and "MMR, λ = 0.5: A, C, D". Text: "B, the near-duplicate of A, is replaced by D."
7. Scene "λ changes the picks". A plot of the step-2 values as lines in λ, for λ from 0 to 1. Use the colors of the lesson graph: B red `#C81D25`, C blue `#1E6091`, D gold `#B8860B`.
   - Python step "step-2 lines": B `1.83λ − 0.95`, C `1.05λ − 0.30`, D `0.80λ − 0.20`.
   - Python step "crossings": C = D at λ = 0.10 / 0.25 = 0.4. B = C at λ = 0.65 / 0.78 = 0.833. After A and C, B = D at step 3 at λ = 0.55 / 0.83 = 0.663 (step-3 line of D: `λ − 0.40`).
   - Below the plot, a λ number line with four regions: "below 0.4: A, D, C", "0.4 to 0.663: A, C, D", "0.663 to 0.833: A, C, B", "above 0.833: A, B, C".
   - Python step "run the greedy loop": a marker moves to λ = 1 and shows "A, B, C (plain top 3)". Then λ = 0.7: "A, C, B". Then λ = 0.5: "A, C, D". Then λ = 0.3: "A, D, C".
   - Text: "λ is not a percentage of diversity. Its effect depends on the similarity values."
8. End text: "Top-k ranks each chunk alone. MMR asks what each new chunk adds. Tune λ on your own data."

## M09 `m09-tool-loop.mp4` (about 70 s)
Misunderstanding it fixes: "The model runs the tool."
Source: lesson 6.2, `06-tools-and-mcp/l2-the-tool-call-loop.md`, sections 4.1, 4.2 and 4.9, and Exercise 2.1.
1. Title: "Who runs the tool?"
2. Scene "Describe". Three boxes with ink outlines: "Model" (left), "Application" (center), "Tool: calculate" (right). A red dashed vertical line between Model and Application with the label "security boundary". At the top, a stage tracker: "describe → decide → call → return → reason". Highlight the current stage in each scene.
   - Call 1: the application sends two blocks to the model: teal "tools: calculate(expression)" and blue "user: What is 7,823 times 4,519?".
3. Scene "Decide and call". The model writes a teal card: `tool_use`, `id: X`, `input: {"expression": "7823 * 4519"}`, and below it `stop_reason: tool_use`.
   - The Tool box does not change.
   - Text: "The model wrote text. Nothing ran."
4. Scene "The application checks". The card crosses the boundary into the Application box. Four checks appear one at a time, each with a green answer:
   - "Is the tool name allowed? Yes."
   - "Are the arguments valid? Yes."
   - "Is this user allowed to do this? Yes."
   - "Does this need a human? No."
   - The application sends "7823 * 4519" to the Tool box. The tool returns "35352137".
   - Python step "the application computes the product with a safe parser, not eval()": 7823 × 4519 = 35352137.
5. Scene "Return and reason". Call 2: the application sends everything again, as a stack of blocks: teal "tools", blue "user: What is 7,823 times 4,519?", gray "assistant: tool_use, id X", teal "user: tool_result, tool_use_id X, 35352137". Draw a line between the two X labels with the text "Same ID".
   - Python step "pair the result with its call": `tool_result.tool_use_id == tool_use.id` → X == X → True.
   - The model returns "7,823 × 4,519 = 35,352,137." with `stop_reason: end_turn`.
   - Text: "Call 2 sends all of call 1 again, plus the call and the result."
6. Scene "A bad request". The model writes a teal card: `calculate("__import__('os').getcwd()")`. The card crosses the boundary. The parser in the Application box rejects it. A red block: "Error: not arithmetic. Nothing ran."
   - Python step "the parser allows only numbers and + − * / ** ( )": the check returns an error string, and no code runs.
   - Text: "Never eval() the model's text. Parse it."
7. End text: "The model writes a request. The application checks it and runs the tool."

## M10 `m10-react-fills-window.mp4` (about 80 s)
Misunderstanding it fixes: "Agent steps are free."
Source: lesson 6.6, `06-tools-and-mcp/l6-execution-patterns-and-react.md`, sections 4.4 to 4.7.
1. Title: "Each step sends the whole history again".
2. Scene "The ReAct loop". Three nodes in a cycle: gray "Thought", teal "Action: one tool call", teal "Observation: the result enters the window". An exit arrow from Thought to "Final answer". Caption: "Yao et al., ReAct, ICLR 2023".
3. Scene "One question, three calls". At the top, the blue question: "What is the status of my most recent order?". On the right, a vertical window bar. Caption: "Token counts: o200k_base, text only. S = 1,500 is the lesson's example value."
   - Call 1 input: purple block "system + tools: 1,500" and blue block "question: 10". Python step: 1,500 + 10 = 1,510.
   - Iteration 1. Three rows appear, and three blocks join the window: gray thought "Find the most recent order." (18), teal action `search_orders(user_id="user_123", sort="newest", limit=1)` (18), teal observation "order ORD-456, 2026-02-18, shipped, two items, total USD 89.97" (54). Python step "tokens added": 18 + 18 + 54 = 90.
   - Call 2 input. Python step: 1,510 + 90 = 1,600.
   - Iteration 2: gray thought "Shipped, so the user wants the delivery date." (26), teal action `get_shipping_status(order_id="ORD-456")` (10), teal observation "FedEx, tracking FX789012345, in transit, ETA 2026-02-22, last seen in Chicago" (46). Python step "tokens added": 26 + 10 + 46 = 82.
   - Call 3 input. Python step: 1,600 + 82 = 1,682.
   - Iteration 3: gray thought "Enough information. No action." A white block with ink outline: "final answer: 61 tokens".
   - Python step "total input": 1,510 + 1,600 + 1,682 = 4,792.
   - Text: "4,792 input tokens for a 61-token answer."
4. Scene "A longer task". New values: S = 3,000 (a system prompt and 10 tools), u = 50, t = 1,200 tokens per iteration.
   - Python step "input of call k": `(S + u) + (k − 1) × t` = 3,050 + (k − 1) × 1,200.
   - A bar chart with one bar per call, from call 1 to call 20. The bars grow in a straight staircase. Label only call 1 "3,050", call 10 "13,850" (3,050 + 9 × 1,200) and call 20 "25,850" (3,050 + 19 × 1,200).
   - Python step "cumulative input": `C_K = K(S + u) + t × K(K − 1)/2`. C_10 = 10 × 3,050 + 1,200 × 45 = 30,500 + 54,000 = 84,500. C_20 = 20 × 3,050 + 1,200 × 190 = 61,000 + 228,000 = 289,000.
   - Beside the bars, a red curve of C_K that bends upward, with points labeled "84,500" at K = 10 and "289,000" at K = 20.
   - Python step "ratio": 289,000 / 84,500 ≈ 3.4.
   - Text: "Twice the steps: about 3.4 times the input."
5. Scene "Guard the loop in code". Three gates appear on the loop arrow: "Maximum iterations", "Token budget", "Repeated-call check".
   - An action `search_docs(query="refund policy")` arrives at the third gate. Then the same action arrives again.
   - Python step "repeated-call key": tool name + arguments as JSON with sorted keys. The second key equals the first, so the gate turns red: "Same tool, same arguments."
   - A final call goes to the model with `tool_choice: none` and the instruction "Answer from what you have. Say what is missing."
   - Text: "A prompt can ask. Only code can enforce a limit."
6. End text: "Agent steps are not free. Each step makes every later call larger. Guard the loop in code."

## M11 `m11-n-by-m.mp4` (about 80 s)
Misunderstanding it fixes: "MCP is just function calling."
Source: lesson 6.7, `06-tools-and-mcp/l7-mcp-the-protocol.md`, sections 4.1 to 4.3 and 4.6.
1. Title: "N applications, M services".
2. Scene "Without a standard". Three application boxes on the left: "chat app", "IDE", "custom agent". Three service boxes on the right: "GitHub", "database", "files". Draw one red line for each pair, one at a time, with a counter.
   - Python step "custom integrations": `N × M` = 3 × 3 = 9.
   - Text: "Each pair needs its own integration."
3. Scene "With MCP". The red lines disappear. Each application gets one teal plug "MCP client". Each service gets one teal plug "MCP server". A vertical teal bar in the middle: "MCP". Six teal links.
   - Python step "MCP integrations": `N + M` = 3 + 3 = 6.
   - Text: "Each application speaks MCP once. Each service ships one server."
4. Scene "The gap grows". Ten application dots and twenty service dots. First 200 thin red lines with the label "10 × 20 = 200". Then they disappear, and 30 teal links appear with the label "10 + 20 = 30".
   - Then a plot for N applications and N services, N from 0 to 20, y from 0 to 400: red curve "custom: N × N", teal line "MCP: N + N". Mark N = 3: 9 and 6. Mark N = 20: 400 and 40.
5. Scene "Two different links". One large box: "Host: Claude Desktop or your agent". Inside it: an ink box "Model", and two teal boxes "Client A" and "Client B". Outside: teal "Server A: local files" linked to Client A by a line labeled "stdio", and teal "Server B: remote service" linked to Client B by a line labeled "Streamable HTTP". Caption: "MCP specification, revision 2026-07-28".
   - Client A sends `{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}` to Server A. Under it, in small gray text: "_meta: protocol version 2026-07-28, client capabilities".
   - Server A returns a result with `"id": 1` and one tool: `get_weather`, with an `inputSchema` that has `location: string`.
   - The host converts the `inputSchema` into the model's tool format and passes it to the model. Label the Model–host link "function calling (lesson 6.2)".
   - The model writes a tool call for `get_weather`. The host sends `{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_weather", "arguments": {"location": "New York"}}}` through Client A. The result returns with `"id": 2`, and the host puts it into the window.
   - Python step "match the response to its request": response id == request id → 1 == 1 and 2 == 2.
   - Label the Client–Server links "MCP: JSON-RPC 2.0".
   - Text: "The model never connects to a server. The host holds one client for each server."
6. Scene "More than tools". A three-row table with columns "Primitive", "Who controls it", "Method":
   - Tools, model, `tools/call`.
   - Resources, application, `resources/read`.
   - Prompts, user, `prompts/get`.
   - Text: "Function calling has only tools. An MCP server also offers resources and prompts."
7. End text: "Function calling: the model asks its host for a tool. MCP: one protocol between any host and any server. N × M becomes N + M."

Checks before you finish:
1. Render each of the seven videos.
2. Run every `assert` in the scene files. If an assert fails, stop and report it. Do not change a number in this prompt.
3. Extract a frame every 3 seconds with ffmpeg and look at each frame. Fix any overlap of text, any text outside the frame and any wrong number.
4. Make sure that each video lasts 45 to 90 seconds.
5. Report the path and the duration of each video. Do not change anything else in the repository.
`````

---

## Prompt 3: Parts 07–09 Manim (M12–M17)

Copy everything between the two fence lines into a new Claude Code session.

`````text
You are working in the repository `C:\Users\ASohi\Downloads\Project-Portfolio`. Make six Manim Community Edition videos for the study-notes subject `ai/context-engineering`.

Rules:
- Do not edit any file in `src/content/notes/`. Chat Claude updates the notes.
- Put the Python scene files in `C:\Users\ASohi\Downloads\context_engineering_manim\part07-09\`.
- Render to `public/notes/media/context-engineering/manim/` with these exact names: `m12-compaction-sawtooth.mp4`, `m13-orchestrator.mp4`, `m14-memory-strategies.mp4`, `m15-context-collapse.mp4`, `m16-validation-gates.mp4`, `m17-cohens-kappa.mp4`.
- 1920×1080, 30 fps. Background `#FAFAF7`. Text color `#100D12`. Font size large enough to read on a laptop. Short sentences on screen.
- On-screen text: no semicolons. No phrasal verbs (for example "set up", "break down", "look up"). Plain words. Write numbers with thousands separators, exactly as below (12,100, not 12100).
- One idea per scene. Show the input, the operation and the output. Pause about 1.5 s after each key result.
- Each video lasts 45 to 90 seconds.
- Color legend (use it exactly): system instructions purple `#6A4C93`; user input blue `#1E6091`; conversation history gray `#8A8A8A`; retrieved knowledge gold `#B8860B`; tools teal `#2A9D8F`; state and memory green `#2D6A4F`; output reserve white with an ink outline; warning, waste, cache miss red `#C81D25`; cache hit green `#2D6A4F`.
- Pass and fail (M16, M17): pass is the legend green `#2D6A4F`, fail is the legend red `#C81D25`. Plot lines use the colors named in each scene, which match the graphs in the lessons.
- Formulas: show each formula exactly as written below, with its plain-words name next to it.
- Do not invent data. Use only the numbers given below. Where a shape is only schematic, write "schematic" on screen.

## M12 `m12-compaction-sawtooth.mp4` (about 85 s)
Misunderstanding it fixes: "Compression means deletion."
Lessons 7.2 (section 4.7, the sawtooth) and 7.3 (sections 4.2 and 4.3, tool-result clearing).
1. Title: "Compression replaces. It does not delete."
2. The input grows. Left: the input of one call as a vertical stack. Purple "fixed prefix (system and tools) 2,000". Gray blocks "turn 400" (a user message of 100 and a reply of 300). Blue "new message 100". Right: a plot, x "call number k" from 1 to 50, y "thousands of tokens" from 0 to 22. A red dashed line at 12 labeled "trigger T = 12,000". Blue points grow call by call: call 1 → 2,100, call 25 → 11,700. Show the rule "input of call k = 2,100 + 400 × (k − 1)" and the formula "compact when Î_next ≥ T" with its name "compaction trigger: the estimated next input reaches the threshold".
3. Call 26: the input would be 12,100, above T. The 21 oldest gray turns (label "turns 1 to 21: 8,400 tokens") move into a box "summarizer". One green block "summary 500" leaves the box. Turns 22 to 25 stay gray, label "keep window: 4 turns, verbatim". The purple block does not move, label "never summarized". At the same time, a copy of the 21 turns moves to a box under the window: "full transcript, stored outside the window". New input: "2,000 + 500 + 4 × 400 + 100 = 4,200".
4. Open the green block. Title "Example summary". Six rows: "Goal: Build the project's backend." "Decisions: FastAPI. OAuth2 with Google. PostgreSQL. Docker on AWS ECS." "Constraints: The user prefers established, well-documented libraries." "Current state: Auth endpoints are done. Tests for refresh tokens fail." "Open items: Choose a migration tool. Fix the refresh-token test." "Exact identifiers: File paths, table names, IDs, numbers, URLs, copied verbatim." Text: "The old words go. The decisions and exact values stay."
5. The sawtooth. On the plot, the blue line continues from 4,200 at call 26 to 11,800 at call 45. Call 46: the input would be 12,200. The old summary and 20 turns (8,500 tokens) become a new 500-token summary. The input is 4,200 again. Calls 47 to 50 end at 5,800. Then draw the red line for no compaction, from 2,100 at call 1 to 21,700 at call 50. Table: "Input over 50 calls: 357,500 tokens with compaction. 595,000 without."
6. Tool-result clearing. Two teal blocks joined by an arrow: `tool_use` "id: toolu_01A, search_products" and `tool_result` "tool_use_id: toolu_01A". The result has a large content area "15 laptop records, about 2,000 tokens". A gray assistant reply follows it: "The model used the result." Then only the content area shrinks to a note of about 20 tokens: "[cleared] 15 laptops under USD 1,000. Top match: ThinkPad X1 Carbon, USD 999.99. Call search_products with the same input to see all records." Both IDs glow green. Counter: "savings = 1 − 20 / 2,000 = 99%". Text: "Only the content changes. The ID and the block stay."
7. Fetch again. Later, the model calls search_products with the same input. A new full teal result of about 2,000 tokens arrives. Text: "The data is not lost. The agent can fetch it again."
8. Clearing over 20 tool steps. Plot, x "call number k" from 2 to 21, y "thousands of tokens" from 0 to 42. Red line "no clearing: 6,000 + 1,700 × (k − 1)". Blue line "clearing: 6,000 + 220 × (k − 1) + 1,480". Both lines start at 7,700 at call 2. At call 21: red 40,000, blue 11,880. Caption: "prefix 6,000, tool call 200, result 1,500, note 20 per step". Then the totals, with the formula "total appearances = N(N + 1) / 2": "20 × 21 / 2 = 210 appearances. 315,000 result tokens without clearing. 33,800 with clearing. About 89% fewer."
9. End text: "Compression replaces content with a summary or a note. Decisions, IDs and exact values stay. The full data stays outside the window."

## M13 `m13-orchestrator.mp4` (about 85 s)
Misunderstanding it fixes: "Multi-agent systems use fewer tokens."
Lesson 7.7, sections 4.2 to 4.6.
1. Title: "Isolation moves tokens. It does not remove them."
2. The architecture. A purple box at the top: "Orchestrator: plan and summaries, about 10K tokens". Three teal boxes under it: "Research sub-agent: docs, 50K", "Code sub-agent: auth files, 15K", "Test sub-agent: test output, 30K". Arrows down: "focused task, about 200 tokens". Each teal box fills with gold blocks, with heights in the ratio 50 : 15 : 30. Arrows up: "summary, 1K to 2K". Text: "The orchestrator keeps conclusions, not raw material."
3. Count every window. One delegation: analyze 5 auth files of 15,000 tokens. Left, the orchestrator counter: "50 out + 200 in = 250". Right, the sub-agent input as a stack: purple "system 500", blue "task 50", gold "files 15,000", purple "checklist 1,000", sum "16,550". Under both: "Total: 50 + 16,550 + 200 = 16,800 tokens." Next to it, a single agent that reads the files once: "15,000". Text: "The orchestrator sees 250 tokens. The total is 16,800."
4. The calls after the analysis. Three formulas with names, n = later calls of the main agent: red "single agent: T_single = 15,000 × (1 + n)", blue "isolation: T_isolated = 16,800 + 200 × n", gold "single agent with tool-result clearing: T_single+clear = 15,000 + 200 × n". Plot, x "later calls n" from 0 to 5, y "thousands of tokens" from 0 to 40. The red line leaves the top of the chart after about 1.7 later calls. The blue and gold lines stay almost flat, 1,800 apart. Then a table for n = 20: "315,000", "20,800", "19,000". Text: "Isolation beats a careless single agent. Clearing gives the same token benefit with one agent."
5. Four reviewers (Exercise 5B). A gold block "15 changed files, 30,000 tokens of code". Four teal agents: "quality", "security", "performance", "tests". Each one receives a full copy of the code. Each input: "30,000 + 500 + 1,000 = 31,500". Four agents: "126,000". Outputs: "4 × (750 + 200) = 3,800". Total: "about 130,000". Single agent: "30,000 + 500 + 4 × 1,000 = 34,500 input, plus about 1,000 output: about 35,000". Text: "About 3.7 times the tokens. Each reviewer reads all the code."
6. Anthropic's measurement. Three bars: "chat 1×", "single agent about 4×", "multi-agent about 15×". Then "15 / 4 ≈ 3.75", next to "about 3.7" from scene 5. Then two lines: "Multi-agent beat single-agent Claude Opus 4 by 90.2% on Anthropic's internal research eval." "On BrowseComp, token usage by itself explains 80% of the variance." Caption: "Anthropic, How we built our multi-agent research system, 13 June 2025."
7. When isolation fits. Two columns. Left: "Reading work: search, research, review". Green check: "Few implicit decisions. Isolation works." Right: "Writing parts of one artifact". Two sub-agents build one Flappy Bird clone. One makes "a background like Super Mario Bros.". The other makes "a bird that does not fit the game". The two parts do not fit (red). Label the drawings "schematic". Caption: "Cognition, Don't Build Multi-Agents, 12 June 2025."
8. End text: "Multi-agent systems use more tokens, not fewer. Use them for independent, valuable work."

## M14 `m14-memory-strategies.mp4` (about 90 s)
Misunderstanding it fixes: "A summary keeps everything that matters."
Lesson 8.5, sections 4.1 to 4.8.
1. Title: "Five memory strategies. Each one loses something."
2. The input. 50 gray turn blocks in a 5 × 10 grid. Label "50 turns, about 8,000 tokens, 160 per turn". Show the two scores with their names: "token savings = 1 − T_after / T_before" and "retention score = correct answers / test questions". Text: "Measure both."
3. Windowing. The last 5 turns stay (800 tokens). The other 45 turns fade to light gray with a red outline. A small card "user name, turn 1" fades with them. Savings: "1 − 5 / 50 = 90%". Text: "No extra calls. Older facts are gone."
4. Rolling summary. The 45 older turns move into a box "LLM summary". One green block "summary 500" leaves the box. The 5 recent turns stay. "500 + 5 × 160 = 1,300 tokens". Savings: "1 − 1,300 / 8,000 = 83.75%". Then 12 question cards appear: 9 turn green and 3 turn red. "Retention: 9 / 12 = 75%". Write "schematic" next to the positions of the red cards. Text: "High savings. Three answers lost." Then a loop arrow "summary of a summary" with the handbook quote: "After five rounds of re-summarization, details can shift or disappear entirely."
5. Key-value extraction. The JSON of lesson 8.5, section 4.4, appears in a green code box, with all 12 keys and the exact text. Counter: "126 tokens (o200k_base)". Savings: "1 − 126 / 8,000 = 98.4%". The line `"database": "PostgreSQL"` glows. A red tag next to it: "why?". Quote: "You know what was decided but not why".
6. Priority pruning. Eight message rows with their scores: "Hi there!" 1. "I'm building an inventory management app" 5. "Sure, let me think about that..." 1. "Use JWT tokens with refresh flow" 5. "Ok thanks" 1. "The token expiry should be 15 minutes" 4. "That makes sense" 1. "We decided on PostgreSQL over MongoDB" 5. A line "threshold 4". The four rows with score 1 turn red and leave. Then "That makes sense" returns as a faint copy with an arrow to "The token expiry should be 15 minutes": "This was the user's acceptance." Text: "A score of 1 can carry a decision."
7. Topic chunking. The turns move into three gold-outlined boxes: "Auth: turns 1, 3, 7, 12", "Database: turns 2, 4, 5, 8", "Deployment: turns 6, 9, 10, 11". Each box shows a short line: "Chose JWT auth with 15-min access tokens", "PostgreSQL with Prisma ORM", "Docker + AWS ECS Fargate". A card "question about login" moves to the Auth box only. Text: "A later question opens one group."
8. A contradiction. A gray turn: "Turn 12: actually, we switched to MySQL." A test question: "Which database does the project use?" The answer: "PostgreSQL". A keyword check that expects "PostgreSQL" shows a green check. Then the check turns red: "Wrong. The latest value is MySQL." Text: "A keyword check counts an old value as correct."
9. End text: "No strategy keeps everything. Facts anchor the truth. Summaries carry the narrative. Measure retention with test questions."

## M15 `m15-context-collapse.mp4` (about 80 s)
Misunderstanding it fixes: "Rewriting a summary again and again is safe."
Lesson 8.7, sections 4.2 to 4.6.
1. Title: "Full rewrite against delta update".
2. Brevity bias. A green bullet "Use PostgreSQL with JSONB columns for flexible metadata" enters a box "LLM rewrites the context". It leaves as "Use a database". Label: "brevity bias". Caption: "Handbook example (Session 6)".
3. Context collapse. Left: bars of context size in tokens, by step. The bars grow from step 1 to step 60. Label this growth "schematic". Step 60: "18,282 tokens". Step 61: a box "full rewrite by the LLM", and the bar drops to "122 tokens". Right: accuracy. A point at step 60: "66.7". A red point at step 61: "57.1". A dashed ink line: "63.7: no adaptation". Then three results, one at a time: "1 − 122 / 18,282 = 99.3% smaller, about 150×." "66.7 − 57.1 = 9.6 points lower in one step." "63.7 − 57.1 = 6.6 points below no playbook." Caption: "Dynamic Cheatsheet on AppWorld, reported by Zhang et al., arXiv 2510.04618."
4. The ACE loop. Boxes in a cycle: "Task" → "Generator: solve with the playbook" → "Trajectory and outcome" → "Reflector: lessons from success and failure" → "Curator: small delta" → "Merge with plain code, no LLM" → green "Playbook" → back to the Generator. Text: "No LLM rewrites the whole playbook."
5. Merge one delta. A green playbook box shows three bullets in a monospace font:
   - "[sql-001] helpful=7 harmful=0 :: Filter fact_orders by order_date before any join. The table is partitioned by date."
   - "[sql-002] helpful=2 harmful=3 :: Run SELECT * on a table to inspect it before you query it."
   - "[api-004] helpful=4 harmful=0 :: The orders API returns at most 100 rows. Loop with the next_page token."
   A delta card: "Add to sql: Cast order_total to DECIMAL(18,2) before SUM. The column is a string." "Mark sql-001 helpful." "Mark sql-002 harmful." The merge changes "helpful=7" to "helpful=8" on sql-001 and "harmful=3" to "harmful=4" on sql-002. A new line appears: "[sql-003] helpful=0 harmful=0 :: Cast order_total to DECIMAL(18,2) before SUM. The column is a string." Green checks mark the unchanged text of the three old bullets. Text: "Old bullets keep their exact words." Caption: "Format is illustrative."
6. Results. Bars: "ReAct 42.4", "ReAct + Dynamic Cheatsheet (online) 51.9", "ReAct + ACE (offline, with labels) 59.4". Brackets: "+17.0 over ReAct", "+7.5 over Dynamic Cheatsheet". Text: "Adaptation latency 86.9% lower on average." Caption: "AppWorld, DeepSeek-V3.1. Zhang et al., Table 1."
7. End text: "Do not let an LLM rewrite the whole context. Let it propose a small delta. Merge the delta with code."

## M16 `m16-validation-gates.mp4` (about 85 s)
Misunderstanding it fixes: "Run all the checks at the end."
Lesson 9.4, sections 4.1 to 4.6.
1. Title: "Validation gates: cheap checks first".
2. The loop. Left to right: "Change code" → gate "Level 1: static checks (ruff, mypy)" → gate "Level 2: unit tests (pytest)" → gate "Level 3: integration test" → green "Report done". From each gate, a red arrow "fail" goes to red "Read the error" → "Fix the root cause" → back to "Change code". A dot travels the loop. It fails at Level 1, travels the fix path once, then passes all three gates. Text: "Run the checks after every change. Stop at the first failure."
3. Same fault, three costs. A code card:
   ```
   from app.schemas.session import ChatTurn

   def total_tokens(turns: list[ChatTurn]) -> int:
       return sum(t.tokens for t in turns)
   ```
   `t.tokens` is red. Three rows appear one at a time: "Level 1, mypy: ChatTurn has no attribute tokens. File and line. Seconds." "Level 2, unit test: AttributeError with a traceback. About a minute." "Level 3, running service: the summary endpoint returns 500. Other endpoints work. Minutes in logs." Text: "Same fault. Different cost to find it."
4. The expected time of one pass. Three gates with labels: "Level 1: c = 15 s, p = 0.30", "Level 2: c = 90 s, p = 0.25", "Level 3: c = 600 s, p = 0.10". Show the formula with its name "expected time of one pass": "E = Σ c_k × Π_{j<k} (1 − p_j)". One line: "A check runs only if all checks before it passed." Cheap first (1, 2, 3): a bar "chance to reach the gate" shrinks from "1" to "0.70" to "0.70 × 0.75". A stacked time bar fills: "15 + 0.70 × 90 + 0.70 × 0.75 × 600 = 15 + 63 + 315 = 393 s". Expensive first (3, 2, 1): "600 + 0.90 × 90 + 0.90 × 0.75 × 15 = 600 + 81 + 10.1 ≈ 691 s". Two bars side by side: green "393 s" and red "691 s".
5. The sort rule. Text: "Run check a before check b when c_a / p_a < c_b / p_b." Ratios on the gates: "15 / 0.30 = 50", "90 / 0.25 = 360", "600 / 0.10 = 6,000". The gates move into the order 1, 2, 3. Text: "Of all six orders, 1, 2, 3 has the lowest expected time." Then: "When every check passes, all levels run: 15 + 90 + 600 = 705 s. The order changes the cost of failing passes."
6. Fix, don't disable. Level 1 fails on `t.tokens`. The agent adds `# type: ignore` to the line (red). A box "PreToolUse hook" stops the edit: "exit code 2: edit blocked". Under it, a second box "CI diff check" shows the same suppression stopped before merge: "New suppression found. Fix the cause instead:" and "exit code 1". Then the agent changes the code to `return sum(t.input_tokens + t.output_tokens for t in turns)`. All gates turn green. Text: "Prompts advise. Hooks and CI enforce."
7. End text: "Cheap checks after every change. Stop at the first failure. Fix the code, not the check."

## M17 `m17-cohens-kappa.mp4` (about 85 s)
Misunderstanding it fixes: "High percent agreement means a good judge."
Lesson 9.6, section 4.5 and check question 1.
1. Title: "Cohen's kappa: agreement beyond chance".
2. Sort 100 answers. 100 small squares in a 10 × 10 grid. Each square gets two marks: the human label and the judge label (pass green, fail red). The squares move into a 2 × 2 table. Rows: "Human: pass", "Human: fail". Columns: "Judge: pass", "Judge: fail". Counts: 45 and 10 in the first row, 15 and 30 in the second row. Row totals 55 and 45. Column totals 60 and 40. "N = 100".
3. Observed agreement. The two diagonal cells glow. Formula with its name "observed agreement": "p_o = (45 + 30) / 100 = 0.75".
4. Chance agreement. A unit square. Split it at 0.55 on one side ("human pass rate") and at 0.60 on the other side ("judge pass rate"). The "both pass" area: "0.55 × 0.60 = 0.33". The "both fail" area: "0.45 × 0.40 = 0.18". Sum: "p_e = 0.33 + 0.18 = 0.51". Name: "chance agreement: each rater labels at random with its own label rates". Show the general formula once: "p_e = Σ (n_k· / N) × (n_·k / N)".
5. Kappa. Formula with its name "Cohen's kappa": "κ = (p_o − p_e) / (1 − p_e)". Fill it: "(0.75 − 0.51) / (1 − 0.51) = 0.24 / 0.49 ≈ 0.49". A horizontal band bar: "below 0: No agreement", "0 to 0.20: Slight", "0.21 to 0.40: Fair", "0.41 to 0.60: Moderate", "0.61 to 0.80: Substantial", "0.81 to 1: Almost perfect". A marker at 0.49 lands in "Moderate". Caption: "Bands: Landis and Koch (1977). A convention, not a law." Text: "75% agreement. Kappa 0.49."
6. The lazy judge. The judge says "pass" for every answer. Humans pass 90 of 100. The table: 90 and 0 in the first row, 10 and 0 in the second row. "p_o = 0.90". "p_e = 0.90 × 1.00 + 0.10 × 0.00 = 0.90". "κ = (0.90 − 0.90) / (1 − 0.90) = 0". Text: "90% agreement. Kappa 0. The judge knows nothing."
7. Raw agreement does not rank judges. Two vertical axes side by side: left "agreement", right "kappa". Three judges, each a line from left to right: "75% → 0.49", "85% → 0.66", "90% → 0". Small captions at the left ends: "the table above", "200 answers: 120, 20, 10, 50", "the lazy judge". The lines cross. Text: "A higher agreement can give a lower kappa."
8. Humans set the ceiling. A kappa axis from 0 to 1 with ink lines at 0.2, 0.4, 0.6 and 0.8. Shopify's first judge, a red point at "0.02", moves to "0.61" after iterative prompting. A blue dashed line at "0.69: human to human". Caption: "Shopify Engineering, 26 August 2025." Text: "Compare the judge's kappa with the kappa between humans."
9. End text: "Raw agreement includes chance. Compute kappa. Compare it with the kappa between humans."

Checks before you finish:
1. Render each of the six videos.
2. Extract a frame every 3 seconds with ffmpeg and look at each frame. Fix any overlap of text, any text outside the frame and any wrong number.
3. Compare every number on screen with the numbers in this prompt. Fix any number that differs.
4. Measure each duration with ffprobe. Each video must last 45 to 90 seconds. If a video is too long, make the pauses and animations shorter. Do not remove a scene.
5. Report the path and the duration of each video. Do not change anything else in the repository.
`````

---

## Prompt 4: PaperBanana figures (F01–F11)

Copy everything between the two fence lines into a new Claude Code session.

`````text
You are working in the repository `C:\Users\ASohi\Downloads\Project-Portfolio`. Make eleven static figures with the PaperBanana skill for the study-notes subject `ai/context-engineering`.

Rules:
- Do not edit any file in `src/content/notes/`. Chat Claude updates the notes. You may read a lesson file to check a label.
- Use the PaperBanana skill for every figure. Read the skill's instructions before the first figure.
- Run one figure at a time. Make it, look at it, fix it, then start the next one.
- Keep working files outside the repository, in `C:\Users\ASohi\Downloads\context_engineering_paperbanana\`.
- Save the final files to `public/notes/media/context-engineering/paperbanana/`. Format PNG. Use these exact names: `f01-llm-os.png`, `f02-six-elements.png`, `f03-four-strategies.png`, `f04-context-stack.png`, `f05-rag-pipeline.png`, `f06-hybrid-retrieval.png`, `f07-mcp-architecture.png`, `f08-memory-architecture.png`, `f09-orchestrator.png`, `f10-prp-workflow.png`, `f11-capstone-map.png`.
- Each PNG is at least 1600 px wide. F05 and F11 are at least 2000 px wide. If the skill gives a smaller image, make it again at a higher resolution. Do not upscale a blurred image.
- Background `#FAFAF7`. Text and lines ink `#100D12`. One clean sans-serif font. Labels must be readable at 50% zoom on a laptop: the smallest text is at least 28 px tall in a 1600 px wide image, and larger in a wider image.
- Color legend (use it exactly): system instructions purple `#6A4C93`; user input blue `#1E6091`; conversation history gray `#8A8A8A`; retrieved knowledge gold `#B8860B`; tools teal `#2A9D8F`; state and memory green `#2D6A4F`; output reserve white with an ink outline (dashed, as in `public/notes/media/context-engineering/figures/window-anatomy.svg`); warning and waste red `#C81D25`.
- A box with no legend role (a model, a host, a client, an agent, a pipeline stage, a window) has a white `#FFFFFF` fill and a 2 px ink outline. Each figure section below says the color of each element.
- Text on purple, blue, teal, green and red fills is white. Text on gray and gold fills is ink.
- Do not use other colors. A pale tint of a legend color is allowed only as the background of a group frame.
- Draw only the text in "Source text" for that figure, word for word. Text inside backticks is the exact text. Do not add, remove, reword, shorten or correct a word or a number. Do not add subtitles, legends, footnotes, logos, product icons, people or decorative text. If a label does not fit, change the layout, not the text.
- Each figure has a "Never show" list. These are the handbook's wrong versions, which the lessons correct. Nothing on the figure may state or suggest them.
- The caption is input for PaperBanana and for the notes. Do not draw the caption on the image.
- If PaperBanana cannot run (for example, a key or a dependency is missing), stop and report the error. Do not draw the figures with another tool.

## F01 `f01-llm-os.png`

Lesson: 2.2 "The LLM OS model", `src/content/notes/ai/context-engineering/02-paradigm-shift/l2-the-llm-os-model.md`. Sections 4.2 (the corrected six-row table and its "Source check") and 4.4 (the key box).

Source text (show exactly this, nothing more):
- Title: `The LLM OS model`
- Column headers: `OS part` and `LLM part`
- Group A header: `Karpathy's own mapping, 2023`
  - Row A1: `CPU` → `The model`. Small note: `Karpathy's spec sheet calls the LLM the "processor".`
  - Row A2: `RAM` → `The context window`. Small note: `Karpathy: the spec sheet ("RAM: 128Ktok") and the November 2023 talk`
  - Row A3: `File system` → `Retrieval: RAG, vector databases`. Small note: `Karpathy: "Filesystem: Ada002", an embeddings store`
- Group B header: `The handbook's own extension`
  - Row B1: `System calls` → `Tool and API calls, including MCP`. Small note: `MCP launched on 25 November 2024, a year after Karpathy's posts.`
  - Row B2: `Applications` → `Agents`
  - Row B3: `Kernel` → `The system prompt, for example CLAUDE.md`. Warning note: `It conflicts with Karpathy, who calls the LLM itself the kernel process.`
- Bottom line: `In the LLM OS, you are the memory manager.`

Layout: a table-like diagram, top to bottom. Each row is one OS-part box on the left, an arrow to the right, and one LLM-part box. The small note sits under or beside its row. Group A (rows A1 to A3) is in one frame with a solid ink outline. Group B (rows B1 to B3) is below it, in a second frame with a dashed ink outline, so that the two origins are clearly separate. The bottom line is centered under both groups, in bold.

Colors: all OS-part boxes white with ink outline. `The model`, `The context window` and `Agents`: white with ink outline. `Retrieval: RAG, vector databases`: gold. `Tool and API calls, including MCP`: teal. `The system prompt, for example CLAUDE.md`: purple. The B3 warning note: red text, or white text on a red tag. Small notes: ink.

Never show: the six rows as one table called "Karpathy's LLM OS Analogy"; any B row inside Group A; "Kernel = system prompt" or "System calls = MCP" credited to Karpathy.

Caption: Three rows are Karpathy's mapping and three rows are the handbook's own extension, whose kernel row conflicts with Karpathy.

## F02 `f02-six-elements.png`

Lesson: 2.3 "The six elements of context", `src/content/notes/ai/context-engineering/02-paradigm-shift/l3-the-six-elements-of-context.md`. Sections 4.3 (the Mermaid diagram and the API table) and 4.5 (the 32,000-token budget example).

Source text (show exactly this, nothing more):
- Title: `The six elements in one window`
- Panel A heading: `Where each element goes in a request`. Panel A subheading: `Anthropic Messages API`
- Element boxes: `1 System instructions`, `6 State and memory`, `5a Tool definitions`, `3 Conversation history`, `5b Tool results`, `4 Retrieved knowledge`, `2 User input`
- Small label under `5b Tool results`: `tool_result block inside a user message`
- Field boxes: `system`, `tools`, `messages`
- Arrows: `1 System instructions` → `system`. `6 State and memory` → `system`. `5a Tool definitions` → `tools`. `3 Conversation history`, `5b Tool results`, `4 Retrieved knowledge` and `2 User input` → `messages`. The arrows have no text.
- Panel A note: `Two elements have no field of their own: retrieved knowledge and state.`
- Panel B heading: `One budget for all elements`
- Formula: the sum of T_i for i = 1 to 6, plus R, ≤ B ≤ W. Draw it as one math line: `Σ Tᵢ + R ≤ B ≤ W`, with the limits i = 1 and 6 on the sum sign.
- Formula key: `Tᵢ: input tokens of element i`, `R: output reserve (max_tokens)`, `B: context budget`, `W: context window`
- Bar segments, left to right: `System instructions 2,000`, `Tool definitions 3,000`, `Conversation history 8,000`, `Retrieved knowledge 12,000`, `State and memory 1,000`, `User input 500`, `Output reserve 4,096`, `1,404 tokens to spare`
- Bracket over the first six segments: `Input total 26,500`. Bracket over the whole bar: `B = 32,000`
- Line under the bar: `Window W: 1,000,000 tokens`

Layout: two panels, top and bottom. Panel A: the seven element boxes in one column on the left, in the order listed. The three field boxes in one column on the right. Arrows go left to right. The note is under the panel. Panel B: the formula and its key at the top. Under them, one horizontal stacked bar. Segment widths are in proportion to the tokens out of 32,000 (2,000 = 6.25%, 3,000 = 9.4%, 8,000 = 25%, 12,000 = 37.5%, 1,000 = 3.1%, 500 = 1.6%, 4,096 = 12.8%, 1,404 = 4.4%). Thin segments get a callout line to their label. Do not draw a bar for the window.

Colors: `1 System instructions` and the system-instructions segment: purple. `2 User input` and its segment: blue. `3 Conversation history` and its segment: gray. `4 Retrieved knowledge` and its segment: gold. `5a Tool definitions`, `5b Tool results` and the tool-definitions segment: teal. `6 State and memory` and its segment: green. `Output reserve 4,096`: white with a dashed ink outline. `1,404 tokens to spare`: no fill, dotted ink outline. Field boxes: white with ink outline, in a monospace font.

Never show: a separate API field for each element; tool results as `tool_use` blocks; the six elements called "the complete context window".

Caption: Seven inputs map to three API fields, and all six elements share one token budget with the output reserve.

## F03 `f03-four-strategies.png`

Lesson: 4.1 "Four strategies: write, select, compress, isolate", `src/content/notes/ai/context-engineering/04-write-and-rag/l1-four-strategies.md`. Sections 4.1 (source and date), 4.2 (the Mermaid diagram and the direction table) and 4.6 (what is outside the four strategies).

Source text (show exactly this, nothing more):
- Title: `Write, select, compress, isolate`
- Subtitle: `Which way do the tokens move?`
- Boxes: `Context window of this call`, `External storage: files, memory, index`, `Smaller window`, `Sub-agent window 1`, `Sub-agent window 2`
- Arrow WRITE (window → storage). Labels: `WRITE`, `Window to storage`, `None at once. Later windows can be smaller.`
- Arrow SELECT (storage → window). Labels: `SELECT`, `Storage to window`, `Adds tokens`
- Arrow COMPRESS (window → smaller window). Labels: `COMPRESS`, `Window to a smaller window`, `Removes tokens`
- Arrows ISOLATE (window → sub-agent window 1 and window → sub-agent window 2, one shared label). Labels: `ISOLATE`, `One window to several windows`, `Each window holds less`
- Footer box heading: `Outside the four strategies`. Items: `Fine-tuning`, `Prompt caching`, `Model choice and settings`, `Authoring content`
- Source line: `Lance Martin, "Context Engineering for Agents", 23 June 2025`

Layout: `Context window of this call` in the center. `External storage: files, memory, index` on the left, drawn as a cylinder. WRITE is an upper arc from the window to the storage. SELECT is a lower arc from the storage to the window. `Smaller window` on the right, visibly smaller than the center window, with the COMPRESS arrow. The two sub-agent windows sit below the center, side by side, with the ISOLATE arrows. Each strategy name is in bold capitals. Its two lines sit under the name: the direction, then the effect. The footer box is at the bottom, across the full width. The source line is under it, in small text.

Colors: `External storage: files, memory, index`: green. All windows: white with ink outline. Arrows and strategy labels: ink. Footer box: white with ink outline.

Never show: WRITE as "authoring system prompts" or "authoring context"; the four strategies as "exhaustive" or complete; prompt caching as a form of SELECT; the date October 2025; "WSCI" as Lance Martin's term.

Caption: Each strategy moves tokens in one direction: window to storage, storage to window, window to a smaller window, or one window to several.

## F04 `f04-context-stack.png`

Lesson: 3.6 "The context stack", `src/content/notes/ai/context-engineering/03-system-layer/l6-the-context-stack.md`. Sections 4.1 (the layer table, its "Source check" and the Mermaid diagram), 4.2 (PRP), 4.4 (the request Mermaid diagram) and 4.5 (the append-or-edit example).

Source text (show exactly this, nothing more):
- Title: `The context stack`
- Left panel heading: `Five layers sorted by lifespan`
  - `Layer 1: Rules file (AGENTS.md, CLAUDE.md)` with `Weeks to months`
  - `Layer 2: Feature spec (INITIAL.md)` with `Hours to days`
  - `Layer 3: PRP or implementation plan` with `Hours to days`
  - `Layer 4: Examples folder` with `Days to weeks`
  - `Layer 5: Dynamic tool results` with `Seconds to minutes`
- Left panel notes: `Layer 1 is the most persistent. It is listed first, and it comes first in the request.` and `PRP: Product Requirements Prompt`
- Right panel heading: `One request`
  - Boxes in order: `tools field`, `system field`, `user: Layers 1 and 2`, `assistant: read the plan and the example`, `user: tool results with Layers 3 and 4`, `assistant: run tests`, `user: tool result, Layer 5`
- Bottom panel heading: `Which layers are cache-friendly`
  - `S = 7,300 stable tokens. Each step adds 1,200 tokens.`
  - Bar 1: `Append only, call 10: about 93.4% from the cache`
  - Bar 2: `Plan edited in place before call 10: about 15.5% from the cache`
  - Rule: `Write a plan change as a new message at the end. Do not rewrite Layer 3.`

Layout: left panel, a vertical stack, top to bottom, Layer 1 at the top. The lifespan sits at the right end of each layer bar. The two notes sit under the stack. Right panel: the seven request boxes top to bottom, joined by arrows, as one sequence. Bottom panel across the full width: two horizontal bars of equal length, each split into a cached part and the rest, in proportion (93.4% and 15.5%). The rule line is under the bars.

Colors: Layer 1: purple. Layer 2: blue. Layer 3: green. Layer 4: gold. Layer 5: teal. `tools field`: teal. `system field`: purple. `user: Layers 1 and 2`: left half purple, right half blue. `user: tool results with Layers 3 and 4`: left half green, right half gold. `user: tool result, Layer 5`: teal. The two `assistant:` boxes: white with ink outline. In the bars, the cached part is green and the rest is red.

Never show: Layer 1 at the bottom of the stack or last in the request; PRP as "Prompt-Response Pairs"; the stack as a structure that the model sees.

Caption: All five layers become one messages array, with the most persistent layer first so that the cache can reuse the prefix.

## F05 `f05-rag-pipeline.png`

Lesson: 4.4 "The RAG pipeline", `src/content/notes/ai/context-engineering/04-write-and-rag/l4-the-rag-pipeline.md`. Sections 4.1 (the Mermaid diagram and the "Source check: seven or eight stages"), 4.3 (the same embedding model) and 4.5 (the top-k trap).

Source text (show exactly this, nothing more):
- Title: `The RAG pipeline: offline and online`
- Offline band label: `Offline indexing: runs again when documents change`
  - Boxes: `1 Ingest` → `2 Chunk` → `3 Embed` → `4 Store: vector index`
- Online band label: `Online: every query`
  - Boxes: `User question` → `5 Query: embed the question` → `6 Retrieve top-k` → `7 Rerank, optional` → `8 Generate` → `Answer with citations`
- Arrow from `4 Store: vector index` to `6 Retrieve top-k`, no text.
- Box between the bands: `Same embedding model`, with the small line `The same version. The same input format. The same settings.` Dashed arrows from it to `3 Embed` and to `5 Query: embed the question`.
- Warning tag at `6 Retrieve top-k`: `Top-k always returns k results`

Layout: two horizontal bands, left to right. The offline band is on top. The online band is below. `4 Store: vector index` is a cylinder at the right end of the offline band, and its arrow goes down to `6 Retrieve top-k`. `Same embedding model` sits between the bands, under `3 Embed` and above `5 Query: embed the question`. Mark `7 Rerank, optional` with a dashed outline.

Colors: `4 Store: vector index`: gold. `User question`: blue. All other stage boxes and `Answer with citations`: white with ink outline. `Same embedding model`: white with ink outline. The warning tag: red. Band frames: pale ink tint or no fill.

Never show: seven stages, or no separate query stage; "Stages 1–4 happen once"; a time share for generation such as "70–85%".

Caption: Indexing runs offline and again when documents change, and each query runs online with the same embedding model as the index.

## F06 `f06-hybrid-retrieval.png`

Lesson: 5.3 "Rerankers", `src/content/notes/ai/context-engineering/05-retrieval-quality/l3-rerankers.md`. Sections 2 (where the analogy stops working), 3 (first-stage retrieval), 4.1 (the Mermaid diagram and "Recall first, precision second") and 4.7 (the recall ceiling).

Source text (show exactly this, nothing more):
- Title: `Hybrid retrieval funnel`
- Funnel levels, top to bottom: `Query`, `First stage: hybrid search over all chunks (fast)`, `Candidate set: top 50`, `Reranker: cross-encoder scores 50 pairs (slow, accurate)`, `Top 5 into the window`
- Two chips inside the first-stage level: `Dense` and `BM25`
- Side tag at the first stage: `Recall: do not miss the relevant chunk.`
- Side tag at the reranker: `Precision: put the relevant chunk at the top.`
- Formula note: `Recall@5 after reranking ≤ Recall@N of the first stage`
- Warning note: `A reranker can only reorder what the first stage returned.`

Layout: a vertical funnel, wide at the top and narrow at the bottom. `Query` sits above the funnel, with an arrow into it. The first-stage level is the widest. `Top 5 into the window` is the narrowest, at the bottom. Arrows join the levels. The two side tags sit on the left, each level with its tag. The formula note and the warning note sit on the right. Widths are schematic. Do not draw counts other than 50 and 5.

Colors: `Query`: blue. `Top 5 into the window`: gold. The other levels: white with ink outline. `Dense` and `BM25` chips: white with ink outline. Side tags and the formula note: ink text. The warning note: red.

Never show: a fixed quality gain such as "10–25%"; a reranker price such as "USD 1 per 1,000 calls"; a latency range such as "50–200ms"; the model ID `ms-marco-MiniLM-L-6-v2`.

Caption: A fast first stage finds 50 candidates and a cross-encoder reorders them, but it cannot recover a chunk that the first stage missed.

## F07 `f07-mcp-architecture.png`

Lesson: 6.7 "MCP: the protocol", `src/content/notes/ai/context-engineering/06-tools-and-mcp/l7-mcp-the-protocol.md`. Sections 2 (consent), 3 (terms), 4.2 (the Mermaid diagram and "Source check: host and client"), 4.3 (JSON-RPC 2.0), 4.5 (transports) and 4.6 (server primitives).

Source text (show exactly this, nothing more):
- Title: `MCP host, clients and servers`
- Host frame label: `Host: Claude Desktop or your agent`
- Boxes inside the host: `Model`, `Client A`, `Client B`
- Boxes outside the host: `Server A: local files, subprocess`, `Server B: remote service`
- Arrow `Client A` → `Server A: local files, subprocess`, label: `stdio`
- Arrow `Client B` → `Server B: remote service`, label: `Streamable HTTP`
- Note at the client-server arrows: `Each client holds a 1:1 connection with one MCP server.`
- Dotted line between `Model` and `Client A`, with the note: `The model sees only what the host passes to it.`
- Panel heading: `Server primitives and who controls each`. Rows: `Tools: model-controlled`, `Resources: application-controlled`, `Prompts: user-controlled`
- Footer lines: `MCP messages are JSON-RPC 2.0.` and `Spec revision 2026-07-28`
- Warning note: `The host, not the protocol, asks the user for consent.`

Layout: left to right. A large host frame on the left. `Model` at the top of the frame. `Client A` and `Client B` below it, one above the other. The two servers on the right, each level with its client. The primitives panel sits under the servers. The footer lines and the warning note sit under the host frame.

Colors: host frame: white with ink outline. `Model`, `Client A`, `Client B`: white with ink outline. `Server A` and `Server B`: teal. Primitives panel: white with ink outline. The warning note: red outline with ink text, or white text on red.

Never show: Claude Desktop, Cursor or VS Code labeled as the "MCP client"; an arrow from the model straight to a server; HTTP+SSE or "SSE" as a transport; "exactly three capabilities".

Caption: The host holds one client for each server, and the model sees only what the host passes to it.

## F08 `f08-memory-architecture.png`

Lesson: 8.2 "Three kinds of memory", `src/content/notes/ai/context-engineering/08-memory/l2-three-kinds-of-memory.md`. Sections 4.1 (sources and "Source check"), 4.4 (the Mermaid diagram and the table), 4.5 (consolidation) and 4.7 (kind and tier).

Source text (show exactly this, nothing more):
- Title: `Memory architecture`
- Column headers: `Where in the request` and `Effect on prompt caching`
- Rows, top to bottom (one box each, then two cells):
  - `Procedural: rules and playbook`, small line `how to act` | `System prompt, near the top` | `Cacheable for all users of the agent`
  - `Semantic: user profile and pinned facts`, small line `what is true` | `System prompt, after the rules` | `Cacheable within a session`
  - `Episodic: past events retrieved for this question`, small line `what happened` | `Near the end, close to the question` | `Not cacheable`
  - `Working memory: recent turns, tool results` | `The message list` | `Grows at the end, so earlier turns stay cacheable`
  - `New user message`
- Side arrow label (down the full height): `Stable content first, changing content last.`
- Curved arrow from the episodic box up to the semantic box and the procedural box, label: `Consolidation: from many events to one fact or rule`
- Note box: `Kind and tier are two separate axes. Every kind can sit in more than one tier.`
- Source line: `Tulving (1972)` and `CoALA (Sumers et al., TMLR 2024)`

Layout: top to bottom, in the order listed, joined by down arrows from one memory box to the next. The two cells of each row sit to its right, under their column headers. The side arrow runs down the left edge. The consolidation arrow curves on the right side of the memory boxes. The note box and the source line sit at the bottom.

Colors: procedural box: purple. Semantic box: green. Episodic box: green. Working memory box: gray. `New user message`: blue. Cells, note box and arrows: ink on white.

Never show: procedural = hot, semantic = warm, episodic = cold, or any other one-to-one match of kind and tier; fixed lifespans such as "a few days" for episodic memory; a single key-value table for all kinds.

Caption: Rules go first and retrieved events go last in the request, and consolidation makes one fact or rule from many events.

## F09 `f09-orchestrator.png`

Lesson: 7.7 "ISOLATE: one window is not enough", `src/content/notes/ai/context-engineering/07-compress-and-isolate/l7-isolate-one-window-is-not-enough.md`. Sections 4.2 (the Mermaid diagram), 4.3 (total tokens rise), 4.6 (reading against writing) and 4.8 (the cost row).

Source text (show exactly this, nothing more):
- Title: `Orchestrator and sub-agents`
- Top box: `Orchestrator: plan and summaries, about 10K tokens`
- Sub-agent boxes, left to right: `Research sub-agent: docs, 50K`, `Code sub-agent: auth files, 15K`, `Test sub-agent: test output, 30K`
- Down arrows from the orchestrator to each sub-agent. The first one has the label `focused task, about 200 tokens`. The other two have the label `focused task`.
- Up arrows from each sub-agent to the orchestrator, each with the label `summary, 1K to 2K`
- Warning box heading: `Total tokens rise`. Text: `Anthropic measured about 15 times chat for multi-agent and 4 times for single agents.`
- Table heading: `Separate reading from writing`. Rows: `Search, research, review, analysis of independent parts` → `Works well: parallel, condensed summaries`. `Writing parts of one artifact (code, a document, a design)` → `Risky: decisions conflict.`

Layout: top to bottom. The orchestrator box at the top center. The three sub-agent boxes in one row below it. Each pair of down and up arrows sits side by side, so that the labels do not overlap. Draw each sub-agent box visibly larger than the orchestrator box, to show its bigger window. The warning box and the table sit side by side at the bottom.

Colors: orchestrator and sub-agent boxes: white with ink outline. Inside the sub-agent boxes, the words `docs, 50K` and `auth files, 15K` sit on a gold chip, and `test output, 30K` sits on a teal chip. Arrows: ink. Warning box: red outline, red heading. Table: `Works well` row text ink, `Risky: decisions conflict.` in red.

Never show: "isolation saves tokens" or any smaller total; "50 tokens to delegate against 15,000 to load" as the full cost; "multi-agent always outperforms a single agent"; a 200K window.

Caption: Sub-agents explore in their own windows and return condensed summaries, so the main window stays small but total tokens rise.

## F10 `f10-prp-workflow.png`

Lesson: 9.3 "The PRP workflow", `src/content/notes/ai/context-engineering/09-production/l3-the-prp-workflow.md`. Sections 4.1 (the name), 4.2 (the Mermaid diagram, the phase table and "Source check: /create-prp and /generate-prp") and 4.3 (the review gate).

Source text (show exactly this, nothing more):
- Title: `The PRP workflow`
- Subtitle: `PRP: Product Requirements Prompt`
- Boxes: `Spec: INITIAL.md`, `Plan: PRPs/<feature>.md`, `Human review` (a diamond), `Build: agent executes`, `Validate: level 1, 2, 3`, `Pull request`
- Who-acts line under each phase box: Spec `You`. Plan `The agent drafts, you review`. Build `The agent`. Validate `The agent runs, you check level 3`.
- Command line under Plan: `/create-prp INITIAL.md`. Command line under Build: `/execute-prp PRPs/<feature>.md`
- Arrows: `Spec: INITIAL.md` → `Plan: PRPs/<feature>.md` (no text). Plan → `Human review` (no text). `Human review` → Plan, label `change the plan`. `Human review` → Build, label `approve`. Build → Validate (no text). Validate → Build, label `a level fails`. Validate → Plan, label `design flaw found`. Validate → `Pull request`, label `all pass`.
- Key note: `The PRP is your review gate.`
- Small gray note: `Upstream command: /generate-prp INITIAL.md`

Layout: left to right in one row: Spec, Plan, Human review, Build, Validate, Pull request. The loop arrows curve above or below the row: `change the plan` and `design flaw found` above, `a level fails` below. Commands are in a monospace font. The key note sits above the `Human review` diamond. The small gray note sits under the Plan command.

Colors: `Spec: INITIAL.md`: blue. `Human review`: red. All other boxes: white with ink outline. The small note: gray `#8A8A8A` text.

Never show: PRP as "Product Requirements for Prompts" or "Prompt-Response Pairs"; Cole Medin as the inventor of PRP; a fixed time saving such as "2 to 3 hours".

Caption: You review the PRP before any code exists, a failed level returns to the build, and a design flaw returns to the plan.

## F11 `f11-capstone-map.png`

Lesson: `src/content/notes/ai/context-engineering/10-capstone/capstone-overview.md`. Sections 2 (the architecture Mermaid diagram and its color note) and 3 (the milestone map).

Source text (show exactly this, nothing more):
- Title: `Capstone map`
- Component boxes, each with a milestone badge:
  - `User question` (no badge)
  - `ResearchSession` [M1]
  - `ContextBuilder: six slots and one budget` [M1]
  - `System rules` [M1]
  - `Memory: pinned facts, rolling summary, SQLite facts, past sessions` [M5]
  - `History buffer with cleared tool results` [M4]
  - `Hybrid retriever: BM25, embeddings, RRF, labels` [M2]
  - `ReAct loop` [M3]
  - `Guards: iterations, tokens, duplicates, write gate` [M3]
  - `Model API through a provider adapter` [M1]
  - `MCP server: search_docs, read_file, save_note` [M3]
  - `Compressor: clearing, then compaction at 80 percent` [M4]
  - `Session summary on disk` [M5]
  - `Traces and the evaluation harness` [M6]
- Arrows (no text): User question → ResearchSession. ResearchSession → ContextBuilder. System rules → ContextBuilder. Memory → ContextBuilder. History buffer → ContextBuilder. Hybrid retriever → ContextBuilder. ContextBuilder → ReAct loop. Guards → ReAct loop. ReAct loop → Model API, and Model API → ReAct loop. ReAct loop → MCP server. MCP server → Hybrid retriever. ReAct loop → History buffer. History buffer → Compressor. Compressor → Memory. ResearchSession → Session summary on disk. ReAct loop → Traces and the evaluation harness (dotted).
- Milestone strip, left to right: `M0 Scaffold`, `M1 Context builder`, `M2 Retrieval`, `M3 Tools and MCP`, `M4 Compression`, `M5 Memory`, `M6 Evaluation and traces`, `M7 Ship`
- Strip note: `Each milestone depends only on earlier milestones.`

Layout: top to bottom. Row 1: `User question` → `ResearchSession`, with `Session summary on disk` to the right of `ResearchSession`. Row 2: the four inputs side by side (`System rules`, `Memory`, `History buffer`, `Hybrid retriever`), all with arrows into `ContextBuilder` below them. Row 3: `ContextBuilder`. Row 4: `ReAct loop` in the center, `Guards` on its left, `Model API` and `MCP server` on its right. Route the return arrows (`MCP server` → `Hybrid retriever`, `ReAct loop` → `History buffer`, `Compressor` → `Memory`) along the sides, so that no arrow crosses a label. Place `Compressor` near `History buffer` and `Memory`. `Traces and the evaluation harness` sits under the loop. A badge is a small rounded tag with white fill and ink outline at the top-right corner of its box. The milestone strip runs across the full width at the bottom, as eight joined chevrons. The strip note is under it.

Colors: `User question`: blue. `System rules`: purple. `Memory` and `Session summary on disk`: green. `History buffer with cleared tool results`: gray. `Hybrid retriever`: gold. `MCP server`: teal. `Guards`: red. All other boxes, the badges and the strip: white with ink outline.

Never show: web search as a tool; summarize as a tool; any milestone number on a box other than the badges listed above.

Caption: Each part of the research assistant shows the milestone that builds it, and the strip shows all eight milestones in order.

Checks before you finish:
1. Open each PNG and look at it at full size. Also save a copy scaled to 50% in the working folder and look at it. Every label must be readable in the copy.
2. Fix any wrong, overlapping, cut or unreadable label. Fix any arrow that points the wrong way or crosses a label. Make the figure again if needed.
3. Compare every label on each figure with its "Source text" in this prompt, word by word and number by number. Remove any text that is not in the source text. Check the "Never show" list of each figure.
4. Check the colors against the "Colors" line of each figure.
5. Read the pixel size of each PNG, for example with Python and Pillow. Each one must be at least 1600 px wide, and F05 and F11 at least 2000 px wide.
6. Report each path and its pixel size. Do not change anything else in the repository.
`````
