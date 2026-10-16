---
title: "03 Background: training, cross-entropy and distillation"
order: 3
summary: "How a model learns its probabilities: parameters, loss, gradient descent and cross-entropy. Why maximum likelihood copies the data, what a model does when it cannot distinguish contexts, and how distillation and RL post-training make the models of the paper."
status: not-started
tags: [training, cross-entropy, maximum-likelihood, distillation, reinforcement-learning, background]
---

## 1. The question this page answers

A language model gives a probability to each possible next token. What sets these probabilities? What does training do when the model cannot learn everything in its data? How does a small "student" model learn from a large "teacher" model, and why can the student become worse than its teacher?

The paper's explanation of loops uses these ideas. Page 08 uses them to prove Proposition 1.

## 2. Mental model

> [!analogy] A forecaster and her logbook
> A forecaster has a logbook of past mornings. Each entry records the kind of morning and if it rained that day. She learns one rain forecast for each kind of morning. Training changes her forecasts until the logbook looks as little surprising as possible.
>
> The best forecast for one kind of morning is the fraction of such mornings with rain. Now suppose that she has no thermometer. She cannot tell cold mornings from warm mornings, so she must give one forecast to both kinds. The best single forecast is then the average of the two fractions.
>
> **Where it stops working:** the forecaster can count. A neural network cannot count directly. It changes millions of numbers in small steps, and it can stop before it reaches the counts or never reach them. Also, the forecast does not change the weather. A language model reads its own output as the context for its next step.

## 3. Terms

| Term | Plain meaning |
|---|---|
| parameter | One number inside a model that training can change. A model with 1.5B parameters has 1.5 billion such numbers. |
| loss | One number that says how wrong the model is on the training data. Training tries to make it small. |
| gradient | For each parameter: how fast the loss changes when that parameter increases a little. |
| gradient descent | Repeat two steps: compute the gradient, then move each parameter a small step against it. The learning rate sets the size of the step. |
| cross-entropy | The loss of next-token prediction. For one example it is $-\log q$, where $q$ is the probability that the model gave to the correct token. |
| likelihood | The probability that the model gives to the whole training data: the product of the probabilities of all examples. |
| maximum likelihood | Choose the parameters that make the likelihood as large as possible. This is the same as the smallest average cross-entropy. |
| teacher forcing | In training, the model always predicts the next token from the true prefix in the data, never from its own earlier guesses. |
| supervised fine-tuning (SFT) | More training of a trained model, with cross-entropy, on example responses. |
| distillation | Training a student model on the outputs of a teacher model. For the models in this paper: on the text that the teacher writes. |
| teacher, student | In distillation: the model that writes the training data, and the model that learns from it. |
| model capacity | The set of behaviors that a model can represent at all. Fewer parameters usually means less capacity. |
| under-training | Training that stops before the model has learned what it could learn. The paper says "limited training compute". |
| optimization difficulty | Gradient descent does not reach a good solution, even though the model can represent that solution. |
| RL post-training | Reinforcement learning after pretraining: the model writes answers, a reward scores them, and training makes high-reward answers more likely. |
| best-of-k | Sample $k$ answers and keep a correct one. "The best-of-k version" of a model is this whole procedure, viewed as a new model. |

All terms are also in the [Glossary](/notes/papers/glossary).

## 4. What training means

### 4.1 A model is a function with parameters

Page 01 describes a language model as a function. Its input is a context. Its output is a probability distribution over the vocabulary: one number from 0 to 1 for each token, and the numbers add to 1.

The function contains parameters. When a parameter changes, the probabilities change. The Transformers that the paper trains on its synthetic task have about 85M parameters (§3.2). The open models of §2 have 1.5B to 32B parameters.

**Training** is the search for good parameter values. A computer needs a measurable definition of "good". That definition is the **loss**: one number that the computer calculates from the model and the training data. A small loss means that the model fits the data well. Next-token prediction uses a loss called cross-entropy (section 5). Section 4.2 first shows the mechanics with a simpler loss.

### 4.2 The gradient and gradient descent

Imagine a model with only one parameter $w$, and the loss $L(w) = (w - 3)^2$. The loss is 0 at $w = 3$ and larger at every other value. The computer does not know where the minimum is. It knows only the loss and its slope at the current value of $w$.

The **gradient** is that slope: how fast the loss changes when $w$ increases a little. For this loss the gradient is $2(w - 3)$. A negative gradient means "the loss falls if $w$ increases". So the rule is: move $w$ against the gradient.

$$
w_{\text{new}} = w - \eta \cdot \text{gradient}
$$

The number $\eta$ ("eta") is the **learning rate**. It sets the size of each step.

> [!example] Worked example: four steps of gradient descent
> Start at $w = 0$ with $\eta = 0.25$.
>
> | Step | $w$ | Loss $(w-3)^2$ | Gradient $2(w-3)$ | Next $w$ |
> |---|---|---|---|---|
> | 0 | 0 | 9 | $-6$ | $0 - 0.25 \times (-6) = 1.5$ |
> | 1 | 1.5 | 2.25 | $-3$ | $1.5 - 0.25 \times (-3) = 2.25$ |
> | 2 | 2.25 | 0.5625 | $-1.5$ | $2.25 - 0.25 \times (-1.5) = 2.625$ |
> | 3 | 2.625 | 0.140625 | $-0.75$ | $2.625 - 0.25 \times (-0.75) = 2.8125$ |
>
> Each step halves the distance to 3. The loss falls from 9 to 0.140625 in three steps. The method never jumps to the answer. It only moves downhill, one small step at a time.

A real model has millions or billions of parameters. The idea stays the same: one slope for each parameter, and one small step for each parameter. **Backpropagation** is the method that computes all these slopes, layer by layer, from the output of the network back to its input.

A batch is a group of examples that the model processes together. The loss of a batch is the average over its examples. The paper trains its synthetic Transformers with Adam, a common variant of gradient descent (§3.2). It uses 100k steps, batch size 64 and a learning rate of $10^{-4}$ with cosine decay. Cosine decay lowers the learning rate along a cosine curve during training. Page 06 gives all the training details.

## 5. Cross-entropy: the loss of next-token prediction

### 5.1 The loss of one example

One training example is a context and the token that really followed in the data. The model gives probability $q$ to that correct token. The cross-entropy loss of the example is:

$$
\ell = -\log q(\text{correct token} \mid \text{context})
$$

These notes use the natural logarithm (base $e \approx 2.718$). Another base multiplies every loss by the same number, so it does not change which parameters are best. Page 01 explains logarithms.

> [!example] Worked example: the loss for different probabilities
> | $q$ (probability of the correct token) | $\log q$ | Loss $-\log q$ |
> |---|---|---|
> | 1.0 | 0 | 0 |
> | 0.9 | $-0.1054$ | 0.1054 |
> | 0.5 | $-0.6931$ | 0.6931 |
> | 0.1 | $-2.3026$ | 2.3026 |
> | 0.01 | $-4.6052$ | 4.6052 |
>
> A sure and correct model gets loss 0. The loss grows fast as $q$ falls. When $q$ approaches 0, the loss grows without limit. The logarithm of a number below 1 is negative, so the minus sign makes the loss positive.

### 5.2 One gradient step on the logits

Page 01 explains logits and softmax. The model computes one score $z_k$ (a logit) for each token $k$. Softmax converts the scores to probabilities: $q_k = e^{z_k} / \sum_j e^{z_j}$.

The gradient of the cross-entropy with respect to each logit has a simple form. Let $c$ be the correct token. Write $y_k = 1$ when $k = c$, and $y_k = 0$ for every other token. Two rules from calculus are enough: the slope of $\log x$ is $1/x$, and the slope of $e^{z}$ is $e^{z}$.

$$
\ell = -\log \frac{e^{z_c}}{\sum_j e^{z_j}} = -z_c + \log \sum_j e^{z_j}
$$

$$
\frac{\partial \ell}{\partial z_k} = -y_k + \frac{1}{\sum_j e^{z_j}} \cdot e^{z_k} = q_k - y_k
$$

The symbol $\partial \ell / \partial z_k$ means "the slope of $\ell$ when only $z_k$ changes". So each logit moves by its probability minus its target.

> [!example] Worked example: one training step on three tokens
> A training trace continues with the token "So" (a step forward in the solution). The model has three candidate tokens with logits So 1.0, Wait 2.0, Hmm 0.0.
>
> 1. Exponentials: $e^{1.0} = 2.7183$, $e^{2.0} = 7.3891$, $e^{0.0} = 1.0000$. Sum: $11.1073$.
> 2. Probabilities: So $2.7183 / 11.1073 = 0.2447$, Wait $0.6652$, Hmm $0.0900$. Greedy decoding would write "Wait".
> 3. Loss: $-\log 0.2447 = 1.4076$.
> 4. Gradient $q_k - y_k$: So $0.2447 - 1 = -0.7553$, Wait $0.6652 - 0 = 0.6652$, Hmm $0.0900 - 0 = 0.0900$.
> 5. Step with $\eta = 1$: So $1.0 + 0.7553 = 1.7553$, Wait $2.0 - 0.6652 = 1.3348$, Hmm $0.0 - 0.0900 = -0.0900$.
> 6. New exponentials: $5.7850$, $3.7991$, $0.9139$. Sum: $10.4980$. New probabilities: So $0.5511$, Wait $0.3619$, Hmm $0.0871$ (rounded).
> 7. New loss: $-\log 0.5511 = 0.5959$. Greedy decoding would now write "So".
>
> The step raised the correct logit. It lowered each wrong logit in proportion to the probability that the wrong token had taken. "Wait" had the most probability, so it dropped the most. A numeric check of the slopes (a small change of each logit) gave the same three gradient values.

If training repeats this step on this one example, $q(\text{So})$ rises to 0.7224, 0.8035, 0.8486 and 0.8770 in the next four steps. With one example, the target is 1, so the model moves toward certainty. Section 6 shows what happens with many examples that disagree.

### 5.3 A whole text

A training text of $T$ tokens gives $T$ examples: one for each position. The loss of the text is the sum of $-\log q$ over all its positions.

By the chain rule of page 01, the probability of a sequence is the product of its token probabilities. So the sum of the token losses equals $-\log$ of the probability of the whole text. The paper uses this fact for chunks of tokens (§3, "Mapping to language models"):

$$
\log P_\theta(x_{t:t+k-1} \mid x_{<t}) = \sum_{i=t}^{t+k-1} \log P_\theta(x_i \mid x_{<i})
$$

Here $\theta$ ("theta") stands for all the parameters, and $x_{t:t+k-1}$ is the chunk of $k$ tokens that starts at position $t$. The paper concludes that next-token training "also maximizes the log-probability of any such chunk" (§3). So every rule on this page about one token also holds for a chunk, for example one step of a proof.

## 6. Cross-entropy and maximum likelihood are the same

### 6.1 Likelihood

Take a training set of $N$ examples. The model gives probability $q_i$ to the correct token of example $i$. The **likelihood** is the probability of all the data together: the product $q_1 \times q_2 \times \dots \times q_N$. **Maximum likelihood** means: choose the parameters that make this product as large as possible.

A logarithm changes the product to a sum, and it keeps the order of numbers (a larger number has a larger logarithm). So:

$$
\text{average cross-entropy} = \frac{1}{N}\sum_{i=1}^{N} \left(-\log q_i\right) = -\frac{1}{N}\log \prod_{i=1}^{N} q_i
$$

The smallest average cross-entropy and the largest likelihood occur at the same parameters. The two names describe one training goal.

> [!example] Worked example: four examples
> The model gives 0.5, 0.8, 0.25 and 0.9 to the correct tokens of four examples.
>
> 1. Likelihood: $0.5 \times 0.8 \times 0.25 \times 0.9 = 0.09$.
> 2. Log-likelihood: $\log 0.09 = -2.4079$.
> 3. Loss of each example: $0.6931 + 0.2231 + 1.3863 + 0.1054 = 2.4079$.
> 4. Average cross-entropy: $2.4079 / 4 = 0.6020$.
>
> Lines 2 and 3 give the same number with opposite signs.

Computers also prefer the sum for a practical reason. A product of many probabilities becomes too small for the number format. In Python, `0.5**1000` is about $9.3 \times 10^{-302}$, and `0.5**1075` gives `0.0`. A sum of 1,075 logarithms is no problem.

### 6.2 Maximum likelihood copies the frequencies of the data

The context "The sky is" appears 10 times in some training data. It continues with "blue" 7 times and with "gray" 3 times. The model can choose $x = q(\text{blue})$ and $1 - x = q(\text{gray})$ for this context. Which $x$ gives the smallest average cross-entropy?

$$
\text{average loss}(x) = -\left(0.7 \log x + 0.3 \log (1 - x)\right)
$$

> [!example] Worked example: try several values of $x$
> | $x = q(\text{blue})$ | Average loss |
> |---|---|
> | 0.5 | 0.6931 |
> | 0.6 | 0.6325 |
> | 0.7 | **0.6109** |
> | 0.8 | 0.6390 |
> | 0.9 | 0.7645 |
> | 0.99 | 1.3886 |
>
> For $x = 0.7$: $-(0.7 \times \log 0.7 + 0.3 \times \log 0.3) = -(0.7 \times (-0.3567) + 0.3 \times (-1.2040)) = 0.2497 + 0.3612 = 0.6109$. The best value is the frequency in the data, 0.7. A model that says 0.99 is too sure, and it pays heavily on the 3 "gray" examples.

```plot
{
  "title": "Average cross-entropy for one context with 70% blue and 30% gray: loss curve (ink), best value at x = 0.7 (purple)",
  "xAxis": { "label": "x = q(blue)", "domain": [0, 1] },
  "yAxis": { "label": "average loss", "domain": [0, 2.2] },
  "disableZoom": true,
  "data": [
    { "points": [[0.05, 2.1124], [0.1, 1.6434], [0.15, 1.3767], [0.2, 1.1935], [0.25, 1.0567], [0.3, 0.9498], [0.35, 0.8641], [0.4, 0.7947], [0.45, 0.7383], [0.5, 0.6931], [0.55, 0.658], [0.6, 0.6325], [0.65, 0.6165], [0.7, 0.6109], [0.75, 0.6173], [0.8, 0.639], [0.85, 0.6829], [0.9, 0.7645], [0.95, 0.9346]], "fnType": "points", "graphType": "polyline", "color": "#100D12", "skipTip": true },
    { "points": [[0.05, 2.1124], [0.1, 1.6434], [0.15, 1.3767], [0.2, 1.1935], [0.25, 1.0567], [0.3, 0.9498], [0.35, 0.8641], [0.4, 0.7947], [0.45, 0.7383], [0.5, 0.6931], [0.55, 0.658], [0.6, 0.6325], [0.65, 0.6165], [0.7, 0.6109], [0.75, 0.6173], [0.8, 0.639], [0.85, 0.6829], [0.9, 0.7645], [0.95, 0.9346]], "fnType": "points", "graphType": "scatter", "color": "#100D12", "skipTip": true },
    { "points": [[0.7, 0], [0.7, 0.6109]], "fnType": "points", "graphType": "polyline", "color": "#6A4C93", "skipTip": true },
    { "points": [[0.7, 0.6109]], "fnType": "points", "graphType": "scatter", "color": "#6A4C93", "skipTip": true }
  ]
}
```

The same rule holds for any number of tokens. For one context with target frequencies $t_1, \dots, t_m$, the average cross-entropy $-\sum_k t_k \log q_k$ is smallest when $q_k = t_k$ for every $k$. Page 08 proves a version of this result with a method for constrained minimization.

> [!key] A maximum-likelihood learner copies the data
> Take a context that the model can distinguish from all others. For this context, maximum likelihood sets the predicted distribution equal to the frequencies in the training data. It does not round them to 0 or 1. A teacher that writes "progress" 70% of the time and "restate" 30% of the time produces a perfect student with 0.7 and 0.3.

## 7. When the model cannot distinguish contexts

### 7.1 An everyday case

Imagine a very small model that sees only the last token of the context. Two training sentences are "The capital of France is Paris" and "The capital of Italy is Rome". Both contexts end with the token "is". This model cannot distinguish them, so it must give one distribution after "is".

Suppose that the two sentences appear equally often, and no other context ends with "is". Maximum likelihood then sets "Paris" 0.5 and "Rome" 0.5 after "is". Greedy decoding writes the same city for both questions, so it is wrong for one of them.

Real models read the whole context. But they can still merge contexts that differ in a way that they did not learn. Proposition 1 describes a learner that is "constrained to ignore the context" (§3). The paper adds that the same effect appears when "the student's representation collapses many distinct contexts" (§3).

### 7.2 Two contexts, one shared distribution

> [!example] Worked example: two contexts that the model cannot distinguish
> Contexts A and B appear equally often in the training data. Three actions are possible. Action $a_0$ is easy: it is the same in both contexts, for example "restate the problem". Action $a_1$ is the correct next step in A, and $a_2$ is the correct next step in B.
>
> The data: in A, $a_1$ with 0.7 and $a_0$ with 0.3. In B, $a_2$ with 0.7 and $a_0$ with 0.3.
>
> **A model that can distinguish A from B** learns two distributions and copies each one (section 6.2). Its loss in each context is $-(0.3 \log 0.3 + 0.7 \log 0.7) = 0.6109$. Greedy decoding picks $a_1$ in A and $a_2$ in B: always the correct step.
>
> **A model that cannot distinguish A from B** must use one distribution $(q_0, q_1, q_2)$ in both. Its average loss is:
>
> 1. $\tfrac12 \left(-0.3 \log q_0 - 0.7 \log q_1\right) + \tfrac12 \left(-0.3 \log q_0 - 0.7 \log q_2\right)$
> 2. $= -0.3 \log q_0 - 0.35 \log q_1 - 0.35 \log q_2$
>
> Line 2 is the cross-entropy against the **average** of the two targets, $(0.3, 0.35, 0.35)$. By section 6.2, the best shared distribution is that average.

A comparison of several shared distributions confirms the result:

| Shared $(q_0, q_1, q_2)$ | Loss in A | Loss in B | Average loss |
|---|---|---|---|
| (0.3, 0.35, 0.35) | 1.0961 | 1.0961 | **1.0961** |
| (0.4, 0.3, 0.3) | 1.1177 | 1.1177 | 1.1177 |
| (0.2, 0.4, 0.4) | 1.1242 | 1.1242 | 1.1242 |
| (0.3, 0.5, 0.2) | 0.8464 | 1.4878 | 1.1671 |
| (0.3, 0.7, 0.0) | 0.6109 | no limit | no limit |

The last row shows why the model cannot simply guess. A probability of 0 on a correct token gives an infinite loss on the other context. Maximum likelihood "hedges". The paper uses this word: "maximum-likelihood training encourages it to hedge by spreading probability mass across these candidates" (§3).

### 7.3 More contexts: the hard action fades

Now take $n$ contexts. Each context has its own correct action with probability $1 - p = 0.7$, and all contexts share the easy action with $p = 0.3$. The same averaging gives the easy action 0.3 and each hard action $0.7/n$.

| $n$ | Each hard action $0.7/n$ | Easy action | What greedy decoding picks |
|---|---|---|---|
| 1 | 0.7 | 0.3 | The correct hard action |
| 2 | 0.35 | 0.3 | A hard action, but a tie between two: wrong half the time |
| 3 | 0.2333 | 0.3 | The easy action |
| 5 | 0.14 | 0.3 | The easy action |
| 10 | 0.07 | 0.3 | The easy action |

From $n = 3$, the easy action wins, although the data chose it only 30% of the time in every context. Proposition 1 of the paper states the general result: probability $p$ on the easy action and $(1-p)/n$ on each hard action (§3). Page 08 gives its proof.

> [!key] Hardness diffuses the hard action, and the easy action keeps its mass
> When a model cannot distinguish $n$ contexts, maximum likelihood spreads the hard action over $n$ options. The easy action is the same in every context, so its probability stays whole. If the easy action is a cyclic action, greedy decoding can repeat it again and again. This is the first loop mechanism of the paper (page 08).

## 8. Teacher forcing: training on the true prefix

In training, every position uses the **true** prefix from the data. The model never sees its own earlier guesses. This is teacher forcing.

> [!example] Worked example: the training text "2 + 3 = 5"
> | Position | Context (always from the data) | Target | Guess of a half-trained model |
> |---|---|---|---|
> | 1 | 2 | + | + |
> | 2 | 2 + | 3 | 4 |
> | 3 | 2 + 3 | = | = |
> | 4 | 2 + 3 = | 5 | 5 |
>
> At position 2 the model guesses "4", so that position adds a large loss. At position 3 the context is still "2 + 3", from the data. The wrong guess "4" never enters a training context.

In generation, the model writes one token at a time and each chosen token joins the context (page 01). So a wrong token stays in the context and affects every later step.

The paper trains its synthetic Transformers in this way. Each sequence holds an edge list, a start node, a goal node and a walk. The paper applies "the loss only to the random-walk portion of the sequence" (§3.2). At test time, the model must write the whole walk itself.

> [!trap] Training never shows the model its own mistakes
> Interpretation of these notes: generation can reach states that the training data never contained, for example the same sentence ten times in a row. Teacher forcing gives no training signal for such states. One paper that this paper cites names this gap in its title: "Relating neural text degeneration to exposure bias" (Chiang and Chen, 2021). The paper discusses error accumulation as a possible extra force behind loops (§5). Page 10 covers it.

## 9. Distillation: a student learns from the text of a teacher

### 9.1 The recipe

The paper frames its first mechanism with "the distillation scenario, where a student model is trained on reasoning chains generated by a teacher" (§3). The recipe has three steps:

1. Collect many problems.
2. The teacher writes a full reasoning trace for each problem.
3. The student trains on these traces with cross-entropy and teacher forcing. This is supervised fine-tuning.

Several models of the paper are made in this way. For example, the OpenThinker3 models are students of QwQ-32B (§2). Page 04 lists every model and how it was made.

> [!note] Two kinds of distillation
> The original method of Hinton, Vinyals and Dean (2015) trains a student on the full probability lists of the teacher. They called these lists "soft targets" (arXiv 1503.02531, checked on 2026-10-14). The students in this paper train only on the text: one sampled token for each position. Interpretation of these notes: both methods have the same best student, one that copies the distribution of the teacher (section 6.2). With text only, the student must estimate that distribution from samples.

### 9.2 What a perfect student would do

A perfect student copies the teacher's distribution exactly. Then it writes the same kinds of traces, and it loops as often as the teacher. The paper states that the looping of such a student "could not be significantly higher than that of the teacher" (§1).

The measurements disagree with a perfect student. With greedy decoding, OpenThinker3-1.5B has a looping fraction of 0.30, and its teacher QwQ-32B has 0.04 (Figure 2, exact bar labels). The paper concludes that the student did not learn the teacher's distribution. It calls such mismatches "errors in learning": "mismatches between the training distribution and the learned model" (abstract). Page 05 discusses this term.

> [!example] Worked example: same data, two students
> At one decision point, a teacher writes a progress-making step in 700 of 1,000 traces and restates the problem in 300. A **perfect student** copies 0.7 and 0.3, so greedy decoding picks the progress-making step, as the teacher's does.
>
> Now take a **student that confuses the correct step with 4 other steps** ($n = 5$). It gives $0.7 / 5 = 0.14$ to each of the 5 steps and keeps 0.3 for the restatement. Its greedy decoding picks the restatement, because $0.3 > 0.14$. The data is the same for both students. Only the learner differs.

### 9.3 Why a student does not match its teacher

The paper names three sources of hardness of learning, and so of such errors (§3.3, "Sources of hardness"). They are limited model capacity, limited training compute (under-training) and "the inability of the optimization to find the right solution".

**Capacity.** The model cannot represent the difference between some contexts, as the last-token model of section 7.1. A smaller model has fewer parameters, so it can merge more contexts. The authors call capacity "a plausible explanation for why smaller models loop more within a family trained on the same data" (§3.3). This is an explanation of the authors, not a measurement.

**Under-training.** Take a model with one parameter $u$ for one context with two actions. The probability of the progress-making action is $q = e^{u} / (e^{u} + e^{0})$. The data says 0.7. By section 5.2, the gradient of one example is $q - 1$ for a progress example and $q - 0$ for a restate example. The average over the data is $0.7 (q - 1) + 0.3 (q - 0) = q - 0.7$.

> [!example] Worked example: stop training early
> Start at $u = 0$, so $q = 0.5$. Use $\eta = 0.5$ and the update $u_{\text{new}} = u - 0.5 (q - 0.7)$.
>
> | Steps | $q$ | Average loss |
> |---|---|---|
> | 0 | 0.5000 | 0.6931 |
> | 1 | 0.5250 | 0.6744 |
> | 5 | 0.5963 | 0.6340 |
> | 20 | 0.6829 | 0.6115 |
> | 40 | 0.6982 | 0.6109 |
>
> First step: $u = 0 - 0.5 \times (0.5 - 0.7) = 0.1$, so $q = e^{0.1} / (e^{0.1} + 1) = 0.5250$. A model that stops after 5 steps says 0.5963, not 0.7. It has an error in learning, although it could represent 0.7.

**Optimization difficulty.** The synthetic task of the paper uses the star graph of Bachmann and Nagarajan (2024). There, models learn the later edges of a path early in training. The first edge then becomes "the bottleneck", and the model puts roughly $1/n$ on each of the $n$ first edges (§3.1). The paper notes that here "the source of hardness is not model capacity" (§3.1). The models "have enough capacity to represent the right solution", so the cause is "the inability of optimization". Page 06 describes this graph.

## 10. Reinforcement learning post-training

### 10.1 The idea

Distillation needs a separate teacher. Reinforcement learning (RL) post-training does not. One round has three steps:

1. The model writes several answers to one problem. Each full answer is a **trajectory**.
2. A reward scores each trajectory. For a math problem with a known final answer, a small program can check the final answer. Such a program is a verifier.
3. Training makes high-reward trajectories more likely and low-reward trajectories less likely.

Training repeats this round on many problems. Page 01 of the earlier paper notes explains RLHF, a form of RL with a reward from human preferences ([LITM 01](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models)).

### 10.2 The paper's view: a best-of-k version of itself

The paper gives a simple picture of RL (§3.3). It views RL "as sampling multiple trajectories from the model and training on the correct ones". So RL "can be thought of as training the model on best-of-k version of itself" (§3.3). Here $k$ is the number of sampled trajectories.

The best-of-$k$ version is stronger than the model. Suppose the model solves a problem with probability $s$ in one sample, and the $k$ samples are independent. All $k$ samples fail with probability $(1-s)^k$. So the best-of-$k$ version succeeds with probability $1 - (1-s)^k$.

> [!example] Worked example: a model that solves a problem 20% of the time
> With $s = 0.2$ and $k = 8$:
>
> 1. $0.8^2 = 0.64$, $0.8^4 = 0.64^2 = 0.4096$, $0.8^8 = 0.4096^2 = 0.1678$.
> 2. $1 - 0.1678 = 0.8322$.
>
> The best-of-8 version solves the problem 83.2% of the time. The model itself solves it 20% of the time.
>
> | $k$ | $s = 0.2$ | $s = 0.05$ (a harder problem) |
> |---|---|---|
> | 1 | 0.2000 | 0.0500 |
> | 2 | 0.3600 | 0.0975 |
> | 4 | 0.5904 | 0.1855 |
> | 8 | 0.8322 | 0.3366 |
> | 16 | 0.9719 | 0.5599 |

So RL also trains a learner on data from a stronger generator. The paper concludes: "there is still a gap between the data generator and the learner, which can possibly cause this mechanism" (§3.3). The paper does not test this in its synthetic task. It is a hypothesis of the authors.

### 10.3 What the paper measured about RL

The paper has one model pair for this question. Phi-4-reasoning is a distilled model, and Phi-4-reasoning-plus is "a version that has been lightly tuned with RL" (§2). With greedy decoding, their looping fractions are 0.43 and 0.45 (Figure 2, exact bar labels). The paper says that "the looping counts remain roughly the same across the two models" (§2).

Interpretation of these notes: one pair of models is weak evidence. It does not separate the effect of RL from other differences between the two models. Page 07 discusses this result.

## 11. Common mistakes

1. **"Cross-entropy and maximum likelihood are two different training goals."** They are one goal. The average cross-entropy is minus the logarithm of the likelihood, divided by the number of examples.
2. **"A well-trained model gives probability 1 to the most common next token."** Maximum likelihood copies the frequencies: 0.7 stays 0.7. Only one single example pushes the model toward 1.
3. **"If the teacher prefers the progress-making action, the student will prefer it too."** Not if the student cannot distinguish the contexts. Then the hard action gets $(1-p)/n$ and the easy action keeps $p$.
4. **"A student fails only because it is small."** Under-training and optimization difficulty also cause errors in learning. In the star graph, the models have enough capacity.
5. **"Teacher forcing shows the model its own mistakes."** It does the opposite. Every training context is a prefix from the data, so the model never trains on its own wrong tokens.
6. **"RL has no teacher, so this mechanism cannot affect it."** The paper views RL as training on a best-of-k version of the model. This version is stronger than the model, so the gap can act like a teacher-student gap. This is a hypothesis of the authors.

## 12. One-minute explanation

A model is a function with parameters, and training searches for parameter values with a small loss. Gradient descent finds them in small steps: compute the slope of the loss for every parameter, then move each parameter against its slope. Next-token prediction uses cross-entropy, $-\log q$ of the correct token, and its smallest average is the same as the largest likelihood. So for each context that the model can distinguish, training copies the frequencies of the data. When a model cannot distinguish $n$ contexts, it must share one distribution. The hard action then gets only $(1-p)/n$, and the easy action keeps $p$. Training uses teacher forcing, so the model never trains on its own mistakes. In distillation, a student trains on the text of a teacher, and a perfect student would loop as little as its teacher. Limited capacity, under-training and optimization difficulty stop a student from being perfect. The paper views RL as training on a best-of-k version of the model, so a similar gap can exist there too.

## 13. Check questions

```check
{
  "question": "A model gives probability 0.25 to the correct next token. What is the cross-entropy loss of this example? What is it if the probability is 0.9?",
  "hint": "The loss is $-\\log q$ with the natural logarithm.",
  "answer": "$-\\log 0.25 = 1.3863$ and $-\\log 0.9 = 0.1054$. The less probability on the correct token, the larger the loss."
}
```

```check
{
  "question": "In the training data, one context continues with \"So\" 60% of the time and with \"Wait\" 40% of the time. The model can distinguish this context from all others. Which probabilities does maximum likelihood give, and which token does greedy decoding write?",
  "answer": "It copies the frequencies: $q(\\text{So}) = 0.6$ and $q(\\text{Wait}) = 0.4$. Greedy decoding writes \"So\" every time, because 0.6 is the larger value."
}
```

```check
{
  "question": "The easy action has probability $p = 0.2$ in every context. A model cannot distinguish $n$ contexts, and each context has its own hard action with probability 0.8. What is the smallest $n$ for which greedy decoding picks the easy action with no tie?",
  "hint": "Each hard action gets $0.8/n$. Compare it with 0.2.",
  "answer": "For $n = 4$, each hard action gets $0.8/4 = 0.2$: a tie with the easy action. For $n = 5$, each gets $0.8/5 = 0.16 < 0.2$, so greedy decoding picks the easy action. The answer is $n = 5$."
}
```

```check
{
  "question": "A model solves a problem in 30% of its samples. RL samples $k = 4$ trajectories for this problem. In the paper's simple view, what is the success rate of the best-of-4 version that generates the training data?",
  "answer": "$1 - 0.7^4 = 1 - 0.2401 = 0.7599$. The data generator succeeds about 76% of the time, the model itself 30%. The paper calls this a gap between the data generator and the learner."
}
```

## 14. Links

- Previous: [02 Background: decoding, greedy, temperature and sampling](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/02-background-decoding-greedy-temperature-sampling)
- Next: [04 Background: reasoning models](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/04-background-reasoning-models)
- The paper card: [Wait, Wait, Wait... Why Do Reasoning Models Loop?](/notes/papers/reasoning-models/2025-why-reasoning-models-loop)
- Softmax, logits and the chain rule: [01 Background: probability and next-token prediction](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/01-background-probability-and-next-token-prediction)
- The full proof of Proposition 1: [08 Why 1: risk aversion from hardness of learning](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/08-why-1-risk-aversion)
- The training details of the synthetic task: [06 Experiment design](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/06-experiment-design)
- Errors in learning: [05 The question](/notes/papers/reasoning-models/2025-why-reasoning-models-loop/05-the-question)
- Pretraining, instruction fine-tuning and RLHF: [LITM 01 Background: language models and context](/notes/papers/long-context/2023-lost-in-the-middle/01-background-language-models)
- [Glossary](/notes/papers/glossary)
