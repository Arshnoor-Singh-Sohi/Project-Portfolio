---
title: "L6: The cost of a conversation"
order: 6
summary: "Each call sends the whole history again. So the input of one call grows linearly with the turn number, and the total input of a conversation grows with the square of the number of turns."
status: not-started
tags: [foundations, cost, tokens, conversation]
---

## 1. The question this idea answers

How much more does a 50-turn conversation cost than a 5-turn conversation? The handbook says "10–20 times" and calls the growth "linear". Both claims need a check. This lesson builds the cost formula from first principles, so that I can compute the answer for any design.

## 2. Mental model

> [!analogy] A taxi that charges for every earlier kilometer again
> Picture a taxi meter with a strange rule. At each stop, it charges you for the full distance from the start of the trip, not only for the last leg. The charge at each stop grows step by step. The total of all the charges grows much faster, because each new charge includes all the old distance again.
>
> **Where it stops working:** prompt caching changes the meter. The provider charges a much lower rate for input that it saw before (lesson [L7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)). Also, a real conversation does not add the same number of tokens on every turn.

## 3. Terms

| Term | Plain meaning |
|---|---|
| fixed prefix ($S$) | The tokens sent on every call: system prompt, tool definitions and other fixed content. |
| turn growth ($t$) | The tokens that one turn adds to the history: the user message plus the reply. |
| per-call input | The input tokens of one call. |
| cumulative input | The sum of the input tokens of all calls in a conversation. |
| MTok | One million tokens. Prices are in USD per MTok. |
| linear growth | Growth by the same amount at each step. |
| quadratic growth | Growth with the square of the number of steps. |

## 4. Method and math

### 4.1 The model

Use these symbols:

- $S$: fixed prefix tokens on every call.
- $u$: tokens in each user message.
- $a$: tokens in each reply.
- $t = u + a$: tokens that one finished turn adds to the history.
- $k$: the number of the call: 1, 2, 3, …
- $N$: the number of turns in the conversation.
- $p_{in}$ and $p_{out}$: prices for input and output, in USD per MTok.

Call $k$ sends the prefix, the $k - 1$ finished turns and the new user message:

$$
I_k = S + u + (k-1)\,t
$$

This is **linear** in $k$: each call is $t$ tokens larger than the one before.

The cumulative input is the sum over all calls. The sum $0 + 1 + \cdots + (N-1)$ equals $\frac{N(N-1)}{2}$, so:

$$
C_N = \sum_{k=1}^{N} I_k = N\,(S+u) + t\,\frac{N(N-1)}{2}
$$

The second term grows with $N^2$. So the cumulative input is **quadratic** in the number of turns.

The total cost adds the output, which is $a$ tokens on each of the $N$ calls:

$$
\text{cost}_N = \frac{p_{in}\, C_N + p_{out}\, N\, a}{10^6}
$$

### 4.2 Worked example: 5 turns against 50 turns

> [!example] A support chatbot
> $S = 2{,}000$ tokens, $u = 100$, $a = 300$, so $t = 400$. Prices: USD 2 / MTok input and USD 10 / MTok output (Claude Sonnet 5.5, checked on 2026-10-12).
>
> **Per-call input:**
>
> - Call 5: $2{,}000 + 100 + 4 \times 400 = 3{,}700$ tokens.
> - Call 50: $2{,}000 + 100 + 49 \times 400 = 21{,}700$ tokens.
> - Ratio: $21{,}700 / 3{,}700 \approx 5.9$.
>
> **Cumulative input:**
>
> - 5 turns: $5 \times 2{,}100 + 400 \times \frac{5 \times 4}{2} = 10{,}500 + 4{,}000 = 14{,}500$ tokens.
> - 50 turns: $50 \times 2{,}100 + 400 \times \frac{50 \times 49}{2} = 105{,}000 + 490{,}000 = 595{,}000$ tokens.
> - Ratio: $595{,}000 / 14{,}500 \approx 41$.
>
> **Cost:**
>
> - 5 turns: $(2 \times 14{,}500 + 10 \times 1{,}500) / 10^6 = 0.029 + 0.015 = 0.044$ USD.
> - 50 turns: $(2 \times 595{,}000 + 10 \times 15{,}000) / 10^6 = 1.19 + 0.15 = 1.34$ USD.
> - Ratio: $1.34 / 0.044 \approx 30$.
>
> Ten times more turns cost about 30 times more. The history term ($490{,}000$ tokens) is now most of the bill.

### 4.3 The ratio depends on the size of the fixed prefix

The ratio $C_{50} / C_5$ depends on how large $S$ is compared with one turn. This table keeps $u = 100$ and $t = 400$ and changes $S$:

| $S / t$ | $S$ (tokens) | $C_{50} / C_5$ |
|---|---|---|
| 0 | 0 | 110 |
| 1 | 400 | 79 |
| 5 | 2,000 | 41 |
| 20 | 8,000 | 20 |
| 50 | 20,000 | 14 |
| 100 | 40,000 | 12 |

A large fixed prefix makes every call expensive, so the history matters less in relative terms. A small prefix makes the history dominate.

> [!note] Source check: "10–20 times, and cost scales linearly"
> **Corrected.** The handbook (Session 5, §2.1) says that "a 50-turn conversation on Claude Sonnet can cost 10–20x what a 5-turn conversation costs" and that "cost scales linearly". The cost of **one call** grows linearly with the turn number. The **total** cost grows quadratically. The ratio is 10–20 times only when the fixed prefix is about 20 to 100 times the size of one turn. With a small system prompt, the input ratio is 40 to 110 times.

### 4.4 Agents grow faster

An agent adds tool calls and tool results to the history at every step. A tool result can be thousands of tokens. So $t$ is large, and the quadratic term grows fast.

> [!example] An agent with large tool results
> $S = 6{,}000$ (system prompt and 20 tool definitions). Each step adds a 200-token tool call and a 3,000-token result, so $t \approx 3{,}200$. Take $u = 0$ for the steps after the first.
>
> After 30 steps: $C_{30} \approx 30 \times 6{,}000 + 3{,}200 \times \frac{30 \times 29}{2} = 180{,}000 + 1{,}392{,}000 = 1{,}572{,}000$ input tokens. At USD 2 / MTok that is about 3.14 USD of input for one task. The last call alone sends about $6{,}000 + 29 \times 3{,}200 = 98{,}800$ tokens.
>
> This is why tool-result clearing and compaction exist (Part 7).

### 4.5 Three ways to bend the curve

| Method | What it changes in the formula | Lesson |
|---|---|---|
| Prompt caching | Old tokens are billed at a much lower rate. The quadratic term stays, but with a small factor. | [L7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) |
| Compression | The history is cut or summarized, so $I_k$ stops growing. The per-call curve becomes a sawtooth. | Part 7 |
| Isolation | Sub-agents work in separate windows, so the main history grows by short summaries only. | Part 7 |

### 4.6 Production view

| Concern | What this lesson means for it |
|---|---|
| Cost | Model the cost of a full conversation or a full agent task, not of one call. |
| Budgets | Set a maximum number of turns or steps, or a token limit for the history. |
| Monitoring | Log `usage` per call and sum it per conversation. A cost per conversation that grows faster than the turn count is the quadratic term at work. |
| Latency | The per-call input grows, so the time to first token also grows during a long conversation. |

## 5. Graphs

```plot
{
  "title": "Input tokens of call k (red) and cumulative input after k calls (blue), in thousands of tokens",
  "xAxis": { "label": "turn number k", "domain": [1, 50] },
  "yAxis": { "label": "thousands of tokens", "domain": [0, 620] },
  "disableZoom": true,
  "data": [
    { "fn": "2.1 + 0.4*(x-1)", "color": "#C81D25" },
    { "fn": "2.1*x + 0.2*x*(x-1)", "color": "#1E6091" }
  ]
}
```

The red line is the input of one call: it is almost flat at this scale and ends at 21.7 thousand. The blue curve is the cumulative input: it bends upward and ends at 595 thousand. Same example as section 4.2.

```plot
{
  "title": "Cumulative cost in USD without caching (red) and with prompt caching (blue)",
  "xAxis": { "label": "turn number", "domain": [1, 50] },
  "yAxis": { "label": "cumulative cost (USD)", "domain": [0, 1.4] },
  "disableZoom": true,
  "data": [
    { "fn": "0.0042*x + 0.0004*x*(x-1) + 0.003*x", "color": "#C81D25" },
    { "fn": "0.00525 + 0.00121*(x-1) + 0.00002*(x-1)*(x-2) + 0.003*x", "color": "#1E6091" }
  ]
}
```

The blue curve assumes that each call comes within the cache lifetime. It uses a cache-write rate of 1.25 times and a cache-read rate of 0.05 times the input price (Claude Sonnet 5.5, checked on 2026-10-12). After 50 turns: about 1.34 USD without caching and about 0.26 USD with caching. Lesson [L7](/notes/ai/context-engineering/01-foundations/l7-prompt-caching) derives the blue curve.

## 6. Code

These exercises go in `notebooks/01-foundations.ipynb`.

**Exercise 6.1: the cost model.**

1. Write `per_call_input(k, S, u, a)` and `cumulative_input(N, S, u, a)`.
2. Write `conversation_cost(N, S, u, a, p_in, p_out)`.
3. Check the closed formula of section 4.1 against a loop that adds $I_k$ one call at a time.

Acceptance tests:

- `cumulative_input(50, 2000, 100, 300)` returns 595,000.
- `conversation_cost(50, 2000, 100, 300, 2, 10)` returns 1.34 (to two decimals).
- The loop and the closed formula agree for $N$ from 1 to 200.

**Exercise 6.2: find the "10–20 times" region.** For $u = 100$ and $a = 300$, find the values of $S$ where $C_{50} / C_5$ is between 10 and 20. Plot the ratio against $S$.

**Exercise 6.3: your real data.** Take one real conversation log from a chatbot that you use at work. Measure $S$, the average $u$ and the average $a$. Predict the cumulative input with the formula, then compare it with the sum of the logged `usage` values.

## 7. Common mistakes

1. **"Cost grows linearly with turns."** One call grows linearly. The total grows quadratically.
2. **Pricing one call instead of one conversation.** The first call of a chat is the cheapest one.
3. **Forgetting the output price.** Output is often 5 times the input price, and it does not shrink with caching.
4. **Assuming the agent's history is small.** Tool results make $t$ large.
5. **Assuming a large window removes the cost problem.** A larger window lets the history grow longer, so the quadratic term grows further.

## 8. One-minute explanation

The model is stateless, so every call sends the whole conversation again. Call k sends the fixed prefix plus all earlier turns plus the new message. That number grows by one turn's worth of tokens on each call: linear growth for each call. But you pay for every call, so the total input is the sum of a growing series. That sum grows with the square of the number of turns. In a typical example, 50 turns cost about 30 times more than 5 turns, not 10 times. Agents grow even faster, because each tool result joins the history. Prompt caching lowers the price of the repeated part, and compression stops the history from growing.

## 9. Check questions

```check
{
  "question": "S = 1,000, u = 50, a = 150. What is the input of call 10, and what is the cumulative input after 10 calls?",
  "hint": "t = u + a. Use I_k = S + u + (k − 1)t and C_N = N(S + u) + t·N(N − 1)/2.",
  "answer": "t = 200. I_10 = 1,000 + 50 + 9 × 200 = 2,850 tokens. C_10 = 10 × 1,050 + 200 × 45 = 10,500 + 9,000 = 19,500 tokens."
}
```

```check
{
  "question": "A conversation doubles from 20 to 40 turns. With a very small fixed prefix, by about what factor does the cumulative input grow? Why?",
  "answer": "About 4 times. When S is small, C_N ≈ t·N²/2, and (40/20)² = 4. Each extra turn is sent again on every later call."
}
```

```check
{
  "question": "The handbook says that a 50-turn conversation costs 10–20 times a 5-turn conversation. Under which condition is that true?",
  "answer": "When the fixed prefix S is about 20 to 100 times the tokens of one turn. For example, with t = 400 tokens, S between about 8,000 and 40,000 tokens. With a small system prompt, the input ratio is 40 to 110 times."
}
```

```check
{
  "question": "Why does output not follow the same quadratic growth as input?",
  "answer": "Each call writes only its own reply, a tokens. Output is not sent again as output. So total output is N × a, which is linear. The old replies do come back on later calls, but as input."
}
```

## 10. Links

- Previous: [L5: Position and length effects](/notes/ai/context-engineering/01-foundations/l5-position-and-length-effects)
- Next: [L7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- [L3: The chat API call](/notes/ai/context-engineering/01-foundations/l3-the-chat-api-call): why the history is sent again
- [Glossary](/notes/ai/context-engineering/glossary)
