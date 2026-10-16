# Claude Code prompts: Why Reasoning Models Loop (Manim)

6 videos for the paper notes "Why Reasoning Models Loop (2025)" in `src/content/notes/papers/reasoning-models/2025-why-reasoning-models-loop/`. Every page already has a `video` block that points to the output path. A video appears in the notes as soon as its file exists.

## How to run

Open a new Claude Code session in `C:\Users\ASohi\Downloads\Project-Portfolio` and paste one line:

```text
Read "Claude outputs/paper-why-reasoning-models-loop-manim-prompts.md" and follow its run rules.
```

Paste the same line again to continue a stopped run. Finished videos are skipped.

## Run rules (for Claude Code)

1. Run only one Claude Code session on this repository at a time. Two sessions can erase each other's changes.
2. Work through the queue table below in order.
3. Before each video, check its output path. If the file already exists, skip the video. So a run is safe to repeat, and a stopped run can continue.
4. Make each video with the shared rules and its prompt below. The prompt is the full specification. Use its exact labels and numbers. They come from the paper and from checked calculations. Values marked "approximate" or "illustrative" must keep that mark on screen.
5. After each finished video, add one row to `Claude outputs/papers-manim-report.md`. If that file does not exist, create it with this header:

   ```text
   | Date | File | Duration | Size | Checks |
   |---|---|---|---|---|
   ```

6. Do not edit any file in `src/`, and do not edit this prompt file. Chat Claude reads the report and updates the notes.
7. At the end, list the videos of the queue that are still missing.

## Queue

| # | Video | Output path | Page |
|---|---|---|---|
| 1 | Why reasoning models loop · M01: Greedy decoding, temperature and a loop that never ends | `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m01-greedy-temperature-loop.mp4` | 02 Background: decoding, greedy, temperature and sampling |
| 2 | Why reasoning models loop · M02: The star graph G(5,5) and its random walk with resets | `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m02-star-graph-random-walk.mp4` | 06 Experiment design |
| 3 | Why reasoning models loop · M03: Proposition 1: the hard action's mass diffuses, the easy cyclic action keeps its mass | `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m03-hard-action-mass-diffuses.mp4` | 08 Why 1: risk aversion from hardness of learning |
| 4 | Why reasoning models loop · M04: Temporally correlated errors: small errors that repeat at every visit | `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m04-correlated-errors-loop.mp4` | 09 Why 2: temporally correlated errors |
| 5 | Why reasoning models loop · M05: Confidence that grows inside a loop | `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m05-confidence-buildup.mp4` | 10 The catalyst: confidence that grows inside a loop |
| 6 | Why reasoning models loop · M06: Temperature: a stopgap, not a cure | `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m06-temperature-stopgap.mp4` | 11 Temperature: a stopgap, not a cure |

## Shared rules (apply to every video)

`````text
SHARED RULES (apply to this video)

You make one teaching video with Manim Community Edition for my study notes.

Repository: C:\Users\ASohi\Downloads\Project-Portfolio
- Do not edit any file in src/. The page already has a video block that points to the output path.
- Write the Manim source in C:\Users\ASohi\Downloads\manim-work\why-reasoning-models-loop\ (create it if needed), not inside the repository.
- Save only the final .mp4 at the output path given below. Create the folder if it does not exist.
- Delete the intermediate render folders in manim-work after the final file is copied.

Format
- 1920x1080, 30 fps. Render with: manim -r 1920,1080 --fps 30 ...
- White background #FFFFFF. Main text ink #100D12.
- No audio. All explanation is on-screen text: short phrases, at most 12 words per caption.
- No text smaller than 32 px. Use one clean sans-serif font for all text, and a monospace font for token strings, training strings and code.
- Use Text, not MathTex or Tex, so the render needs no LaTeX. Write formulas as plain text, for example "0.7 / 5 = 0.14" and "q0 + q1 = 1".
- One idea per scene. Show the input, then the operation, then the output. Hold the final state of each scene for 2 seconds.
- Total length 45 to 100 seconds.
- Use the exact labels and numbers from the scene list. Do not invent other numbers.
- A value marked "approximate" or "illustrative" in the scene list keeps that word on screen.

Color legend (use it for every element)
- Progress-making action, correct path, teacher or largest model: blue #1E6091
- Cyclic action (reset, restatement), loop, error, smallest student model: red #C81D25
- Start node, temperature and sampling, middle model: gold #B8860B
- Goal node, perfect learner, ideal reference: purple #6A4C93
- Ordinary nodes, text and neutral tokens: ink #100D12
- Unvisited or faded parts: gray #8A8A8A

Checks before you finish
1. Render the video.
2. Extract one frame at the end of each scene with ffmpeg and look at every frame.
3. Fix every overlap, every cut-off label, every spelling error and every wrong number. Render again.
4. Report: the output path, the duration in m:ss, the file size, and one line per scene.
`````

## Prompts

### 1. Why reasoning models loop · M01: Greedy decoding, temperature and a loop that never ends

Output: `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m01-greedy-temperature-loop.mp4`. Page 02 Background: decoding, greedy, temperature and sampling.

`````text
VIDEO: Greedy decoding, temperature and a loop that never ends
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2025-why-reasoning-models-loop\manim\m01-greedy-temperature-loop.mp4
MISUNDERSTANDING TO FIX: Temperature is a dial that repairs the model: a low temperature only makes the text a little less varied, and a high temperature changes which token the model prefers. In truth, temperature never changes the order of the tokens, temperature 0 is deterministic greedy decoding, and a deterministic rule that returns to a state repeats the same steps forever. Sampling only gives the exits a chance: the trace leaves the loop, but it stays longer than necessary.

Scene 1. A small label in the corner reads 'invented example'. Four vertical bars stand for four candidate next tokens: ' Wait' in red #C81D25 (a token that starts a re-check, a cyclic action), ' So' in blue #1E6091 (a token that starts the next step, a progress-making action), ' Therefore' and ' Hmm' in ink #100D12. Above the bars, their logits appear: 2.0, 1.5, 0.5, -1.0. A box labeled 'softmax' takes the logits and the bars grow to the probabilities 0.5321, 0.3227, 0.1187, 0.0265. A gold #B8860B dial at the top reads 'T = 1.0'. A line under the bars reads 'sum = 1.0000'.

Scene 2. The gold #B8860B dial turns from 'T = 1.0' to 'T = 0.6'. Each logit is divided by T on screen: 2.0/0.6 = 3.3333, 1.5/0.6 = 2.5000, 0.5/0.6 = 0.8333, -1.0/0.6 = -1.6667. The bars change to 0.6564, 0.2853, 0.0539, 0.0044. The dial turns to 'T = 0.2' and the bars change to 0.9237, 0.0758, 0.0005, 0.0000003. A small meter at the side shows the ratio Wait/So = e^(0.5/T): 1.6487 at T = 1.0, 2.3010 at T = 0.6, 12.1825 at T = 0.2. Caption: 'The order never changes. Wait stays first.'

Scene 3. The dial moves to 'T = 0.05'. The red ' Wait' bar reaches 0.999955 and the three other bars fade to gray #8A8A8A. A label appears: 'T -> 0 is greedy decoding: always take the argmax'. A note in the corner: 'The paper calls greedy decoding temperature 0 (Figure 2).'

Scene 4. A toy state machine where each node is one whole sentence (invented probabilities). Node A 'restate the rule' in gold #B8860B (the start node), node B 'restate the goal' in ink #100D12, node C 'Wait, check again' in ink #100D12, node D 'count the pairings' in purple #6A4C93 (the goal). Red #C81D25 edges: A to B 0.6, B to C 0.55, C to A 0.9. Blue #1E6091 edges: A to D 0.4, B to D 0.45, C to D 0.1. A cursor runs greedy decoding: at each node it takes the larger edge, so A, B, C, A, B, C. A round counter climbs 1, 2, 3, 4. A token budget bar fills toward '30K tokens' and stops the trace when full. D stays unvisited. Caption: 'Greedy decoding never chooses D.'

Scene 5. A row of state boxes s_1, s_2, s_3, s_4, s_5, s_6, s_7 shows A, B, C, A, B, C, A. The boxes s_1 and s_4 light up with the label 's_i = s_j'. An arrow labeled 'f (one greedy step)' goes from s_1 to s_2 and from s_4 to s_5, and an equal sign appears between s_2 and s_5. The equal signs continue to the right: s_3 = s_6, s_4 = s_7. Text: 'Same state and a deterministic rule give the same next state, forever. Period j - i = 3.'

Scene 6. The same state machine, now with sampling at T = 1. A gold #B8860B die rolls at each node. A product builds on screen: one full round on the red edges has the probability 0.6 x 0.55 x 0.9 = 0.297, and ten rounds have 0.297^10 = 5.34 x 10^-6. The cursor leaves through a blue #1E6091 edge and reaches D (purple #6A4C93). A table appears: 'T = 1.0: 2.745 steps on average', 'T = 0.6: 3.287', 'T = 0.2: 7.159', 'T = 0 (greedy): D never reached'. Under it, in purple: 'A model that ranks D first: 1 step'. Caption: 'Sampling ends the endless loop, but the trace stays longer than necessary.'

Scene 7. The paper's loop rule on a toy text. Text A, 'so the word is the pair sorted .' written three times, appears as 24 small token boxes in ink #100D12. A gold #B8860B window, 3 boxes wide, slides from left to right over 22 positions. A counter for the 3-gram 'the word is' climbs 1, 2, 3. At 3 the window and the counter turn red #C81D25 with the label 'looping (n = 3, k = 3)'. Final caption: 'The paper uses n = 30 and k = 20 for reasoning models, and k = 10 for instruct models (Section 2).'
`````

### 2. Why reasoning models loop · M02: The star graph G(5,5) and its random walk with resets

Output: `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m02-star-graph-random-walk.mp4`. Page 06 Experiment design.

`````text
VIDEO: The star graph G(5,5) and its random walk with resets
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2025-why-reasoning-models-loop\manim\m02-star-graph-random-walk.mp4
MISUNDERSTANDING TO FIX: A learner may think the star-graph task is a hard maze search. In fact all 21 edges are given in the input, every node except the root has exactly one way forward, the only real choice is which of the 5 edges to take at the root, and a reset is a jump to the start node, not an edge of the graph.

Scene 1. Build G(5,5) with its start node. Draw a gold node labeled 's (start)' on the left and an ink node 'r (root)' to its right, joined by one ink arrow. From r, draw 5 spokes as rays. Each spoke is 4 ink nodes in a line, and the last node of each spoke is a leaf. Show the count step by step: '1 start + 1 root + 5 x 4 spoke nodes = 22 nodes' and '5 x 4 spoke edges + 1 = 21 edges'. Caption: 'G(5,5): n = 5 spokes, each a path of l - 1 = 4 edges'.

Scene 2. Out-degree and the goal. Flash the outgoing arrows of each kind of node and write its out-degree: start 1, inner spoke nodes 1, leaves 0, root 5. Pulse the root and write 'the only real choice: 5 outgoing edges'. Pick one leaf, color it purple and label it 'g (goal)'. Color the path s -> r -> 3 inner nodes -> g blue and label it 'shortest walk: 6 nodes, 5 moves'. Fade the other 4 spokes to gray.

Scene 3. Why the root is hard (Bachmann and Nagarajan, 2024). Show the edge list as a row of ink tokens at the top of the frame. Put a marker on an inner node of the blue path. Draw a lookup arrow from that node to the one edge in the list that starts there, and copy its end node: label 'one edge starts here: copy it (the Clever Hans cheat)'. Move the marker to the root: 5 edges in the list light up at once. Label 'five edges start here: the lookup cannot choose'. Draw 5 small bars of about equal height over the 5 children of the root, labeled 'learned: roughly 1/n each'.

Scene 4. The random walk with reset, p = 0.3. A gold token starts at s. At the current node, show a blue arrow 'progress 0.7' to the next node of the blue path and a red dashed curved arrow 'reset 0.3' to s. Animate one walk: s -> r -> v1 -> red reset to s -> red reset from s to s (label 'the reset applies at s too') -> r -> v1 -> v2 -> v3 -> g. As the token moves, write each visited node in a row at the bottom: 's r v1 s s r v1 v2 v3 g'. End with 'stop at the goal'.

Scene 5. The training string. Write the paper's example on one line in ink: '11,16|5,42|2,29|...|29,22 / 2,42 = 2,29,22,33,5,2,...,5,42'. Put braces under its three parts with the labels 'edge list', 'start, goal' and 'random walk'. Color 2 gold (start) and 42 purple (goal). Shade the walk part and write 'the loss is computed only on the walk'. Then show '0.7^5 = 0.168: the chance of the shortest walk' and '1 - 0.168 = about 83% of training walks contain at least one reset'.

Scene 6. Other training walks, shown at the root of G(5,5). Show the root and its 5 children with one probability bar per option, one panel at a time. Panel 1, exploration variant: 'reset 0.3' (red bar), 'correct child 0.5' (blue bar), 'each other child 0.2 / 4 = 0.05' (ink bars). Panel 2, uniform-child walk: 'each child 1/5 = 0.2', no reset at inner nodes, and a non-goal leaf returns to s. Panel 3, margin variant with m = 0.1: after child A is visited once, 'A: 0.2 - 0.1 = 0.1' and 'each unvisited child: 0.2 + 0.1/4 = 0.225'.

Scene 7. One name, two looping counts. Replay a generated walk as a row of tokens: 's r s r s r A1 A2 A3 A4 s r A1 A2 A3 A4 s r G1 G2 G3 G4'. Highlight each 'r s' pair in red and count: 'looping count of Section 3 (root -> start transitions): 2'. Highlight each visit to a root child in blue and count per child: 'A1: 2, G1: 1, so the looping count of Section 4 (most visits to one root child) is 2'. Final text: 'same name, two definitions: never compare them directly'.
`````

### 3. Why reasoning models loop · M03: Proposition 1: the hard action's mass diffuses, the easy cyclic action keeps its mass

Output: `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m03-hard-action-mass-diffuses.mp4`. Page 08 Why 1: risk aversion from hardness of learning.

`````text
VIDEO: Proposition 1: the hard action's mass diffuses, the easy cyclic action keeps its mass
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2025-why-reasoning-models-loop\manim\m03-hard-action-mass-diffuses.mp4
MISUNDERSTANDING TO FIX: If the teacher's data gives 0.7 to the progress-making action and 0.3 to a cyclic action, a student trained on that data also puts most probability on the progress-making action, so greedy decoding makes progress. In fact a student that cannot tell the correct action from n look-alikes gives each look-alike 0.7/n and keeps 0.3 for the easy cyclic action, so for n = 5 greedy decoding picks the cyclic action (0.3 > 0.14) and loops.

Scene 1. Title card: 'One step, two kinds of action'. Five ink (#100D12) boxes in a row, labeled 'context set C1' to 'context set C5'. Above each box, a small bar chart with six slots labeled a0, a1, a2, a3, a4, a5. In every chart the a0 bar is red (#C81D25), height 0.3, label '0.3 easy cyclic action'. In box Ci only slot ai has a blue (#1E6091) bar, height 0.7, label '0.7 progress-making action'. Caption: 'Training data: each context set has its own correct progress-making action.'

Scene 2. The five boxes slide together and merge into one gray (#8A8A8A) box labeled 'blind learner: one distribution for all five context sets'. Write the loss in ink: 'loss = -p log q0 - (1 - p) (1/n) sum of log qi'. Then substitute and highlight 'p = 0.3' and 'n = 5'. Caption: 'The learner cannot tell C1 to C5 apart.'

Scene 3. The five charts stack into one chart and average slot by slot. For slot a1 show '(0.7 + 0 + 0 + 0 + 0) / 5 = 0.14'. All five blue bars settle at height 0.14. The red a0 bar stays at 0.3 with '(0.3 + 0.3 + 0.3 + 0.3 + 0.3) / 5 = 0.3'. Caption: 'Proposition 1: q0 = p = 0.3 and qi = (1 - p)/n = 0.7/5 = 0.14.'

Scene 4. Why exactly these values. A 2D panel with axes 'q0' and 'q1' from 0 to 1.2. The ink line 'q0 + q1 = 1'. Three level curves of '-0.3 log q0 - 0.7 log q1': gold (#B8860B) 'loss 0.55' that misses the line, purple (#6A4C93) 'loss 0.611' that touches the line at a purple dot '(0.3, 0.7)', red 'loss 0.70' that crosses the line twice (near q0 = 0.14 and q0 = 0.51). At the purple dot, draw the loss gradient '(-1, -1)' and the constraint direction '(1, 1)' on one straight line. Then show three ink lines: 'p / q0 = mu', '(1 - p) / (n qi) = mu', 'sum = 1/mu = 1, so mu = 1'. Caption: 'Lagrange multiplier: at the best point every action has the same marginal value mu.'

Scene 5. Greedy choice at the root. A bar chart: one red bar 'reset 0.3' and five blue bars 'child 0.14'. An ink argmax pointer moves to the red bar. Then a small plot: a blue curve '0.7 / n' for n from 1 to 10 and a red horizontal line '0.3'. Mark the crossing 'n = 2.33'. Caption: 'Greedy picks the easy cyclic action when 0.3 > 0.7/n, that is for every n of 3 or more.'

Scene 6. The star graph G(5,5): a gold start node 's', one edge to an ink root 'r', five spokes of 4 nodes each in gray (unvisited), and the goal leaf in purple at the end of one spoke. A token runs the Markovian student under greedy decoding: s to r with the label 'move 0.7 > reset 0.3', then r to s along a red edge with the label 'reset 0.3 > child 0.14', again and again. A red counter 'root -> start transitions' counts 1, 2, 3, 4. At s, show two small labels 'move to root 0.7 (easy)' and 'reset 0.3 (easy)' to show why s does not loop on itself. Caption: 'Loops form where a hard action meets an easy cyclic action.'

Scene 7. A gold slider 'temperature' moves from 0 to 1. The red loop opens and the token sometimes walks down a spoke. Two horizontal bars appear: red 'learned Transformer, G(5,5) with exploration, T = 1: 105.5' and purple 'perfect learner: 24.8'. Ink label '105.5 / 24.8 = 4.25'. Caption: 'Higher temperature breaks the loop but does not fix the learned probabilities.'
`````

### 4. Why reasoning models loop · M04: Temporally correlated errors: small errors that repeat at every visit

Output: `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m04-correlated-errors-loop.mp4`. Page 09 Why 2: temporally correlated errors.

`````text
VIDEO: Temporally correlated errors: small errors that repeat at every visit
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2025-why-reasoning-models-loop\manim\m04-correlated-errors-loop.mp4
MISUNDERSTANDING TO FIX: If a model's probabilities at a decision point are almost right (0.2 plus or minus 0.05 for each of 5 children), its errors are random noise that cancels over visits, so it cannot loop. In fact the errors keep the same direction from visit to visit (the top-1 child is the same in 96.7% of consecutive visits), and greedy decoding uses only the order, so the walk takes the same spoke again and again.

Scene 1. The star graph G(5,5): a gold (#B8860B) start node 's', an ink (#100D12) root 'r', five spokes labeled A to E with 4 nodes each, and the goal leaf in purple (#6A4C93) at the end of spoke C. Show the training walk of Section 4: 's -> r: 1', 'r -> each child: 1/5 = 0.2', 'inside a spoke: 1', 'non-goal leaf -> s'. Five purple bars at the root, all at 0.2, labeled 'perfect learner'. Caption: 'No hard action: every child has training probability 0.2.'

Scene 2. The trained Transformer at the root, first visit: bars A 0.24, B 0.21, C 0.19, D 0.18, E 0.18, with a small gray (#8A8A8A) note 'illustrative values inside 0.2 +/- 0.05'. A dashed purple line at 0.2. An ink greedy pointer picks A. The token runs down spoke A to its leaf, and the spoke turns red (#C81D25). The token returns to s along a red edge, then moves to r. A counter 'visits to A: 1'. Caption: 'Small estimation errors: 0.2 +/- 0.05 for n = 5.'

Scene 3. Visits 2, 3 and 4: the bars move a little (for example A 0.23, B 0.21, C 0.20, D 0.18, E 0.18), but A stays the tallest every time. The greedy pointer picks A each time, and the counter rises to 'visits to A: 4'. A red label 'temporally correlated errors' appears. Caption: 'The same child stays preferred, so greedy decoding repeats the same spoke.'

Scene 4. Split screen. Right, gray, 'if each visit ranked the children at random': the bar order reshuffles at every visit and the label reads 'same top-1 child: 1/5 = 20%'. Left, measured with margin 0: two red bars 'top-1 child the same: 96.7%' and 'second child the same: 76.7%'. Caption: 'Measured over consecutive visits to the root.'

Scene 5. The looping count of Section 4. For one trace, a tally table 'A: 3, B: 1, C (goal): 1', with the maximum '3' highlighted. Then a small line chart titled 'approximate, read from Figure 5': red line for margin 0 with values 17.1, 5.5, 3.7, 3.3, 3.3, 3.1 at T = 0, 0.2, 0.4, 0.6, 0.8, 1.0. Caption: 'Looping count = visits of the most visited root child, averaged over 500 test traces.'

Scene 6. The margin variant with m = 0.1. After the walk visits A once, A's training bar drops from 0.2 to 0.1, and the four other bars rise to 0.225 each, with the label '0.2 + 0.1/4 = 0.225'. Then a grouped bar chart of the measured fractions 'top-1 the same / second the same': margin 0 in red '96.7% / 76.7%', margin 0.05 in gold '77.1% / 53.7%', margin 0.1 in ink '61.6% / 48.0%', perfect learner under greedy decoding in purple '0%'. Caption: 'Training walks that favor new children weaken the bias but do not remove it.'

Scene 7. Both forces together (Appendix D). Left panel G(5,5): after one wrong visit, the visited child has a red bar 0.125 and four blue (#1E6091) bars 0.875/4 = 0.219, so greedy moves to a new child. Right panel G(10,5): the visited child has a red bar 0.125 and nine blue bars 0.875/9 = 0.097, so greedy returns to the visited child, with a red loop arrow. Final ink line: 'T = 1 length: 44.7 vs 27.7 (about 1.5x) here, 105.5 vs 24.8 (about 4x) for risk aversion.' Caption: 'Small correlated errors loop under greedy decoding. Temperature helps more when the errors are small.'
`````

### 5. Why reasoning models loop · M05: Confidence that grows inside a loop

Output: `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m05-confidence-buildup.mp4`. Page 10 The catalyst: confidence that grows inside a loop.

`````text
VIDEO: Confidence that grows inside a loop
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2025-why-reasoning-models-loop\manim\m05-confidence-buildup.mp4
MISUNDERSTANDING TO FIX: A model that has looped for a while is as likely to leave the loop as at its start, and a 0.001 fraction of looping training data is too small to matter. In truth, the top-1 probability climbs toward 1 inside the loop, and a tiny looping bias dominates once the history contains a few repeats.

Scene 1. Title card: 'Confidence buildup during looping'. Subtitle: 'OpenThinker3-1.5B, AIME 2025 Problem I-5, greedy decoding'. Below, a strip of generated tokens in ink #100D12 moves to the left. Above the newest token, a small bar chart of the next-token distribution shows five bars. The tallest bar carries the label 'top-1'.

Scene 2. Before the loop. The strip shows varied reasoning text. The top-1 bar changes height from token to token, for example 0.4, 0.9, 0.7 (label: 'illustrative'). A plot grows at the bottom: x axis 'decoding step' from 0 to 30,000, y axis 'running average of top-1 (window 200)' from 0.5 to 1.0. A gold #B8860B curve moves between about 0.75 and 0.95 up to step 11,000. Corner label: 'values approximate, read from Figure 15'.

Scene 3. A vertical dashed red #C81D25 line appears near step 11,000 with the label 'final loop begins (approximate)'. The token strip now repeats the line 'Wait, 7 + 6 + 4 = 17, 7 + 5 + 5 = no.' three times. Each copy gets a red #C81D25 outline.

Scene 4. With each repeat, the top-1 bar grows: 0.85, 0.95, 0.99 (label: 'illustrative'). The other bars fade to gray #8A8A8A. The gold curve rises to about 0.97 near step 14,000 and stays near 1.0 until step 30,000 (label: 'approximate'). Caption: 'The longer the loop, the more sure the model is.'

Scene 5. Switch to the star graph G(5,5). Start node s in gold #B8860B, root r in ink #100D12, five spokes of 4 nodes each in ink, the goal leaf in purple #6A4C93. A red #C81D25 curved arrow from r to s carries the label 'reset'. A text box: 'Training data: 0.001 of the traces loop start, root, start, root forever. All other traces are as before.'

Scene 6. A dot bounces s, r, s, r. A counter 'root visit' counts 1 to 8. Next to r, two bars show the reset probability. The ink #100D12 bar ('normal data') stays at 0.3. The purple #6A4C93 bar ('ideal learner of the biased data, toy calculation') takes the values 0.30, 0.30, 0.32, 0.39, 0.60, 0.84, 0.96, 0.99 at visits 1 to 8. At visit 6 a small panel shows the weights: 'normal trace 0.999 x 0.7^6 x 0.3^5 = 0.000286' and 'loop trace 0.001 x 1 = 0.001', then 'loop trace posterior 0.78'. A note: 'The paper's trained model reaches about 1.0 near visit 6 to 8 (approximate, Figure 16).'

Scene 7. A summary table appears. Row 1: 'G(5,5) without exploration, greedy accuracy: about 0.17 without bias, about 0.00 with bias (approximate, Figure 17)'. Row 2: 'Margin 0.1, greedy accuracy: about 1.00 without bias, about 0.48 with bias (approximate, Figure 19)'. Final caption: 'The catalyst does not start a loop. It makes a loop harder to leave.'
`````

### 6. Why reasoning models loop · M06: Temperature: a stopgap, not a cure

Output: `public/notes/media/papers/2025-why-reasoning-models-loop/manim/m06-temperature-stopgap.mp4`. Page 11 Temperature: a stopgap, not a cure.

`````text
VIDEO: Temperature: a stopgap, not a cure
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\papers\2025-why-reasoning-models-loop\manim\m06-temperature-stopgap.mp4
MISUNDERSTANDING TO FIX: Raising the temperature fixes looping, so a model that no longer loops at temperature 1 works as well as a perfect learner. In truth, temperature never changes the order of the learned probabilities. It only adds exploration, so a model with large errors in learning still produces much longer chains.

Scene 1. The star graph G(5,5). Start node s in gold #B8860B, root r in ink #100D12, five spokes of 4 nodes each. The correct spoke is blue #1E6091, the four wrong spokes are ink #100D12, and the goal leaf is purple #6A4C93. A red #C81D25 arrow from r to s carries the label 'reset 0.3'. Five arrows from r to the first node of each spoke carry the label '0.14'. Title: 'Markovian student at the root'.

Scene 2. A gold #B8860B temperature dial appears at the top, set near T = 0. The reset arrow becomes thick with the label 'about 1'. The five child arrows become thin and gray #8A8A8A. A dot walks s, r, s, r and leaves a red #C81D25 trail. Caption: 'Greedy: the reset wins because 0.3 > 0.14.'

Scene 3. The dial turns to T = 0.5, then T = 1, then T = 2. The labels change together: 'reset 0.479, each child 0.104', then 'reset 0.3, each child 0.14', then 'reset 0.226, each child 0.155'. All five child labels always show the same number. Caption: 'Temperature never changes the order. The five children stay equal.'

Scene 4. At T = 1 the dot leaves the start-root loop. It enters a wrong spoke, reaches its leaf, returns to s along a red #C81D25 reset arrow, and tries again. After several tries it reaches the purple #6A4C93 goal. A step counter runs in the corner. Caption: 'Exploration ends the loop, but not the wrong tries.'

Scene 5. Two horizontal bars: 'learned model at T = 1: 105.5' in red #C81D25 and 'perfect learner: 24.8' in purple #6A4C93. The text '105.5 / 24.8 = 4.25 (the paper: about 4x)' appears. Below, a second pair for temporally correlated errors: '44.7' in red #C81D25 and '27.7' in purple #6A4C93, with '44.7 / 27.7 = 1.61 (the paper: about 1.5x)'. Caption: 'Large errors give a large blowup. Small errors give a small blowup.'

Scene 6. Open models at temperature 1.0, label 'approximate, Figure 1b'. Three bars of average chain length: OpenThinker3-1.5B about 19,000 tokens in red #C81D25, OpenThinker3-7B about 16,400 in gold #B8860B, QwQ-32B (teacher) about 14,900 in blue #1E6091. A note below: 'looping fraction at T = 1.0: about 0.01, 0.01 and 0.00 (approximate, Figure 1a)'. Caption: 'The students barely loop, but they still write longer chains.'

Scene 7. Split screen. Left: a gold #B8860B box 'inference time: raise temperature' with an arrow to a red #C81D25 box 'loops'. Right: four blue #1E6091 boxes 'hints at high-loss positions', 'better curricula', 'new architectures', 'bias traces toward new actions', each with an arrow to an ink #100D12 box 'errors in learning'. Tags: the first three 'suggested, not tested', the last 'tested in the toy task only'. Final caption: 'Temperature is a reasonable fix when errors are small, and a stopgap when they are large (Section 5).'
`````
