---
title: "Reasoning models"
order: 20
summary: "How models that write a long chain of thought behave, why they fail, and how to run them well."
---

## The main question of this topic

A reasoning model writes a long chain of thought before it gives an answer. More thinking tokens can give better answers, but long generations also fail in new ways. The papers in this topic ask two questions:

1. How does a reasoning model use its chain of thought, and where does the chain go wrong?
2. Which settings and training choices make the chain shorter, more reliable and less expensive?

## Papers

| Paper | Year | Main finding | Status |
|---|---|---|---|
| [Why Reasoning Models Loop](/notes/papers/reasoning-models/2025-why-reasoning-models-loop) | 2025 | Reasoning models repeat the same text at low temperature. Errors in learning are a key cause. Temperature reduces the loops but does not fix the errors. | not started |

The [Papers](/notes/papers) page has the reading queue for this topic.
