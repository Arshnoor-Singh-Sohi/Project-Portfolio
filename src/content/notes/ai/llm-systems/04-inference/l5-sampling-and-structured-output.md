---
title: "L5: Sampling and structured output"
order: 5
summary: "How a server turns 128,256 logits into one token: the exact order of logit bias, penalties, temperature, min-p, top-k and top-p in vLLM V1, the exponential-race draw, logprobs and seeds. Then constrained decoding for JSON and grammars with token masks from state machines, how XGrammar makes it fast, its pitfalls, and why temperature 0 can still give different answers."
status: not-started
tags: [inference, sampling, temperature, top-p, min-p, penalties, structured-output, constrained-decoding, xgrammar, determinism]
---

## 1. The question this idea answers

After each forward pass, the model gives one score (a logit) for every entry of the vocabulary: 128,256 numbers for Llama-3.1-8B. The server must choose one token. The client controls how with settings such as `temperature`, `top_p` and `presence_penalty`. Some clients also demand that the output is valid JSON for a given schema.

An interviewer asks: in which order are these settings applied, and does the order matter? How does the server draw a random token on a GPU without slowing down? How does "JSON mode" guarantee valid JSON, and what does it cost? Why can the same prompt at temperature 0 give two different answers? This lesson answers with the code of vLLM V1 and with numbers.

The basics of softmax, greedy decoding, temperature, top-k and top-p are in the paper page [Decoding: greedy, temperature and sampling](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/02-background-decoding-greedy-temperature-sampling). This lesson goes deeper into the server side.

## 2. Mental model

> [!analogy] A raffle with a strict door policy
> Every token gets raffle tickets in proportion to its probability. Before the draw, several officials edit the tickets in a fixed order. One adds or removes tickets for named tokens (logit bias). One takes tickets away from tokens that already appeared (penalties). One makes the raffle fairer or more lopsided (temperature). Others throw away tickets of the weakest tokens (min-p, top-k, top-p). Then one ticket is drawn.
>
> For structured output, a door guard stands in front of the box: a token whose text would break the required format is never let in.
>
> **Where it stops working:** in a real raffle, removing tickets does not change who is the favorite unless you remove the favorite's tickets. Here, penalties can change the favorite, but temperature and the filters never can. Also, the door guard of structured output must look ahead: a token can be allowed now and still lead into a dead end later.

## 3. Terms

| Term | Plain meaning |
|---|---|
| logit | The raw score of one vocabulary entry before softmax. Higher means more likely. |
| softmax | $p_i = e^{z_i} / \sum_j e^{z_j}$: turns logits into probabilities that sum to 1. |
| greedy decoding | Always take the token with the highest logit. In vLLM, a temperature below $10^{-5}$ means greedy. |
| temperature | Divide every logit by $T$ before softmax. $T < 1$ sharpens, $T > 1$ flattens. |
| top-k | Keep only the $k$ highest logits. |
| top-p (nucleus) | Keep the smallest set of top tokens whose probabilities sum to at least $p$. |
| min-p | Keep only tokens whose probability is at least `min_p` times the top probability. |
| logit bias | A number added to the logit of a chosen token ID. A large negative bias bans the token. |
| repetition penalty | Pushes down the logits of tokens that appear in the prompt or the output so far. |
| frequency penalty | Subtracts `frequency_penalty` × (count of the token in the output so far) from its logit. |
| presence penalty | Subtracts `presence_penalty` once from the logit of every token that appears in the output so far. |
| argmax-invariant | A processing step that can never change which token has the highest logit. |
| logprob | The natural logarithm of a token's probability. |
| seed | A number that fixes the random draws of one request. |
| constrained decoding | Sampling where a mask removes every token that would break a required format. Also called structured output or guided decoding. |
| token mask | A list of allowed tokens for this step, often stored as a bitmask with 1 bit per vocabulary entry. |
| finite-state machine (FSM) | A machine with a fixed set of states and transitions. It can check regular expressions. |
| pushdown automaton (PDA) | A state machine plus a stack. It can check nested structures such as JSON objects inside arrays. |
| batch invariance | The property that a request's numbers do not depend on which other requests share its batch. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. From logits to one token, in vLLM's order

### 4.1 The order

> [!key] The order is fixed, and it matters
> vLLM V1 applies the processors in this order: allowed tokens, bad words, logit bias and min-tokens, penalties, then temperature, min-p, top-k and top-p. The first group can change the top token. The second group never can. Then one token is drawn.

The docstring of the `Sampler` class in vLLM 0.31.0 (`vllm/v1/sample/sampler.py`, checked on 2026-10-15) lists the steps:

1. If logprobs are requested, compute them from the **raw** logits (the default `logprobs_mode` is `raw_logprobs`).
2. Convert the logits to FP32.
3. Apply the allowed-token-IDs whitelist.
4. Apply the bad-words exclusion.
5. Apply the logits processors that are not argmax-invariant: the min-tokens processor and the logit-bias processor.
6. Apply the penalties: repetition, then frequency, then presence.
7. Sample: if a request is greedy, take the argmax. Otherwise apply temperature, then the argmax-invariant processors (min-p by default), then top-k and top-p, then draw a token.
8. Gather the logprobs of the top `logprobs` tokens and of the sampled token.

A grammar mask for structured output is applied to the logits before this sampler runs (section 6).

### 4.2 Each step as a formula

Let $z_i$ be the logit of token $i$.

- **Logit bias:** $z_i \leftarrow z_i + b_i$.
- **Min-tokens:** while fewer than `min_tokens` tokens exist, the end-of-sequence token and the stop token IDs get $-\infty$.
- **Repetition penalty $\theta$:** for every token that appears in the prompt **or** the output so far:

$$
z_i \leftarrow \begin{cases} z_i / \theta & \text{if } z_i > 0 \\ z_i \times \theta & \text{if } z_i \le 0 \end{cases}
$$

- **Frequency and presence penalties:** with $c_i$ the count of token $i$ in the output so far (not the prompt):

$$
z_i \leftarrow z_i - f \cdot c_i - r \cdot \mathbf{1}[c_i > 0]
$$

The vLLM source says: "We follow the definition in OpenAI API."

- **Temperature:** $z_i \leftarrow z_i / T$. vLLM treats $T < 10^{-5}$ as greedy. A temperature between 0 and 0.01 is raised to 0.01 with a warning, because smaller values "may cause numerical errors nan or inf".
- **Min-p:** compute $p = \mathrm{softmax}(z)$ and remove every token with $p_i < \text{min\_p} \times \max_j p_j$.
- **Top-k:** remove every token below the $k$-th highest logit. In vLLM, `top_k = 0` or `-1` means no limit.
- **Top-p:** sort the remaining tokens, renormalize them, and remove the low tokens whose cumulative probability is at most $1 - p$. vLLM always keeps the top token.

> [!trap] Top-p runs after top-k, on the renormalized top-k distribution
> In vLLM's PyTorch path (`apply_top_k_top_p_pytorch`), top-k first sets low logits to $-\infty$. Then softmax runs over what remains, and top-p cuts on that new distribution. So "top_p = 0.9" means 90% of the probability left after top-k and min-p, not 90% of the original distribution.

The repetition penalty has a history worth knowing. The CTRL paper (Keskar et al., 2019) introduced it by dividing the logits of earlier tokens by $\theta$, and suggested $\theta \approx 1.2$ with greedy sampling. Dividing a negative logit by $\theta > 1$ moves it toward 0, which **raises** that token's probability. So implementations such as vLLM's kernel multiply negative logits by $\theta$ instead: `logit / penalty` if `logit > 0`, else `logit * penalty`.

### 4.3 Worked example

![Alt text: a table of six tokens through each sampling step, ending with Paris 0.3945 and Lyon 0.6055](/notes/media/llm-systems/figures/04-5-sampling-pipeline.svg)

> [!example] Worked example: one sampling step with every processor
> Vocabulary of 6 tokens: " Paris", " Lyon", " the", " France", " Rome", `<eos>`. Raw logits: 3.0, 2.0, 1.0, 0.5, 1.2, −1.0. At $T = 1$, these give probabilities 0.5653, 0.2080, 0.0765, 0.0464, 0.0934, 0.0104. The prompt contains " France". The output so far is " the", " Paris", " the".
>
> Settings: `logit_bias` −100 for " Rome", `repetition_penalty` 1.2, `frequency_penalty` 0.5, `presence_penalty` 0.3, `temperature` 0.7, `min_p` 0.02, `top_k` 3, `top_p` 0.9.
>
> 1. **Logit bias.** " Rome": $1.2 - 100 = -98.8$.
> 2. **Repetition.** " Paris" (in the output): $3.0 / 1.2 = 2.5$. " the" (in the output): $1.0 / 1.2 = 0.8333$. " France" (in the prompt): $0.5 / 1.2 = 0.4167$.
> 3. **Frequency and presence.** " the" appears twice: $0.8333 - 0.5 \times 2 - 0.3 = -0.4667$. " Paris" appears once: $2.5 - 0.5 - 0.3 = 1.7$. " France" is only in the prompt, so these two penalties do not touch it.
> 4. **Temperature 0.7.** Logits: 2.4286, 2.8571, −0.6667, 0.5952, −141.14, −1.4286. Probabilities: 0.3621, 0.5559, 0.0164, 0.0579, 0.0000, 0.0077. " Lyon" now leads: the penalties changed the top token.
> 5. **Min-p 0.02.** Threshold $0.02 \times 0.5559 = 0.0111$. " Rome" and `<eos>` fall below it.
> 6. **Top-k 3.** Four tokens remain. The lowest, " the", goes.
> 7. **Top-p 0.9.** Renormalized: " France" 0.0593, " Paris" 0.3711, " Lyon" 0.5696. Sorted from low to high, the cumulative sums are 0.0593, 0.4304, 1.0. Only 0.0593 is at most $1 - 0.9 = 0.1$, so " France" goes.
> 8. **Final distribution.** " Paris" $e^{2.4286} / (e^{2.4286} + e^{2.8571}) = 0.3945$ and " Lyon" 0.6055.

```python
import numpy as np

def softmax(z):
    z = z - np.max(z)
    e = np.exp(z)
    return e / e.sum()

def process_logits(logits, prompt_ids, output_ids, *, logit_bias=None, rep=1.0, freq=0.0,
                   pres=0.0, temperature=1.0, min_p=0.0, top_k=0, top_p=1.0):
    """Turn raw logits into sampling probabilities in the order of vLLM V1's sampler."""
    x = logits.astype(np.float64).copy()
    for tok, b in (logit_bias or {}).items():             # 1. logit bias
        x[tok] += b
    seen = np.zeros(len(x), dtype=bool)
    seen[list(prompt_ids) + list(output_ids)] = True      # 2. repetition: prompt AND output
    x[seen] = np.where(x[seen] > 0, x[seen] / rep, x[seen] * rep)
    counts = np.bincount(output_ids, minlength=len(x))    # 3. frequency and presence: output only
    x -= freq * counts + pres * (counts > 0)
    x /= temperature                                      # 4. temperature
    p = softmax(x)
    x[p < min_p * p.max()] = -np.inf                      # 5. min-p
    if top_k > 0:                                         # 6. top-k
        kth = np.sort(x)[-top_k]
        x[x < kth] = -np.inf
    order = np.argsort(x)                                 # 7. top-p on the top-k distribution
    cum = np.cumsum(softmax(x[order]))
    drop = cum <= 1 - top_p
    drop[-1] = False                                      # always keep the top token
    x[order[drop]] = -np.inf
    return softmax(x)

vocab = [" Paris", " Lyon", " the", " France", " Rome", "<eos>"]
logits = np.array([3.0, 2.0, 1.0, 0.5, 1.2, -1.0])
p = process_logits(logits, prompt_ids=[3], output_ids=[2, 0, 2], logit_bias={4: -100.0},
                   rep=1.2, freq=0.5, pres=0.3, temperature=0.7, min_p=0.02, top_k=3, top_p=0.9)
print({v: round(float(q), 4) for v, q in zip(vocab, p)})
```

Output:

```text
{' Paris': 0.3945, ' Lyon': 0.6055, ' the': 0.0, ' France': 0.0, ' Rome': 0.0, '<eos>': 0.0}
```

- `seen` marks prompt and output tokens, because vLLM's repetition penalty uses both masks (`prompt_mask[idx] || output_mask[idx]` in its CUDA kernel).
- `counts` counts the output only, as the docstrings of `frequency_penalty` and `presence_penalty` say ("in the generated text so far").
- `np.sort(x)[-top_k]` is the $k$-th highest logit. Ties at that value survive, as in vLLM's mask `logits_sort < top_k_mask`.
- `drop[-1] = False` mirrors vLLM's comment "at least one".

### 4.4 Why the order matters

Change the order and the answer changes. Two examples with the same numbers:

- **Penalties after temperature.** Then a penalty of 0.5 is not divided by 0.7. It acts weaker at low temperature and stronger at high temperature. Engines that differ here give different outputs for "the same" settings.
- **Top-p before top-k.** Then top-p cuts on the full distribution. With different cut points, the set of kept tokens can differ.

Interpretation of these notes: when you move a prompt and its settings between providers or engines, expect different behavior even with identical numbers. Hosted APIs do not always document their order.

## 5. Drawing the token

### 5.1 The exponential race

`torch.multinomial` is the obvious way to draw from a distribution. vLLM avoids it. Its source says: "We use this function instead of torch.multinomial because torch.multinomial causes CPU-GPU synchronization." Instead, vLLM fills a tensor $E$ with independent draws from the exponential distribution and takes

$$
\text{token} = \arg\max_i \frac{p_i}{E_i}
$$

**Why this draws token $i$ with probability $p_i$.** Let $E_i$ have the exponential distribution with rate 1. Then $E_i / p_i$ has the exponential distribution with rate $p_i$.

Picture each token as a runner who finishes at time $E_i / p_i$. For independent exponential times, the runner with rate $p_i$ finishes first with probability $p_i / \sum_j p_j = p_i$. The argmax of $p_i / E_i$ is the argmin of $E_i / p_i$, so it is that first runner. Tokens with $p_i = 0$ never win. This is the same trick as Gumbel-max, because $-\ln E_i$ has the Gumbel distribution.

```python
def sample(p, rng):
    """Exponential race: argmax p_i / E_i with E_i ~ Exp(1) picks token i with probability p_i."""
    with np.errstate(divide="ignore"):
        return int(np.argmax(p / rng.exponential(size=p.shape)))

rng = np.random.default_rng(0)
draws = [sample(p, rng) for _ in range(100_000)]
print(np.bincount(draws, minlength=len(p)) / len(draws))
```

Output:

```text
[0.3935 0.6065 0.     0.     0.     0.    ]
```

The empirical shares (0.3935 and 0.6065) match the target 0.3945 and 0.6055 within sampling noise.

### 5.2 Seeds

A request with its own `seed` gets its own random generator. vLLM draws the noise for all requests at once, then overwrites the rows of seeded requests one by one. A source comment admits: "This can be slow because we handle each request one by one." A seed makes the random draw repeatable. It does not make the logits repeatable (section 7).

### 5.3 Logprobs

- `logprobs: n` in vLLM's `SamplingParams` returns the log-probabilities of the $n$ most likely tokens and of the sampled token, so up to $n + 1$ entries. The OpenAI chat API names the fields `logprobs: true` and `top_logprobs: n`.
- By default, vLLM V1 computes them from the **raw** logits, before penalties and temperature. A source comment says this "is different from the V0 sampler, which uses the logits that is used for sampling". The server option `logprobs_mode` can switch to `processed_logprobs`.
- `prompt_logprobs` returns logprobs of the prompt tokens. It needs logits for prompt positions, so it costs extra compute and memory ([L1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request) explains why vLLM normally skips them).

> [!trap] Raw logprobs are not the sampling probabilities
> With temperature 0.7 and penalties, the probability that vLLM sampled from differs from the returned raw logprob. In the worked example, " Lyon" had a raw probability of 0.2080 but a sampling probability of 0.6055. Use processed logprobs if you need the real sampling distribution, for example for evaluation or for importance weights.

### 5.4 Stop conditions and defaults

The stop conditions (end-of-sequence token, stop token IDs, stop strings, `max_tokens`) are in [L1](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request). Two defaults matter here:

- vLLM loads sampling defaults from the model's `generation_config.json` unless the server runs with `--generation-config vllm` (`generation_config: str = "auto"` in vLLM 0.31.0). So a request without `temperature` may not get 1.0.
- With temperature below $10^{-5}$, vLLM resets `top_p` to 1, `top_k` to 0 and `min_p` to 0, and requires `n = 1`.

## 6. Structured output: constrained decoding

### 6.1 The idea

> [!key] A mask over the vocabulary at every step
> Constrained decoding keeps a machine that knows which texts are still valid. Before each draw, it sets the logit of every token that would make the text invalid to $-\infty$. Softmax then gives those tokens probability 0, and the model chooses among the valid ones.

In formulas (the older lesson [Tool schemas and structured outputs](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs) shows the same idea for hosted APIs):

$$
p'(t) = \frac{p(t)\, a(t)}{\sum_{s} p(s)\, a(s)}, \qquad a(t) \in \{0, 1\}
$$

The hard part is computing $a(t)$ for 128,256 tokens in microseconds at every step. A token is a string of several characters. The machine must check whether that whole string can follow the current state.

### 6.2 A worked example with a state machine

The output must be exactly one of "positive", "negative" or "neutral". The toy vocabulary has 11 tokens: `pos`, `neg`, `neu`, `itive`, `ative`, `tral`, `n`, `e`, `ut`, `x` and `<eos>`.

![Alt text: a state machine for the three words, with the dead-end path n, ne, neut](/notes/media/llm-systems/figures/04-5-token-mask.svg)

```python
import numpy as np
from functools import lru_cache

CHOICES = ["positive", "negative", "neutral"]
VOCAB = ["pos", "neg", "neu", "itive", "ative", "tral", "n", "e", "ut", "x", "<eos>"]
EOS = len(VOCAB) - 1

def is_prefix(s):
    return any(c.startswith(s) for c in CHOICES)

@lru_cache(maxsize=None)
def live(state):
    """True if some token sequence can still finish a choice from this state."""
    if state in CHOICES:
        return True
    return any(is_prefix(state + t) and live(state + t) for t in VOCAB[:EOS])

def mask(state, check_live=True):
    m = np.zeros(len(VOCAB), dtype=bool)
    m[EOS] = state in CHOICES
    for i, tok in enumerate(VOCAB[:EOS]):
        nxt = state + tok
        m[i] = is_prefix(nxt) and (live(nxt) if check_live else True)
    return m

for s in ["", "n", "ne", "neu", "neut", "neg", "negative"]:
    naive = [VOCAB[i] for i in np.flatnonzero(mask(s, False))]
    safe = [VOCAB[i] for i in np.flatnonzero(mask(s, True))]
    print(f"{s!r:12} live={live(s)!s:5} naive={naive} safe={safe}")
```

Output:

```text
''           live=True  naive=['pos', 'neg', 'neu', 'n'] safe=['pos', 'neg', 'neu']
'n'          live=False naive=['e'] safe=[]
'ne'         live=False naive=['ut'] safe=[]
'neu'        live=True  naive=['tral'] safe=['tral']
'neut'       live=False naive=[] safe=[]
'neg'        live=True  naive=['ative'] safe=['ative']
'negative'   live=True  naive=['<eos>'] safe=['<eos>']
```

- The state is the text so far. `is_prefix` asks whether the text can still grow into a valid word.
- A naive mask allows `n` at the start, because "n" is a prefix of "negative". But this vocabulary has no `g` and no `ral` token, so "n" can only become "ne" and then "neut", where no token fits. The model would be stuck.
- `live` looks ahead: a state is live if some sequence of tokens reaches a complete choice. The safe mask allows only tokens that lead to live states.
- `<eos>` is allowed only in an accepting state.

> [!example] Worked example: the mask changes the choice
> Toy logits for the 11 tokens: `pos` 1.0, `neg` 2.5, `neu` 0.3, `itive` 0.1, `ative` 0.2, `tral` 0.4. Then `n` 0.9, `e` 0.5, `ut` 0.7, `x` 3.0 and `<eos>` −1.0.
>
> - Without a mask, the most likely token is `x` with probability 0.4306. It cannot start any valid answer.
> - With the safe mask at the start state, only `pos`, `neg` and `neu` remain: $e^{1.0}$, $e^{2.5}$ and $e^{0.3}$ out of their sum. The probabilities are 0.1673, 0.7497 and 0.0831.

### 6.3 From schemas to machines

- **Regular expressions and simple schemas.** A regular expression becomes a finite-state machine over characters. Outlines (Willard and Louf, 2023) then builds an index, a map "σ : Q → P(V)" from each FSM state to the set of vocabulary tokens it accepts. It walks every token's characters through the machine from every state, once, before generation. At generation time a lookup in a hash map gives the mask, which "costs O(1) on average" per token.
- **Nested JSON needs a stack.** Objects can contain arrays that contain objects, to any depth. Matching brackets is not a regular language, so no finite-state machine can check it. A pushdown automaton adds a stack. XGrammar (Dong et al., 2024) explains: "CFG interpretation requires a stack state that tracks the recursive rules matched so far", and "the unbounded stack length results in an infinite number of possible states". So the token masks cannot all be precomputed.
- **XGrammar's speed-ups.** It splits the vocabulary into "context-independent tokens, which constitute the vast majority and can be pre-computed", and context-dependent tokens, which need the stack. For the Llama-3.1 vocabulary with a JSON grammar, the context-dependent tokens are "less than 1% (1134 out of 128k)". It caches the precomputed validity per grammar position. It keeps the possible stacks in one shared tree (the persistent stack). It computes the mask on the CPU while the GPU runs the forward pass. It reports mask generation "under 40 µs per token for JSON Schema and CFG (JSON)" and "up to 100x speedup over existing solutions".

### 6.4 Structured output in vLLM

- **Backends.** `StructuredOutputsConfig.backend` accepts `auto`, `xgrammar`, `guidance`, `outlines` and `lm-format-enforcer`. With `auto`, vLLM 0.31.0 tries XGrammar first. If the request uses a feature that XGrammar does not support, vLLM uses guidance (llguidance) instead, or in some cases Outlines (`vllm/sampling_params.py`, checked on 2026-10-15).
- **Where the mask is built and applied.** After each scheduling decision, the engine core calls `scheduler.get_grammar_bitmask`. The `StructuredOutputManager` builds one bitmask for the batch. The GPU worker applies it to the logits before the sampler (`apply_grammar_bitmask`). With speculative decoding, it needs one mask row per draft position: the code allocates `max_batch_size * (1 + max_num_spec_tokens)` rows.
- **API.** Through the OpenAI-compatible server, use `response_format` with `"type": "json_schema"`, or the `structured_outputs` extra field with one of `json`, `regex`, `choice`, `grammar` or `structural_tag`. The older fields `guided_json`, `guided_regex`, `guided_choice`, `guided_grammar` and `guided_decoding_backend` "were removed in v0.12.0" (vLLM docs, checked on 2026-10-15).

```json
{
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "messages": [{"role": "user", "content": "Classify the sentiment: vLLM is wonderful!"}],
  "structured_outputs": {"choice": ["positive", "negative", "neutral"]}
}
```

> [!example] Worked example: the size of a bitmask
> One bit per vocabulary entry, packed into 32-bit integers. For Llama-3.1-8B: $\lceil 128{,}256 / 32 \rceil = 4{,}008$ integers, so $4{,}008 \times 4 = 16{,}032$ bytes per sequence per step. For 1,024 sequences, the batch mask is about 16.4 MB. That is small next to the logits themselves: $1{,}024 \times 128{,}256 \times 4$ bytes is about 525 MB in FP32.

### 6.5 Pitfalls

1. **Truncation.** If `max_tokens` ends the output inside the structure, the result is invalid JSON with `finish_reason: "length"`. The mask cannot help, because it only acts while tokens are generated.
2. **First-request latency.** A new schema must be compiled into a grammar. Cache compiled grammars and warm them up for fixed schemas.
3. **Quality.** The mask can force the model down a path it considered unlikely. The vLLM docs advise: "normally it's better to indicate in the prompt the JSON schema and how the fields should be populated". Interpretation of these notes: if the answer needs thought, put a reasoning field before the answer field. A forced early answer cannot use later tokens.
4. **Reasoning models.** With a reasoning parser, vLLM can leave the thinking part unconstrained. The option `enable_in_reasoning` (default false) decides whether the grammar also applies inside the reasoning.
5. **Whitespace.** JSON allows any amount of whitespace, so a constrained model can loop on spaces or newlines. `disable_any_whitespace` makes the output compact (XGrammar and guidance backends only).
6. **Unsupported schema keywords.** Not every backend supports every JSON Schema keyword. In `auto` mode, vLLM switches to another backend. With a fixed backend, the request fails. [JSON Schema for tool arguments](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments) covers the keywords.

## 7. Determinism: why temperature 0 can still vary

Greedy decoding is a deterministic rule, so the same logits always give the same token. But the logits themselves can change slightly between runs.

### 7.1 Floating-point addition is not associative

```python
import numpy as np

print((0.1 + 1e20) - 1e20, 0.1 + (1e20 - 1e20))

rng = np.random.default_rng(0)
x = rng.standard_normal(4096).astype(np.float32)
s_one = np.float32(0)
for v in x:
    s_one += v                                      # one long sequential sum
s_split = sum(np.float32(c.sum(dtype=np.float32)) for c in np.split(x, 8))   # 8 chunks, then add
s_tree = x.sum(dtype=np.float32)                    # NumPy's pairwise sum
print(repr(s_one), repr(s_split), repr(s_tree))
```

Output:

```text
0.0 0.1
np.float32(-66.06458) np.float32(-66.064606) np.float32(-66.0646)
```

The same 4,096 numbers give three different sums, depending on the order of the additions. A GPU kernel chooses its order: how it splits a dot product across threads and blocks.

### 7.2 The real cause: batch size changes the kernel

A Thinking Machines blog post (Horace He, 2025-09-10) argues that the usual explanation, concurrency plus floating point, "doesn't reveal the full picture". The forward pass of a typical server is "run-to-run deterministic": the same batch gives the same numbers. But it is not **batch-invariant**: a request's numbers depend on the batch size, because kernels choose a different reduction strategy for different batch sizes. The post names three operations: RMSNorm, matrix multiplication (split-K "breaks batch invariance") and attention (split-KV). Server load sets the batch size, so from one user's point of view the output is nondeterministic.

> [!example] Worked example: how big the effect is
> The post sampled 1,000 completions at temperature 0 for "Tell me about Richard Feynman" with Qwen3-235B-A22B-Instruct-2507. It got 80 unique completions. The most common appeared 78 times. The first divergence came at "the 103rd token". With batch-invariant kernels, all 1,000 completions were identical.
>
> The cost, with Qwen3-8B on one GPU and 1,000 sequences: 26 s for default vLLM and 55 s for an unoptimized deterministic version. An improved attention kernel brought it to 42 s.

Why a tiny difference matters: greedy decoding takes the argmax. If two logits differ by less than the rounding noise, a change of the last bit flips the chosen token. From then on, the two texts differ completely, because every later token depends on it.

### 7.3 Batch invariance in vLLM

vLLM has a batch-invariant mode, "currently in beta". Enable it with the environment variable `VLLM_BATCH_INVARIANT=1`. The docs say that it ensures "that the output of a model is deterministic and independent of the batch size or the order of requests in a batch". It requires NVIDIA GPUs with compute capability 8.0 or higher (or Intel XPUs with Triton). It uses deterministic kernels and disables optimizations "such as custom all-reduce operations in tensor parallel mode". With random sampling, vLLM warns when no seed is set: "Random sampling without an explicit seed may not be batch invariant."

Other sources of variation remain outside this mode: a different GPU type, a different tensor-parallel size, a different engine version, or a different quantization.

### Exercises

1. **Your own sampler.** Without reading section 4.3 again, write `process_logits` in NumPy in vLLM's order. Acceptance test: the worked example gives 0.3945 and 0.6055. With `rep = 1.0`, `freq = 0` and `pres = 0` and everything else the same, " Paris" leads again with 0.8067.
   - Hint 1: apply penalties before temperature.
   - Hint 2: top-p must use the distribution after top-k.
2. **Check the exponential race.** Draw 200,000 tokens with the exponential race and with `rng.choice(len(p), p=p)` for $p = (0.5, 0.3, 0.15, 0.05)$. Acceptance test: both empirical distributions are within 0.005 of $p$ in every entry.
   - Hint 1: `rng.exponential(size=(N, 4))` draws all noise at once.
   - Hint 2: take `argmax(p / E, axis=1)`.
3. **A JSON-shaped constraint.** Extend the state machine of section 6.2 so that the output must be `{"answer":"yes"}` or `{"answer":"no"}`. Use the vocabulary `{"`, `answer`, `":"`, `yes`, `no`, `"}`, `ye`, `s`, `n` and `<eos>`. Acceptance test: at the start, only `{"` is allowed. After `{"answer":"`, the allowed tokens are `yes`, `no` and `ye`, and `n` is not allowed.
   - Hint 1: reuse `is_prefix` and `live` with the two complete strings as `CHOICES`.
   - Hint 2: `n` keeps a valid prefix, but the vocabulary has no `o` token to finish "no" after it.

## 8. Common mistakes

1. **"Temperature 0 makes a server deterministic."** It makes the rule deterministic. The logits still depend on the batch size unless the kernels are batch-invariant.
2. **"Top-p 0.9 keeps 90% of the original probability mass."** In vLLM, top-p runs after top-k and min-p, on the renormalized remainder.
3. **"The repetition penalty divides every repeated logit by θ."** Dividing a negative logit by θ raises it. vLLM multiplies negative logits by θ.
4. **"Presence and frequency penalties count the prompt."** In vLLM, they count only the generated tokens. The repetition penalty uses prompt and output.
5. **"Returned logprobs are the sampling probabilities."** vLLM V1 returns raw logprobs by default, before penalties and temperature.
6. **"Structured output guarantees a complete JSON object."** It guarantees that every generated token keeps the text valid. A `max_tokens` limit can still cut the object.
7. **"A mask that only checks prefixes is enough."** A token can keep a valid prefix and still lead to a state from which the vocabulary cannot finish the structure. A correct mask looks ahead to live states.

## 9. One-minute explanation

After each forward pass, the server has one logit per vocabulary entry and must choose one token. vLLM V1 applies allowed tokens, bad words, logit bias, min-tokens and penalties first, then temperature, min-p, top-k and top-p. The first group can change the top token, the second group never can, so greedy decoding still feels the penalties. Top-p cuts the distribution that remains after top-k. To draw, vLLM uses an exponential race: the argmax of $p_i / E_i$ with exponential noise picks token $i$ with probability $p_i$, without a CPU-GPU synchronization. Structured output adds a token mask: a state machine for regular formats, or a pushdown automaton for nested JSON, sets invalid tokens to minus infinity. XGrammar makes this fast: it precomputes the more than 99% of tokens whose validity does not depend on the stack. It also computes masks on the CPU while the GPU runs. The mask cannot fix a cut by max_tokens, and it can lower quality if it forces unlikely tokens. Finally, temperature 0 is not enough for identical outputs: kernels reduce in a batch-dependent order, so vLLM offers a batch-invariant mode at some speed cost.

## 10. Check questions

```check
{
  "question": "In vLLM V1, which processing steps can change the token that greedy decoding picks, and which cannot? Why does vLLM apply logit bias and penalties before the greedy branch?",
  "hint": "A step is argmax-invariant if it never changes which logit is the largest.",
  "answer": "**Can change the top token:** the allowed-token whitelist, bad words, the min-tokens processor, logit bias, and the repetition, frequency and presence penalties. They change logits by different amounts for different tokens.\n\n**Cannot change it:** temperature, min-p, top-k and top-p. Dividing all logits by the same positive $T$ keeps their order. The top token always passes its own min-p threshold. Top-k and top-p always keep the top token.\n\nvLLM therefore applies the first group before the greedy branch: a greedy request must still respect a ban, a bias or a repetition penalty. The second group runs only on the random-sampling path, because it cannot affect an argmax. vLLM's docstring calls these \"logit processors which are not argmax-invariant\" and \"argmax-invariant\" ones."
}
```

```check
{
  "question": "After temperature, six tokens have probabilities 0.40, 0.25, 0.15, 0.10, 0.06 and 0.04. With `top_k = 4` and `top_p = 0.7`, which tokens does vLLM keep, with which final probabilities? Would top-p on the original distribution keep the same set?",
  "hint": "vLLM renormalizes after top-k, then sorts from low to high and drops tokens whose cumulative sum is at most $1 - p$.",
  "answer": "1. **Top-k 4:** keep 0.40, 0.25, 0.15, 0.10. Renormalized by 0.90: 0.4444, 0.2778, 0.1667, 0.1111.\n2. **Top-p 0.7 in vLLM:** sort ascending: 0.1111, 0.1667, 0.2778, 0.4444. Cumulative sums: 0.1111, 0.2778, 0.5556, 1.0. Drop where the sum is at most $1 - 0.7 = 0.3$: the first two (0.10 and 0.15 originally).\n3. **Final:** two tokens, $0.40 / 0.65 = 0.6154$ and $0.25 / 0.65 = 0.3846$.\n\nTop-p on the original distribution: the descending cumulative sums are 0.40, 0.65, 0.80. The smallest set with at least 0.7 has three tokens (0.40, 0.25, 0.15). So the two definitions keep different sets: 2 tokens in vLLM's order, 3 tokens on the original distribution."
}
```

```check
{
  "question": "A token that already appeared has logit −2.0. Apply a repetition penalty of 1.2 the CTRL way (divide) and the vLLM way. Which one is correct, and why?",
  "hint": "Is −2.0 / 1.2 larger or smaller than −2.0?",
  "answer": "- CTRL division: $-2.0 / 1.2 = -1.667$. The logit **rises**, so the repeated token becomes more likely. That is the opposite of a penalty.\n- vLLM: the logit is not positive, so it multiplies: $-2.0 \\times 1.2 = -2.4$. The logit falls, so the token becomes less likely.\n\nThe vLLM kernel uses `logit > 0 ? logit / penalty : logit * penalty`. Both branches move the logit away from the more likely side. Values of the penalty below 1 do the opposite and encourage repetition, as the vLLM docstring says."
}
```

```check
{
  "question": "Interview follow-up: prove that $\\arg\\max_i p_i / E_i$, with independent $E_i \\sim \\mathrm{Exp}(1)$, picks token $i$ with probability $p_i$. Why does vLLM use this instead of `torch.multinomial`?",
  "hint": "Scale an exponential variable. Then ask which of several exponential clocks rings first.",
  "answer": "**Proof.** If $E_i \\sim \\mathrm{Exp}(1)$, then $X_i = E_i / p_i \\sim \\mathrm{Exp}(p_i)$, an exponential time with rate $p_i$. For independent exponential times with rates $p_1, \\dots, p_n$, the probability that $X_i$ is the smallest is $p_i / \\sum_j p_j$. (The competing exponential clocks form one merged process with rate $\\sum_j p_j$. Each clock owns the share $p_i$ of that rate.) Since $\\sum_j p_j = 1$, the probability is $p_i$. The largest $p_i / E_i$ is the smallest $E_i / p_i$, so the argmax picks $i$ with probability $p_i$. Tokens with $p_i = 0$ give $p_i / E_i = 0$ and never win. Equivalently, $-\\ln E_i$ is Gumbel noise, so this is the Gumbel-max trick.\n\n**Why.** vLLM's comment says `torch.multinomial` \"causes CPU-GPU synchronization\". The race needs only element-wise operations and one argmax on the GPU, so the sampler never waits for the CPU. That matters when a whole decode step takes a few milliseconds."
}
```

```check
{
  "question": "Interview follow-up: why can a finite-state machine not enforce arbitrary JSON? What does XGrammar precompute, and why is the mask then cheap? How large is the bitmask per step for Llama-3.1-8B?",
  "hint": "Think about nested brackets, and about how many tokens depend on the stack.",
  "answer": "- **Why not an FSM.** JSON values nest: objects in arrays in objects, to any depth. Checking that every `{` and `[` is closed in the right order needs memory that grows with the depth, a stack. A finite-state machine has a fixed number of states, so it can check only a bounded depth. A pushdown automaton (states plus a stack) is needed. XGrammar notes that \"the unbounded stack length results in an infinite number of possible states\", so masks cannot simply be precomputed per state.\n- **What XGrammar precomputes.** For each grammar position, the validity of the context-independent tokens, whose validity does not depend on the stack below the top. They are the vast majority: only 1,134 of about 128k Llama-3.1 tokens are context-dependent for a JSON grammar, under 1%. At run time, only those few tokens are checked against the stack. A persistent stack tree shares common stack parts, and mask computation runs on the CPU while the GPU computes the forward pass. The paper reports under 40 µs per token for JSON.\n- **Bitmask size.** $\\lceil 128{,}256 / 32 \\rceil = 4{,}008$ 32-bit integers, 16,032 bytes per sequence per step."
}
```

```check
{
  "question": "Interview follow-up: a user sends the same prompt twice at temperature 0 to a busy vLLM server and gets two different answers. Explain the cause precisely, how to fix it, and what the fix costs.",
  "hint": "Run-to-run determinism and batch invariance are different properties.",
  "answer": "**Cause.** Greedy decoding is deterministic given the logits. The logits differ slightly between the two calls. With a fixed batch, the forward pass is run-to-run deterministic. But the two calls ran in batches of different sizes, because the server load differed. Kernels for matrix multiplication (split-K), attention (split-KV) and RMSNorm choose their reduction order by batch size. Floating-point addition is not associative, so the sums differ in the last bits. When two top logits are close, the argmax flips, and every later token then differs. The Thinking Machines experiment got 80 unique answers in 1,000 runs at temperature 0, first diverging at token 103.\n\n**Fix.** Batch-invariant kernels: in vLLM, `VLLM_BATCH_INVARIANT=1` (beta, compute capability 8.0 or higher). It also disables custom all-reduce in tensor parallelism. With temperature above 0, also set a seed.\n\n**Cost.** Lower throughput. For 1,000 sequences of Qwen3-8B, the blog measured 26 s for default vLLM. Its improved deterministic version took 42 s (55 s unoptimized). Determinism also requires the same GPU type, parallel layout, engine version and quantization."
}
```

```check
{
  "question": "Interview follow-up: a client uses structured output with a JSON schema on vLLM, but some responses still fail `json.loads`. Give three likely causes and the fix for each.",
  "hint": "Check `finish_reason`, the request fields, and where the reasoning goes.",
  "answer": "1. **Truncation.** `finish_reason` is `length`: `max_tokens` cut the object. The mask cannot prevent this. Fix: raise `max_tokens`, keep the schema small, check `finish_reason` and retry.\n2. **The constraint was never applied.** The client still sends `guided_json`, which vLLM removed in v0.12.0. Fix: send `response_format` with `\"type\": \"json_schema\"`, or `structured_outputs: {\"json\": ...}`.\n3. **Reasoning text mixed with JSON.** A reasoning model writes thinking text first. If the server has no reasoning parser, or the client reads the wrong field, the text before the JSON breaks parsing. Fix: run the server with the right `--reasoning-parser` and read the JSON from `content`. The grammar applies after the reasoning unless `enable_in_reasoning` is set.\n\nOther causes: a stop string that cuts the output, or a schema keyword that the chosen backend does not support. With a fixed backend the request then fails. With `auto`, vLLM switches to another backend."
}
```

```check
{
  "question": "Exercise 1: show a reference solution for your own sampler.",
  "hint": "Compare with section 4.3, then test both settings.",
  "answer": "The reference is `process_logits` in section 4.3. The test:\n\n```python\np = process_logits(logits, [3], [2, 0, 2], logit_bias={4: -100.0}, rep=1.2, freq=0.5, pres=0.3,\n                   temperature=0.7, min_p=0.02, top_k=3, top_p=0.9)\nq = process_logits(logits, [3], [2, 0, 2], logit_bias={4: -100.0}, rep=1.0, freq=0.0, pres=0.0,\n                   temperature=0.7, min_p=0.02, top_k=3, top_p=0.9)\nprint([round(float(v), 4) for v in p[:2]], [round(float(v), 4) for v in q[:2]])\n```\n\nOutput: `[0.3945, 0.6055] [0.8067, 0.1933]`.\n\nWithout penalties, \" Paris\" keeps its raw lead: after temperature its logit is $3.0 / 0.7 = 4.29$ against $2.0 / 0.7 = 2.86$ for \" Lyon\". The penalties alone moved the top token."
}
```

```check
{
  "question": "Exercise 2: show a reference solution for checking the exponential race.",
  "hint": "Draw all noise at once with a shape of (N, 4).",
  "answer": "```python\nimport numpy as np\n\nrng = np.random.default_rng(1)\np = np.array([0.5, 0.3, 0.15, 0.05]); N = 200_000\nrace = np.argmax(p / rng.exponential(size=(N, 4)), axis=1)\nchoice = rng.choice(4, size=N, p=p)\nf1 = np.bincount(race, minlength=4) / N\nf2 = np.bincount(choice, minlength=4) / N\nprint(f1.round(4), f2.round(4), np.abs(f1 - p).max(), np.abs(f2 - p).max())\n```\n\nOutput:\n\n```text\n[0.4992 0.3003 0.1504 0.0501] [0.4988 0.301  0.15   0.0502] 0.0007699999999999929 0.001224999999999976\n```\n\nBoth methods are within 0.002 of $p$. With $N = 200{,}000$, the standard error of a share near 0.5 is about $\\sqrt{0.25 / 200{,}000} \\approx 0.0011$, so differences of this size are expected noise."
}
```

```check
{
  "question": "Exercise 3: show a reference solution for the JSON-shaped constraint.",
  "hint": "Only `CHOICES` and `VOCAB` change.",
  "answer": "```python\nfrom functools import lru_cache\n\nCHOICES = ['{\"answer\":\"yes\"}', '{\"answer\":\"no\"}']\nVOCAB = ['{\"', 'answer', '\":\"', 'yes', 'no', '\"}', 'ye', 's', 'n', '<eos>']\nEOS = len(VOCAB) - 1\n\ndef is_prefix(s):\n    return any(c.startswith(s) for c in CHOICES)\n\n@lru_cache(maxsize=None)\ndef live(state):\n    if state in CHOICES:\n        return True\n    return any(is_prefix(state + t) and live(state + t) for t in VOCAB[:EOS])\n\ndef allowed(state):\n    out = [t for t in VOCAB[:EOS] if is_prefix(state + t) and live(state + t)]\n    return out + ([\"<eos>\"] if state in CHOICES else [])\n\nprint(allowed(\"\"), allowed('{\"answer\":\"'), allowed('{\"answer\":\"ye'), allowed('{\"answer\":\"yes\"}'))\n```\n\nOutput: `['{\"'] ['yes', 'no', 'ye'] ['s'] ['<eos>']`.\n\n`n` keeps a valid prefix, but no token can follow it: `no` would give \"nno\" and there is no `o` token. The look-ahead in `live` removes it. Real engines do the same per grammar state, over the whole vocabulary."
}
```

## 11. Links

- Previous lesson: [L4: Batching and scheduling](/notes/ai/llm-systems/04-inference/l4-batching-and-scheduling)
- Next lesson: [L6: Speculative decoding](/notes/ai/llm-systems/04-inference/l6-speculative-decoding)
- Basics: [Decoding: greedy, temperature and sampling](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/02-background-decoding-greedy-temperature-sampling), [Probability and next-token prediction](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/01-background-probability-and-next-token-prediction), [From text to vectors and back](/notes/ai/llm-systems/02-attention-and-the-transformer/l1-from-text-to-vectors)
- Related: [The life of a request](/notes/ai/llm-systems/04-inference/l1-the-life-of-a-request), [Tool schemas and structured outputs](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs), [JSON Schema for tool arguments](/notes/ai/llm-systems/07-mcp/l7-json-schema-for-tool-arguments), [Numbers in memory](/notes/ai/llm-systems/01-math-and-hardware/l4-numbers-in-memory), [Serving engines](/notes/ai/llm-systems/04-inference/l10-serving-engines)

### Sources

- vLLM 0.31.0 source code: `vllm/v1/sample/sampler.py`, `vllm/v1/sample/ops/topk_topp_sampler.py`, `vllm/model_executor/layers/utils.py` (`apply_penalties`), `csrc/libtorch_stable/sampler.cu` (repetition penalty kernel), `vllm/v1/sample/logits_processor/builtin.py`, `vllm/sampling_params.py`, `vllm/config/structured_outputs.py`, `vllm/v1/structured_output/`: https://pypi.org/project/vllm/0.31.0/ (checked on 2026-10-15)
- vLLM, "Structured Outputs": https://docs.vllm.ai/en/latest/features/structured_outputs/ (checked on 2026-10-15)
- vLLM, "Batch Invariance": https://docs.vllm.ai/en/latest/features/batch_invariance/ (checked on 2026-10-15)
- Keskar et al., "CTRL: A Conditional Transformer Language Model for Controllable Generation", 2019: https://arxiv.org/abs/1909.05858 (checked on 2026-10-15)
- Holtzman et al., "The Curious Case of Neural Text Degeneration" (top-p), 2020: https://arxiv.org/abs/1904.09751 (checked on 2026-10-15)
- Nguyen et al., "Turning Up the Heat: Min-p Sampling for Creative and Coherent LLM Outputs", 2024: https://arxiv.org/abs/2407.01082 (checked on 2026-10-15)
- Willard and Louf, "Efficient Guided Generation for Large Language Models" (Outlines), 2023: https://arxiv.org/abs/2307.09702 (checked on 2026-10-15)
- Dong et al., "XGrammar: Flexible and Efficient Structured Generation Engine for Large Language Models", 2024: https://arxiv.org/abs/2411.15100 (checked on 2026-10-15)
- H. He and Thinking Machines Lab, "Defeating Nondeterminism in LLM Inference", 2025-09-10: https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/ (checked on 2026-10-15)
