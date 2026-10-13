---
title: "L2: Tokens and tokenizers"
order: 2
summary: "Models read and bill in tokens, not words. How byte-pair encoding makes tokens, how to count them exactly, and why code, numbers and other languages cost more."
status: not-started
tags: [foundations, tokens, bpe, tokenizer]
---

## 1. The question this idea answers

Every limit and every price of an LLM API is in tokens: the window size, `max_tokens`, the cost per million. But I write in words and characters. What exactly is a token? How many tokens does my text use? Why does the same text cost a different number of tokens on two models?

## 2. Mental model

> [!analogy] A box of building bricks
> A tokenizer has a fixed box of bricks. Some bricks are single letters. Other bricks are frequent pieces such as "ing" or " the". Very frequent words are one brick each. To build a text, the tokenizer uses the largest bricks that fit. A common word needs one brick. A rare word needs several small bricks.
>
> **Where it stops working:** the bricks do not follow grammar. Statistics on training text chose them, not a linguist. So the splits can look strange: "antidisestablishmentarianism" becomes `ant|idis|est|ablishment|arian|ism`. Also, each model family has its own box, so the same text gives different counts on different models.

## 3. Terms

| Term | Plain meaning |
|---|---|
| tokenizer | The program that converts text into a list of token IDs, and back. |
| vocabulary | The fixed set of all tokens that a tokenizer knows. Each token has a number: its token ID. |
| token ID | The integer that stands for one token. The model sees only these integers. |
| byte-pair encoding (BPE) | A method that builds a vocabulary by merging the most frequent pair of symbols, again and again. |
| merge rule | One learned step of BPE: "replace the pair A, B with the new symbol AB". |
| byte-level BPE | BPE that starts from the 256 possible byte values, so it can encode any text. |
| encoding | A named tokenizer with its vocabulary and merge rules, for example `o200k_base`. |
| special token | A token with a control job, for example the end of a turn. Users do not type it. |

## 4. Method and math

### 4.1 Why not characters, and why not words?

A model must have a fixed vocabulary. Two simple choices both fail:

| Choice | Problem |
|---|---|
| One token for each character | The vocabulary is small, but sequences become very long. Attention cost grows with the square of the length (lesson [L4](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length)). |
| One token for each word | Sequences are short, but the vocabulary must hold every word, name, typo and number. An unknown word has no token. |

Subword tokens sit between these two. Frequent words are one token. Rare words split into a few frequent pieces. No word is ever "unknown".

### 4.2 How BPE learns its vocabulary

Sennrich, Haddow and Birch adapted byte-pair encoding to text in 2016 (ACL 2016, "Neural Machine Translation of Rare Words with Subword Units"). The training algorithm is:

1. Split every word into single characters. Add an end-of-word marker, written here as `</w>`.
2. Count every pair of neighboring symbols in the training text.
3. Merge the most frequent pair into one new symbol. Save this as a merge rule.
4. Repeat steps 2 and 3 until the vocabulary has the target size.

> [!example] Worked example: five merges
> The training text has four words, with these counts: "low" × 5, "lower" × 2, "newest" × 6, "widest" × 3. When two pairs have the same count, this example takes the pair that comes first in alphabetical order.
>
> | Step | Merge | Count | Where the count comes from |
> |---|---|---|---|
> | 1 | `e` + `s` → `es` | 9 | newest (6) + widest (3) |
> | 2 | `es` + `t` → `est` | 9 | newest (6) + widest (3) |
> | 3 | `est` + `</w>` → `est</w>` | 9 | newest (6) + widest (3) |
> | 4 | `l` + `o` → `lo` | 7 | low (5) + lower (2) |
> | 5 | `lo` + `w` → `low` | 7 | low (5) + lower (2) |
>
> After 5 merges, "low" is one symbol, and the ending "est" is one symbol.

### 4.3 How BPE encodes a new word

To encode a word, apply the merge rules in the order that training learned them.

> [!example] Worked example: a word that training never saw
> Encode "lowest" with the five merges above.
>
> 1. Start: `l o w e s t </w>`
> 2. Merge 1 (`e s`): `l o w es t </w>`
> 3. Merge 2 (`es t`): `l o w est </w>`
> 4. Merge 3 (`est </w>`): `l o w est</w>`
> 5. Merge 4 (`l o`): `lo w est</w>`
> 6. Merge 5 (`lo w`): `low est</w>`
>
> Result: 2 tokens, `low` and `est</w>`. The tokenizer never saw "lowest", but it still encodes it with frequent pieces.

### 4.4 Byte-level BPE

GPT-2 (Radford et al., 2019) runs BPE on **bytes**, not on characters. There are only 256 possible byte values, so the base vocabulary has 256 symbols. Any text in any language, any emoji and any binary data can be encoded. GPT-2's vocabulary has 50,257 entries. Modern encodings are larger: OpenAI's `o200k_base` has about 200,000 tokens.

A larger vocabulary has two effects:

1. **Shorter sequences.** More words and word pieces fit into one token.
2. **A larger output layer.** The model must compute a probability for every token in the vocabulary at every step.

### 4.5 Rules of thumb, and their limits

| Source | Rule for English text | Checked |
|---|---|---|
| OpenAI help center | 1 token ≈ 4 characters ≈ ¾ of a word. 100 tokens ≈ 75 words. | 2026-10-12 |
| Google Gemini docs | 1 token ≈ 4 characters. 100 tokens ≈ 60 to 80 words. | 2026-10-12 |
| Anthropic glossary | On models before Claude 4.7, 1 token ≈ 3.5 English characters. Claude 4.7 and later use a newer tokenizer that gives about 30% more tokens for the same text. | 2026-10-12 |

A measurement with `o200k_base` and `cl100k_base` on two plain English paragraphs gave about 115 to 118 tokens per 100 words. So "100 words ≈ 130 tokens" is a safe upper estimate for plain English.

These rules fail for other kinds of text:

| Text | Effect on the token count |
|---|---|
| Code | Punctuation, indentation and identifiers split into many tokens. |
| Numbers and IDs | Long numbers, UUIDs and hashes split into many short tokens. |
| JSON | Quotes, braces and repeated keys add tokens. |
| Languages with non-Latin scripts | Usually more tokens for the same meaning. The ratio depends on the tokenizer. Measure it. |

> [!example] Worked example: two words
> With `o200k_base`, "context" is **1** token. "antidisestablishmentarianism" is **6** tokens: `ant|idis|est|ablishment|arian|ism`.

### 4.6 How to count exactly

Rules of thumb are good for planning. Use an exact count for budgets and for tests.

| Provider | Exact method | Notes |
|---|---|---|
| OpenAI | The `tiktoken` library: `tiktoken.get_encoding("o200k_base").encode(text)` | `encoding_for_model()` knows only the models in its table. Check that your model is in it. |
| Anthropic | The endpoint `POST /v1/messages/count_tokens`. It takes the same body as a Messages request and returns `{"input_tokens": N}`. | It is free, but it has its own rate limits. The docs call the result an estimate. The Claude tokenizer is not public. |
| All | The `usage` field of each response | This is the billed count. Log it on every call. |

> [!trap] Never mix tokenizers
> A `tiktoken` count is not a Claude count. A Claude 4.6 count is not a Claude 4.7 count. Count with the tokenizer of the model that you call.

### 4.7 Images also cost tokens

Images enter the window as visual tokens. Each provider has its own rule. The rules below were checked on 2026-10-12.

**Claude:** each 28 × 28 pixel patch is one visual token.

$$
\text{tokens} = \left\lceil \frac{w}{28} \right\rceil \times \left\lceil \frac{h}{28} \right\rceil
$$

The symbols mean:

- $w$ and $h$ are the width and the height of the image in pixels, after any resize.
- $\lceil x \rceil$ rounds $x$ up to the next whole number.

Large images are resized first. On models before Claude 4.7, the long edge is at most 1,568 pixels and an image costs at most 1,568 tokens. On Claude 4.7 and later, the long edge is at most 2,576 pixels and an image costs at most 4,784 tokens.

> [!example] Worked example: three images on Claude
> - 200 × 200 pixels: $\lceil 200/28 \rceil = 8$, so $8 \times 8 = 64$ tokens.
> - 1,000 × 1,000 pixels: $\lceil 1000/28 \rceil = 36$, so $36 \times 36 = 1{,}296$ tokens.
> - 560 × 280 pixels: $20 \times 10 = 200$ tokens.

**OpenAI:** current models cover the image with 32 × 32 pixel patches, and multiply the patch count by a factor for each model. Older models such as GPT-4o use 512-pixel tiles: 85 base tokens plus 170 tokens for each tile. **Gemini:** an image of 384 × 384 pixels or less costs 258 tokens. Larger images split into 768 × 768 tiles of 258 tokens each.

> [!note] Source check: image tokens
> **Corrected.** The handbook says that an image costs "1,600–6,400 tokens". On Claude the maximum is 1,568 (standard tier) or 4,784 (Claude 4.7 and later). A small image costs much less: 64 tokens for 200 × 200 pixels. The old formula "width × height / 750" is no longer in the Anthropic docs. Source: Anthropic, "Vision" docs, checked on 2026-10-12.

### 4.8 Production view

| Concern | What tokens mean for it |
|---|---|
| Cost | Price per token × tokens. Code-heavy and JSON-heavy prompts cost more than their character count suggests. |
| Limits | Chunk sizes, budgets and `max_tokens` are in tokens. A splitter that counts characters does not give token-sized chunks (Part 4). |
| Model changes | A new model can have a new tokenizer. The same prompt can grow by about 30% (Claude 4.7 and later). Re-measure budgets after a model change. |
| Multilingual users | The same answer can cost more tokens in another language. Measure the ratio for each language that you support. |
| Observability | Log the `usage` field of every call. It is the true count. |

## 5. Graphs

```plot
{
  "title": "Claude visual tokens for a square image (red), before the 1,568 cap",
  "xAxis": { "label": "side of the square image (pixels)", "domain": [0, 1150] },
  "yAxis": { "label": "visual tokens", "domain": [0, 1700] },
  "disableZoom": true,
  "data": [
    { "points": [[100, 16], [200, 64], [300, 121], [400, 225], [500, 324], [600, 484], [700, 625], [800, 841], [900, 1089], [1000, 1296], [1092, 1521]], "fnType": "points", "graphType": "polyline", "color": "#C81D25", "skipTip": true },
    { "points": [[100, 16], [200, 64], [300, 121], [400, 225], [500, 324], [600, 484], [700, 625], [800, 841], [900, 1089], [1000, 1296], [1092, 1521]], "fnType": "points", "graphType": "scatter", "color": "#C81D25", "skipTip": true }
  ]
}
```

The count grows with the **area** of the image, so it grows with the square of the side. Double the side, and the token count is about four times larger.

## 6. Code

These exercises go in `notebooks/01-foundations.ipynb`.

**Exercise 2.1: train a tiny BPE.**

1. Write `learn_merges(word_counts, n_merges)` that returns the list of merge rules.
2. Write `encode(word, merges)` that applies the rules in order.
3. Use the training text of section 4.2 and the same tie rule.

Acceptance tests:

- The first five merges match the table in section 4.2.
- `encode("lowest", merges)` returns `["low", "est</w>"]`.
- `encode("newest", merges)` returns fewer symbols after 8 merges than after 2 merges.

**Exercise 2.2: measure real tokenizers.**

1. With `tiktoken` and `o200k_base`, count the tokens of five texts. Use an English paragraph, a Python function, a JSON object, a paragraph in a non-Latin script and a list of 20 UUIDs.
2. For each text, print characters per token and tokens per 100 words.
3. If an Anthropic API key is available, count the same texts with `count_tokens` and compare.

Acceptance tests:

- A table with five rows and the two ratios.
- A sentence that names the text type with the most tokens per character, and explains why.

**Exercise 2.3: image cost function.** Write `claude_image_tokens(w, h, tier)` with the resize rule and the formula of section 4.7. Test it on the three images of the worked example.

## 7. Common mistakes

1. **"One token is one word."** For plain English, 100 words are about 115 to 135 tokens. For code and other scripts, the ratio is different.
2. **"500 characters is 500 tokens."** For English, 500 characters is about 125 tokens. Many text splitters count characters by default (Part 4).
3. **"The same text costs the same everywhere."** Each model family has its own tokenizer. Even two versions of one family can differ.
4. **"Token counts from tiktoken work for Claude."** They are only an estimate for Claude. Use `count_tokens` or the `usage` field.
5. **"Images are free context."** A 1,000 × 1,000 image costs 1,296 tokens on Claude, which is about 1,000 words of text.

## 8. One-minute explanation

A model does not read letters or words. It reads tokens: integers that stand for pieces of text. A tokenizer makes them with byte-pair encoding. Training starts from single bytes and merges the most frequent pair again and again. So common words become one token, and rare words become a few pieces. That is why "context" is one token but "antidisestablishmentarianism" is six. For plain English, one token is about four characters. Code, numbers, JSON and other scripts need more tokens. Every model family has its own tokenizer, so count with the right one. Use tiktoken for OpenAI and the count-tokens endpoint for Claude. Always log the usage field of the response. Images also cost tokens, by their area.

## 9. Check questions

```check
{
  "question": "With the merges of section 4.2, how does BPE encode the word \"low\"? How many tokens is it?",
  "hint": "Apply the merges in order: e+s, es+t, est+</w>, l+o, lo+w.",
  "answer": "Start: l o w </w>. Merges 1 to 3 do not apply. Merge 4 gives lo w </w>. Merge 5 gives low </w>. Result: 2 tokens, low and </w>. (With more merges, low + </w> could become one token.)"
}
```

```check
{
  "question": "A Claude model before 4.7 receives a 1,120 × 560 pixel image. How many visual tokens does it use?",
  "hint": "Divide each side by 28 and round up. Check the 1,568-pixel resize limit first.",
  "answer": "The long edge is 1,120 pixels, below 1,568, so there is no resize. ⌈1120/28⌉ = 40 and ⌈560/28⌉ = 20. Tokens = 40 × 20 = 800."
}
```

```check
{
  "question": "A team plans a 2,000-character limit for each chunk because the embedding model accepts 512 tokens. Is the plan safe for English text? For Python code?",
  "hint": "Convert characters to tokens with about 4 characters per token, then think about code.",
  "answer": "English: 2,000 / 4 ≈ 500 tokens, so it is close to the 512 limit and some chunks can be cut. Code uses more tokens per character, so many chunks will pass 512 tokens. Count with the real tokenizer, and set the limit in tokens."
}
```

```check
{
  "question": "Why does byte-level BPE never produce an unknown token?",
  "answer": "Its base vocabulary holds all 256 byte values. Every text is a sequence of bytes, so the worst case encodes each byte as its own token."
}
```

## 10. Links

- Previous: [L1: What a model does with context](/notes/ai/context-engineering/01-foundations/l1-what-a-model-does-with-context)
- Next: [L3: The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call)
- [L4: Attention, the KV cache and the cost of length](/notes/ai/context-engineering/01-foundations/l4-attention-and-the-cost-of-length): why longer sequences cost more
- [Glossary](/notes/ai/context-engineering/glossary)
