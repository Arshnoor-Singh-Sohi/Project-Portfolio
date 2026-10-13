---
title: "Glossary"
order: 2
summary: "Every term in the paper notes, with a plain meaning and the page that defines it. One glossary for all papers, in alphabetical order."
---

Terms are in alphabetical order. "LITM" means [Lost in the Middle (2023)](/notes/papers/long-context/2023-lost-in-the-middle).

| Term | Plain meaning | First seen |
|---|---|---|
| accuracy | The percent of examples where any correct answer string appears in the output of the model. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| ALiBi | Attention with linear biases. It subtracts a penalty from each attention score. The penalty grows with the distance between the two tokens. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| answer document | The one document in a prompt that contains the answer. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| attention score | The dot product of a query and a key, divided by $\sqrt{d}$. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| attention sink | A token, usually one of the first tokens, that gets strong attention whatever its meaning. | [LITM 10](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work) |
| attention weight | The share of one value in the weighted average of attention. Weights are positive and add to 1. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| base model | A model after pretraining only. It continues text. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| best case, worst case | The highest and the lowest accuracy over all tested positions. | [LITM 05](/notes/papers/long-context/2023-lost-in-the-middle/05-results-multi-document-qa) |
| bidirectional | Each token can see the tokens before it and after it. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| causal mask | A rule that stops each token from seeing the tokens after it. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| closed-book | A test setting with no documents. The model answers from parametric memory only. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| compaction | Replacing a long history in the context with a shorter summary. | [LITM 09](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) |
| context | All the tokens that the model can use at one step. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| context engineering | The design of what goes into the context of a model, in which order, and in which format. | [LITM 09](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) |
| context rot | The drop in the reliability of a model as its input gets longer. | [LITM 10](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work) |
| context window | The largest number of tokens that a model can use at one time. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| contextualization | The change of a token vector when it mixes in information from other tokens. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| Contriever | A neural retriever that ranks passages by vector similarity. In the paper, fine-tuned on MS-MARCO. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| controlled experiment | An experiment that changes one thing at a time and keeps all other things the same. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| decoder-only model | A model with only causal self-attention. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| dependent variable | The thing that an experiment measures. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| distractor | A document that looks relevant but does not contain the answer. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| edge ordering | An order that puts the most relevant documents at the start and at the end, and the least relevant in the middle. | [LITM 09](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) |
| encoder-decoder model | A model whose encoder reads the input with no mask, and whose decoder writes the output with a causal mask. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| extended-context model | A version of a model with a larger context window. | [LITM 05](/notes/papers/long-context/2023-lost-in-the-middle/05-results-multi-document-qa) |
| extrapolation | Use of a model on inputs longer than in training. | [LITM 07](/notes/papers/long-context/2023-lost-in-the-middle/07-why-it-happens) |
| golden dataset | A fixed set of test questions with known correct answers. | [LITM 09](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) |
| greedy decoding | At each step, the model writes the token with the highest probability. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| hard negative | A distractor that a retriever ranks high, so it looks very relevant. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| head | One copy of the attention step with its own learned matrices. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| independent variable | The thing that an experiment changes. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| instruction fine-tuning | More training on pairs of instructions and good responses. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| key-value retrieval | A synthetic task: find the value of one given key in a JSON object. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| language model | A program that gives a probability to each possible next token, from the tokens before it. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| multi-document question answering | A task where the model gets a question and $k$ documents, and must answer from the documents. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
| needle in a haystack | A test that hides one fact in a long text and asks for it. | [LITM 10](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work) |
| oracle | A test setting with only the one document that contains the answer. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| parametric memory | Knowledge that is stored in the weights of the model from training. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| point | One percentage point. 75.8% to 53.8% is a drop of 22.0 points. | [LITM 05](/notes/papers/long-context/2023-lost-in-the-middle/05-results-multi-document-qa) |
| position | The place of the useful information in the context. Position 1 is the first document. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| position gap | Best case minus worst case, in points. | [LITM 05](/notes/papers/long-context/2023-lost-in-the-middle/05-results-multi-document-qa) |
| position sweep test | An evaluation that puts the useful information at each position in turn and measures accuracy at each position. | [LITM 09](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) |
| positional attention bias | A preference of the attention for some positions, independent of the content. | [LITM 10](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work) |
| positional encoding | Information about the position of each token that the model adds, because attention alone ignores order. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| primacy bias | Better use of the information at the start of the context. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| query, key, value | Three vectors that the model computes from each token vector, with three learned matrices. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| query-aware contextualization | Put the query (the question or the key) both before and after the data. | [LITM 07](/notes/papers/long-context/2023-lost-in-the-middle/07-why-it-happens) |
| ranked list truncation | Cutting a ranked list early: use fewer documents when the extra ones are probably not useful. | [LITM 08](/notes/papers/long-context/2023-lost-in-the-middle/08-more-context-trade-off) |
| reader | The part of a RAG system that reads the documents and writes the answer. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| recency bias | Better use of the information at the end of the context. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| relative drop | A drop divided by the starting value. | [LITM 05](/notes/papers/long-context/2023-lost-in-the-middle/05-results-multi-document-qa) |
| reranker | A model that scores each pair of query and document more carefully than the retriever. | [LITM 09](/notes/papers/long-context/2023-lost-in-the-middle/09-engineering-takeaways) |
| reranking | A second, more careful ranking of the retrieved documents, to put the most useful ones first. | [LITM 08](/notes/papers/long-context/2023-lost-in-the-middle/08-more-context-trade-off) |
| retrieval-augmented generation (RAG) | A system that finds documents for a question and puts them in the prompt. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| retriever | The part of a RAG system that finds and ranks documents. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| retriever recall | The percent of questions where at least one of the top $k$ documents contains a correct answer. | [LITM 08](/notes/papers/long-context/2023-lost-in-the-middle/08-more-context-trade-off) |
| RLHF | Reinforcement learning from human feedback. Training that rewards the responses that people prefer. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| robust use | Accuracy that changes very little when the position of the useful information changes. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| RoPE | Rotary position embedding. It rotates each query and key by an angle that grows with the position. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| saturation | The point after which more input gives almost no more improvement. | [LITM 08](/notes/papers/long-context/2023-lost-in-the-middle/08-more-context-trade-off) |
| self-attention | Attention where the queries, keys and values all come from the same sequence. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| serial-position effect | In human memory: people recall the first and the last items of a list best. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| softmax | A function that changes a list of scores into weights that are positive and add to 1. | [LITM 02](/notes/papers/long-context/2023-lost-in-the-middle/02-background-attention-and-position) |
| synthetic task | A task with generated data, made to test one skill. | [LITM 06](/notes/papers/long-context/2023-lost-in-the-middle/06-results-key-value-retrieval) |
| threat to validity | A reason why the result of an experiment could be wrong, or could fail to hold in other settings. | [LITM 10](/notes/papers/long-context/2023-lost-in-the-middle/10-limits-and-later-work) |
| token | The unit of text that a model reads and writes. Often a part of a word. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| tokenizer | The program that changes text into a list of token numbers, and back. | [LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models) |
| top-k | The number of retrieved documents that go into the prompt. | [LITM 08](/notes/papers/long-context/2023-lost-in-the-middle/08-more-context-trade-off) |
| training-time sequence length | The longest input length that the model saw in training. | [LITM 07](/notes/papers/long-context/2023-lost-in-the-middle/07-why-it-happens) |
| U-shaped curve (U-curve) | A curve that is high at both ends and low in the middle. | [LITM 03](/notes/papers/long-context/2023-lost-in-the-middle/03-the-question) |
| UUID | A random 128-bit identifier, written as 32 hex characters in five groups. | [LITM 04](/notes/papers/long-context/2023-lost-in-the-middle/04-experiment-design) |
