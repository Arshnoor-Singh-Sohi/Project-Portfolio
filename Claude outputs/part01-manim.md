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
