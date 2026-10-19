---
title: "08 The rest of SGLang: the language, compressed FSMs and API speculation"
order: 8
summary: "The SGLang language and how its primitives create the prefix sharing that RadixAttention uses, constrained decoding from a regex to a compressed finite state machine with jump-forward and retokenization, API speculative execution for black-box models with its cost arithmetic, and how images enter the radix tree as hashed pad values."
status: not-started
tags: [sglang, sglang-language, constrained-decoding, compressed-fsm, jump-forward, api-speculative-execution, multimodal]
---

## 1. The question this page answers

The paper names three inefficiencies of LM programs (page 03). The first is that LM programs are hard to write. The second is redundant KV computation, and RadixAttention (pages 04 to 07) answers it. The third is slow constrained decoding: "existing systems only decode one token at a time". This page covers the parts of SGLang that answer the first and the third, plus two smaller techniques.

An interviewer who hears "SGLang" will ask:

1. What is the SGLang language, and why does a serving paper need a language?
2. How do `select` and `fork` create the sharing that RadixAttention exploits?
3. How does constrained decoding work, from a regex to a token mask?
4. What is a compressed finite state machine, and what does jump-forward save?
5. Why must the forced text be retokenized, and what can go wrong?
6. How can SGLang speed up a model that it reaches only through an API, such as GPT-4?
7. How does an image become part of a radix tree key?

## 2. Mental model

> [!analogy] A clerk and a printed form
> A form has printed text, such as "Name:" and "Grade:", and empty boxes. A slow clerk copies the whole form letter by letter. At every printed letter, he checks the template and writes the only letter that fits. A fast clerk copies each printed phrase in one stroke and thinks only at the empty boxes. That is jump-forward: decode only where a choice exists. A second trick works for a clerk in another building. Ask him to fill several boxes in one visit, not one box per visit. That is API speculative execution.
>
> **Where it stops working:** the "letters" of a model are tokens, and one text can split into tokens in several ways. A printed phrase copied in one stroke can end at a split that the model rarely saw in training. The engine must retokenize, and the next probabilities can change. Also, the far clerk can write the wrong thing in the extra boxes. Then the visit is wasted and must be repeated.

## 3. Terms

| Term | Plain meaning |
|---|---|
| LM program | A program that calls an LLM several times, with control flow between the calls and structured inputs and outputs. |
| primitive | One basic operation of the SGLang language, such as `gen` or `fork`. |
| `gen` | Generate text, store it under a name, and optionally constrain it with a regex. |
| `select` | Choose the option with the highest probability from a list. |
| `fork` and `join` | Make parallel copies of the prompt state, and merge their results back. |
| stream executor | The object that runs the primitives of one prompt in a background thread. |
| interpreter mode | The default execution: each prompt is an asynchronous stream of primitives. |
| regular expression (regex) | A pattern that describes a set of strings, for example `[ABC]` for one of three letters. |
| finite state machine (FSM) | States joined by transitions, each labeled with a character. A string is valid if it leads from the start state to an accepting state. |
| token mask | The set of tokens that keep the output valid at this step. All other tokens get probability 0. |
| singular transition edge | An FSM edge whose source state has exactly one successor and one acceptable character or string. |
| compressed edge | One edge that replaces a chain of singular transition edges and carries their whole string. |
| jump-forward | Append the string of a compressed edge in one step, with no decoding step for each of its tokens. |
| retokenization | Tokenizing the forced text together with the earlier text, with the model's own tokenizer. |
| API speculative execution | For an API-only model: let the first call generate past its stop condition, and reuse the extra text for later primitives. |
| pad value | In SGLang 0.5.22, the token ID that fills an image's positions in the radix key. It is computed from the image hash. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. The SGLang language

### 4.1 Why a serving paper needs a language

The paper defines LM programs by two properties. First: "LM programs typically contain multiple LLM calls interspersed with control flow." Second: "LM programs receive structured inputs and produce structured outputs." Without a language, the programmer manipulates strings, tunes prompts, parses brittle outputs, handles images by hand and writes the parallelism himself. The paper calls this the first inefficiency: programming difficulty.

The core idea of the paper is to "systematically exploit the multi-call structure in LM programs for efficient execution." A language exposes this structure. A `fork` tells the system that several calls share a prefix. A `gen` with a regex tells it the output format. The runtime can then use this information (page 07 and §5).

### 4.2 The primitives

The SGLang language is embedded in Python. Its backends are the SGLang Runtime and OpenAI.

| Primitive | What it does | What the runtime sees |
|---|---|---|
| `gen(name, regex=...)` | Generates text, stores it under `name`, with an optional regex constraint | One generation request, perhaps constrained |
| `select(name, choices)` | Chooses the highest-probability option from a list | Several requests that share the prompt |
| `extend` or `+=` | Appends text or a primitive to the prompt state | A longer prompt for the next call |
| `s["name"]` | Reads a result. It waits until the result is ready | Nothing new: a synchronization point |
| `fork(n)` | Makes $n$ parallel copies of the prompt state | $n$ requests with a shared prefix, after a hint |
| `join` | Merges the copies back | Nothing new |
| `image`, `video` | Adds an image or video frames to the prompt | Image positions in the token sequence (§7) |

The paper's Table 1 compares the primitives. LMQL has extend, gen and select. Guidance adds image. SGLang adds video, fork and join.

### 4.3 The judge program of Figure 2

The paper's Figure 2 shows a program that judges an essay about an image. It adds the image and the essay, uses `select` to ask whether they are related, and forks into three copies. Each copy judges one dimension with `gen`. The program then merges the judgments, summarizes, grades, and returns JSON that a regex constrains. The paper says an equivalent with the OpenAI API needs "2.1×" as many lines of code. A shorter version, with dimension names chosen by these notes:

```python
# Simplified from Figure 2 of the paper: plain text, no chat roles, lists of parts.
def multi_dimensional_judge(s, path, essay):
    s += ["<image " + path + "> Essay: " + essay + "\n",
          "Is the essay related to the image? ", select("related", ["yes", "no"])]
    if s["related"] == "no":
        return "unrelated"
    forks = s.fork(3)                                   # three branches, one prefix
    for f, dim in zip(forks, ["clarity", "originality", "evidence"]):
        f += ["\nJudge the " + dim + ": ", gen("judgment", stop="\n")]
    s += "\nJudgments: " + " | ".join(f["judgment"] for f in forks)   # merge
    s += ["\nReturn JSON: ", gen("output", regex=r'\{"summary": "[a-z ]+", "grade": "[ABC]"\}')]
    return s["output"]
```

### 4.4 Interpreter mode: a prompt is an asynchronous stream

The paper runs programs in interpreter mode by default. A prompt is an asynchronous stream. A primitive is submitted to the stream without blocking, "similar to launching CUDA kernels asynchronously". Each prompt has a stream executor in a background thread. Only reading a result, such as `s["related"]`, blocks until the result is ready. So the Python code runs ahead, and independent streams, such as the three branches of a fork, run in parallel. The paper also has a compiler mode with a graph representation (Appendix D), but the main results do not use it. SGLang 0.5.22 still works this way:

```python
# SGLang 0.5.22, python/sglang/lang/interpreter.py (selected lines of StreamExecutor)
class StreamExecutor:
    """A stream executor that executes SGL expressions in a background thread."""

    def submit(self, expr: SglExpr):
        self._init_var_event(expr)

        if self.use_thread:
            self.queue.put(expr)
        else:
            self._execute(expr)

    def sync(self):
        if self.use_thread:
            self.queue.join()

    def get_var(self, name):
        if name in self.variable_event:
            self.variable_event[name].wait()
        return self.variables[name]
```

`submit` puts the primitive into a queue and returns at once. `sync` waits until the queue is empty: the fork hint of page 07 uses it. `get_var` waits for a per-variable event. `ProgramState.__getitem__`, the `s["name"]` of the program, calls it.

### 4.5 How `select` and `fork` create sharing

The program above sends many requests that share long prefixes. To see them, run it against a fake frontend and engine. The fake engine records each request and its longest match with earlier prompts, in characters, like a radix tree. It runs the primitives one after another, without threads.

```python
# continues: a fake frontend and engine that run the program above
from os.path import commonprefix

class Gen:
    def __init__(self, name, choices=None):
        self.name, self.choices = name, choices

gen = lambda name, stop=None, regex=None: Gen(name)
select = lambda name, choices: Gen(name, choices)

class Engine:
    """Logs each request and the length of its longest match with earlier prompts."""
    def __init__(self):
        self.seen, self.log = [], []
    def call(self, prompt, kind):
        hit = max((len(commonprefix([prompt, p])) for p in self.seen), default=0)
        self.seen.append(prompt)
        self.log.append((kind, len(prompt), hit))
        return "yes" if kind == "select" else "ok"

class State:
    def __init__(self, engine, text=""):
        self.engine, self.text, self.vars = engine, text, {}
    def __iadd__(self, parts):
        for p in parts if isinstance(parts, list) else [parts]:
            if isinstance(p, Gen) and p.choices:          # select: the prefix, then k choices
                self.engine.call(self.text, "hint")
                for c in p.choices:
                    self.engine.call(self.text + c, "select")
                self.vars[p.name] = p.choices[0]           # this fake model prefers choice 1
                self.text += p.choices[0]
            elif isinstance(p, Gen):                       # gen: one request
                self.vars[p.name] = self.engine.call(self.text, "gen")
                self.text += self.vars[p.name]
            else:                                          # a constant string
                self.text += p
        return self
    def __getitem__(self, name):
        return self.vars[name]
    def fork(self, n):
        self.engine.call(self.text, "hint")                # the fork hint of page 07
        return [State(self.engine, self.text) for _ in range(n)]

engine = Engine()
multi_dimensional_judge(State(engine), "cat.png", "A cat sleeps on a warm red sofa.")
for kind, n, hit in engine.log:
    print(f"{kind:6} prompt={n:3} chars  matched={hit:3}")
total, hits = sum(n for _, n, _ in engine.log), sum(h for _, _, h in engine.log)
print(f"matched {hits} of {total} prompt characters = {hits / total:.1%}")
```

```text
hint   prompt= 91 chars  matched=  0
select prompt= 94 chars  matched= 91
select prompt= 93 chars  matched= 91
hint   prompt= 94 chars  matched= 94
gen    prompt=114 chars  matched= 94
gen    prompt=118 chars  matched=105
gen    prompt=115 chars  matched=105
gen    prompt=132 chars  matched= 99
matched 679 of 851 prompt characters = 79.8%
```

Read the log line by line:

1. **The `select` hint** (91 characters) is new, so it matches 0. SGLang 0.5.22 sends it too: `select` first sends the prompt with `"max_new_tokens": 0` under the comment "Cache common prefix" (`runtime_endpoint.py`).
2. **The two choices** ("yes" and "no") each match the whole 91-character prompt. In 0.5.22, the choices go out as one batch with one prompt per choice, and each returns the log probabilities of its tokens. The default `choices_method` is `token_length_normalized`.
3. **The fork hint** (94 characters) is already fully cached, because the "yes" choice request had the same text.
4. **The three branches** match the 94-character prefix. Branches 2 and 3 also match "\nJudge the" from branch 1: 105 characters.
5. **The final `gen`** matches 99 characters: the prefix plus "\nJudg", the common start of "\nJudgments" and "\nJudge the". The match ends inside an edge, which a radix tree handles with a split (page 01).

Every request after the first reuses most of its prompt. The language does not hide this structure, so the runtime can exploit it.

## 5. Constrained decoding and the compressed FSM

### 5.1 From a regex to a finite state machine

A program often needs output in a fixed format, for example JSON with two fields. The judge program asks for the regex `\{"summary": "[a-z ]+", "grade": "[ABC]"\}`. Read it piece by piece. `\{` is the character `{`. `"summary": "` is constant text. `[a-z ]+` means one or more characters, each a lowercase letter or a space. `[ABC]` means exactly one of A, B or C. `\}` is the closing brace.

A finite state machine (FSM) checks such a pattern one character at a time. It has states, and each state has transitions, labeled with characters, to next states. Reading a character follows its transition. If no transition has that character, the text is invalid. The text is complete when it ends in an accepting state.

For this regex, the FSM has 31 states in a chain, numbered 0 to 30, as the code below builds it:

1. States 0 to 13 read the 13 characters of `{"summary": "`, one transition each.
2. State 13 accepts any of 27 characters (26 letters and the space) and goes to state 14.
3. State 14 has 28 transitions: the same 27 characters loop back to 14, and `"` goes to 15.
4. States 15 to 27 read `, "grade": "`, 12 characters.
5. State 27 accepts A, B or C. States 28 to 30 read `"}`. State 30 is the accepting state.

### 5.2 The token mask: one forward pass per token

The model does not write characters. It writes tokens, and a token can hold several characters. Existing systems "follow the constraints only for the next token by masking probabilities of disallowed tokens." At each step, the engine computes which tokens keep the text valid from the current FSM state. It sets all other tokens to probability 0, and the model chooses among the rest. [L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output), §6, builds such a mask step by step.

The cost problem is at the constant text. At state 0, only the text `{"summary": "` can follow. The mask may allow several tokens, for example `{` and `{"`, but they all spell the same forced characters. The model still needs one forward pass for each of these tokens, although no real choice exists.

### 5.3 Singular transition edges and compression

The paper defines a singular transition edge: an edge whose source state has only one successor state and one acceptable character or string. Compression merges each chain of consecutive singular edges into one compressed edge. Several tokens of that edge are then decoded in one forward pass. This code builds the FSM of the regex and compresses it. It is a small builder for this pattern shape, not a general regex compiler.

```python
import string

# The pattern \{"summary": "[a-z ]+", "grade": "[ABC]"\} as parts.
LETTERS = set(string.ascii_lowercase + " ")
PARTS = ['{"summary": "', ("+", LETTERS), '", "grade": "', ("1", set("ABC")), '"}']

def build_fsm(parts):
    """Character FSM: edges[state] = {char: next_state}. Not a general regex compiler."""
    edges, s = {0: {}}, 0
    for part in parts:
        if isinstance(part, str):                    # a constant string: a chain of states
            for ch in part:
                edges[s][ch] = s + 1
                s += 1
                edges[s] = {}
        else:                                        # a character class, once or more
            kind, chars = part
            for ch in chars:
                edges[s][ch] = s + 1
            s += 1
            edges[s] = {}
            if kind == "+":
                for ch in chars:
                    edges[s][ch] = s                 # the loop: more characters
    return edges, s                                  # s is the accepting state

def compress(edges):
    """Merge chains of singular edges (one successor, one character)."""
    out = {}
    for start in edges:
        text, s = "", start
        while len(edges[s]) == 1:
            (ch, nxt), = edges[s].items()
            text, s = text + ch, nxt
        if text:
            out[start] = (text, s)
    return out

edges, accept = build_fsm(PARTS)
comp = compress(edges)
print("states:", len(edges), "accepting state:", accept)
print("singular edges:", sum(len(e) == 1 for e in edges.values()))
for start in (0, 15, 28):
    print(f"compressed edge from state {start}: {comp[start][0]!r} -> state {comp[start][1]}")
```

```text
states: 31 accepting state: 30
singular edges: 27
compressed edge from state 0: '{"summary": "' -> state 13
compressed edge from state 15: ', "grade": "' -> state 27
compressed edge from state 28: '"}' -> state 30
```

The important lines:

1. `edges[s][ch] = s + 1` in the constant-string branch creates a state with exactly one transition. These become the singular edges.
2. `edges[s][ch] = s` creates the loop of `+`. State 14 then has 28 transitions, so it is not singular, and a compressed edge stops there.
3. `while len(edges[s]) == 1` follows a chain of singular edges and concatenates its characters.
4. `out[start] = (text, s)` stores, for every state, the forced text up to the next state with a real choice. The decoder needs only the entries of the states that it reaches: 0, 15 and 28.

The 27 singular edges are $13 + 12 + 2$. The `"` that ends the summary is not singular: at state 14 the model chooses between more letters and `"`.

![Alt text: the character FSM with 13 singular edges for the JSON prefix, and the compressed FSM with three compressed edges and three real choices](/notes/media/papers/2023-sglang-radixattention/figures/08-compressed-fsm.svg)

### 5.4 Jump-forward and retokenization

When the decoder stands at a state with a compressed edge, it appends the whole string without asking the model. The LMSYS blog of 2024-02-05 calls this jump-forward decoding. The forced text is not decoded token by token. It joins the input of the next forward pass, like a short prefill.

The paper adds one rule: retokenization. The forced text is tokenized together with the earlier text by the model's original tokenizer, for example into the tokens `{"`, `summary`, `":` and ` "`. The reason: the model was trained on its tokenizer's splits, so the engine must feed it the same splits. The paper reports only "minor retokenization overhead".

This code continues the one above. A scripted model writes `{"summary": "good essay", "grade": "A"}`. A toy tokenizer takes the longest vocabulary match. The code counts forward passes with and without jump-forward.

```python
# continues: jump-forward with a scripted model and a toy tokenizer
MERGED = ['{"', 'summary', '":', ' "', '",', 'grade', 'good', ' essay', '"}']
VOCAB = sorted(set(MERGED) | set(string.printable), key=len, reverse=True)

def tokenize(text):
    """Greedy longest-match tokenizer over the toy vocabulary."""
    out = []
    while text:
        tok = next(t for t in VOCAB if text.startswith(t))
        out.append(tok)
        text = text[len(tok):]
    return out

TARGET = '{"summary": "good essay", "grade": "A"}'     # what the scripted model writes

def decode(jump):
    text, state, passes = "", 0, 0
    while state != accept:
        if jump and state in comp:                     # forced text: no pass of its own
            forced, state = comp[state]
            text += forced
            continue
        tok = tokenize(TARGET[len(text):])[0]          # the model's next token
        for ch in tok:
            state = edges[state][ch]                   # the mask: the token must be valid
        text, passes = text + tok, passes + 1          # one forward pass per model token
    return passes, text

print("tokens:", tokenize(TARGET))
for jump in (False, True):
    passes, text = decode(jump)
    print(f"jump-forward={jump!s:5} forward passes={passes:2} text ok={text == TARGET}")
prev, forced = '{"summary": "good essay"', ', "grade": "'
print("forced text alone:", tokenize(forced))
print("retokenized text: ", tokenize(prev + forced)[-5:])
```

```text
tokens: ['{"', 'summary', '":', ' "', 'good', ' essay', '",', ' "', 'grade', '":', ' "', 'A', '"}']
jump-forward=False forward passes=13 text ok=True
jump-forward=True  forward passes= 4 text ok=True
forced text alone: [',', ' "', 'grade', '":', ' "']
retokenized text:  ['",', ' "', 'grade', '":', ' "']
```

> [!example] Worked example: 13 forward passes against 4
> The output has 13 tokens with the toy tokenizer.
>
> 1. **Without jump-forward**, each token costs one forward pass: 13 passes. Of the 13 tokens, 9 are forced: 4 for `{"summary": "`, 4 for ` "grade": "` and 1 for `"}`.
> 2. **With jump-forward**, the forced text at state 0 joins the prompt's prefill. The model chooses `good`, ` essay` and `",` in three passes. The token `",` holds the model's real choice (`"`, end the summary) and one forced character (`,`).
> 3. After `",` the FSM is at state 16, inside the second chain. The rest of the chain, ` "grade": "`, joins the input of the next pass, which yields `A`. That is pass 4.
> 4. At state 28 the forced text `"}` completes the output. In this model no pass is needed, because the output ends there.
> 5. Total: 4 forward passes instead of 13. Interpretation of these notes: the gain depends on how much of the output is forced.

The last two lines of the output show why retokenization matters. Suppose the model had chosen `"` alone, at state 15. The forced text `, "grade": "` tokenized alone begins with `,`. Tokenized together with the earlier text, `"` and `,` merge into the token `",`. So the engine replaces the model's last token, and the next pass must recompute that position. Interpretation of these notes: this is the source of the retokenization overhead.

```video
{"src": "/notes/media/papers/2023-sglang-radixattention/manim/r06-compressed-fsm-jump-forward.mp4", "caption": "A character FSM for a small JSON regex, its singular edges merged into compressed edges, and decoding that jumps over the forced text: 13 forward passes become 4."}
```

### 5.5 The distortion at token boundaries (Appendix B.3)

Jump-forward changes which token splits the model sees. Appendix B.3 discusses this. A gap between the token boundary and the string boundary can distort the probabilities. The paper gives an example with a grade on a compressed edge. Interpretation of these notes: the model learned its probabilities on its tokenizer's usual splits. If a compressed edge ends where the tokenizer would usually merge the forced characters with the next characters, the model sees an unusual split. Its next-token distribution can then differ from the distribution without the jump.

### 5.6 Results, and what SGLang 0.5.22 does today

The paper reports a 1.6x throughput gain on JSON decoding from the compressed FSM. It also reports that throughput is 2.4x lower without reusing the preprocessed FSM across the requests of a batch. Interpretation of these notes: building the FSM and its compressed edges costs CPU time, so a batch with one schema must build it once.

SGLang 0.5.22 (source read on 2026-10-19):

1. `--grammar-backend` has the choices `xgrammar`, `outlines`, `llguidance` and `none`. The default resolves to `xgrammar` (`srt/arg_groups/choices.py`, `serving_hook.py`).
2. `srt/constrained/outlines_jump_forward.py` still exists. Its docstring says "Faster constrained decoding with jump forward decoding / compressed finite state machine" and cites the LMSYS blog.
3. The grammar backends still define `try_jump_forward` and `jump_forward_str_state`. But a search of the whole 0.5.22 package finds no caller of them outside `srt/constrained/`. The Outlines backend also sets its `jump_forward_map` to `None`.

Interpretation of these notes: in 0.5.22, jump-forward is not wired into the runtime path. Constrained decoding uses token masks, which XGrammar computes fast ([L5](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output), §6.3). The idea of the paper remains a standard interview topic, but do not claim that today's SGLang runs it.

## 6. API speculative execution

### 6.1 The problem

Some models, such as GPT-4 or GPT-3.5, are reachable only through an API. SGLang cannot keep their KV cache or change their decoding. Each `gen` becomes a separate API call, and each call sends the whole context again. The provider bills the input tokens of every call. A program with three `gen` calls on a long context pays for that context three times.

### 6.2 The mechanism

The paper evaluates the technique with GPT-3.5 on few-shot extraction of three fields from a Wikipedia page, and the input token cost falls about threefold. It describes the mechanism in two steps. The first `gen` call continues past its stop condition for a few extra tokens. The interpreter keeps the extra text and matches it against the later primitives. If the model follows the template, later `gen` calls take their values from the kept text, with no new call.

SGLang 0.5.22 implements this in the frontend (`lang/interpreter.py` and `lang/backend/openai.py`, source read on 2026-10-19):

1. The program enables it with `@sgl.function(num_api_spec_tokens=...)`, the number of extra tokens. The package's tests use 64 and 256.
2. For completion models, `_spec_gen` calls the API with no stop string and a token limit of at least `num_api_spec_tokens`. It cuts the result at the stop string and keeps the rest in `speculated_text`.
3. `_execute_fill` compares each constant string with the start of `speculated_text`. If it matches, it consumes the text. If not, it discards the speculation.
4. For chat models, the backend collects the assistant turn's constant strings and `gen` calls into a pattern. It makes one call at the end of the turn and tries up to 3 times (`spec_max_num_tries = 3`) until the output matches the pattern. If all 3 tries fail, the code keeps whatever the last try matched and raises no error. A comment marks this: "# TODO(ying): throw errors or warnings". Interpretation of these notes: a production program should validate the fields.

### 6.3 A model of the mechanism

This model follows the completion-model path. It is a model of these notes, not SGLang's code. It counts characters, not tokens.

```python
class SpecProgram:
    """A model of SGLang's API speculation for completion models (not the real code)."""
    def __init__(self, api, limit):
        self.api, self.limit = api, limit
        self.text, self.spec, self.calls = "", "", 0
    def fill(self, value):                         # a constant string of the program
        if self.spec.startswith(value):
            self.spec = self.spec[len(value):]     # the speculation predicted it: consume
        else:
            self.spec = ""                         # mismatch: discard the speculation
        self.text += value
    def gen(self, stop):
        if self.spec == "":                        # nothing left: call the API
            self.calls += 1
            self.spec = self.api(self.text, self.limit)   # ignores the stop string
        pos = self.spec.find(stop)
        out = self.spec[:pos] if pos != -1 else self.spec
        self.spec = self.spec[len(out):]           # keep the rest, from the stop string on
        self.text += out
        return out

LABELS = ["Name:", "Birthday:", "Job:"]
VALUES = {"Name:": " Ada Lovelace", "Birthday:": " 10 December 1815", "Job:": " mathematician"}

def fake_api(prompt, limit):
    """A model that follows the template: it continues after the last label."""
    last = max(LABELS, key=prompt.rfind)
    k = LABELS.index(last)
    out = VALUES[last] + "".join("\n" + l + VALUES[l] for l in LABELS[k + 1:])
    return (out + "\nName: Charles")[:limit]      # it does not stop at the template end

for sep in ("\n", ""):
    p = SpecProgram(fake_api, limit=64)
    p.fill("Context ...\nName:")
    name = p.gen(stop="\n")
    p.fill(sep + "Birthday:")
    day = p.gen(stop="\n")
    p.fill(sep + "Job:")
    job = p.gen(stop="\n")
    print(f"label starts with {sep!r:4}: API calls={p.calls} {name!r} {day!r} {job!r}")
```

```text
label starts with '\n': API calls=1 ' Ada Lovelace' ' 10 December 1815' ' mathematician'
label starts with ''  : API calls=3 ' Ada Lovelace' ' 10 December 1815' ' mathematician'
```

The important lines:

1. `self.api(self.text, self.limit)` makes the only call when the speculation works. The model writes all three fields and more.
2. `self.spec = self.spec[len(out):]` keeps the rest from the stop string on. So the kept text starts with `\n`.
3. `self.spec.startswith(value)` is the check against the template. The label `"\nBirthday:"` matches the kept text. The label `"Birthday:"` does not, so the speculation is discarded and every field needs its own call.

> [!trap] The next constant string must start with the stop string
> In the 0.5.22 code, the text kept after a `gen` starts with its stop string. So a template must write the stop string at the start of the next constant, as the package's test `test_completion_speculative` does with `"\nBirthday:"`. Interpretation of these notes: otherwise the values are still correct. But the program makes three calls and also pays for the extra tokens of the first one.

### 6.4 Worked example: the cost

> [!example] Worked example: three fields from one context
> Choices of these notes: a context of 1,000 tokens. The labels cost 2, 3 and 3 tokens. The values cost 4, 5 and 3 tokens. A speculation limit of 64 tokens.
>
> 1. **Without speculation**, each `gen` is a call. Call 1 input: $1{,}000 + 2 = 1{,}002$. Call 2 input: $1{,}002 + 4 + 3 = 1{,}009$. Call 3 input: $1{,}009 + 5 + 3 = 1{,}017$.
> 2. Total input: $1{,}002 + 1{,}009 + 1{,}017 = 3{,}028$ tokens. Total output: $4 + 5 + 3 = 12$ tokens.
> 3. **With speculation**, one call: input 1,002 tokens, output at most 64 tokens.
> 4. Input ratio: $3{,}028 / 1{,}002 \approx 3.02$. The paper also reports an input cost about three times lower, but these numbers are the notes' own.
> 5. **Break-even.** Speculation saves $3{,}028 - 1{,}002 = 2{,}026$ input tokens and adds at most $64 - 12 = 52$ output tokens. It saves money while the output price per token is below $2{,}026 / 52 \approx 38.96$ times the input price.
> 6. **If the model breaks the template** at field 2, the program pays the speculative call and then two normal calls. Input: 3,028 tokens. Output: $64 + 5 + 3 = 72$ tokens. That is 60 output tokens more than without speculation.

![Alt text: three API calls that each resend the 1,000-token context, against one call whose extra output fills all three fields](/notes/media/papers/2023-sglang-radixattention/figures/08-api-speculation.svg)

## 7. Multimodal: images in the radix tree

The paper extends RadixAttention to images: the radix tree key for an image is a hash of the input image (Section 6). Two requests with the same image and the same text before it then share the image's KV.

SGLang 0.5.22 implements this with pad values (`srt/managers/schedule_batch.py` and `mm_utils.py`, source read on 2026-10-19):

1. Each image gets a 64-bit hash of its processed data. For a NumPy array, it is the first 8 bytes of a SHA-256 digest (`hash_feature`).
2. The pad value is `MM_PAD_SHIFT_VALUE + (hash % (1 << 30))`, with `MM_PAD_SHIFT_VALUE = 1_000_000`. The comment says that the offset "ensures pad_values don't overlap with valid text token IDs", and the code checks that the vocabulary size is not larger.
3. The image's placeholder positions in the input IDs are all set to its pad value. The request's `origin_input_ids` hold these padded IDs, and the radix tree matches them like tokens.

```python
import hashlib
import math
import numpy as np

MM_PAD_SHIFT_VALUE = 1_000_000                     # the constant of SGLang 0.5.22

def image_hash(pixels):
    """64 bits: the first 8 bytes of SHA-256 over the array bytes."""
    digest = hashlib.sha256(memoryview(np.ascontiguousarray(pixels))).digest()
    return int.from_bytes(digest[:8], "big")

def pad_value(h):
    return MM_PAD_SHIFT_VALUE + (h % (1 << 30))   # what the radix key sees

def padded_ids(text_before, pixels, n_image_tokens, text_after):
    return text_before + [pad_value(image_hash(pixels))] * n_image_tokens + text_after

rng = np.random.default_rng(0)
cat, dog = rng.random((4, 4)), rng.random((4, 4))  # two tiny "images"
r1 = padded_ids([1, 2, 3], cat, 6, [40, 41])       # question 1 about the cat
r2 = padded_ids([1, 2, 3], cat, 6, [50, 51])       # question 2 about the same cat
r3 = padded_ids([1, 2, 3], dog, 6, [40, 41])       # question 1 about the dog
lcp = lambda a, b: next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
print("r1:", r1)
print("same image, other question: matched", lcp(r1, r2), "of", len(r2))
print("other image, same question: matched", lcp(r1, r3), "of", len(r3))
for n in (1_000, 10_000, 100_000):
    p = 1 - math.exp(-n * (n - 1) / 2 / 2**30)     # birthday bound on 2**30 values
    print(f"{n:>7} images: P(two share a pad value) = {p:.4%}")
```

```text
r1: [1, 2, 3, 794151667, 794151667, 794151667, 794151667, 794151667, 794151667, 40, 41]
same image, other question: matched 9 of 11
other image, same question: matched 3 of 11
   1000 images: P(two share a pad value) = 0.0465%
  10000 images: P(two share a pad value) = 4.5494%
 100000 images: P(two share a pad value) = 99.0501%
```

The same image gives the same pad value, so the second question reuses all 9 tokens before its own text. Another image gives another pad value, so the match stops after the 3 text tokens. The real hash runs over the processed pixel data, so the same picture after a different preprocessing gives a different key.

> [!trap] Only 30 bits of the hash reach the radix key
> Interpretation of these notes, from the 0.5.22 code: the radix key sees the pad value, which keeps 30 bits of the 64-bit hash. Two different images with the same pad value, after the same text, would match. The engine would then reuse the KV of the wrong image, and nothing would report it. For one pair, the chance is $2^{-30} \approx 9.3 \times 10^{-10}$. Among $n$ images, it grows like $n^2 / 2^{31}$: about 4.5% for 10,000 images. A collision matters only when both images follow the same text and one is cached when the other arrives, so the real risk is lower.

![Alt text: the same image gives the same pad value run and a 9-token match, another image matches only 3 text tokens](/notes/media/papers/2023-sglang-radixattention/figures/08-image-key.svg)

The paper's Table 2 measures multimodal throughput against the model authors' Hugging Face implementation:

| Model | Hardware | Baseline | SGLang | Ratio (computed in these notes) |
|---|---|---|---|---|
| LLaVA-v1.5-7B | one A10G | 0.18 image/s | 1.15 image/s | $1.15 / 0.18 \approx 6.39$ |
| LLaVA-NeXT-34B | one A100 80 GB | 0.02 frame/s | 0.10 frame/s | $0.10 / 0.02 = 5$ |

In production on Chatbot Arena, the paper reports a RadixAttention hit rate of 52.4% for LLaVA-NeXT-34B after one month. It names reused example images as one source of hits ([09 Results](/notes/papers/llm-serving/2023-sglang-radixattention/09-results)).

### 7.1 Exercises

1. **Compress another FSM.** Build the FSM for the parts `'{"name": "'`, one or more lowercase letters, `'", "age": '`, one or more digits, and `'}'`. Walk the target `{"name": "ada", "age": 36}` and list the compressed edges that the decoder uses. Acceptance test: 24 states, 19 singular edges, and exactly two jumps: `{"name": "` from state 0 and `, "age": ` from state 12. Explain why the final `}` is not a jump.
   - Hint 1: reuse `build_fsm` and `compress` of §5.3. Only the parts change.
   - Hint 2: count the transitions of the state after the digits. The loop and `}` compete there.
2. **The cost of speculation.** Write `api_costs(context, labels, values, limit, breaks_at=None)` that returns (calls, input tokens, output tokens) without and with speculation. Acceptance test: `(3, 3028, 12)` and `(1, 1002, 64)` for the example of §6.4, and a break-even ratio of 38.96. A break at field 2 gives `(3, 3028, 72)`.
   - Hint 1: the input of each normal call is the context plus all earlier labels and values plus its own label.
   - Hint 2: after a break, the fields from `breaks_at` on need their normal calls. The first field still uses the speculative text.
3. **Collisions of image keys.** Find the smallest number of images $n$ with a collision probability of at least 1%, and of at least 50%. Do it for 30-bit and 64-bit keys. Acceptance test: 38,582 images reach 50% for 30 bits.
   - Hint 1: start from the birthday bound $n \approx \sqrt{-2 \cdot 2^{b} \ln(1 - p)}$.
   - Hint 2: then step $n$ up or down by 1 until the exact formula crosses $p$.

Build it in a lab: [open a lab for this page](/labs/new?note=papers/llm-serving/2023-sglang-radixattention/08-the-rest-of-sglang)

## 8. Common mistakes

1. **"SGLang is only a serving engine."** The paper is a co-design: a frontend language plus a runtime. The language exposes the structure (forks, choices, formats) that the runtime exploits.
2. **"`select` generates a choice token by token."** It scores each option with log probabilities, in requests that share the prompt. In 0.5.22 it first sends the prompt alone, then one batch with one prompt per option.
3. **"Constrained decoding is free because the mask is cheap."** The mask removes invalid tokens, but every forced token still costs a forward pass. Jump-forward removes those passes.
4. **"Jump-forward appends the forced tokens as they are."** The forced text is retokenized together with the earlier text, so token boundaries can move, and the model's last token can change.
5. **"The compressed FSM is still active in SGLang 0.5.22."** The methods exist, but no caller exists outside `srt/constrained/`. Today's default is XGrammar masks.
6. **"API speculation always saves money."** It saves input tokens only when the model follows the template. It adds output tokens, and a broken template costs a wasted call.

## 9. One-minute explanation

SGLang co-designs a Python-embedded language and a runtime, with primitives such as `gen`, `select`, `fork` and `join`. Each prompt runs as an asynchronous stream, and a `select` or `fork` sends several requests with one shared prefix, which RadixAttention reuses. For structured output, a regex becomes a finite state machine. Normal decoding masks invalid tokens but spends a forward pass on every forced token. The compressed FSM merges chains of singular edges, so jump-forward appends the forced text in one step. The forced text is retokenized with the model's tokenizer, which costs a little and can distort probabilities at token boundaries. In my toy example 13 forward passes become 4, and the paper reports 1.6x throughput on JSON decoding. For API-only models, the first call generates past its stop string, and later primitives reuse that text: about threefold lower input cost with GPT-3.5. Images join the radix tree through a pad value computed from the image hash. In SGLang 0.5.22, constrained decoding uses XGrammar masks, and I found no caller of the jump-forward code.

## 10. Check questions

```check
{
  "question": "Name the SGLang primitives. For `select` and for `fork`, say what requests the runtime receives.",
  "answer": "- `gen`: generate, store under a name, with an optional regex.\n- `select`: choose the highest-probability option.\n- `extend` or `+=`: append to the prompt state.\n- `s[\"name\"]`: read a result. It blocks until the result is ready.\n- `fork` and `join`: make parallel copies of the prompt state and merge them.\n- `image` and `video`: add visual inputs.\n\nFor `select` with $k$ options, SGLang 0.5.22 first sends the prompt alone with `\"max_new_tokens\": 0` (\"Cache common prefix\"). Then it sends one batch of $k$ prompts, prompt plus option, that return log probabilities. All share the prompt. For `fork(n)`, the frontend sends the prefix alone as a hint and waits for it. Then it sends $n$ branch requests that all match the prefix (page 07)."
}
```

```check
{
  "question": "Build the character FSM of the regex `\\{\"id\": [0-9]+\\}` in your head. How many states and singular edges does it have, and what are its compressed edges?",
  "hint": "A constant string gives one state per character. A `+` class gives one state with a loop.",
  "answer": "The constant `{\"id\": ` has 7 characters, so states 0 to 7 form a chain of 7 singular edges. State 7 accepts any of 10 digits and goes to state 8. State 8 has 11 transitions: 10 digits that loop back and `}`, which goes to state 9, the accepting state. Total: 10 states, 7 singular edges. There is one compressed edge: state 0 with the string `{\"id\": ` to state 7. The final `}` is not a compressed edge, because at state 8 it competes with the digit loop: the model decides when the number ends. (Checked with the `build_fsm` and `compress` code of §5.3.)"
}
```

```check
{
  "question": "Why must the forced text of a compressed edge be retokenized? Use the toy tokenizer of §5.4 in your answer.",
  "answer": "The model learned its probabilities on its own tokenizer's splits, so it must see the same splits. Appending forced characters as separate pieces could create splits the model never saw. In the toy example, the text `{\"summary\": \"good essay\"` plus the forced `, \"grade\": \"` tokenizes alone as `,`, ` \"`, `grade`, `\":`, ` \"`. Tokenized together with the earlier text, the model's `\"` and the forced `,` merge into the single token `\",`. So the engine replaces the model's last token and recomputes that position in the next pass. The paper tokenizes the forced text together with the earlier text using the original tokenizer and reports only \"minor retokenization overhead\"."
}
```

```check
{
  "question": "Interview follow-up: A JSON output has 60 tokens, and the schema forces 45 of them. Estimate the forward passes with and without jump-forward. Then name reasons why the real gain is smaller.",
  "answer": "Without jump-forward: one pass per token, 60 passes. With jump-forward, in the model of §5.4: one pass per token that the model really chooses, about 15. Each forced run joins the input of the next pass, and a forced run at the very end needs no pass. So the estimate is about 4 times fewer decode steps for this request.\n\nWhy the real gain is smaller (interpretation of these notes):\n\n1. Tokens can straddle the boundary between chosen and forced text, like `\",` in the toy example. Retokenization can then replace the model's last token, which costs recomputation.\n2. The forced tokens still need prefill compute and KV slots. Only the sequential decode steps disappear.\n3. In a large batch, one decode step serves many requests. Saving steps for one request helps its latency more than the total throughput.\n4. Building the FSM and its compressed edges costs CPU time. The paper reports 2.4x lower throughput if that work is not reused across a batch.\n\nThe paper's measured gain on JSON decoding is 1.6x throughput."
}
```

```check
{
  "question": "Interview follow-up: Does SGLang 0.5.22 run the compressed FSM with jump-forward? How did you check, and what does it use instead?",
  "answer": "Not in the runtime path, as far as the source shows (read on 2026-10-19). `--grammar-backend` offers `xgrammar`, `outlines`, `llguidance` and `none`, and the default resolves to `xgrammar`. The file `srt/constrained/outlines_jump_forward.py` still exists, and the backends still define `try_jump_forward` and `jump_forward_str_state` (XGrammar's calls `find_jump_forward_string`). But a search of the whole package finds no caller of these methods outside `srt/constrained/`, and the Outlines backend sets `jump_forward_map = None`. Interpretation of these notes: today SGLang relies on fast token masks from XGrammar. In an interview, describe the compressed FSM as the paper's technique, and say that the current code path uses masks."
}
```

```check
{
  "question": "Interview follow-up: When does API speculative execution cost more than it saves? Give the break-even condition for the example of §6.4 and the worst case of the chat path.",
  "answer": "Speculation saves input tokens (the repeated context) and adds output tokens (the extra text up to the limit). In the example, it saves $3{,}028 - 1{,}002 = 2{,}026$ input tokens and adds at most $64 - 12 = 52$ output tokens. It saves money while the output price per token is below $2{,}026 / 52 \\approx 38.96$ times the input price. It loses money when:\n\n1. The model breaks the template. The speculative call is wasted and normal calls follow: in the example, 3,028 input and 72 output tokens instead of 3,028 and 12.\n2. The limit is far larger than the template needs, so the extra output is billed for nothing.\n3. In the 0.5.22 chat path, the backend tries up to 3 times (`spec_max_num_tries = 3`). Each try is a full call, so the worst case is 3 times the input plus 3 times the limit. After 3 failures, the code keeps the partial matches without an error.\n\nThe paper measured about a threefold input-cost reduction with GPT-3.5 on extraction of three fields, where the model follows the template."
}
```

```check
{
  "question": "Interview follow-up: How does an image become part of a radix tree key in SGLang 0.5.22? What is the risk, and how large is it?",
  "answer": "Each image gets a 64-bit hash of its processed data (for a NumPy array, the first 8 bytes of SHA-256). The pad value is `1_000_000 + (hash % (1 << 30))`. The offset keeps it above all text token IDs. The image's placeholder positions in `origin_input_ids` all get this pad value. The radix tree then matches the image like a run of identical tokens. The paper describes the key as a hash of the input image. Risk (interpretation of these notes): only 30 bits reach the key. Two different images with the same pad value, after the same text, would match. The engine would then reuse the wrong image's KV without any error. One pair collides with probability $2^{-30} \\approx 9.3 \\times 10^{-10}$. Among 10,000 images, at least one pair collides with probability about 4.5%, and 50% is reached at 38,582 images. A collision matters only when both images follow the same text and one is cached when the other arrives."
}
```

```check
{"question": "Exercise 1: show a reference solution", "answer": "```python\nimport string\n\ndef build_fsm(parts):\n    edges, s = {0: {}}, 0\n    for part in parts:\n        if isinstance(part, str):\n            for ch in part:\n                edges[s][ch] = s + 1\n                s += 1\n                edges[s] = {}\n        else:\n            kind, chars = part\n            for ch in chars:\n                edges[s][ch] = s + 1\n            s += 1\n            edges[s] = {}\n            if kind == \"+\":\n                for ch in chars:\n                    edges[s][ch] = s\n    return edges, s\n\ndef compress(edges):\n    out = {}\n    for start in edges:\n        text, s = \"\", start\n        while len(edges[s]) == 1:\n            (ch, nxt), = edges[s].items()\n            text, s = text + ch, nxt\n        if text:\n            out[start] = (text, s)\n    return out\n\ndef reached_jumps(edges, comp, accept, target):\n    \"\"\"Walk the target text and record the compressed edges the decoder uses.\"\"\"\n    s, i, used = 0, 0, []\n    while s != accept:\n        if s in comp:\n            text, nxt = comp[s]\n            assert target.startswith(text, i)\n            used.append((s, text, nxt))\n            s, i = nxt, i + len(text)\n        else:\n            s, i = edges[s][target[i]], i + 1\n    return used\n\nPARTS = ['{\"name\": \"', (\"+\", set(string.ascii_lowercase)), '\", \"age\": ', (\"+\", set(string.digits)), \"}\"]\nedges, accept = build_fsm(PARTS)\ncomp = compress(edges)\nused = reached_jumps(edges, comp, accept, '{\"name\": \"ada\", \"age\": 36}')\nprint(\"states:\", len(edges), \"accepting:\", accept)\nprint(\"singular edges:\", sum(len(e) == 1 for e in edges.values()))\nfor s, text, nxt in used:\n    print(f\"jump from state {s}: {text!r} -> state {nxt}\")\nprint(\"state 22 has\", len(edges[22]), \"transitions: the final '}' competes with the digit loop\")\nassert [(s, t) for s, t, _ in used] == [(0, '{\"name\": \"'), (12, ', \"age\": ')]\n```\n\nOutput:\n\n```text\nstates: 24 accepting: 23\nsingular edges: 19\njump from state 0: '{\"name\": \"' -> state 10\njump from state 12: ', \"age\": ' -> state 21\nstate 22 has 11 transitions: the final '}' competes with the digit loop\n```\n\n`compress` stores the forced text for every state of a chain. `reached_jumps` walks the target and shows the two jumps that the decoder really uses. The final `}` is not a jump: state 22 has 10 digit transitions plus `}`, so the model must decide when the number ends."}
```

```check
{"question": "Exercise 2: show a reference solution", "answer": "```python\ndef api_costs(context, labels, values, limit, breaks_at=None):\n    \"\"\"Calls, input tokens and output tokens, without and with API speculation.\n    breaks_at: index of the first field where the model leaves the template.\"\"\"\n    prompt, normal = context, []\n    for lab, val in zip(labels, values):\n        prompt += lab\n        normal.append(prompt)                      # the input of this field's own call\n        prompt += val\n    plain = (len(normal), sum(normal), sum(values))\n    if breaks_at is None:\n        spec = (1, normal[0], limit)               # one call, billed up to the limit\n    else:                                          # the rest needs normal calls\n        rest = normal[breaks_at:]\n        spec = (1 + len(rest), normal[0] + sum(rest), limit + sum(values[breaks_at:]))\n    return plain, spec\n\nplain, spec = api_costs(1000, [2, 3, 3], [4, 5, 3], 64)\nprint(\"no speculation:\", plain, \"| speculation:\", spec)\nprint(f\"break-even output/input price ratio: {(plain[1] - spec[1]) / (spec[2] - plain[2]):.2f}\")\nplain, broken = api_costs(1000, [2, 3, 3], [4, 5, 3], 64, breaks_at=1)\nprint(\"model leaves the template at field 2:\", broken)\nassert plain == (3, 3028, 12) and spec == (1, 1002, 64) and broken == (3, 3028, 72)\n```\n\nOutput:\n\n```text\nno speculation: (3, 3028, 12) | speculation: (1, 1002, 64)\nbreak-even output/input price ratio: 38.96\nmodel leaves the template at field 2: (3, 3028, 72)\n```\n\nThe input of a normal call is the context plus all earlier labels and values plus its own label. With speculation, the first call is billed up to the limit. After a break at field $k$, the fields from $k$ on need their normal calls, and the first field still uses the speculative text."}
```

```check
{"question": "Exercise 3: show a reference solution", "answer": "```python\nimport math\n\ndef p_collision(n, bits):\n    return 1 - math.exp(-n * (n - 1) / 2 / 2**bits)\n\ndef images_for(p, bits):\n    \"\"\"Smallest n with a collision probability of at least p.\"\"\"\n    n = math.isqrt(int(-2 * 2**bits * math.log(1 - p)))   # estimate from the birthday bound\n    while p_collision(n, bits) < p:\n        n += 1\n    while n > 2 and p_collision(n - 1, bits) >= p:\n        n -= 1\n    return n\n\nfor bits in (30, 64):\n    print(f\"{bits} bits: 1% at n = {images_for(0.01, bits):,}, 50% at n = {images_for(0.5, bits):,}\")\nassert images_for(0.5, 30) == 38582\n```\n\nOutput:\n\n```text\n30 bits: 1% at n = 4,647, 50% at n = 38,582\n64 bits: 1% at n = 608,926,882, 50% at n = 5,056,937,542\n```\n\nThe birthday bound gives a first estimate. The two loops then move $n$ to the exact smallest value. For 30-bit keys, 4,647 images give 1% and 38,582 give 50%. For the full 64-bit hash, the numbers are in the hundreds of millions and billions."}
```

## 11. Links

- Previous: [07 Frontend hints and multi-GPU RadixAttention](/notes/papers/llm-serving/2023-sglang-radixattention/07-frontend-hints-and-multi-gpu)
- Next: [09 Results](/notes/papers/llm-serving/2023-sglang-radixattention/09-results)
- The three inefficiencies: [03 The question](/notes/papers/llm-serving/2023-sglang-radixattention/03-the-question)
- Radix trees and splits: [01 Background: tries and radix trees](/notes/papers/llm-serving/2023-sglang-radixattention/01-background-tries-and-radix-trees)
- Sharing patterns of LM programs: [02 Background: prefix sharing in LM programs](/notes/papers/llm-serving/2023-sglang-radixattention/02-background-prefix-sharing-in-lm-programs)
- Constrained decoding and masks: [L5: Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)
- Prefix caching at the API level: [L7: Prompt caching](/notes/ai/context-engineering/01-foundations/l7-prompt-caching)
- The paper folder: [SGLang and RadixAttention (2023)](/notes/papers/llm-serving/2023-sglang-radixattention), [Glossary](/notes/papers/glossary)

### Sources

- Zheng et al., "SGLang: Efficient Execution of Structured Language Model Programs", arXiv 2312.07104 v2: https://arxiv.org/abs/2312.07104 (checked on 2026-10-19)
- LMSYS blog, "Fast JSON Decoding for Local LLMs with Compressed Finite State Machine", 2024-02-05: https://lmsys.org/blog/2024-02-05-compressed-fsm/ (checked on 2026-10-19)
- SGLang 0.5.22 on PyPI (`lang/interpreter.py`, `lang/backend/openai.py`, `lang/backend/runtime_endpoint.py`, `srt/constrained/`, `srt/arg_groups/choices.py`, `srt/managers/schedule_batch.py`, `srt/managers/mm_utils.py`, `test/test_programs.py`): https://pypi.org/project/sglang/0.5.22/ (checked on 2026-10-19)
