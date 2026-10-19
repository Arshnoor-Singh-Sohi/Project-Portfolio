---
title: "Video guide"
order: 4
summary: "Checked videos for every part of the course, in study order, with what each one covers and which lessons it supports."
---

## How to use this page

1. Start with "Top 12 in study order". These twelve videos give a first pass through the course.
2. Then use the part sections. Each part lists its videos in the order of its lessons.
3. Each entry gives the channel, the speaker, the date, the length, the level, what the video covers, the lessons it supports and why it helps.
4. The date is the upload date on YouTube. If the talk date is different, the entry gives both dates.
5. "At least 17:03" means that the last chapter of the video starts at 17:03. "Not confirmed" means that the length could not be read.
6. The levels are beginner, intermediate and advanced. Watch beginner videos before you start a part. Watch advanced videos after you finish its lessons.
7. In "Supports", "Part 2: L1" is lesson 1 of Part 2. In Part 6, P1 to P13 are the paper pages.

Some terms appear often on this page. A large language model (LLM) is a very large model that predicts the next token of text. An agent is a program that observes, decides and acts in a loop toward a goal. Recursive self-improvement (RSI) is improvement in which the improved system does the next improvement.

## Top 12 in study order

Watch these twelve first, in this order. Each one prepares you for the next one.

1. [Large Language Models explained briefly](https://www.youtube.com/watch?v=LPZh9BOjkQs). 3Blue1Brown, Grant Sanderson, 7:58. *Why:* it gives the fastest correct mental model of an LLM, before any agent topic. *Supports:* Part 1: [L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models).
2. [\[1hr Talk\] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g). Andrej Karpathy, 59:48. *Why:* the chapter "Self-improvement, LLM AlphaGo" (38:02) asks the central question of this course. *Supports:* Part 1: [L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models). Part 2: [L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means).
3. [What's next for AI agentic workflows ft. Andrew Ng of AI Fund](https://www.youtube.com/watch?v=sal78ACtGTc). Sequoia Capital, Andrew Ng, 13:40. *Why:* it shows an agent loop and names reflection, the simplest form of self-improvement. *Supports:* Part 1: [L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment).
4. [AI Self Improvement - Computerphile](https://www.youtube.com/watch?v=5qfIgCiYlfY). Computerphile, Robert Miles. *Why:* it explains the RSI argument in plain words, with no mathematics. *Supports:* Part 2: [L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means).
5. [AlphaGo Zero: Starting from scratch](https://www.youtube.com/watch?v=tXlM99xPQC8). Google DeepMind, David Silver. *Why:* a real system became superhuman only by learning from itself. Use it as the reference example of a working loop. *Supports:* Part 2: [L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples).
6. [9 Examples of Specification Gaming](https://www.youtube.com/watch?v=nKJlF-olKmg). Robert Miles AI Safety, Robert Miles. *Why:* a self-improving system climbs only the score you give it. So the evaluator is the weak point of the later methods. *Supports:* Part 8: [L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming).
7. [CMU LLM Inference (8): Self-Refine and Self-Correction Methods](https://www.youtube.com/watch?v=uaxf9yssDy4). Graham Neubig. *Why:* it teaches Self-Refine and Reflexion, and also the evidence for when self-correction fails. *Supports:* Part 5: [L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement).
8. [LLM Agents MOOC | UC Berkeley CS294-196 Fall 2024 | Compound AI Sys & DSPy Framework by Omar Khattab](https://www.youtube.com/watch?v=JEMYuzrKLUw). Berkeley RDI, Omar Khattab. *Why:* it shows how prompts become parameters that an optimizer changes automatically. *Supports:* Part 5: [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization).
9. [Automated Design of Agentic Systems with Shengran Hu - 700](https://www.youtube.com/watch?v=C5EyZAYlW7E). The TWIML AI Podcast, Shengran Hu. *Why:* the first author of Automated Design of Agentic Systems (ADAS) explains how an LLM designs whole new agents as code. *Supports:* Part 6: [P7](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search).
10. [The AI Scientific Revolution will be Driven by Open-Ended and AI-Generating Algorithms | Jeff Clune](https://www.youtube.com/watch?v=P-qzI6ZJQBw). Vector Institute, Jeff Clune. *Why:* one recent talk connects open-endedness, ADAS, the Darwin Gödel Machine (DGM) and Hyperagents. *Supports:* Part 6: [P10](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine).
11. [Wild breakthrough on Math after 56 years... \[Exclusive\]](https://www.youtube.com/watch?v=vC9nAosXrJw). Machine Learning Street Talk, Matej Balog and Alexander Novikov. *Why:* it shows evolution of code at production scale, and asks directly if this is already RSI. *Supports:* Part 6: [P12](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve).
12. [Can AIs do AI R&D? Reviewing REBench Results with Neev Parikh of METR](https://www.youtube.com/watch?v=SX8Mxyy_UHY). Cognitive Revolution, Neev Parikh. *Why:* it shows how researchers measure if AI can do AI research. That ability is the condition for RSI at the level of a lab. *Supports:* Part 6: [P13](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research).

## Part 1: Foundations

1. [But what is a neural network? | Deep learning chapter 1](https://www.youtube.com/watch?v=aircAruvnKk)
   - **Channel and speaker:** 3Blue1Brown, Grant Sanderson.
   - **Date, length and level:** 2017-10-05, at least 17:03, beginner.
   - **Covers:** what a neuron, a layer, a weight and a bias are, with a digit-recognition example. It connects the network to linear algebra and shows where learning fits.
   - **Supports:** Part 1: [L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models), [L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated).
   - **Why it helps:** you see that a model is a function with learned numbers before you study systems that change themselves.
2. [Large Language Models explained briefly](https://www.youtube.com/watch?v=LPZh9BOjkQs)
   - **Channel and speaker:** 3Blue1Brown, Grant Sanderson.
   - **Date, length and level:** 2024-11-20, 7:58, beginner.
   - **Covers:** chatbots, next-word prediction, pretraining and transformers. The video was made for a Computer History Museum exhibit.
   - **Supports:** Part 1: [L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models).
   - **Why it helps:** it is the shortest correct introduction to LLMs on this list.
3. [\[1hr Talk\] Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g)
   - **Channel and speaker:** Andrej Karpathy.
   - **Date, length and level:** 2023-11-22, 59:48, beginner.
   - **Covers:** what an LLM is, pretraining and fine-tuning, the "LLM OS" idea and LLM security. Chapter 38:02 is "Self-improvement, LLM AlphaGo".
   - **Supports:** Part 1: [L1](/notes/ai/recursive-self-improvement/01-foundations/l1-programs-models-and-language-models), [L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated). Part 2: [L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means). Part 10: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement).
   - **Why it helps:** the self-improvement chapter is a direct bridge from LLM basics to RSI.
4. [What's next for AI agentic workflows ft. Andrew Ng of AI Fund](https://www.youtube.com/watch?v=sal78ACtGTc)
   - **Channel and speaker:** Sequoia Capital, Andrew Ng.
   - **Date, length and level:** 2024-03-26, 13:40, beginner.
   - **Covers:** a talk at Sequoia AI Ascent. Ng says that iterative agent workflows can improve results as much as a newer model. He gives four design patterns: reflection, tool use, planning and multi-agent collaboration.
   - **Supports:** Part 1: [L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment). Part 5: [L9](/notes/ai/recursive-self-improvement/05-approaches/l9-multi-agent-improvement). Part 6: [P3](/notes/ai/recursive-self-improvement/06-research-systems/p03-voyager).
   - **Why it helps:** it names the agent patterns that later lessons improve automatically.
5. [LLM Agents MOOC | UC Berkeley CS294-196 Fall 2024 | LLM Agents: History & Overview by Shunyu Yao](https://www.youtube.com/watch?v=RM6ZArd2nVc)
   - **Channel and speaker:** Berkeley RDI, Shunyu Yao (OpenAI, author of ReAct and Tree of Thoughts, co-author of Reflexion).
   - **Date, length and level:** 2024-09-17 (lecture on 2024-09-16), length not confirmed, intermediate.
   - **Covers:** the history of language agents and the reason-act loop. The course readings for this lecture are ReAct and WebShop.
   - **Supports:** Part 1: [L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment). Part 5: [L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience).
   - **Why it helps:** it explains the loop that the self-improving agents in this course start from.
6. [LLM Agents MOOC | UC Berkeley CS294-196 Fall 2024 | Agents for Software Development by Graham Neubig](https://www.youtube.com/watch?v=f9L9Fkq-8K4)
   - **Channel and speaker:** Berkeley RDI, Graham Neubig (Carnegie Mellon University, CMU).
   - **Date, length and level:** 2024-10-14, length not confirmed, intermediate.
   - **Covers:** coding agents, which are agents that read, write and run code.
   - **Supports:** Part 1: [L2](/notes/ai/recursive-self-improvement/01-foundations/l2-agents-actions-state-tools-environment). Part 6: [P9](/notes/ai/recursive-self-improvement/06-research-systems/p09-sica-self-improving-coding-agent). Part 7: [L1](/notes/ai/recursive-self-improvement/07-implementations/l1-how-to-read-a-research-repository), [L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code).
   - **Why it helps:** coding agents are the base that DGM and STOP (Self-Taught Optimizer) improve.
7. [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI)
   - **Channel and speaker:** Andrej Karpathy.
   - **Date, length and level:** 2025-02-05, 3:31:23, beginner to intermediate.
   - **Covers:** the full training pipeline: data, tokens, pretraining, post-training, hallucinations, tool use and reinforcement learning (RL). The RL examples are DeepSeek-R1 and AlphaGo.
   - **Supports:** Part 1: [L6](/notes/ai/recursive-self-improvement/01-foundations/l6-how-ml-systems-are-trained-and-evaluated). Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement).
   - **Why it helps:** watch the RL part (from 2:07) for the link between training and self-improvement.

## Part 2: The core idea of RSI

8. [AI Self Improvement - Computerphile](https://www.youtube.com/watch?v=5qfIgCiYlfY)
   - **Channel and speaker:** Computerphile, Robert Miles.
   - **Date, length and level:** 2015-07-24, length not confirmed, beginner.
   - **Covers:** the core RSI idea in plain words. If we build an AI that is better at AI design than we are, then it can build a better successor.
   - **Supports:** Part 2: [L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means), [L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents). Part 1: [L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops). Part 6: [P1](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine).
   - **Why it helps:** it gives the argument before the course adds conditions and evidence to it.
9. [Why Would AI Want to do Bad Things? Instrumental Convergence](https://www.youtube.com/watch?v=ZeecOKBus3Q)
   - **Channel and speaker:** Robert Miles AI Safety, Robert Miles.
   - **Date, length and level:** 2018-03-24, length not confirmed, beginner.
   - **Covers:** why agents with very different goals can all want the same sub-goals, such as more resources and more capability. The idea comes from Omohundro's "Basic AI Drives".
   - **Supports:** Part 2: [L1](/notes/ai/recursive-self-improvement/02-core-idea/l1-what-rsi-means), [L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents).
   - **Why it helps:** it explains why self-improvement is a predicted drive, not only a design choice.
10. [AlphaGo Zero: Starting from scratch](https://www.youtube.com/watch?v=tXlM99xPQC8)
    - **Channel and speaker:** Google DeepMind, David Silver.
    - **Date, length and level:** 2017-10-18, short (exact length not confirmed), beginner.
    - **Covers:** AlphaGo Zero learns only by playing against itself, from random moves, with no human games. It beats the earlier AlphaGo 100 to 0.
    - **Supports:** Part 2: [L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples). Part 1: [L3](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops). Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement). Part 10: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement).
    - **Why it helps:** it is the clearest real case of a closed self-improvement loop.
11. [A.I. ‐ Humanity's Final Invention?](https://www.youtube.com/watch?v=fa8k8IQ1_X0)
    - **Channel and speaker:** Kurzgesagt – In a Nutshell, the Kurzgesagt team.
    - **Date, length and level:** 2024-08-06, about 17 minutes (from a third-party summary), beginner.
    - **Covers:** an animated history from narrow AI to artificial general intelligence (AGI). It describes AI that improves itself and a possible "explosion of intelligence" without human involvement.
    - **Supports:** Part 2: [L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents).
    - **Why it helps:** it shows the popular form of the idea, which Part 10 then tests against evidence.
12. [Juergen Schmidhuber: Godel Machines, Meta-Learning, and LSTMs | Lex Fridman Podcast #11](https://www.youtube.com/watch?v=3FIo6evmweo)
    - **Channel and speaker:** Lex Fridman, Jürgen Schmidhuber.
    - **Date, length and level:** 2018-12-23, length not confirmed, intermediate.
    - **Covers:** the history of the idea from the inventor of the Gödel machine. Topics are meta-learning ("learning to learn"), RSI since the 1980s, and programs that rewrite themselves.
    - **Supports:** Part 2: [L5](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents). Part 3: [L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels). Part 5: [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver). Part 6: [P1](/notes/ai/recursive-self-improvement/06-research-systems/p01-good-and-the-godel-machine), [P8](/notes/ai/recursive-self-improvement/06-research-systems/p08-godel-agent).
    - **Why it helps:** you hear the theory side of RSI from one of its first authors.

## Part 3: How an RSI system works

13. [Ken Stanley's talk on Why Greatness Cannot Be Planned](https://www.youtube.com/watch?v=VDuF4onPmuE)
    - **Channel and speaker:** Kenneth Stanley.
    - **Date, length and level:** 2024-05-11 (a new upload of an earlier TTI/Vanguard talk), length not confirmed, beginner.
    - **Covers:** the main ideas of his book with Joel Lehman. A direct search for an objective often fails, and novelty and "stepping stones" lead further.
    - **Supports:** Part 3: [L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions). Part 1: [L4](/notes/ai/recursive-self-improvement/01-foundations/l4-optimization-and-search). Part 5: [L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods). Part 6: [P10](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine). Part 10: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement).
    - **Why it helps:** this is the idea behind the DGM archive of agent versions.

The DGM explainer (video 35) and the Jeff Clune talk on quality diversity (video 36) also support these lessons: Part 3: [L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components), [L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step).

## Part 4: The mathematics of improvement

No video in the checked list teaches this part directly. The lessons of this part link to videos from other parts as background:

- The METR talks (videos 42 and 45) support the evaluation statistics in Part 4: [L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise).
- The STOP talk (video 33) supports the improver functions in Part 4: [L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules), [L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver).
- The Jason Weston lecture (video 24) supports the improvement curves in Part 4: [L4](/notes/ai/recursive-self-improvement/04-mathematics/l4-improvement-dynamics).

## Part 5: Major approaches

14. [Reflection Agents](https://www.youtube.com/watch?v=v5ymBTXNqtk)
    - **Channel and speaker:** LangChain, the LangChain team.
    - **Date, length and level:** 2024-02-21, at least 17:34, intermediate.
    - **Covers:** a hands-on build of three reflection agents in LangGraph: basic reflection, Reflexion (04:59) and Language Agent Tree Search (10:25).
    - **Supports:** Part 5: [L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement), [L2](/notes/ai/recursive-self-improvement/05-approaches/l2-memory-and-learning-from-experience). Part 6: [P2](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion). Part 4: [L2](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules).
    - **Why it helps:** you see each reflection loop as working code.
15. [CMU LLM Inference (8): Self-Refine and Self-Correction Methods](https://www.youtube.com/watch?v=uaxf9yssDy4)
    - **Channel and speaker:** Graham Neubig (CMU).
    - **Date, length and level:** 2025-10-19, length not confirmed, intermediate.
    - **Covers:** Self-Refine, self-debugging for code, Reflexion, the limits of self-correction, and critique that uses tools.
    - **Supports:** Part 5: [L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement). Part 6: [P2](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion). Part 10: [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators), [L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work).
    - **Why it helps:** it is good on when self-correction fails.
16. [Adv. LLM Agents MOOC | UC Berkeley Sp25 | Inference-Time Techniques for LLM Reasoning by Xinyun Chen](https://www.youtube.com/watch?v=g0Dwtf3BH-0)
    - **Channel and speaker:** Berkeley RDI, Xinyun Chen (Google DeepMind, co-author of OPRO and Self-Debug).
    - **Date, length and level:** 2025-01-27, length not confirmed, intermediate.
    - **Covers:** part 3 covers iterative self-improvement: Reflexion, Self-Refine, Self-Debug, and "LLMs cannot self-correct reasoning yet". Part 1 covers LLMs as prompt optimizers (OPRO).
    - **Supports:** Part 5: [L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement), [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization). Part 6: [P2](/notes/ai/recursive-self-improvement/06-research-systems/p02-self-refine-and-reflexion). Part 10: [L5](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises).
    - **Why it helps:** one lecture covers both self-correction and prompt optimization, by a co-author of OPRO.
17. [LLM Agents MOOC | UC Berkeley CS294-196 Fall 2024 | Compound AI Sys & DSPy Framework by Omar Khattab](https://www.youtube.com/watch?v=JEMYuzrKLUw)
    - **Channel and speaker:** Berkeley RDI, Omar Khattab (creator of DSPy).
    - **Date, length and level:** 2024-10-07, length not confirmed, intermediate.
    - **Covers:** compound AI systems and DSPy, which treats prompts as parameters that an optimizer tunes. The readings are MIPRO and "Fine-Tuning and Prompt Optimization: Two Great Steps that Work Better Together".
    - **Supports:** Part 5: [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization).
    - **Why it helps:** it shows prompt optimization as an engineering method, not as manual prompt writing.
18. [On Engineering AI Systems that Endure The Bitter Lesson - Omar Khattab, DSPy & Databricks](https://www.youtube.com/watch?v=qdmxApz3EJI)
    - **Channel and speaker:** AI Engineer, Omar Khattab.
    - **Date, length and level:** 2025-08-06, length not confirmed, beginner to intermediate.
    - **Covers:** the design ideas behind DSPy: modular AI programs instead of prompts tuned by hand. It compares this approach with prompting, fine-tuning and RL.
    - **Supports:** Part 5: [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization).
    - **Why it helps:** it is shorter and less technical than video 17.
19. [Beating RL With Reflection: GEPA and Optimize Anything — Lakshya A. Agrawal, GEPA](https://www.youtube.com/watch?v=OA-Mc60Rboo)
    - **Channel and speaker:** AI Engineer, Lakshya A. Agrawal (GEPA lead author, UC Berkeley).
    - **Date, length and level:** 2026-09-26, about 21 minutes, intermediate.
    - **Covers:** GEPA reflects on full execution traces and rewrites prompts. It keeps a Pareto pool of candidates, in which no candidate is worse than another candidate on every task. The speaker claims that GEPA beats an RL training method called GRPO with far fewer rollouts. The talk also covers "Optimize Anything".
    - **Supports:** Part 5: [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization). Part 4: [L1](/notes/ai/recursive-self-improvement/04-mathematics/l1-functions-objectives-and-search-spaces).
    - **Why it helps:** it is the most recent prompt-optimization talk on this list.
20. [Don't invent faster horses - Prof. Jeff Clune](https://www.youtube.com/watch?v=mw5WIDGRLnA)
    - **Channel and speaker:** Machine Learning Street Talk, Jeff Clune (University of British Columbia, UBC, senior author of ADAS and DGM).
    - **Date, length and level:** 2025-01-03, about 2 hours (exact length not confirmed), intermediate.
    - **Covers:** open-ended algorithms, novelty search, POET, AI-generating algorithms, and ADAS (from 1:15:10).
    - **Supports:** Part 5: [L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search). Part 3: [L3](/notes/ai/recursive-self-improvement/03-anatomy/l3-archives-and-search-over-versions). Part 6: [P7](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search). Part 7: [L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code).
    - **Why it helps:** it gives the research program that connects ADAS, DGM and open-endedness.
21. [AFlow: Automating Agentic Workflow Generation](https://www.youtube.com/watch?v=07FFbeD3qWM)
    - **Channel and speaker:** YanAITalk, an independent reviewer who is not named.
    - **Date, length and level:** 2025-04-13, at least 42:10, advanced.
    - **Covers:** a paper review of AFlow (ICLR 2025). Workflows are code graphs, and Monte Carlo Tree Search with execution feedback searches them. The reviewer is not an author.
    - **Supports:** Part 5: [L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search).
    - **Why it helps:** optional. It shows a second method of workflow search next to ADAS.
22. [The AI Paradigm That Nobody Talks About — Tim Rocktäschel](https://www.youtube.com/watch?v=6DrCq8Ry2cw)
    - **Channel and speaker:** Machine Learning Street Talk, Tim Rocktäschel (University College London, UCL, and Google DeepMind).
    - **Date, length and level:** 2024-10-04, at least 46:04, intermediate.
    - **Covers:** a definition of open-endedness (novel and learnable), Rainbow Teaming and prompt evolution. It ends with self-improvement and evolution in AI systems (46:04).
    - **Supports:** Part 5: [L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods).
    - **Why it helps:** it gives a clear test for when a process is open-ended.
23. [ELLIS Unit Stuttgart - Distinguished Lecture Series - Talk by Tim Rocktäschel](https://www.youtube.com/watch?v=mIGSNVIIjYU)
    - **Channel and speaker:** ELLIS Unit Stuttgart, Tim Rocktäschel.
    - **Date, length and level:** 2025-07-18 (talk on 2025-07-02), length not confirmed, advanced.
    - **Covers:** the talk "Open-Endedness, World Models, and the Automation of Innovation". It argues that open-endedness is necessary for artificial superintelligence (ASI). It covers self-improvement loops for automatic prompt engineering, red-teaming and AI debate.
    - **Supports:** Part 5: [L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods). Part 10: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement).
    - **Why it helps:** it states the open-endedness condition that Part 10 examines.
24. [Adv. LLM Agents MOOC | UC Berkeley CS294-280 Sp25 | Learning to Reason with LLMs by Jason Weston](https://www.youtube.com/watch?v=_MNlLhU33H0)
    - **Channel and speaker:** Berkeley RDI, Jason Weston (Meta).
    - **Date, length and level:** 2025-02-03, length not confirmed, advanced.
    - **Covers:** the move from reflection at prompt time to self-improvement at training time. Topics are Self-Rewarding LMs, Iterative Reasoning Preference Optimization and Meta-Rewarding, in which the model judges its own judgments.
    - **Supports:** Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement). Part 6: [P6](/notes/ai/recursive-self-improvement/06-research-systems/p06-self-rewarding-language-models). Part 10: [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators).
    - **Why it helps:** it shows a model that improves its weights and its own judge.
25. [AlphaZero: Shedding new light on the grand games of chess, shogi and Go](https://www.youtube.com/watch?v=7L2sUGcOgh0)
    - **Channel and speaker:** Google DeepMind, the DeepMind team.
    - **Date, length and level:** 2018-12-06, length not confirmed, beginner.
    - **Covers:** one self-play algorithm learns chess, shogi and Go with no human data, and finds new strategies.
    - **Supports:** Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement).
    - **Why it helps:** it shows that the same self-play loop works across three games.
26. [Keynote David Silver NIPS 2017 Deep Reinforcement Learning Symposium AlphaZero](https://www.youtube.com/watch?v=A3ekFcZ3KNw)
    - **Channel and speaker:** Aske Plaat (a new upload, not an official channel), David Silver.
    - **Date, length and level:** 2017-12-09 (talk on 2017-12-06), length not confirmed, advanced.
    - **Covers:** a technical keynote on AlphaGo, AlphaGo Zero and AlphaZero by their lead researcher.
    - **Supports:** Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement).
    - **Why it helps:** it gives the technical detail behind videos 10 and 25.
27. [David Silver: AlphaGo, AlphaZero, and Deep Reinforcement Learning | Lex Fridman Podcast #86](https://www.youtube.com/watch?v=uPUEq8d73JI)
    - **Channel and speaker:** Lex Fridman, David Silver.
    - **Date, length and level:** 2020-04-03, length not confirmed, intermediate.
    - **Covers:** a long interview. See the chapters "Supervised learning and self-play in AlphaGo" (53:40) and "AlphaZero and self-play" (1:14:10).
    - **Supports:** Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement).
    - **Why it helps:** optional. The two chapters focus on self-play.
    - **Check status:** the embed service gave an HTTP error for this video. The watch page confirmed the title, channel and date.
28. [AlphaGo - The Movie | Full award-winning documentary](https://www.youtube.com/watch?v=WXuK6gekU1Y)
    - **Channel and speaker:** Google DeepMind, directed by Greg Kohs.
    - **Date, length and level:** 2020-03-13, 1:30:28, beginner.
    - **Covers:** the story of the 2016 match against Lee Sedol.
    - **Supports:** Part 5: [L7](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement).
    - **Why it helps:** optional. It gives motivation, but it covers AlphaGo, not AlphaGo Zero, which learned only from self-play.
29. [Stanford CS330: Multi-Task and Meta-Learning, 2019 | Lecture 3 - Optimization-Based Meta-Learning](https://www.youtube.com/watch?v=v7otSgpTc0Q)
    - **Channel and speaker:** Stanford Online, Chelsea Finn (Stanford).
    - **Date, length and level:** 2020-02-25, length not confirmed, advanced.
    - **Covers:** optimization-based meta-learning, taught by the inventor of MAML (Model-Agnostic Meta-Learning). The model learns an initialization that adapts fast to new tasks.
    - **Supports:** Part 5: [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver). Part 4: [L5](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver).
    - **Why it helps:** it is the core lecture on learning to learn, which is one form of improving the improver.
    - **Check status:** the embed service gave an HTTP error for this video. The watch page and cs330.stanford.edu confirmed the lecture.
30. [DLRL Summer School 2020 - Meta Reinforcement Learning - Chelsea Finn](https://www.youtube.com/watch?v=c0vSwglRY4w)
    - **Channel and speaker:** CIFAR, Chelsea Finn.
    - **Date, length and level:** 2020-10-21, length not confirmed, advanced.
    - **Covers:** a meta-RL lecture at the CIFAR Deep Learning and RL Summer School. The topic is agents that learn how to learn new RL tasks.
    - **Supports:** Part 5: [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver).
    - **Why it helps:** it extends meta-learning from supervised tasks to agents.
31. [Stanford CS330 Deep Multi-Task & Meta Learning - What is multi-task learning? I 2022 I Lecture 1](https://www.youtube.com/watch?v=bkVCAk9Nsss)
    - **Channel and speaker:** Stanford Online, Chelsea Finn.
    - **Date, length and level:** date not confirmed, length not confirmed, intermediate.
    - **Covers:** an introduction to multi-task learning, which is the base for the meta-learning lectures. Only the title was checked.
    - **Supports:** Part 5: [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver).
    - **Why it helps:** optional. Watch it before video 29 if multi-task learning is new to you.

## Part 6: Research systems and papers

32. [Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution (Paper Explained)](https://www.youtube.com/watch?v=tkX0EfNl4Fc)
    - **Channel and speaker:** Yannic Kilcher.
    - **Date, length and level:** 2023-10-07, at least 38:05, intermediate.
    - **Covers:** a paper review of Promptbreeder (DeepMind). It evolves task prompts, and it also evolves the mutation prompts that change them. So the improver itself improves.
    - **Supports:** Part 6: [P4](/notes/ai/recursive-self-improvement/06-research-systems/p04-promptbreeder). Part 5: [L3](/notes/ai/recursive-self-improvement/05-approaches/l3-prompt-and-instruction-optimization), [L8](/notes/ai/recursive-self-improvement/05-approaches/l8-meta-learning-and-improving-the-improver). Part 3: [L4](/notes/ai/recursive-self-improvement/03-anatomy/l4-the-improver-and-meta-levels).
    - **Why it helps:** it is the clearest video example of a second improvement level.
33. [Adam Kalai - Recursive Self-improving Code Generation](https://www.youtube.com/watch?v=RovcBFlfXpQ)
    - **Channel and speaker:** DIMACS CCICADA, Adam Tauman Kalai (Microsoft Research, STOP co-author).
    - **Date, length and level:** 2023-11-02 (talk on 2023-10-19 or 2023-10-20), length not confirmed, advanced.
    - **Covers:** STOP at the DIMACS Workshop on Foundation Models, LLMs, and Game Theory (Rutgers). A seed improver program uses a language model to improve code, and then it improves itself. The talk covers safety concerns and a game-theory view.
    - **Supports:** Part 6: [P5](/notes/ai/recursive-self-improvement/06-research-systems/p05-stop-self-taught-optimizer). Part 7: [L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code). Part 5: [L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification). Part 10: [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories).
    - **Why it helps:** it is the only checked talk on STOP by an author.
34. [Automated Design of Agentic Systems with Shengran Hu - 700](https://www.youtube.com/watch?v=C5EyZAYlW7E)
    - **Channel and speaker:** The TWIML AI Podcast with Sam Charrington, Shengran Hu (ADAS first author, UBC).
    - **Date, length and level:** 2024-09-03, at least 53:56, intermediate.
    - **Covers:** an interview on ADAS. An LLM writes new agent designs as code and improves them in a loop. It covers the main components, the link to AI-generating algorithms, new design patterns found on the ARC benchmark, and practical uses.
    - **Supports:** Part 6: [P7](/notes/ai/recursive-self-improvement/06-research-systems/p07-adas-meta-agent-search). Part 5: [L4](/notes/ai/recursive-self-improvement/05-approaches/l4-workflow-and-architecture-search). Part 7: [L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code).
    - **Why it helps:** the first author explains the step from prompt changes to agent design.
35. [Darwin Gödel Machine Explained: Self-Improving AI Agents](https://www.youtube.com/watch?v=KptCerr9D5I)
    - **Channel and speaker:** AI Papers Academy.
    - **Date, length and level:** 2025-06-14, short (at least 3:59), beginner to intermediate.
    - **Covers:** a short explainer of the DGM paper (Sakana AI and UBC). A coding agent edits its own code, and an archive of variants keeps the search open-ended. It shows the results.
    - **Supports:** Part 6: [P10](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine). Part 3: [L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components), [L2](/notes/ai/recursive-self-improvement/03-anatomy/l2-one-iteration-step-by-step). Part 7: [L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code). Part 10: [L5](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises).
    - **Why it helps:** it is the fastest overview of the central system of this course.
36. [Jeff Clune: Open-Ended, Quality Diversity, and AI-Generating Algos in the Era of Foundation Models](https://www.youtube.com/watch?v=ynhAJceDuIw)
    - **Channel and speaker:** alphaXiv, Jeff Clune.
    - **Date, length and level:** 2025-09-19, length not confirmed, intermediate.
    - **Covers:** a research talk by the DGM senior author. Topics are quality diversity, OMNI, VPT, ADAS, the Darwin Gödel Machine and The AI Scientist.
    - **Supports:** Part 6: [P10](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine), [P13](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research). Part 3: [L1](/notes/ai/recursive-self-improvement/03-anatomy/l1-the-components). Part 7: [L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code).
    - **Why it helps:** it places DGM in a longer line of open-ended research.
37. [The AI Scientific Revolution will be Driven by Open-Ended and AI-Generating Algorithms | Jeff Clune](https://www.youtube.com/watch?v=P-qzI6ZJQBw)
    - **Channel and speaker:** Vector Institute, Jeff Clune.
    - **Date, length and level:** 2026-07-02, length not confirmed, intermediate.
    - **Covers:** the most recent talk that was found. It adds Hyperagents (2026) to DGM, ADAS and The AI Scientist.
    - **Supports:** Part 6: [P10](/notes/ai/recursive-self-improvement/06-research-systems/p10-darwin-godel-machine). Part 5: [L5](/notes/ai/recursive-self-improvement/05-approaches/l5-code-self-modification). Part 10: [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories).
    - **Why it helps:** it is the most current view of this research line from its senior author.
38. [FunSearch from DeepMind explained | LLM hallucinations discover new math solutions!?](https://www.youtube.com/watch?v=EXj5pbH_D3c)
    - **Channel and speaker:** AI Coffee Break with Letitia, Letitia Parcalabescu.
    - **Date, length and level:** 2023-12-18, at least 10:42, beginner.
    - **Covers:** an LLM proposes programs, and an automatic evaluator keeps the good ones ("guided confabulation"). The examples are cap sets and bin packing.
    - **Supports:** Part 6: [P12](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve). Part 5: [L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods). Part 7: [L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code).
    - **Why it helps:** it shows in a short video why a strict evaluator makes LLM proposals useful.
39. [Bernardino Romera Paredes - Evolving Programs with LLMs | ML in PL 2024](https://www.youtube.com/watch?v=rA3f7pGBaFI)
    - **Channel and speaker:** ML in PL, Bernardino Romera-Paredes (FunSearch first author).
    - **Date, length and level:** 2025-01-06, length not confirmed, intermediate.
    - **Covers:** an invited conference talk on FunSearch: LLM plus evaluator, new cap-set constructions, better bin-packing heuristics, and why search in the space of code works.
    - **Supports:** Part 6: [P12](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve).
    - **Why it helps:** the first author explains why the method works, not only what it found.
40. [Wild breakthrough on Math after 56 years... \[Exclusive\]](https://www.youtube.com/watch?v=vC9nAosXrJw)
    - **Channel and speaker:** Machine Learning Street Talk, Matej Balog and Alexander Novikov (AlphaEvolve authors).
    - **Date, length and level:** 2025-05-14, at least 1:05:39, intermediate.
    - **Covers:** the evolutionary loop of AlphaEvolve, its evaluators, the 4×4 matrix result with 48 multiplications, and speedups for the Google fleet and Gemini training. The final chapter asks a question: is AlphaEvolve a form of RSI when it improves the infrastructure that trains its own models?
    - **Supports:** Part 6: [P12](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve). Part 2: [L4](/notes/ai/recursive-self-improvement/02-core-idea/l4-examples-and-non-examples). Part 7: [L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code). Part 10: [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories).
    - **Why it helps:** the authors discuss the indirect loop that Part 10 examines.
41. [DeepMind's Pushmeet Kohli on AI's Scientific Revolution](https://www.youtube.com/watch?v=6J7d4_yvqcg)
    - **Channel and speaker:** Sequoia Capital, Pushmeet Kohli (Google DeepMind, AI for Science lead).
    - **Date, length and level:** 2025-07-15, at least 36:34, beginner.
    - **Covers:** a non-technical interview on how AlphaEvolve works and what it found: matrix multiplication, data-center scheduling code, and work with Terence Tao.
    - **Supports:** Part 6: [P12](/notes/ai/recursive-self-improvement/06-research-systems/p12-funsearch-and-alphaevolve).
    - **Why it helps:** it gives the context of AlphaEvolve without the technical detail.
42. [Can AIs do AI R&D? Reviewing REBench Results with Neev Parikh of METR](https://www.youtube.com/watch?v=SX8Mxyy_UHY)
    - **Channel and speaker:** Cognitive Revolution "How AI Changes Everything", Neev Parikh (METR).
    - **Date, length and level:** 2024-12-21, at least 1:46:20, intermediate.
    - **Covers:** RE-Bench, the METR benchmark of real machine learning (ML) research tasks. Examples are tuning of graphics processing unit (GPU) kernels and fine-tuning of language models. It compares AI agents with human experts and covers best-of-k sampling, scaffolding and reward hacking in evaluations.
    - **Supports:** Part 6: [P13](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research). Part 8: [L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming), [L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance). Part 10: [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators), [L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work).
    - **Why it helps:** the chapter "Reward Hacking & Bad Behavior" (1:35:17) shows reward hacking in real evaluations of AI research.

## Part 7: Real implementations

This part reads code, so it has no videos of its own. Watch the author talk of each system before you read its code:

1. Part 7: [L2](/notes/ai/recursive-self-improvement/07-implementations/l2-stop-in-code). Watch the STOP talk (video 33) first.
2. Part 7: [L3](/notes/ai/recursive-self-improvement/07-implementations/l3-adas-in-code). Watch the ADAS interview (video 34) first.
3. Part 7: [L4](/notes/ai/recursive-self-improvement/07-implementations/l4-darwin-godel-machine-in-code). Watch the DGM explainer (video 35) first.
4. Part 7: [L5](/notes/ai/recursive-self-improvement/07-implementations/l5-sica-and-godel-agent-in-code). Watch the coding agents lecture (video 6) first.
5. Part 7: [L6](/notes/ai/recursive-self-improvement/07-implementations/l6-openevolve-in-code). Watch the FunSearch explainer (video 38) first.

## Part 8: Failure modes and safety

43. [9 Examples of Specification Gaming](https://www.youtube.com/watch?v=nKJlF-olKmg)
    - **Channel and speaker:** Robert Miles AI Safety, Robert Miles.
    - **Date, length and level:** 2020-04-29, length not confirmed, beginner.
    - **Covers:** real cases in which an AI meets the literal goal but not the intended goal. Its key line is "AI systems do what you say, and it's hard to say exactly what you mean."
    - **Supports:** Part 8: [L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability), [L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming), [L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures). Part 10: [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators).
    - **Why it helps:** every self-improving system in this course faces this problem at each step.
44. [Reward Hacking: Concrete Problems in AI Safety Part 3](https://www.youtube.com/watch?v=92qDfT8pENs)
    - **Channel and speaker:** Robert Miles AI Safety, Robert Miles.
    - **Date, length and level:** 2017-08-12, length not confirmed, beginner.
    - **Covers:** how an agent can find unexpected ways to get more reward than intended. It is based on the paper "Concrete Problems in AI Safety".
    - **Supports:** Part 8: [L1](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability), [L2](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming).
    - **Why it helps:** it gives the standard name and the mechanism of the failure.
45. [How METR measures Long Tasks and Experienced Open Source Dev Productivity - Joel Becker, METR](https://www.youtube.com/watch?v=k1t2xyWMUdY)
    - **Channel and speaker:** AI Engineer, Joel Becker (METR).
    - **Date, length and level:** 2026-01-19, length not confirmed, intermediate.
    - **Covers:** METR time horizons, compared with a randomized controlled trial in which AI tools did not make experienced developers faster. It explains why, and what this means for automated AI research and development (R&D).
    - **Supports:** Part 8: [L3](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures), [L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance). Part 4: [L3](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise). Part 10: [L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work).
    - **Why it helps:** it compares a benchmark measurement with a field trial, and their results differ.
46. [LLM Agents MOOC | UC Berkeley CS294-196 Fa24 | Measuring Agent Caps & RSP (Anthropic) by Ben Mann](https://www.youtube.com/watch?v=6y2AnWol7oo)
    - **Channel and speaker:** Berkeley RDI, Ben Mann (Anthropic co-founder).
    - **Date, length and level:** 2024-11-25, length not confirmed, intermediate.
    - **Covers:** how a frontier lab measures agent capabilities and connects them to its Responsible Scaling Policy (RSP). The readings are the updated Anthropic RSP and the computer-use model post.
    - **Supports:** Part 8: [L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance). Part 6: [P13](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research). Part 10: [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories).
    - **Why it helps:** it shows how a lab connects capability measurements to safety commitments.
47. [Measuring AI R&D Automation: What Happens When AI Automates AI Research | Alan Chan (GovAI)](https://www.youtube.com/watch?v=wRTBKwf45Ak)
    - **Channel and speaker:** FAR.AI, Alan Chan (GovAI).
    - **Date, length and level:** 2026-09-07, 9:10, beginner to intermediate.
    - **Covers:** evidence that labs automate AI research, the risks (faster dual-use progress and weaker human oversight), and the metrics needed to track it.
    - **Supports:** Part 8: [L6](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely), [L7](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance). Part 10: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement), [L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work).
    - **Why it helps:** in nine minutes it names the metrics needed to track the automation of AI research.

## Part 9: Build RSI systems yourself

The projects have no videos of their own. The projects use bin packing, which is also a FunSearch problem. Before some projects, watch the video of the idea that the project builds:

1. Part 9: [P1](/notes/ai/recursive-self-improvement/09-build-it/p1-a-fixed-agent-with-a-score). Watch the FunSearch explainer (video 38) first.
2. Part 9: [P3](/notes/ai/recursive-self-improvement/09-build-it/p3-an-evaluator-with-explicit-tests). Watch the specification gaming examples (video 43) first.
3. Part 9: [P5](/notes/ai/recursive-self-improvement/09-build-it/p5-an-agent-that-edits-a-program). Watch the coding agents lecture (video 6) first.
4. Part 9: [P7](/notes/ai/recursive-self-improvement/09-build-it/p7-regression-tests-and-an-archive). Watch the DGM explainer (video 35) first.
5. Part 9: [P8](/notes/ai/recursive-self-improvement/09-build-it/p8-improving-the-improver). Watch the STOP talk (video 33) first.
6. Part 9: [P9](/notes/ai/recursive-self-improvement/09-build-it/p9-from-toy-to-language-model). Watch the FunSearch talk by its first author (video 39) first.

## Part 10: Advanced understanding and research

Part 10 uses videos from the earlier parts. Watch them again with the questions of each lesson:

1. Part 10: [L1](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement). Videos 3, 10, 13, 23 and 47.
2. Part 10: [L2](/notes/ai/recursive-self-improvement/10-advanced/l2-imperfect-and-optimized-evaluators). Videos 15, 24, 42 and 43.
3. Part 10: [L3](/notes/ai/recursive-self-improvement/10-advanced/l3-models-agents-and-agent-factories). Videos 33, 37, 40 and 46.
4. Part 10: [L4](/notes/ai/recursive-self-improvement/10-advanced/l4-open-problems-and-how-to-read-new-work). Videos 15, 42, 45 and 47.
5. Part 10: [L5](/notes/ai/recursive-self-improvement/10-advanced/l5-advanced-exercises). Videos 16 and 35.

## Other checked videos

These videos passed the checks but are not in the main list:

- [LLM Reasoning by Denny Zhou](https://www.youtube.com/watch?v=QL-FS_Zcmyo). Berkeley RDI, Fall 2024. The readings include "LLMs Cannot Self-Correct Reasoning Yet". It fits Part 5: [L1](/notes/ai/recursive-self-improvement/05-approaches/l1-self-critique-and-refinement). Part 8: [L4](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures).
- [RE-Bench: measuring AI agents at AI R&D vs human experts](https://www.youtube.com/watch?v=5lFVRtHCEoM). Samuel Albanie, 2024-12-20. It is a shorter alternative to video 42 for Part 6: [P13](/notes/ai/recursive-self-improvement/06-research-systems/p13-the-ai-scientist-and-automated-research).
- [Jeff Clune | Open-Ended and AI-Generating Algorithms in the Era of Foundation Models | May 2, 2025](https://www.youtube.com/watch?v=tP5AB5GgZAE). Deep RL Course. It is an alternative to video 36 for Part 5: [L6](/notes/ai/recursive-self-improvement/05-approaches/l6-evolutionary-and-population-methods).

## Gaps

Some topics have no good checked video:

1. STOP has one checked video only (video 33). No talk by Eric Zelikman was found. The STOP explainers that were found came from AI-generated or clickbait channels, so they were dropped.
2. No talk led by Jenny Zhang, the DGM co-first author, was found. The Jeff Clune talks cover DGM instead. The Sakana DGM page (sakana.ai/dgm, 2025-05-30) has only a self-hosted MP4 file, not a YouTube video.
3. Google DeepMind has no official YouTube video for AlphaEvolve. The DeepMind blog posts (2025-05-14 and 2026-05-07) keep their demo videos on Google storage. This guide uses the author interview (video 40).
4. No Google DeepMind video on specification gaming was found.
5. No stand-alone OPRO video passed the checks. Video 16, by an OPRO co-author, covers it in its Part 1.
6. A specific CS330 Fall 2022 lecture on optimization-based meta-learning was not found. This guide uses the 2019 lecture (video 29).

## Videos that were dropped

Do not use these, even if a search shows them first:

1. DGM, STOP, Self-Refine, FunSearch and AlphaEvolve uploads by unknown or AI-generated channels, or by channels that are not the authors.
2. Hyperagents explainers from channels that make automatic summaries.
3. A DGM video whose channel could not be confirmed.
4. An "Interview with Jenny Zhang" with a Cambridge chemistry researcher of the same name, who is not the DGM author.
5. A personal-channel copy of a Tim Rocktäschel ICLR 2025 talk. The official ELLIS recording of the same talk (video 23) replaces it.

## Verification

1. Every link on this page was checked on 2026-10-19.
2. For each video, the embed service (oEmbed) gave the exact title and channel, or the watch page gave the title, channel, date and chapters. Many entries also had an external check, such as a course page, slides or a transcript.
3. Two videos could not be checked with the embed service, because it gave an HTTP error. They are video 27 (Lex Fridman Podcast #86) and video 29 (Stanford CS330 Lecture 3). The probable cause is that embedding is not allowed for them. Their watch pages confirmed the title, channel and date.
4. Lengths are often not confirmed, because YouTube returned a bot-protection page instead of the watch page.
5. Berkeley RDI recordings are live-stream recordings. Some have a waiting period before the lecture starts.
