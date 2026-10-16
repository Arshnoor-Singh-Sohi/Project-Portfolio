---
title: "05 Cloud hosting"
order: 15
summary: "Hosting options, GPU sizing, containers and model loading, Kubernetes, autoscaling and routing, managed platforms, cost per token and production operations."
---

This part answers "how would you host this model in the cloud?" with numbers. It goes from the hosting options and GPU sizing to Kubernetes, autoscaling, the managed platforms of four clouds, the cost per token and operations. Drill [08 L2](/notes/ai/llm-systems/08-interview-drills/l2-chain-inference-and-cloud) combines it with part 04.

| Code | Lesson | Core idea | Priority | Status |
|---|---|---|---|---|
| L1 | [Ways to host a model](/notes/ai/llm-systems/05-cloud-hosting/l1-ways-to-host-a-model) | Six hosting options, from a closed API to your own Kubernetes platform, split the jobs differently. | Core | not started |
| L2 | [Sizing GPUs for a model](/notes/ai/llm-systems/05-cloud-hosting/l2-sizing-gpus) | Memory decides whether a model fits and how many requests run. Bandwidth decides how fast. | Core | not started |
| L3 | [Containers and model loading](/notes/ai/llm-systems/05-cloud-hosting/l3-containers-and-model-loading) | A cold replica needs about 3 minutes for the image, the weights and compilation. Caches cut it to about 15 s. | Support | not started |
| L4 | [Kubernetes for LLM serving](/notes/ai/llm-systems/05-cloud-hosting/l4-kubernetes-for-llm-serving) | Pods, GPU requests, taints and startup probes sized for slow model loads run replicas on a cluster. | Support | not started |
| L5 | [Autoscaling and routing](/notes/ai/llm-systems/05-cloud-hosting/l5-autoscaling-and-routing) | Scale on queue depth and KV cache usage, not on CPU, and route a request to the replica with its prefix. | Core | not started |
| L6 | [Managed platforms: AWS, Azure, Google Cloud and Databricks](/notes/ai/llm-systems/05-cloud-hosting/l6-managed-platforms) | Bedrock, SageMaker AI, Microsoft Foundry, Agent Platform and Databricks sell the same few billing shapes. | Support | not started |
| L7 | [Cost math: from GPU hours to cost per token](/notes/ai/llm-systems/05-cloud-hosting/l7-cost-math) | USD per million tokens equals USD per hour divided by tokens per second times 3,600, times $10^6$. | Core | not started |
| L8 | [Production operations: metrics, security and failures](/notes/ai/llm-systems/05-cloud-hosting/l8-production-operations) | SLOs, burn-rate alerts, retries with jitter, safe rollouts and endpoint security keep the service healthy. | Support | not started |
