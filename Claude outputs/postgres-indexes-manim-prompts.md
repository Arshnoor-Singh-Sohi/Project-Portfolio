# Claude Code prompts: PostgreSQL indexes and query plans (Manim)

5 videos for part 06 of the PostgreSQL notes, "Indexes and query plans". Every lesson already has a `video` block that points to the output path. A video appears in the notes as soon as its file exists.

## How to run

Open a new Claude Code session in `C:\Users\ASohi\Downloads\Project-Portfolio` and paste one line:

```text
Read "Claude outputs/postgres-indexes-manim-prompts.md" and follow its run rules.
```

Paste the same line again to continue a stopped run. Finished videos are skipped.

## Run rules (for Claude Code)

1. Run only one Claude Code session on this repository at a time. Two sessions can erase each other's changes.
2. Work through the queue table below in order.
3. Before each video, check its output path. If the file already exists, skip the video. So a run is safe to repeat, and a stopped run can continue.
4. Make each video with the shared rules and its prompt below. The prompt is the full specification. Use its exact labels and numbers. They come from real test output.
5. After each finished video, add one row to `Claude outputs/agent-harness-manim-report.md`. If that file does not exist, create it with this header:

   ```text
   | Date | File | Duration | Size | Checks |
   |---|---|---|---|---|
   ```

6. Do not edit any file in `src/`, and do not edit this prompt file. Chat Claude reads the report and updates the media queue.
7. At the end, list the videos of the queue that are still missing.

## Queue

| # | Video | Output path | Lesson |
|---|---|---|---|
| 1 | PostgreSQL · M03: Inside a B-tree: 3 index pages and 1 heap page for one row among 1,049,965 | `public/notes/media/postgres/manim/m03-btree-descent.mp4` | 6.1 B-tree indexes |
| 2 | PostgreSQL · M04: Column order in a two-column index decides how much of it a query reads | `public/notes/media/postgres/manim/m04-composite-index-order.mp4` | 6.2 Multicolumn indexes |
| 3 | PostgreSQL · M05: Seq Scan, Index Scan, Bitmap Scan: where the crossover lies | `public/notes/media/postgres/manim/m05-seq-vs-index-crossover.mp4` | 6.3 Index scan vs sequential scan |
| 4 | PostgreSQL · M06: Reading EXPLAIN ANALYZE: per-loop numbers, buffer totals, and a DELETE that really runs | `public/notes/media/postgres/manim/m06-reading-explain-analyze.mp4` | 6.4 EXPLAIN and EXPLAIN ANALYZE |
| 5 | PostgreSQL · M07: ON DELETE CASCADE: one child lookup per deleted parent row | `public/notes/media/postgres/manim/m07-cascade-delete-fk-index.mp4` | 6.5 Foreign keys and ON DELETE CASCADE |

## Shared rules (apply to every video)

`````text
SHARED RULES (apply to this video)

You make one teaching video with Manim Community Edition for my study notes.

Repository: C:\Users\ASohi\Downloads\Project-Portfolio
- Do not edit any file in src/. The lesson already has a video block that points to the output path.
- Write the Manim source in C:\Users\ASohi\Downloads\manim-work\postgres-indexes\ (create it if needed), not inside the repository.
- Save only the final .mp4 at the output path given below. Create the folder if it does not exist.
- Delete the intermediate render folders in manim-work after the final file is copied.

Format
- 1920x1080, 30 fps. Render with: manim -r 1920,1080 --fps 30 ...
- White background #FFFFFF. Main text ink #100D12.
- No audio. All explanation is on-screen text: short phrases, at most 12 words per caption.
- No text smaller than 32 px. Use one clean sans-serif font for all text, and a monospace font for code, field names and ids.
- One idea per scene. Show the input, then the operation, then the output. Hold the final state of each scene for 2 seconds.
- Total length 45 to 100 seconds.
- Use the exact labels, ids and numbers from the scene list. Do not invent other numbers.

Color legend (use it for every element)
- System prompt and instructions: purple #6A4C93
- User message: blue #1E6091
- Assistant message (model output): ink #100D12
- Tool call and tool result: teal #2A9D8F
- Stored state (database row, session file, checkpoint): green #2D6A4F
- Model provider and API: gold #B8860B
- Transient view (exists for one call only): gray #8A8A8A, dashed outline
- Error, data loss, bug: red #C81D25

Checks before you finish
1. Render the video.
2. Extract one frame at the end of each scene with ffmpeg and look at every frame.
3. Fix every overlap, every cut-off label, every spelling error and every wrong number. Render again.
4. Report: the output path, the duration in m:ss, the file size, and one line per scene.
`````

## Prompts

### 1. PostgreSQL · M03: Inside a B-tree: 3 index pages and 1 heap page for one row among 1,049,965

Output: `public/notes/media/postgres/manim/m03-btree-descent.mp4`. Lesson 6.1 B-tree indexes.

`````text
VIDEO: Inside a B-tree: 3 index pages and 1 heap page for one row among 1,049,965
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\postgres\manim\m03-btree-descent.mp4
MISUNDERSTANDING TO FIX: "An index is one long sorted list, and a lookup searches through it, so a bigger index means a slower lookup." In fact a lookup reads exactly one page per level (3 pages for 1,049,965 rows) and then one heap page. A range scan descends once and then moves sideways along right-links. The tree grows a new level only after about 165 times more rows.

Scene 1. Title card in ink (#100D12): 'One row among 1,049,965'. Below it, a large grid of small green (#2D6A4F) squares labeled 'messages heap: 23,863 pages, 44 rows per page, no order'. A blue (#1E6091) query box enters from the left: 'chat_id = 26bbaaf2..., seq = 3'. A red (#C81D25) scan line sweeps across every square, row by row, while a red counter rises from 0 to '23,863 pages read'. A red caption: 'Seq Scan: Rows Removed by Filter: 1,049,964'. A gold (#B8860B) label in the corner: '173.7 ms on PostgreSQL 16.15'.

Scene 2. Why many keys per page. Left side: a tall gray dashed (#8A8A8A) binary tree with one key per node, 21 levels, labeled 'binary tree: 21 levels, up to 21 page reads'. Right side: a short green tree with 3 levels, labeled 'B-tree: 3 levels'. Between them, one green page drawn as a box 8,192 bytes wide, split into labeled bands: 'header 24 B', 'item identifiers 4 B each', 'items', 'special space 16 B (sibling links)'. Ink arithmetic below the box: '8,192 - 24 - 16 = 8,152 usable bytes', 'one entry (chat_id, seq) = 32 + 4 = 36 bytes', '8,152 / 36 = 226 entries max'. A gold note: 'comparisons stay about 21: 6 + 8 + 7. Page reads drop from 21 to 3.'

Scene 3. The real tree of messages_chat_seq_key. At the top, a small green box 'metapage, block 0: root = 281, level = 2'. Below it, one green box 'root 281 (level 2): 42 downlinks'. Below that, a row of 42 small green boxes labeled 'level 1: 42 internal pages, avg 164.7 downlinks'. At the bottom, a long row of tiny green boxes labeled 'level 0: 6,916 leaf pages, avg 151.8 entries'. Dashed ink arrows run left to right along each level, labeled 'right-link'. Ink arithmetic on the side: '6,916 / 42 = 164.7', 'ln 6,916 / ln 164.7 = 1.73 -> 2 levels above the leaves', 'height = 3'.

Scene 4. The descent, one page at a time. The blue key '(26bbaaf2..., 3)' travels down. In root 281, two items light up: 'item 7: 21aaee12...' and 'item 8: 279a76c6...'. The key fits between them, and an arrow labeled 'item 7 -> block 3146' leads down. In internal page 3146, the first item is highlighted as 'high key 279a76c6...' and item 137 lights up: '(26bbaaf2..., minus infinity) -> block 437'. In leaf 437, items 2 to 6 appear as five rows 'seq 1..5', and item 4 lights up: 'seq 3 -> TID (18,37)'. A final arrow leaves the tree to a single green heap square labeled 'heap block 18, item 37: chat 42, seq 3, role user'. A gold buffer counter in the corner counts 1, 2, 3, 4 as each page lights up, and ends with 'Buffers: shared hit=4 (metapage cached, not counted)'.

Scene 5. A range scan moves sideways. The blue query changes to 'chat_id >= 26bbaaf2... ORDER BY chat_id, seq LIMIT 1000'. One descent repeats quickly to leaf 437. Then a blue marker follows right-links along the leaf row: 437 -> 6638 -> 4497 -> 2088 -> 2715 -> 6022 -> 824. Under each leaf, a running total appears: 121, 242, 394, 617, 739, 852, 1,004. The marker stops at 824 with 'LIMIT 1000 reached'. The upper levels stay dim to show that the scan never returns to them. Gold summary: '2 upper pages + 7 leaves + 1 visibility map page = 10 buffers'. A small gray dashed note: 'block numbers jump around: order lives in the links, not in the file'.

Scene 6. Inserts and page splits. A green leaf box filled to the edge with entries, labeled '226 entries, full'. A blue new entry arrives and does not fit. The leaf splits into two green boxes, about half full each, and a new downlink drops into the parent, which gains one item. The right-link arrows re-attach: left -> new -> old right sibling. Then a two-row comparison table fades in (green bars, ink labels): 'ascending inserts: 366.6 of 407 per leaf (90%)' and 'random inserts: 297.3 of 407 per leaf (73%)'. Below it, two green bars for the same 1,049,965 keys: 'grown by random inserts: 6,960 pages (54 MB)' and 'CREATE INDEX, fillfactor 90: 5,208 pages (41 MB)'.

Scene 7. Summary card in ink with three lines: '1. A lookup reads one page per level: 3 index pages + 1 heap page for 1,049,965 rows.' '2. A range scan descends once, then follows right-links.' '3. Index entries carry no visibility: every match is still checked in the heap or the visibility map.' A gold footer: 'each extra level multiplies the reach by about 165'.
`````

### 2. PostgreSQL · M04: Column order in a two-column index decides how much of it a query reads

Output: `public/notes/media/postgres/manim/m04-composite-index-order.mp4`. Lesson 6.2 Multicolumn indexes.

`````text
VIDEO: Column order in a two-column index decides how much of it a query reads
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\postgres\manim\m04-composite-index-order.mp4
MISUNDERSTANDING TO FIX: "An index on (a, b) serves any query on a or b, and the most selective column should come first." The index is one list sorted by a, then by b. Equality on the leading column plus a range on the next column limits the scanned part. A range on the first column, or a missing first column, makes the scan read a wide part or all of the leaf level, unless PostgreSQL 18 can skip between few leading values.

Scene 1. Title card: 'One list, sorted twice: (owner_id, updated_at DESC)'. Below it, a horizontal strip of 292 small green (#2D6A4F) boxes labeled 'leaf pages of chats_owner_updated_idx (292 pages, about 171 entries each)'. Zoom into the first box: ink (#100D12) rows 'user-0001 | 2026-09-28 20:11', 'user-0001 | 2026-09-13 13:32', '...', 'user-0001 | 2026-01-09 08:10', then 'user-0002 | 2026-09-27 21:49'. A caption: 'owner ascending, then newest first inside each owner. 7 owners per leaf page.'

Scene 2. Above the strip, a green tree: one root box 'root (block 295)', two internal boxes, arrows down to the leaf strip. A blue (#1E6091) query box enters: "owner_id = 'user-0042' ORDER BY updated_at DESC LIMIT 20". A blue arrow descends root -> internal -> one leaf box (3 pages), then moves right along 20 entries. 20 thin arrows go down to a separate strip of green heap pages. A gold (#B8860B) counter shows 'Buffers: 3 index + 20 heap = 23. No Sort.'

Scene 3. Split screen. Left: index (owner_id, updated_at DESC) with query "owner_id = 'user-0042' AND updated_at >= '2026-06-01'": the arrow lands inside the user-0042 group and reads 13 entries. Gold counter: '3 index pages + 13 heap pages = 16'. Right: index (updated_at, owner_id), 247 leaf pages. The same query starts at '2026-06-01' and walks right across 22,814 entries. Each entry flashes red (#C81D25) when owner_id is not user-0042, green when it matches (13 times). Gold counter: '115 index pages + 13 heap pages = 128'. Caption: 'updated_at is the most selective column (50,000 distinct values), yet it is the wrong first column.'

Scene 4. Back to (owner_id, updated_at DESC). Query: "owner_id BETWEEN 'user-0001' AND 'user-0500'". A blue bracket covers 69 leaf pages. Gold counter: '72 buffers, 12,500 rows'. Then the query gains "AND updated_at >= '2026-10-01'". The same bracket stays. Inside it, most entries turn gray dashed (#8A8A8A) as rejected inside the index, and 207 stay. Gold counter: '72 buffers, 207 rows'. Caption: 'A condition on the second column is checked inside the index. It does not shrink the scanned range.'

Scene 5. New green strip: 'messages_role_created_idx (role, created_at): 3,816 leaf pages'. The strip has two halves labeled 'assistant' and 'user'. Query box: 'created_at in one hour, no role condition (160 rows)'. Left panel 'PostgreSQL 16.15': a red sweep reads every leaf page from left to right. Gold counter: '3,819 buffers, 40.5 ms'. Right panel 'PostgreSQL 18.6': blue arrows jump from the root five times (label 'Index Searches: 5'): to the start, into the hour inside 'assistant', to the first 'user' entry, into the hour inside 'user', and to the end. Gold counter: '26 buffers, 0.225 ms'.

Scene 6. Skip scan has limits. The chats index strip returns, now with 2,000 owner groups, about 7 per leaf page. Query 'updated_at >= 2026-10-01, no owner'. A blue arrow tries to jump per owner but every jump lands on the next page anyway, so the arrows merge into one sweep across all 292 pages. Gold text: 'PostgreSQL 18: Index Searches: 1, planner picks Seq Scan'. Caption: 'Skip scan pays only when the leading column has few distinct values.'

Scene 7. Summary card in ink with three lines: '1. Equality columns first, then one range or ORDER BY column.' '2. Conditions after the first range are checked in the index, but the range stays wide.' '3. PostgreSQL 18 can skip a missing leading column with few values. On 16 and 17, write the values as an IN list.'
`````

### 3. PostgreSQL · M05: Seq Scan, Index Scan, Bitmap Scan: where the crossover lies

Output: `public/notes/media/postgres/manim/m05-seq-vs-index-crossover.mp4`. Lesson 6.3 Index scan vs sequential scan.

`````text
VIDEO: Seq Scan, Index Scan, Bitmap Scan: where the crossover lies
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\postgres\manim\m05-seq-vs-index-crossover.mp4
MISUNDERSTANDING TO FIX: "If an index exists on the filtered column, PostgreSQL should use it, and an index scan is always faster than reading the whole table." An index helps only when the matching rows lie on few heap pages. At 44 rows per page, 5% of randomly placed rows already touch 89.5% of the pages, and the physical row order decides where the crossover lies.

Scene 1. Title card: 'Index scan vs sequential scan: where the crossover lies'. Below it, a grid of small green (#2D6A4F) squares labeled 'msg_time_shuffled heap: 23,872 pages, 1,049,965 rows, 44 rows per page'. To its left, a small green tree of three levels labeled 'index on created_at: 2,148 pages, 3 levels'. Above both, a blue (#1E6091) query box: 'SELECT * FROM msg_time_shuffled WHERE created_at < cutoff'. Ink (#100D12) caption: 'Same query, different cutoffs. Which way to read?'

Scene 2. Seq Scan. A gold (#B8860B) read head sweeps the heap grid in page order, row of squares by row of squares, and every square lights up once. A counter in the top right climbs to 'buffers: 23,872'. A gold formula appears: '23,872 x 1.0 + 1,049,965 x (0.01 + 0.0025) = 36,996.56'. Ink caption: 'Same 23,872 pages and same cost for every cutoff.'

Scene 3. Index Scan. The cutoff label shows '2026-01-01 00:06'. A path lights from the root through one internal page to one leaf of the green tree. Two blue arrows go from the leaf to two heap squares. Counter: '5 buffers', gold label 'cost 24.51'. Then the cutoff label changes to '2026-01-15 (two weeks, 52,571 rows)'. Thousands of blue arrows leave the leaf level in key order and land on random heap squares. Squares that are hit a second or third time flash red (#C81D25). Counter: '52,676 buffers for 52,571 rows'. Gold label: 'cost 96,848.41: 23,872 pages x random_page_cost 4.0'.

Scene 4. Bitmap scan for the same two-week cutoff. The 52,571 matching index entries drop as dots into a gray dashed (#8A8A8A) grid with one cell per heap page, labeled 'bitmap in work_mem'. Marked cells fill 21,371 of the 23,872 cells. Then a gold read head sweeps the heap in page order and stops only at marked pages, skipping the unmarked 10.5%. Gold math beside it: '1 - (1 - 0.05)^44 = 0.896 -> 21,379 pages expected, 21,371 measured'. Counter: '21,481 buffers', gold label 'cost 25,380.22'.

Scene 5. A chart draws itself. x axis 'estimated share of matching rows, %' from 0 to 100. y axis 'estimated cost' from 0 to 125,000. A green horizontal line at 36,996.56 labeled 'Seq Scan'. A gold curve labeled 'Bitmap Heap Scan' rises from 0 to 53,726 at 100%. A red curve labeled 'Index Scan' rises steeply to 96,848 at 5% and 122,453 at 100%. Two markers with ink labels: 'Index Scan -> Bitmap: 5 -> 7 estimated rows' near x = 0, and 'Bitmap -> Seq Scan: 448,686 rows (42.7%)' where the gold curve reaches 36,630.26. A small gold note: 'switch at 36,996.56 / 1.01 = 36,630.26 (1% fuzz factor)'.

Scene 6. Same rows, different order. A second heap grid labeled 'msg_time_sorted: rows in created_at order, correlation = 1'. The two-week rows form one solid green band of 1,195 pages at the start of the grid. Blue arrows move through the band in order, without jumps. Counters side by side: 'shuffled: 21,481 buffers, 129.5 ms' and 'sorted: 1,305 buffers, 11.1 ms, cost 2,540.92'. Back on the chart, a blue (#1E6091) curve labeled 'Index Scan, sorted' stays under the green line until '756,391 rows (72.0%)'. A third small grid labeled 'chat order: correlation -0.0003' shows its matches in 2,404 pages grouped in clusters, with an ink note: 'same estimate as shuffled, 9 times fewer pages: correlation cannot see clusters'.

Scene 7. Summary card in ink with three lines: 'An index helps when the matching rows lie on few pages, not when they are few rows.' 'At 44 rows per page, 5% of random rows touch 89.5% of the pages.' 'Read Buffers and Heap Blocks in EXPLAIN (ANALYZE, BUFFERS), not only the plan name.'
`````

### 4. PostgreSQL · M06: Reading EXPLAIN ANALYZE: per-loop numbers, buffer totals, and a DELETE that really runs

Output: `public/notes/media/postgres/manim/m06-reading-explain-analyze.mp4`. Lesson 6.4 EXPLAIN and EXPLAIN ANALYZE.

`````text
VIDEO: Reading EXPLAIN ANALYZE: per-loop numbers, buffer totals, and a DELETE that really runs
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\postgres\manim\m06-reading-explain-analyze.mp4
MISUNDERSTANDING TO FIX: Learners read the actual rows and time of an inner node as totals, and think EXPLAIN ANALYZE only shows a plan. In fact time and rows are averages per loop (19.84 rows x 25 loops = 496), buffers and index searches are totals, and EXPLAIN ANALYZE executes the statement, so a DELETE really deletes unless it runs inside BEGIN and ROLLBACK.

Scene 1. Title card in ink (#100D12): 'EXPLAIN shows the plan. EXPLAIN ANALYZE runs it.' A blue (#1E6091) query box: SELECT c.title, m.seq, m.role FROM chats c JOIN messages m ON m.chat_id = c.id WHERE c.owner_id = 'user-0042'. An arrow leads to a gold (#B8860B) box 'planner', which draws a plan tree from the bottom upward in gray dashed (#8A8A8A) outlines: two leaf boxes 'Bitmap Index Scan on chats_owner_updated_idx' and 'Bitmap Index Scan on messages_chat_seq_key', above them 'Bitmap Heap Scan on chats c' (outer) and 'Bitmap Heap Scan on messages m' (inner), and at the top 'Nested Loop'. Arrows point upward. Caption: 'Read from the most indented node outward. Rows flow up.'

Scene 2. Plain EXPLAIN: estimates only. Gold (#B8860B) labels appear next to each node: Nested Loop 'cost=9.24..2755.03 rows=525', outer heap node 'cost=4.61..89.05 rows=25', inner heap node 'cost=4.63..106.38 rows=26 (per loop)'. The tree stays gray dashed (#8A8A8A) because nothing has run. An ink note: 'cost = arbitrary units, not milliseconds'.

Scene 3. EXPLAIN ANALYZE runs the tree. The outlines turn solid. The outer node sends 25 blue (#1E6091) chat tokens upward, one at a time. For each token, the inner pair of nodes flashes once, and an ink counter 'loops' climbs from 1 to 25. Beside the inner heap node, a box shows 'rows=19.84 per loop'. The multiplication '19.84 x 25 = 496' slides up to the Nested Loop label 'rows=496'.

Scene 4. Rounding, side by side. Left panel 'PostgreSQL 16': 'rows=20 loops=25', then '20 x 25 = 500' in red (#C81D25) next to the true count 496. Right panel 'PostgreSQL 18': 'rows=19.84 loops=25', then '19.84 x 25 = 496.0' in ink with a check mark. Caption: 'Actual rows and time are averages per loop. PostgreSQL 16 rounds them to whole rows. PostgreSQL 18 prints two decimals.'

Scene 5. Time per loop. The inner node shows 'actual time=0.011..0.013' and a small bar of 0.013 ms that copies itself 25 times into one bar labeled '0.013 x 25 = 0.325 ms'. A second bar 'outer: 0.122 ms'. A third, longer bar 'Nested Loop total: 0.518 ms' contains both, and the uncovered remainder is highlighted with the label '0.518 - 0.325 - 0.122 = 0.071 ms: the join's own work'.

Scene 6. Buffers are totals. The index messages_chat_seq_key appears as a green (#2D6A4F) tree with 3 levels: one root page, internal pages, leaf pages. One search lights 3 pages from the root to a leaf. The search repeats 25 times while two ink counters climb: 'Index Searches: 25' and 'Buffers: shared hit=75'. A line shows '75 / 25 = 3 pages per search'. Then 38 green heap pages of messages light: '75 + 38 = 113'. The outer side shows '3 + 25 = 28'. The top line shows '28 + 113 = 141'.

Scene 7. The trap. A blue (#1E6091) box 'EXPLAIN ANALYZE DELETE FROM chats WHERE owner_id = 'user-0042''. 25 green chat rows turn red (#C81D25) and disappear, then 496 green message rows disappear through the cascade. Two ink lines appear: 'Trigger for constraint messages_chat_id_fkey on chats: time=1.568 calls=25' and 'Trigger for constraint message_feedback_message_id_fkey on messages: time=4.005 calls=496', next to 'Delete node: 0.585 ms' and 'Execution Time: 7.320 ms'. Replay with the statement between 'BEGIN' and 'ROLLBACK': at ROLLBACK the rows return, but a sequence counter '50985 -> 51025' stays red. Final card: 'Multiply time and rows by loops. Buffers are totals. Writes go inside BEGIN ... ROLLBACK.'
`````

### 5. PostgreSQL · M07: ON DELETE CASCADE: one child lookup per deleted parent row

Output: `public/notes/media/postgres/manim/m07-cascade-delete-fk-index.mp4`. Lesson 6.5 Foreign keys and ON DELETE CASCADE.

`````text
VIDEO: ON DELETE CASCADE: one child lookup per deleted parent row
OUTPUT PATH: C:\Users\ASohi\Downloads\Project-Portfolio\public\notes\media\postgres\manim\m07-cascade-delete-fk-index.mp4
MISUNDERSTANDING TO FIX: "The foreign key already has an index, because the parent table has a primary key." Only the referenced side must have an index. ON DELETE CASCADE runs one DELETE on the child table for each deleted parent row. Without an index whose leading column is the foreign key column, each of those DELETEs reads the whole child table.

Scene 1. Title card: 'DELETE FROM chats: one statement, many hidden queries'. Three green (#2D6A4F) table boxes from left to right with ink (#100D12) labels: 'chats: 50,000 rows, 558 pages', 'messages: 1,049,965 rows, 23,863 pages', 'message_feedback: 50,985 rows, 425 pages'. Arrows between them labeled 'ON DELETE CASCADE'. A blue (#1E6091) query box above: 'DELETE FROM chats WHERE id IN (20 chats)'.

Scene 2. The 20 chat rows in the chats box turn blue one by one. For each one, a gray dashed (#8A8A8A) event card drops into a queue labeled 'after-trigger queue'. When the queue holds 20 cards, a label appears: 'RI_FKey_cascade_del, AFTER ROW: fires once per deleted chat'. The first card opens and shows the query text in blue: 'DELETE FROM ONLY "public"."messages" WHERE $1 OPERATOR(pg_catalog.=) "chat_id"'.

Scene 3. Case A, no index on messages.chat_id. For call 1, a red (#C81D25) scan bar sweeps across all 23,863 page squares of the messages box. Most pages flash red ('rows removed by filter'), one page flashes green ('the rows of this chat'). A gold (#B8860B) counter shows 'page accesses: 23,863'. The sweep repeats for calls 2 to 20 (animated at higher speed, each call reads the same 23,863 pages), and the counter climbs to '478,571'. A second gold counter shows 'rows read: 20,994,854'. Final caption: 'Trigger for constraint messages_chat_id_fkey: time=2706.147 calls=20 (PostgreSQL 18.6)'.

Scene 4. Case B, with the index messages_chat_seq_key (chat_id, seq). A green B-tree with three levels appears next to the messages box: 'root', 'internal', 'leaf' (level 2). For one call, a blue path goes root -> internal -> leaf (3 pages), then one arrow goes to the single heap page that holds the 12 rows of the chat. The gold counter for 20 calls ends at '1,403 page accesses (63 index, 1,340 heap)'. Caption: 'time=1.101 calls=20'.

Scene 5. A chart with x axis 'chats deleted N' (1, 2, 5, 10, 20, 50) and y axis 'page accesses on messages (thousands)'. The red line rises through 24, 48, 120, 239, 479, 1,197. The green line stays near zero: 0.125, 0.165, 0.457, 0.785, 1.403, 3.454. A gold label on the red line: 'about N x 23,863'. A gold label on the green line: 'about 3 per lookup plus about 3 per deleted message'.

Scene 6. The cascade chain. 20 chats fan out to 437 messages, and 437 gray dashed event cards drop into the queue for 'message_feedback_message_id_fkey'. Then the scene changes to 100 chats: '2,044 calls'. Three versions of the feedback index appear in turn, each with its trigger time on PostgreSQL 18.6. '(message_id, created_at)': each call is a short blue path through 3 index pages, '21.6 ms'. 'no index': each call is a red sweep over all 425 pages, a gold counter ends at '868,820 page accesses', '9,696 ms'. '(created_at, message_id)': the index stays gray and unused, the red sweeps continue, '11,035 ms'. Caption: 'The foreign key column must be the leading column of the index.'

Scene 7. Summary card in ink: 'Referenced side: always indexed (required). Referencing side: index it yourself, foreign key columns first.' Below it, a gold line: 'Without the index: N full scans of the child table. With it: N short index descents.' And a blue line: 'Find gaps: foreign keys whose columns are not the leading columns of a valid, non-partial index.'
`````
