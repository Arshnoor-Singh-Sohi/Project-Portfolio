---
title: "08 Failure modes and safety"
order: 18
summary: "What goes wrong when a system improves itself: Goodhart, reward hacking, evaluation failures, self-evaluation failures, drift, unsafe self-modification, and the controls."
---

Each failure mode has six parts. They say what it is, why it happens and where it was documented. They also say how to detect it, how to reduce the risk and what limits remain.

| Code | Lesson | Core idea | Status |
|---|---|---|---|
| L1 | [Measured score versus real capability](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l1-measured-score-vs-real-capability) | Why a score is a proxy, the four kinds of Goodhart effect, and how the gap between proxy and real objective grows under optimization. | not started |
| L2 | [Reward hacking and specification gaming](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l2-reward-hacking-and-specification-gaming) | Documented cases where systems raised their score without doing the task, from games to coding agents, and how to detect and reduce them. | not started |
| L3 | [Evaluation failures: leakage, overfitting, noise and regression](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l3-evaluation-failures) | How evaluation itself fails: contamination, overfitting the selection set, the winner's curse and regressions on solved tasks. | not started |
| L4 | [Self-evaluation failures](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l4-self-evaluation-failures) | Why a system that grades itself can confirm its own errors: intrinsic self-correction, LLM judge biases, self-preference, sycophancy and model collapse. | not started |
| L5 | [Churn, bloat, lost behavior, drift and runaway cost](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l5-churn-bloat-and-drift) | Five slow failures: changes without real gains, growth without capability, lost behavior, objective drift and uncontrolled resource use. | not started |
| L6 | [The special risks of changing the improver](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l6-changing-the-improver-safely) | Why changes to the improvement mechanism itself carry extra risk, what has been observed, and what theory says about stable self-modification. | not started |
| L7 | [Controls, oversight and governance](/notes/ai/recursive-self-improvement/08-failure-modes-and-safety/l7-controls-oversight-and-governance) | Engineering controls for a self-improving system, and how labs and evaluators measure and govern automated AI research in 2026. | not started |
