---
title: "E7: Structured vs plain context"
order: 7
summary: "The same table of production orders as pretty JSON, compact JSON, XML, a Markdown table, CSV or prose: what does each format cost in tokens, and what does it do to accuracy on lookups, filters and aggregates? A SQL tool is the control. Covers bootcamp topic 12."
status: not-started
tags: [research, formats, json, xml, tables, tokens, nl2sql]
---

## 1. Research question

The same records can enter the window in many formats: JSON, XML, a Markdown table, CSV or plain sentences. For a fixed table, what does each format cost in tokens? Does the format change accuracy on lookups, filters and aggregates? And how does any format compare with a tool that computes the answer in code?

## 2. Why it matters

Tool results and retrieved records enter the window in a format that your code chooses. The production decisions are:

1. Which format the capstone's tools return to the model, and which they return to the application (lesson [6.4](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors), section 4.3).
2. When a question needs computation, whether the model reads rows or calls a tool that aggregates them.

The experiment uses a manufacturing table, close to NL2SQL work. It also builds on lessons [1.2](/notes/ai/context-engineering/01-foundations/l2-tokens-and-tokenizers) (token counts differ by kind of text), [3.3](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order) (tags and delimiters) and [7.6](/notes/ai/context-engineering/07-compress-and-isolate/l6-token-budgets) (truncating large results).

## 3. Hypothesis

- **H1 (tokens, no model needed).** Pretty-printed JSON needs at least 2 times the tokens of CSV for the same rows.
- **H2.** On single-cell lookups at 50 rows, every format scores within 5 points of the best format.
- **H3.** On aggregates at 800 rows, every in-context format scores below 50%. The SQL tool scores at least 30 points higher than the best format.
- **H4.** At 200 rows, CSV and the Markdown table are at most 3 points less accurate than pretty JSON on every question type.

Each hypothesis is wrong if its measured value is on the other side of its threshold.

## 4. Background

- **Tags separate parts.** Anthropic's guide says: "Wrapping each type of content in its own tag (for example, `<instructions>`, `<context>`, `<input>`) reduces misinterpretation" (lesson 3.3). It does not rank data formats against each other.
- **A marked end.** Lesson 3.3 compares XML tags with Markdown headers: a tag marks where data ends, a header does not.
- **Text for the model, data for the application.** An MCP tool can return a short text `content` for the model. Typed `structuredContent` goes to the application (lesson 6.4).
- **Make results small.** Lesson 6.4 lists pagination, aggregation, truncation notes and filtering. Lesson 7.6 truncates a 550-row result and adds a note. Both prefer computing in code to dumping rows.
- **Format changes the token count.** Code, numbers and JSON need more tokens than prose of the same length (lesson 1.2). The handbook FAQ suggests converting tables to Markdown before chunking (lesson 4.5).

No source in this subject measures accuracy by format. That is the gap that this experiment fills for your model.

## 5. Method

**Dataset.** Generate a table of production orders with a fixed seed. It has seven columns:

| Column | Values |
|---|---|
| `order_id` | PO-104000 and up |
| `line` | L1 to L6 |
| `product` | 5 bakery products |
| `qty_planned` | 1,200 to 6,000, in steps of 1,200 |
| `qty_done` | 0 up to `qty_planned`, consistent with the status |
| `status` | planned, running, done, held |
| `due_date` | 2026-10-13 to 2026-10-30 |

Load the same rows into SQLite, so that SQL computes every reference answer.

**Formats.**

| Code | Format |
|---|---|
| F1 | JSON, an array of objects, indented by 2 spaces |
| F2 | JSON, compact, no spaces |
| F3 | XML, one `<order>` element per row, one child element per column |
| F4 | Markdown table with a header row |
| F5 | CSV with a header row |
| F6 | Prose: one sentence per row, for example "Order PO-104000 on line L6 makes Brioche bun 6-pack." |
| F7 | Control: no rows in the window. The model gets the schema and a `run_sql` tool on SQLite. |

> [!example] Worked example: token counts of one generated table
> Counted with `o200k_base` on 2026-10-12, for one table from the generator above (seed 7):
>
> | Format | Tokens, 50 rows | Tokens, 800 rows | Tokens per row | Ratio to CSV |
> |---|---|---|---|---|
> | F1 pretty JSON | 3,712 | 59,365 | 74.2 | 2.61 |
> | F2 compact JSON | 2,463 | 39,366 | 49.2 | 1.73 |
> | F3 XML | 3,636 | 58,101 | 72.6 | 2.55 |
> | F4 Markdown | 1,737 | 27,238 | 34.0 | 1.20 |
> | F5 CSV | 1,437 | 22,760 | 28.5 | 1.00 |
> | F6 prose | 2,352 | 37,603 | 47.0 | 1.65 |
>
> Pretty JSON repeats every key name in every row, plus the indentation. CSV states the keys once. Your generator will give slightly different numbers. Count them again before you test H1.

**Question types.** Ten questions of each type per table size, generated from templates with SQL answers:

| Type | Example |
|---|---|
| Lookup | "What is the status of order PO-104233?" |
| Filter count | "How many orders on line L3 are held?" |
| Aggregate | "What is the total planned quantity on line L2 due before 2026-10-20?" |
| Comparison | "Which line has the most running orders?" |
| Multi-condition | "Which orders of Naan 2-pack have done less than half of their plan?" |

**Sizes.** 50, 200 and 800 rows. At 800 rows, pretty JSON stays below 100K tokens, so the lower price tier of Claude Haiku 5.5 applies.

**Models.** Claude Haiku 5.5 for all cells. Claude Sonnet 5.5 for the 200-row cells, to check the shape of the result.

**Trials and randomization.** 3 sizes × 6 formats × 50 questions × 2 repeats = 1,800 trials, plus 300 tool trials. Put the table first and the question last. Run the 100 trials of one (size, format) cell one after the other. Then the table is a cached prefix. Randomize the order of the cells, and the order of the questions within each cell, with a fixed seed.

**Cost estimate.** Each trial sends the table, 200 other input tokens and gets 100 output tokens.

> [!example] Worked example: the cost of the format trials
> On Claude Haiku 5.5 (USD 0.10 / 0.50 per MTok, cache write USD 0.125 and cache read USD 0.01, checked on 2026-10-12):
>
> - Without caching: about 3.34 USD for the 1,800 trials.
> - With caching, one write and 99 reads per cell: about 0.48 USD.
>
> On Claude Sonnet 5.5, the same trials cost about 66.70 USD without caching and about 6.50 USD with it. The tool control costs about 0.11 USD on Haiku 5.5, at about 2 calls of 1,000 input tokens per trial.

## 6. Metrics

- **Exact-match accuracy** per format, size and question type. Normalize case and spaces. Numbers must match exactly. For a list answer, the set of IDs must match.
- **Tokens per row:** table tokens divided by rows, counted locally. **Input tokens per trial:** from `usage`.
- **Accuracy per 1,000 input tokens:** $A / (\bar{I} / 1{,}000)$.
- **Cost per correct answer:** the cost of a cell divided by its correct trials, with and without caching.
- **Paired differences** between formats on the same questions, with the test of [E1](/notes/ai/context-engineering/11-research-track/e1-context-utilization).

## 7. Report

**Token table.** One row per format. Columns: tokens at 50, 200 and 800 rows, tokens per row, and the ratio to CSV. This table tests H1 without any model call.

**Accuracy table.** One row per format and size. One column per question type, plus the mean, the mean input tokens and the cost per correct answer.

**Plot.** Accuracy on aggregates against table size, one line per format and one for the SQL tool. Name the line colors in the title.

**Decision lines.** The format of `search_docs` results and of any table that a capstone tool returns. The question types that must go to a tool instead of the window.

## 8. Threats to validity

1. **One table shape.** Wide tables, nested data and free-text columns behave differently. This table has 7 short columns.
2. **Generated questions.** Templates make the questions regular. Write 10 questions by hand per size as a check.
3. **Cell order and caching.** Running a cell in one block keeps the cache warm, but it puts a cell's trials close in time. Randomize the cell order to spread drift.
4. **Format details.** The indentation of JSON, the quoting of CSV and the element names of XML are choices. Each choice changes the token count.
5. **Tool errors.** The SQL control depends on correct SQL. Count failed queries apart from wrong answers.

## 9. Extensions

1. **Column order and naming:** put the asked column first, or use short column names, and measure the change.
2. **Nested data:** orders with a list of quality checks each, as nested JSON against flat tables.
3. **Retrieval over rows:** index the rows as chunks (M2) and retrieve only the matching rows, instead of sending the table.
4. **Real schema text:** the same design on the column descriptions of a data dictionary, the core context of NL2SQL.

## 10. Check questions

```check
{
  "question": "Pretty JSON uses about 74 tokens per row and CSV about 28.5. A tool returns 200 rows on every one of 50,000 calls per day. What does the format choice cost per day at USD 2 / MTok input?",
  "answer": "Pretty JSON: 74 × 200 × 50,000 = 740 MTok per day, which is about 1,480 USD. CSV: 28.5 × 200 × 50,000 = 285 MTok, about 570 USD. The difference is about 910 USD per day, before any question of accuracy. An aggregate from a tool would cost far less than either."
}
```

```check
{
  "question": "Why does the design include the SQL tool condition F7, which sends no rows at all?",
  "answer": "It answers the production question behind the format question: should the model read rows at all? If every format fails on aggregates and the tool succeeds, the right design is to compute in code and send the result, whatever the format. Without the control, the experiment could only rank formats that may all be the wrong design."
}
```

```check
{
  "question": "Why does the method run the 100 trials of one cell one after the other instead of fully shuffling all 1,800 trials?",
  "answer": "The table is the same prefix for every question of a cell. Run together, the trials hit the prompt cache, which cuts the cost on Haiku 5.5 from about 3.34 to about 0.48 USD. Fully shuffled trials would switch tables on every call and miss the 5-minute cache. The price is a threat to validity: a cell's trials are close in time, so the cell order is randomized to spread any drift."
}
```

## 11. Links

- Previous: [E6: Source trust and attribution](/notes/ai/context-engineering/11-research-track/e6-source-trust)
- Next: [E8: Context precision and recall](/notes/ai/context-engineering/11-research-track/e8-context-precision-recall)
- [Lesson 3.3: Structure, delimiters and order](/notes/ai/context-engineering/03-system-layer/l3-structure-delimiters-and-order)
- [Lesson 6.4: Tool results and errors](/notes/ai/context-engineering/06-tools-and-mcp/l4-tool-results-and-errors)
- Capstone: [M3: Tools and MCP](/notes/ai/context-engineering/10-capstone/m3-tools-and-mcp)
- [Glossary](/notes/ai/context-engineering/glossary)
