---
title: "L6: A full mock interview"
order: 6
summary: "A 45-minute deep-dive interview script in the format of the friend's interview: a paper, then the KV cache and attention, inference and cloud hosting, RAG and MCP. Timing per section, the interviewer's transitions, 28 questions with the expected depth of each answer, a scoring rubric, how to say 'I don't know' and recover, how to present the paper in 2 minutes, and a self-review checklist."
status: not-started
tags: [interview, mock-interview, rubric, pagedattention, kv-cache, rag, mcp]
---

## 1. The question this idea answers

The drills L1 to L4 train one topic at a time. A real deep-dive interview mixes them. The friend's interviewer asked for a research paper, then went from PagedAttention to the KV cache, its formula, its implementation and attention. He also asked about RAG, cloud hosting and inference. On MCP he asked what is new, the difference between stateful and stateless, and the specifics of the arguments in the JSON Schema.

Knowing each answer is not enough. You must also manage time, move between topics without a pause, and recover when a question goes past what you know. Only a full run under time pressure trains these skills.

The question of this page: **can you hold a 45-minute deep dive across all five topics**? You must reach level 4 or 5 in the KV cache and MCP sections. You must also recover from at least one "I don't know".

## 2. Mental model

> [!analogy] A check ride in a flight simulator
> A pilot does not learn emergencies in a real aircraft. He flies a simulator session with a fixed script: take-off, an engine failure at a set minute, a diversion, a landing. An instructor scores each phase against a written standard. After the session, pilot and instructor replay the recording and name the one or two things to practice next. This page is that script. The interviewer's lines are the scripted events, the rubric is the written standard, and the self-review is the replay.
>
> **Where it stops working:** a simulator script is fixed. A real interviewer follows the words that you say, so the order changes. That is why each answer must end on a term that you can explain one level deeper. You partly control the next question.

## 3. Terms

| Term | Plain meaning |
|---|---|
| mock interview | A full practice interview with a timer, a script and a score. |
| deep dive | An interview that follows one topic down several levels instead of asking a list of unrelated questions. |
| question chain | A sequence of questions where each one follows from the previous answer. |
| level | The depth of a question: 1 definition, 2 mechanism, 3 fields and numbers, 4 trade-offs, 5 production and edge cases. |
| transition | The interviewer's sentence that moves from one topic to the next. |
| bridge sentence | Your first sentence that links a new question to what you said before. |
| hook | The last words of an answer that invite the next question. |
| trap question | A question that contains a wrong belief and checks whether you accept it. |
| pivot | A question that jumps to another topic through a shared idea. |
| timebox | The fixed minutes for one section of the interview. |
| rubric | A written scale that turns an answer into a score from 0 to 4. |
| recovery | The steps that turn "I don't know" into a useful answer. |
| assumption | A value that you choose and say aloud before you compute, for example $u = 0.92$. |
| self-review | The check of a recorded mock against a fixed list, after the mock. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. How to run the mock

### 4.1 Setup

1. Ask a partner to read the questions of section 12 aloud, in order. Alone, read one question, then close the page and answer.
2. Use a timer, paper or a whiteboard, and no notes. Record the audio.
3. Open the hint only after the answer. The hint says what the interviewer listens for. Then open the model answer and score yourself with the rubric of section 6.
4. Keep to the timeboxes. If a section runs over, the interviewer moves on. A real interviewer does the same.

### 4.2 The timeline

![Alt text: a 45-minute timeline of seven interview parts, each bar sized by its minutes, with its deepest target level.](/notes/media/llm-systems/figures/08-6-mock-timeline.svg)

| Part | Minutes | Topic | Deepest target level | Drill to repeat |
|---|---|---|---|---|
| A | 0 to 3 | Opening | 1 | none |
| B | 3 to 8 | The paper | 3 | [L1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| C | 8 to 20 | KV cache and attention | 5 | [L1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention) |
| D | 20 to 28 | Inference and cloud hosting | 4 | [L2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud) |
| E | 28 to 34 | RAG | 4 | [L3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag) |
| F | 34 to 42 | MCP | 5 | [L4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp) |
| G | 42 to 45 | Your questions and the close | none | none |

Parts C and F get the most time, because the friend's interviewer went deepest there.

### 4.3 The shape of one answer

Every answer of the drills has five parts. In a mock you rarely say all five at once. Say the first two or three, stop after 60 to 90 seconds, and let the interviewer choose.

1. **Definition:** one sentence that a beginner understands.
2. **Mechanism:** how it works, in two to four steps.
3. **Fields and numbers:** the formula, the exact field name or one real number.
4. **Trade-off:** what it costs and when not to use it.
5. **Production:** what breaks at scale and how you would notice.

> [!key] Stop at a hook
> End each answer on a term that you can explain one level deeper. "The block table maps each logical block to a physical block" invites "How does the kernel read it?". The interviewer usually asks about the last concrete term that you said.

### 4.4 The transitions

The interviewer moves between topics with a sentence like these. Each one takes a term from your last answer.

```mermaid
flowchart LR
    A["A: opening"] --> B["B: the paper"]
    B -->|"You said KV cache"| C["C: KV cache and attention"]
    C -->|"How do you serve this?"| D["D: inference and cloud"]
    D -->|"Where does the context come from?"| E["E: RAG"]
    E -->|"Expose it to agents"| F["F: MCP"]
    F --> G["G: your questions"]
    style C fill:#2D6A4F,color:#fff
    style F fill:#1E6091,color:#fff
```

| From | To | Interviewer's transition | Your bridge sentence |
|---|---|---|---|
| B | C | "You said the KV cache is large. What is it exactly?" | "It stores the keys and values of earlier tokens, per layer, so a decode step computes only the new token's key and value." |
| C | D | "Fine. Now you have to serve this model to users." | "Serving is mostly about the decode loop, which is memory-bound, so batching decides the cost." |
| D | E | "The model answers only from its weights. How do you give it company documents?" | "With retrieval: we search an index at question time and put the best chunks in the prompt." |
| E | F | "Agents want to call your retrieval system. How do they connect?" | "I would expose it as an MCP tool, with the tenant taken from the token, never from the arguments." |

## 5. Present the paper in 2 minutes

### 5.1 Five beats

The paper page [00 The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page) has the full 2-minute and 30-second texts. Learn the beats, not the words.

| Beat | Time | Content | Numbers to say |
|---|---|---|---|
| 1. The paper | 0:00 to 0:15 | Title, authors, venue | Kwon and colleagues, UC Berkeley, Stanford and UC San Diego, SOSP 2023. The paper behind vLLM. |
| 2. The problem | 0:15 to 0:45 | A server keeps the keys and values of all earlier tokens in GPU memory: the KV cache. It is large. | OPT-13B: 800 KiB per token. A 2,048-token request needs about 1.6 GB. |
| 3. The old way | 0:45 to 1:10 | One contiguous chunk per request at the maximum length. Reservation and fragmentation waste memory, so batches stay small. | Only 20.4% to 38.2% of the KV memory held real tokens. |
| 4. The idea | 1:10 to 1:40 | Paging from operating systems. Blocks of 16 tokens sit anywhere in memory, with a block table per request and allocation on demand. Reference counts and copy-on-write allow sharing. Preemption handles a full memory. | Waste below one block per sequence. |
| 5. The result and the hook | 1:40 to 2:00 | Bigger batches give higher throughput at the same latency. End on the KV cache. | 96.3% of KV memory used. 2 to 4 times the throughput. The kernel is 20% to 26% slower. |

> [!key] End on the KV cache
> The friend's interviewer went from the paper straight to the KV cache, its formula, its implementation and attention. So end the pitch with a sentence that names the KV cache and its size. You will be ready for the next eleven minutes.

### 5.2 Mistakes in a paper pitch

1. **Starting with the method.** Start with the problem and its number. The method makes sense only after the waste.
2. **Saying "it makes attention faster".** The paper's kernel is slower. The system is faster because the batch is larger.
3. **Too much detail.** Copy-on-write, swap versus recompute and the kernel layout are follow-ups. Name them in one phrase each, as hooks.

## 6. The scoring rubric

### 6.1 Score each answer from 0 to 4

| Score | What the answer contains |
|---|---|
| 0 | No answer, or a wrong fact said with confidence. |
| 1 | A correct definition only. |
| 2 | Definition and mechanism. |
| 3 | Mechanism plus the formula, the exact field name or one correct number with its unit. |
| 4 | Level 3 plus a trade-off or a production consequence, in under 2 minutes. |

### 6.2 Deductions

| Deduction | Why it costs a point |
|---|---|
| A number without its assumptions | "53 requests" is wrong for another `gpu_memory_utilization` or overhead. |
| A wrong unit | GB and GiB differ by about 7%. ms and µs differ by 1,000 times. |
| An invented field name, flag or version | It destroys trust in every other answer. |
| No revision for an MCP answer | Many answers differ between 2025-11-25 and 2026-07-28. |
| More than 2 minutes without a pause | The interviewer cannot steer, and time runs short for parts E and F. |

### 6.3 Targets

| Part | Questions | Target average | Why |
|---|---|---|---|
| B | 4 | 3 | The pitch must hold numbers. |
| C | 8 | 3.5 | The friend's interviewer went deepest here. |
| D | 5 | 3 | Formulas and sizing. |
| E | 4 | 3 | Design and evaluation. |
| F | 6 | 3.5 | What is new, stateless, and the argument schema. |

Record every answer below 3 on the [mistakes page](/notes/ai/llm-systems/00-progress/mistakes). Repeat its drill before the next mock.

## 7. "I don't know" and how to recover

### 7.1 Four steps

An honest "I don't know" followed by reasoning scores better than a confident invention. Use four steps:

1. **Say the limit.** "I don't remember the exact number."
2. **Say what you know for sure.** Give the definition or the related fact.
3. **Reason from a formula or a first principle.** Give an estimate and say your assumptions.
4. **Say how you would check it.** Name the source: the datasheet, the spec, the source code or a measurement.

> [!trap] Never fill the gap with a plausible number
> An invented number, field or version is the worst answer in a deep dive. The interviewer may know the true value. Then he doubts every other number that you said.

### 7.2 Four worked recoveries

> [!example] Worked example: a number that the sources do not give
> **Question:** "What is the SRAM bandwidth of an H100?"
>
> 1. "I don't know the H100 number. The sources that I studied do not state it."
> 2. "For the A100, the FlashAttention paper estimates the on-chip SRAM at around 19 TB/s, against 1.5 to 2.0 TB/s of HBM."
> 3. "So SRAM is about ten times faster than HBM. That gap is why FlashAttention keeps the score tiles in SRAM."
> 4. "For the H100 I would measure it, or read a microbenchmark study."
>
> Source lesson: [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention).

> [!example] Worked example: a GPU without published numbers
> **Question:** "How fast does Llama-3.1-8B decode on an A10G?"
>
> 1. "I can't give a number. AWS does not publish the A10G's memory bandwidth or BF16 rate."
> 2. "It has 24 GB of memory. The BF16 weights are 16.06 GB."
> 3. "Batch-1 decode time is about weight bytes divided by bandwidth. Do not assume A10 numbers for it."
> 4. "I would run a short benchmark and read the TPOT."
>
> Source lesson: [part 01 L5](/notes/ai/llm-systems/01-math-and-hardware/l5-gpus-memory-and-bandwidth).

> [!example] Worked example: a future fact
> **Question:** "When is the next MCP revision?"
>
> 1. "I don't know. The roadmap post of 2026-08-22 gives no date and no version number for it."
> 2. "The current revision is 2026-07-28. Its release candidate was locked on 2026-05-21, with a ten-week window for SDKs and clients."
> 3. "Deprecated features such as Roots, Sampling and Logging keep working for at least twelve months under the lifecycle policy."
> 4. "I would watch the specification changelog and the MCP blog."
>
> Source lesson: [part 07 L12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history).

> [!example] Worked example: a formula that you forgot
> **Question:** "Write the KV cache size formula."
>
> 1. "Let me derive it instead of quoting it."
> 2. "Each token stores one key and one value vector per KV head, in every layer: $2 \times H_{kv} \times d_h$ numbers per layer."
> 3. "Times $L$ layers and $s$ bytes per number gives $2 L H_{kv} d_h s$ bytes per token. For Llama-3.1-8B: $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes."
> 4. "Check: the vLLM paper gives 800 KB per token for OPT-13B, and $2 \times 40 \times 40 \times 128 \times 2 = 819{,}200$ bytes $= 800$ KiB."
>
> Source lesson: [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula).

## 8. Self-review checklist

Replay the recording within a day. Answer each item with yes or no.

1. Did every answer start with a one-sentence definition?
2. Did the paper pitch fit in 2 minutes and end on the KV cache?
3. Did I write the KV cache formula and compute 131,072 bytes without notes?
4. Did I say my assumptions before every sizing number?
5. Did every number have a unit, and did I keep GB and GiB apart?
6. Did I name the MCP revision in every MCP answer?
7. Did I write valid JSON for `tools/call` and for an `inputSchema`?
8. Did I stop most answers within 60 to 90 seconds?
9. Did I meet every timebox, so that part F had its full 8 minutes?
10. Where did I say "I don't know", and did I use the four recovery steps?
11. Which answers scored below 3? Are they on the mistakes page?
12. Which single answer will I record again tomorrow?

## 9. Common mistakes

1. **"A deep dive is a list of random questions."** Each question follows from your last answer. The friend felt the questions were random, but they followed his words. Choose your hooks.
2. **"A longer answer scores higher."** A long answer leaves no time for the deep questions. Give 60 to 90 seconds, then stop.
3. **"Saying 'I don't know' fails the interview."** Bluffing fails it. A clear limit, a derivation and a way to check show how you work.
4. **"The paper pitch should explain the whole method."** Two minutes hold the problem, the idea and the result. Details are follow-ups.
5. **"Numbers speak for themselves."** A sizing number is only correct for its assumptions. Say them first.
6. **"MCP has one answer per question."** Many answers differ between 2025-11-25 and 2026-07-28. Name the revision.
7. **"One mock is enough."** The first mock shows the gaps. The second mock, after the drills, shows whether they closed.

## 10. One-minute explanation

The mock follows the friend's interview: a paper, then the KV cache and attention, inference and cloud hosting, RAG and MCP, in 45 minutes. I present PagedAttention in five beats and end on the KV cache, because that is where the interviewer went next. Each answer starts with a definition and a mechanism, adds a formula or a field, and stops at a hook after about a minute. The rubric scores each answer from 0 to 4. A 4 needs a number with its unit and a trade-off. Assumptions come before numbers, and every MCP answer names its revision. When I don't know something, I say so and give what I know for sure. Then I derive an estimate and name the source that would confirm it. After the mock I replay the recording against a twelve-item checklist and log every answer below 3. Then I repeat its drill before the next mock.

## 11. Before you start

Set a timer for 45 minutes. Read each question aloud, answer, then open the hint and the model answer. Score yourself with section 6.

## 12. Check questions: the interview script

### Part A, minutes 0 to 3: the opening

```check
{
  "question": "Opening question (minute 0): \"Tell me briefly about your work. Then pick a topic that you know well.\"",
  "hint": "Expected depth: level 1, about 30 seconds. The interviewer listens for a short, concrete answer that ends on a topic.",
  "answer": "**Structure, about 30 seconds:**\n\n1. Your role in one sentence.\n2. Two systems that you built, one sentence each.\n3. A bridge to the paper: \"Recently I read the PagedAttention paper, because serving cost depends on how the KV cache uses GPU memory.\"\n\n**Why:** the last sentence chooses the next 20 minutes. It names a paper and the KV cache, the two topics that you prepared most.\n\nPitch material: [00 The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page)."
}
```

### Part B, minutes 3 to 8: the paper

```check
{
  "question": "Opening question (minute 3): \"Tell me about a research paper that you read.\"",
  "hint": "Expected depth: level 3, about 120 seconds. The interviewer listens for the problem with a number, the idea with its analogy, and the result with a number.",
  "answer": "**The five beats of section 5, in 2 minutes:**\n\n1. *Efficient Memory Management for Large Language Model Serving with PagedAttention*, Kwon and colleagues, SOSP 2023, the vLLM paper.\n2. The KV cache is large: OPT-13B needs 800 KiB per token, about 1.6 GB for 2,048 tokens.\n3. Earlier systems reserved one contiguous chunk at the maximum length. Only 20.4% to 38.2% of the KV memory held real tokens.\n4. Blocks of 16 tokens, a block table per request, allocation on demand, sharing with reference counts and copy-on-write.\n5. 96.3% of KV memory used, larger batches, 2 to 4 times the throughput at the same latency.\n\n**Score 4 needs:** the waste numbers and the hook \"KV cache\".\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [paper page 00](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page) and [paper page 03](/notes/papers/llm-serving/2023-pagedattention/03-the-question)."
}
```

```check
{
  "question": "Interview follow-up (minute 5): \"Your kernel is slower. Why is the system faster?\"",
  "hint": "Expected depth: level 3, about 60 seconds. The interviewer listens for the memory-bound argument and the batch numbers.",
  "answer": "**Must include:**\n\n- The PagedAttention kernel had 20% to 26% higher attention latency than FasterTransformer's kernel. Only attention pays it.\n- Decode is memory-bound: one step reads all weights once, whatever the batch. More requests per step give more tokens for almost the same time.\n- Less waste gives bigger batches. OPT-13B on ShareGPT at 2 requests per second: 30.42 batched requests for vLLM, 13.62 for Orca (Oracle) and 7.00 for Orca (Max).\n- Result: 2 to 4 times the throughput at the same latency.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [paper page 09](/notes/papers/llm-serving/2023-pagedattention/09-results) and [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)."
}
```

```check
{
  "question": "Interview follow-up (minute 6): \"What does vLLM do when no free block is left?\"",
  "hint": "Expected depth: level 3, about 60 seconds. The interviewer listens for who is preempted, all-or-nothing, and swap versus recompute.",
  "answer": "**Must include:**\n\n- Policy: first-come-first-serve. The scheduler preempts the latest request and evicts **all** blocks of its sequence group (\"all-or-nothing\").\n- Two recovery modes: **swap** the blocks to CPU memory, or **recompute** them later with one prefill over the prompt plus the generated tokens.\n- Today: in vLLM V1, the default preemption mode is recomputation (vLLM docs, checked on 2026-10-15).\n\n**Level 4 detail:** the paper found that recomputation wins with small blocks and swapping with large blocks.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lesson: [paper page 07](/notes/papers/llm-serving/2023-pagedattention/07-scheduling-and-preemption)."
}
```

```check
{
  "question": "Interview follow-up (minute 7): \"Is this still how vLLM works today?\"",
  "hint": "Expected depth: level 2, about 45 seconds. The interviewer listens for that you know which parts of a 2023 paper still hold.",
  "answer": "**Must include, with dates:**\n\n- vLLM 0.31.0 defaults: block size 16, prefix caching on, chunked prefill on, preemption by recomputation, `gpu_memory_utilization` 0.92 (checked on 2026-10-15).\n- The paper's own kernel is history: the vLLM docs call its design page \"a historical document\".\n- The block became the unit for reuse: automatic prefix caching with chained block hashes since vLLM 0.4.0 (2024-03-31), and FlashAttention 2.5.0 with `block_table` (2024-01-23).\n\n**Hook:** \"prefix caching\" invites a pivot to inference.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [paper page 10](/notes/papers/llm-serving/2023-pagedattention/10-limits-and-later-work) and [paper page 00](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page)."
}
```

### Part C, minutes 8 to 20: the KV cache and attention

Transition: "You said the KV cache is large. What is it exactly?"

```check
{
  "question": "Interview follow-up (minute 8): \"You said KV cache. What is it, and why does it exist?\"",
  "hint": "Expected depth: level 2, about 60 seconds. The interviewer listens for why reuse is correct and what it costs.",
  "answer": "**Must include:**\n\n- Definition: the key and value vectors of earlier tokens, stored per layer, so that later tokens can attend to them.\n- Why: to produce the next token, its query attends to the keys and values of all earlier tokens in every layer. Without a cache, each step reruns the whole sequence through every layer.\n- Number: Llama-3.1-8B, 1,000-token prompt and 1,000 new tokens: about $3.0 \\times 10^{13}$ FLOPs with the cache instead of $2.15 \\times 10^{16}$, about 718 times less.\n- Price: 128 KiB per token in BF16, and each step still reads the whole cache.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lesson: [part 03 L1](/notes/ai/llm-systems/03-kv-cache/l1-why-the-kv-cache-exists)."
}
```

```check
{
  "question": "Interview follow-up (minute 10): \"Write the size formula on the board and compute it for a real model.\"",
  "hint": "Expected depth: level 3, about 90 seconds. The interviewer listens for every factor named and one exact number.",
  "answer": "$$\n\\text{KV bytes} = 2 \\times L \\times H_{kv} \\times d_h \\times s \\times T \\times B\n$$\n\n- Name each factor: key and value, layers, KV heads, head dimension, bytes per element, tokens, sequences.\n- Llama-3.1-8B: $2 \\times 32 \\times 8 \\times 128 \\times 2 = 131{,}072$ bytes per token. 1 GiB at 8,192 tokens. 16 GiB at 131,072 tokens, more than the 14.96 GiB of weights.\n- Trap to avoid: $H_{kv} = 8$, not $H = 32$.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Formula sheet: [L5](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet). Source lesson: [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)."
}
```

```check
{
  "question": "Interview follow-up (minute 12): \"How many requests fit on one H100 with Llama-3.1-8B? State your assumptions.\"",
  "hint": "Expected depth: level 3, about 90 seconds. The interviewer listens for assumptions said before the arithmetic.",
  "answer": "**Say the assumptions first:** 80 GiB, $u = 0.92$, 3 GiB of other memory.\n\n1. Budget: $80 \\times 0.92 = 73.6$ GiB.\n2. KV memory: $73.6 - 14.96 - 3 = 55.64$ GiB.\n3. Tokens: $55.64 \\times 2^{30} / 131{,}072 = 455{,}823$.\n4. Requests of 4,096 tokens: about 111.\n\n**Level 4:** with $u = 0.90$ and 4 GiB of overhead, the lessons get 434,523 tokens, so 53 requests of 8,192 tokens. Reserving the full 128K context per request leaves room for only 3. That gap is the motivation of PagedAttention.\n\nFull answer: [L2 drill](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud). Source lessons: [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) and [part 03 L3](/notes/ai/llm-systems/03-kv-cache/l3-the-kv-cache-size-formula)."
}
```

```check
{
  "question": "Interview follow-up (minute 13): \"How would you implement a KV cache?\"",
  "hint": "Expected depth: level 4, about 90 seconds. The interviewer listens for the exact shape and why each axis is where it is.",
  "answer": "**Must include:**\n\n- Per layer, one key tensor and one value tensor of shape $[B, H_{kv}, T, d_h]$. For Llama-3.1-8B: $[B, 8, T, 128]$.\n- Attention multiplies the last two axes, the append happens on the time axis, and $d_h$ is last so one key vector is contiguous.\n- Common bug: storing the expanded $H$ heads instead of $H_{kv}$ makes the cache 4 times larger.\n- In vLLM: a pool of blocks, a block table per sequence, and a slot for each new token: $\\text{block\\_table}[\\lfloor t/B \\rfloor] \\cdot B + t \\bmod B$.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [part 03 L4](/notes/ai/llm-systems/03-kv-cache/l4-implementing-a-kv-cache) and [paper page 05](/notes/papers/llm-serving/2023-pagedattention/05-the-kv-cache-manager)."
}
```

```check
{
  "question": "Interview follow-up (minute 15): \"Go one level down. What is attention?\"",
  "hint": "Expected depth: level 3, about 90 seconds. The interviewer listens for the formula and the link from the causal mask to the cache.",
  "answer": "$$\n\\mathrm{Attention}(Q, K, V) = \\mathrm{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right) V\n$$\n\n**Must include:**\n\n- $Q$, $K$, $V$ are linear projections of the same hidden states. A query asks, a key is matched, a value is mixed.\n- Each row of weights sums to 1, so each output row is a weighted average of value rows.\n- In a decoder, a causal mask hides later tokens. That is why the keys and values of earlier tokens never change, and why caching them is exact.\n- Several heads run in parallel on slices of width $d_h$.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention) and [part 02 L4](/notes/ai/llm-systems/02-attention-and-the-transformer/l4-causal-masking-and-generation)."
}
```

```check
{
  "question": "Interview follow-up (minute 17): \"Why divide by the square root of d_k? 'To normalize' is not an answer.\" (Trap question.)",
  "hint": "Expected depth: level 4, about 60 seconds. The interviewer listens for a derivation, not a word.",
  "answer": "**Three lines:**\n\n1. Entries of $q$ and $k$ independent, mean 0, variance 1: each product $q_i k_i$ has variance 1.\n2. $\\mathrm{Var}(q \\cdot k) = d_k$, so the standard deviation is $\\sqrt{d_k}$, about 11.31 for $d_k = 128$.\n3. Dividing by $\\sqrt{d_k}$ gives variance 1 for every head width.\n\n**Why it matters:** large scores saturate the softmax. One weight is near 1, and the gradients of the others are near 0.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lesson: [part 02 L3](/notes/ai/llm-systems/02-attention-and-the-transformer/l3-scaled-dot-product-attention)."
}
```

```check
{
  "question": "Interview follow-up (minute 18): \"Why is decode slow, even on an H100? Give me a number.\"",
  "hint": "Expected depth: level 4, about 90 seconds. The interviewer listens for bytes over bandwidth, and the ridge point.",
  "answer": "**Must include:**\n\n- A decode step reads all weights once: $16.06 \\times 10^9 / 3.35 \\times 10^{12} \\approx 4.79$ ms for Llama-3.1-8B at batch 1, so at most about 208.6 tokens per second.\n- Its arithmetic intensity is about 1 FLOP per byte. The H100 ridge point is about 295. So the step is memory-bound.\n- Prefill of 2,000 tokens has about 1,775 FLOP per byte and is compute-bound: about 29.3 ms.\n- Decode attention has intensity $H / H_{kv} = 4$ at any batch, so long contexts stay memory-bound.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [part 03 L2](/notes/ai/llm-systems/03-kv-cache/l2-prefill-and-decode) and [part 04 L3](/notes/ai/llm-systems/04-inference/l3-compute-bound-vs-memory-bound)."
}
```

```check
{
  "question": "Interview follow-up (minute 19): \"So PagedAttention makes attention cheaper, right?\" (Trap question.)",
  "hint": "Expected depth: level 5, about 60 seconds. The interviewer listens for a clear no, and the difference between memory management and kernel tiling.",
  "answer": "**No.**\n\n- PagedAttention computes exact attention. The arithmetic is the same. Only the memory layout of the cache changes.\n- Its kernel was 20% to 26% slower in the paper. The gain is in memory: less waste gives larger batches.\n- FlashAttention is a different idea: it tiles the computation and uses the online softmax so that the $T \\times T$ score matrix never goes to HBM. It is also exact.\n- The two combine: FlashAttention 2.5.0 accepts a `block_table`, so one kernel reads a paged cache with the online softmax.\n\nFull answer: [L1 drill](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention). Source lessons: [paper page 04](/notes/papers/llm-serving/2023-pagedattention/04-pagedattention-the-algorithm) and [part 02 L7](/notes/ai/llm-systems/02-attention-and-the-transformer/l7-attention-cost-and-flashattention)."
}
```

### Part D, minutes 20 to 28: inference and cloud hosting

Transition: "Fine. Now you have to serve this model to users."

```check
{
  "question": "Opening question (minute 20): \"Fine. Now you serve this model to users. Walk me through one request.\"",
  "hint": "Expected depth: level 2, about 90 seconds. The interviewer listens for the processes, prefill versus decode, and continuous batching.",
  "answer": "**Must include, for vLLM V1:**\n\n1. API server: HTTP request, chat template, tokenization.\n2. Engine core: waiting queue. Before every step, the scheduler chooses requests and token counts within a token budget and the free KV blocks.\n3. GPU workers: the first pass is prefill, which fills the cache and gives the first token. Every later pass is one decode step per request.\n4. Sampler, stop checks, then incremental detokenization and one server-sent event per new piece of text.\n\n**Where the time goes:** TTFT is network, tokenization, queue and prefill. Decode usually takes most of the end-to-end time.\n\nFull answer: [L2 drill](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud). Source lesson: [part 04 L1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request)."
}
```

```check
{
  "question": "Interview follow-up (minute 22): \"Which metrics go into your SLO?\"",
  "hint": "Expected depth: level 3, about 60 seconds. The interviewer listens for exact definitions and the n minus 1.",
  "answer": "**Must include:**\n\n- TTFT, TPOT and end-to-end latency. $\\mathrm{E2E} = \\mathrm{TTFT} + \\mathrm{TPOT}\\,(n - 1)$, because the first token belongs to TTFT.\n- Percentiles: report P50 and P99, not the mean.\n- Goodput: only requests that meet every SLO limit, for example TTFT at most 200 ms and TPOT at most 50 ms.\n- Capacity: Little's law $L = \\lambda W$. 5 requests per second at 8 s each gives 40 in the system.\n\nFull answer: [L2 drill](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud). Source lesson: [part 04 L2](/notes/ai/llm-systems/04-inference/l2-latency-and-throughput-metrics)."
}
```

```check
{
  "question": "Interview follow-up (minute 23): \"You must host Llama-3.1-70B. Which GPUs, and how many?\"",
  "hint": "Expected depth: level 4, about 90 seconds. The interviewer listens for weights per GPU, KV per GPU and why NVLink.",
  "answer": "**Must include:**\n\n- Weights: $70{,}553{,}706{,}496 \\times 2$ bytes $= 131.42$ GiB in BF16. One H100 offers $80 \\times 0.92 = 73.6$ GiB, so one GPU is impossible.\n- Tensor parallelism with 4 H100s: 32.85 GiB of weights per GPU, 81,920 KV bytes per token per GPU, 494,742 tokens per GPU. TP=4 is the practical minimum. TP=2 fits the weights but leaves only 32,058 tokens.\n- Alternative: the FP8 checkpoint, 67.67 GiB, on one H200 with 141 GB.\n- Tensor parallelism needs NVLink: 900 GB/s against 128 GB/s for PCIe Gen5 on the H100 datasheet.\n\nFull answer: [L2 drill](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud). Source lessons: [part 05 L2](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) and [part 04 L8](/notes/ai/llm-systems/04-inference/l8-parallelism)."
}
```

```check
{
  "question": "Interview follow-up (minute 25): \"Which metric do you autoscale on, and how fast can a new replica serve?\"",
  "hint": "Expected depth: level 4, about 90 seconds. The interviewer listens for a queue metric, the HPA formula and the cold-start steps.",
  "answer": "**Must include:**\n\n- Not CPU and not GPU utilization. Scale on the engine's state: `vllm:num_requests_waiting` as the trigger, paired with `vllm:num_requests_running`.\n- HPA rule: $\\lceil \\text{current} \\times \\text{current metric} / \\text{target} \\rceil$. Two replicas with 13 waiting each and a target of 5 give $\\lceil 5.2 \\rceil = 6$.\n- Cold start in the lesson's model: about 169 s. With a persistent compile cache, pre-pulled images and weights on local NVMe: about 15 s, not counting a new GPU node.\n\nFull answer: [L2 drill](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud). Source lessons: [part 05 L5](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) and [part 05 L3](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading)."
}
```

```check
{
  "question": "Interview follow-up (minute 27): \"What does one million output tokens cost you? When is an API cheaper?\"",
  "hint": "Expected depth: level 4, about 60 seconds. The interviewer listens for the formula with its units and a break-even number.",
  "answer": "$$\n\\text{USD per MTok} = \\frac{\\text{USD per hour}}{r \\times 3600} \\times 10^6\n$$\n\n- Llama-3.1-8B on one H100 at USD 12.29 per hour, batch 64, context 2,048: about 6,450 tokens per second at the bound.\n- That is about USD 0.529 per MTok, and about USD 1.06 at 50% of the bound.\n- Break-even against an API at USD 0.71 per MTok, for an 8-GPU VM at USD 98.32 per hour: about 38,466 tokens per second, every hour.\n- Utilization divides the cost: the effective price is the full-load price divided by $u$.\n\nPrices are examples checked on 2026-10-15. Full answer: [L2 drill](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud). Source lesson: [part 05 L7](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math)."
}
```

### Part E, minutes 28 to 34: RAG

Transition: "The model answers only from its weights. How do you give it company documents?"

```check
{
  "question": "Opening question (minute 28): \"The model knows only its weights. Design RAG over internal documents, where each user may see only some documents.\"",
  "hint": "Expected depth: level 3, about 120 seconds. The interviewer listens for two paths, and where exactly the permission check runs.",
  "answer": "**Must include:**\n\n- Write path: change detection, parsing, chunking at structure, embedding, an index with metadata (document ID, version, tenant, allowed groups), delete-then-insert per document.\n- Read path: authenticate and resolve groups from the session, then rewrite the query. Run hybrid search **with the permission filter inside the search**, then fuse and rerank.\n- Then assemble labeled chunks, generate with citations, and verify the citations in code.\n- Number: post-filtering a user who reads 2% of the corpus leaves zero readable chunks in a top 100 with probability $0.98^{100} = 0.133$. It also leaks restricted chunks into code.\n\nFull answer: [L3 drill](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag). Source lesson: [part 06 L9](/notes/ai/llm-systems/06-rag/l9-production-rag-architecture)."
}
```

```check
{
  "question": "Interview follow-up (minute 30): \"Why hybrid search? How do you combine the two lists?\"",
  "hint": "Expected depth: level 3, about 60 seconds. The interviewer listens for why raw scores cannot be added, and the reranker ceiling.",
  "answer": "**Must include:**\n\n- BM25 finds exact terms such as IDs and names. Dense search finds paraphrases. They fail on different queries.\n- Raw scores have different scales, so fuse ranks: $\\text{RRF}(d) = \\sum_r 1/(k + r(d))$ with $k = 60$. A document at ranks 1 and 4 gets $1/61 + 1/64 = 0.032018$.\n- Then a cross-encoder reranks the top 50 to 100. It can never recover a document that the first stage missed: recall@k after reranking is at most recall@N of the first stage.\n\nFull answer: [L3 drill](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag). Source lesson: [part 06 L5](/notes/ai/llm-systems/06-rag/l5-hybrid-search-and-reranking)."
}
```

```check
{
  "question": "Interview follow-up (minute 32): \"How do you know that it works, and which part failed?\"",
  "hint": "Expected depth: level 4, about 90 seconds. The interviewer listens for a way to locate the failing stage, and noise.",
  "answer": "**Must include:**\n\n- Metrics per relation: recall@k and nDCG for retrieval, faithfulness, answer relevance and correctness for generation.\n- Isolation runs on the same 200 questions (lesson example): closed-book 29%, retrieved 71%, oracle chunks 88%. So retrieval loses 34 questions, and generation loses 24 even with perfect chunks.\n- Noise: with $p = 0.8$ and $n = 200$, the standard error is 0.0283, about $\\pm 0.055$ at 95%.\n- LLM judges: report Cohen's kappa. 85% agreement gave only $\\kappa = 0.571$ in the lesson.\n\nFull answer: [L3 drill](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag). Source lesson: [part 06 L8](/notes/ai/llm-systems/06-rag/l8-evaluating-rag)."
}
```

```check
{
  "question": "Interview follow-up (minute 33): \"Our model has a 1 million token context window. RAG is dead, right?\" (Trap question.)",
  "hint": "Expected depth: level 4, about 60 seconds. The interviewer listens for numbers, and where long context does win.",
  "answer": "**No. Four reasons:**\n\n1. Cost: assume a hypothetical USD 3.00 per million input tokens. A 150,000-token prompt costs USD 0.45 per query. 4,000 tokens of RAG context cost USD 0.012.\n2. Latency and memory: on Llama-3.1-8B, a 131,072-token prompt needs 16 GiB of KV cache.\n3. Scale and freshness: millions of documents do not fit, and RAG updates one document at a time.\n4. Permissions: one long prompt cannot hide parts of itself from a user.\n\n**Honest part:** long context is a good first design for a small, stable, shared corpus.\n\nFull answer: [L3 drill](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag). Source lessons: [part 06 L7](/notes/ai/llm-systems/06-rag/l7-generation-and-grounding) and [part 06 L1](/notes/ai/llm-systems/06-rag/l1-why-rag)."
}
```

### Part F, minutes 34 to 42: MCP

Transition: "Agents want to call your retrieval system. How do they connect?"

```check
{
  "question": "Opening question (minute 34): \"Agents want to call your retrieval system. You mentioned MCP. What is it, and what is new in it?\"",
  "hint": "Expected depth: level 3, about 90 seconds. The interviewer listens for the revision date and the stateless core.",
  "answer": "**Must include:**\n\n- MCP is an open protocol between an AI application (the host, with one client per server) and services (servers). It uses JSON-RPC 2.0 over stdio or Streamable HTTP. Servers offer tools, resources and prompts.\n- The current revision is 2026-07-28 (checked on 2026-10-15). Its big change is a stateless core: no `initialize` handshake, no session, `_meta` with the protocol version and client capabilities on every request.\n- Server-to-client requests became Multi Round-Trip Requests: the server returns `input_required`, and the client retries.\n- Also new: `server/discover`, `resultType` on every result, `Mcp-Method` and `Mcp-Name` headers, and tasks as an extension.\n- Roots, Sampling and Logging are deprecated for at least twelve months.\n\nFull answer: [L4 drill](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp). Source lesson: [part 07 L12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history)."
}
```

```check
{
  "question": "Interview follow-up (minute 36): \"What is the difference between stateful and stateless MCP?\"",
  "hint": "Expected depth: level 4, about 120 seconds. The interviewer listens for three kinds of state, a number and the handle pattern.",
  "answer": "**Must include:**\n\n- Three kinds of state: protocol state, application state, conversation state. 2026-07-28 removed only the first from the server between requests.\n- 2025-11-25: `initialize` fixed the version and capabilities, the server kept a session (`Mcp-Session-Id` on HTTP), and the server could call the client mid-request. A session lived in one replica.\n- Number: with $k$ replicas and random routing, $r$ requests stay on the right replica with probability $(1/k)^r$: about 1.6% for $k = 4$, $r = 3$.\n- 2026-07-28: self-describing requests, MRTR, `subscriptions/listen`, cacheable lists. Cost: about 190 more body bytes per call in the lesson's example.\n- Key sentence: a stateless protocol does not mean a stateless application. State lives behind explicit handles.\n\nFull answer: [L4 drill](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp). Source lesson: [part 07 L5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless)."
}
```

```check
{
  "question": "Interview follow-up (minute 38): \"Show me the JSON Schema of a tool's arguments. Write one.\"",
  "hint": "Expected depth: level 5, about 120 seconds. The interviewer listens for valid JSON, the root rule, and what default really does.",
  "answer": "```json\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"customer_id\": {\"type\": \"string\", \"pattern\": \"^CUS-[0-9]{4}$\", \"description\": \"Customer ID, format CUS-NNNN, for example CUS-0042.\"},\n    \"status\": {\"type\": \"string\", \"enum\": [\"pending\", \"shipped\", \"cancelled\"]},\n    \"limit\": {\"type\": \"integer\", \"minimum\": 1, \"maximum\": 50, \"default\": 20}\n  },\n  \"required\": [\"customer_id\"],\n  \"additionalProperties\": false\n}\n```\n\n**Must say:**\n\n- It is the `inputSchema` of the tool. The root must be `\"type\": \"object\"`. The default dialect is JSON Schema 2020-12.\n- `default` is an annotation. If the model omits `limit`, the server receives no `limit`, and the server code applies 20.\n- `additionalProperties: false` rejects a typo such as `limt`.\n- Design rules: enums for fixed choices, anchored patterns, bounded numbers, integers for money, flat and few parameters.\n\nFull answer: [L4 drill](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp). Source lessons: [part 07 L7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) and [part 07 L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)."
}
```

```check
{
  "question": "Interview follow-up (minute 40): \"The schema says integer. The model sends limit as the string \"3\". What happens, and which error does the model see?\"",
  "hint": "Expected depth: level 5, about 90 seconds. The interviewer listens for the difference between the schema and the SDK, and tool errors versus protocol errors.",
  "answer": "**Must include:**\n\n- JSON Schema 2020-12: `\"3\"` is invalid for `{\"type\": \"integer\"}`. `3.0` is valid, because a number with a zero fractional part is an integer.\n- Python SDK 2.3.0 validates with Pydantic in lax mode. It accepted `\"3\"` as 3 (measured in the lesson). So the server accepts more than its published schema.\n- If validation fails, the server returns a normal result with `isError: true` and a readable message, not a JSON-RPC error. The model can then read it and correct itself.\n- Discrepancy: the spec lists an unknown tool as a protocol error with -32602, but the Python SDK 2.3.0 returns `isError: true`.\n\nFull answer: [L4 drill](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp). Source lessons: [part 07 L7](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) and [part 07 L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)."
}
```

```check
{
  "question": "Interview follow-up (minute 41): \"How does a remote MCP server know who the user is?\"",
  "hint": "Expected depth: level 4, about 90 seconds. The interviewer listens for the roles, the discovery step and the audience check.",
  "answer": "**Must include:**\n\n- OAuth 2.1. The MCP server is the resource server. A separate authorization server issues tokens. stdio servers take credentials from the environment instead.\n- First request gets `401` with `WWW-Authenticate` that names the Protected Resource Metadata (RFC 9728). The client finds the authorization server there.\n- Authorization code flow with PKCE (S256), a `state`, and the `resource` parameter (RFC 8707). In 2026-07-28 the client also checks the `iss` of the response (RFC 9207).\n- The server MUST accept only tokens issued for itself (audience check) and MUST NOT pass the token through to upstream APIs.\n\nFull answer: [L4 drill](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp). Source lesson: [part 07 L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security)."
}
```

```check
{
  "question": "Interview follow-up (minute 42): \"In 2026-07-28 every request carries clientInfo. Can the server use it to decide what the caller may do?\" (Trap question.)",
  "hint": "Expected depth: level 5, about 45 seconds. The interviewer listens for a clear no and the source of real identity.",
  "answer": "**No.** `io.modelcontextprotocol/clientInfo` in `_meta` is self-reported. Any client can write any name and version.\n\n- The OAuth access token proves identity, and the server checks it on every HTTP request.\n- The same rule holds for tool arguments: the model writes a tenant ID in the arguments, so it can be wrong or injected. Take the tenant from the authenticated request.\n- `requestState` also passes through the client. If it affects authorization, the server must protect its integrity, for example with an HMAC or an AEAD cipher.\n\nFull answer: [L4 drill](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp). Source lessons: [part 07 L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security) and [part 07 L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots)."
}
```


### Part G, minutes 42 to 45: your questions

The interviewer asks whether you have questions. Ask about the team's systems: which serving engine, which retrieval stack, which MCP revision they target. Then stop the timer and score each answer with section 6.

## 13. Links

- Previous lesson: [L5: Formula and numbers sheet](/notes/ai/llm-systems/08-interview-drills/l5-formula-sheet)
- The drills behind each part: [L1](/notes/ai/llm-systems/08-interview-drills/l1-chain-attention-to-pagedattention), [L2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud), [L3](/notes/ai/llm-systems/08-interview-drills/l3-chain-rag), [L4](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp)
- The paper pitch: [00 The paper on one page](/notes/papers/llm-serving/2023-pagedattention/00-paper-on-one-page)
- The 2-minute MCP answers: [part 07 L5](/notes/ai/llm-systems/07-mcp/l5-stateful-vs-stateless) and [part 07 L12](/notes/ai/llm-systems/07-mcp/l12-whats-new-version-history)
- [Course plan](/notes/ai/llm-systems/course-plan), [mistakes](/notes/ai/llm-systems/00-progress/mistakes) and [Glossary](/notes/ai/llm-systems/glossary)

### Sources

Every answer on this page is based on the lessons and drills that it links. The primary sources behind those lessons (checked on 2026-10-15):

- Efficient Memory Management for Large Language Model Serving with PagedAttention: https://arxiv.org/abs/2309.06180
- Attention Is All You Need: https://arxiv.org/abs/1706.03762
- vLLM documentation: https://docs.vllm.ai/en/latest/
- NVIDIA H100 product page: https://www.nvidia.com/en-us/data-center/h100/
- MCP specification 2026-07-28: https://modelcontextprotocol.io/specification/2026-07-28
- MCP blog post on the 2026-07-28 release: https://blog.modelcontextprotocol.io/posts/2026-07-28/
