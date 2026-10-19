---
title: "L4: Improvement dynamics: rates, diminishing returns and plateaus"
order: 4
summary: "Simple models of how a score changes over iterations, from steady gains to plateaus to explosive models, and what these models can and cannot prove."
status: not-started
tags: [rsi, mathematics, dynamics, plateau, intelligence-explosion, differential-equations]
---

## Learning objectives

After this lesson you can:

- Write and iterate linear, exponential and saturating recurrences, and give their closed forms.
- Fit a saturating model to a measured plateau and say what the fit does and does not mean.
- Solve $dI/dt = c\,I^{\alpha}$ for $\alpha < 1$, $\alpha = 1$ and $\alpha > 1$, and compute a finite blow-up time.
- Explain Yudkowsky's toy equation, Bostrom's schema and the Forethought returns parameter $r$, each with its evidence label.
- Compare these models with measured curves from the Darwin Gödel Machine (DGM), SICA (a self-improving coding agent) and training-based loops. List what the models cannot prove.

## Prerequisites

- [L3: Feedback loops](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops)
- [L2: Loss, reward and update rules](/notes/ai/recursive-self-improvement/04-mathematics/l2-loss-reward-and-update-rules)
- [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)

## 1. The question this idea answers

Compare two kinds of growth. Money in a savings account grows by a fixed percentage each year, so the yearly gain gets larger. Your typing speed grows fast in the first weeks of practice and then slowly, so the weekly gain gets smaller. Both are "improvement", but their curves have opposite shapes.

The classic argument for an "intelligence explosion" assumes the first shape, or an even faster one. In recursive self-improvement (RSI), a system that improves itself becomes better at improving itself, so the gains grow. Most measured self-improvement curves have the second shape: the gains shrink, and the score levels off.

This lesson gives you the mathematics to state each claim exactly. Then you can ask the right question of any curve: which model is assumed, which is measured, and what would tell them apart?

## 2. Mental model, and where it stops working

> [!analogy] A snowball and a sponge
> A snowball rolls downhill. The bigger it is, the more snow it picks per turn, so it grows faster and faster. A sponge in a bowl of water absorbs quickly when it is dry and slowly when it is nearly full. It stops at its capacity. Self-improvement curves can look like either one.
>
> - **Where it stops working (1):** a real system can change shape. It can grow like a snowball for a while and then fill like a sponge.
> - **Where it stops working (2):** "size" is one number for a snowball. An agent's ability is not one number, and a benchmark measures only a part of it.
> - **Where it stops working (3):** a pass rate cannot exceed 100%. So a benchmark score must look like a sponge near the top, even if the underlying ability did not.

## 3. Terms

| Term | Plain meaning |
|---|---|
| recurrence | A rule that gives the next value of a sequence from the current value. |
| increment, gain | The change of the score in one iteration: $I_{t+1} - I_t$. |
| linear growth | The score rises by the same amount in each iteration. |
| exponential growth | The score rises by the same percentage in each iteration. |
| saturating growth | Each gain is a fixed fraction of the remaining distance to a ceiling. |
| ceiling | The value $I_{\max}$ that a saturating score approaches but does not pass. |
| headroom | The remaining distance to the ceiling, $I_{\max} - I_t$. |
| diminishing returns | Each new unit of effort gives a smaller gain than the last. |
| plateau | A stretch of iterations with almost no gain. |
| differential equation | An equation for the rate of change of a quantity at each moment. |
| returns exponent $\alpha$ | In $dI/dt = c\,I^{\alpha}$, the number that says how strongly the current level speeds up growth. |
| finite-time blow-up | A solution that becomes infinite at a finite time. |
| optimization power | Bostrom's term for the quality-weighted effort applied to make a system smarter. |
| recalcitrance | Bostrom's term for how hard a system is to improve. |
| crossover | Bostrom's term for the point after which the system's own work drives most of its improvement. |
| returns to software research and development (R&D), $r$ | Software doublings per doubling of cumulative research effort (Eth and Davidson). |
| software intelligence explosion (SIE) | Fast, accelerating progress from software improvements alone, on existing hardware. |
| residual | The difference between a measured value and the value that a fitted model predicts. |

## 4. Method and math

### 4.1 Three discrete recurrences

A self-improving loop runs in iterations $t = 0, 1, 2, \dots$. Let $I_t$ be the score after iteration $t$. A **recurrence** gives $I_{t+1}$ from $I_t$.

**The idea.** Three simple rules give three shapes. The gain is constant, or a constant percentage, or a fixed share of the remaining headroom.

$$
\text{linear: } I_{t+1} = I_t + c \qquad \text{exponential: } I_{t+1} = (1 + g)\,I_t \qquad \text{saturating: } I_{t+1} = I_t + k\,(I_{\max} - I_t)
$$

Their closed forms are:

$$
I_t = I_0 + c\,t \qquad I_t = I_0\,(1 + g)^t \qquad I_t = I_{\max} - (I_{\max} - I_0)(1 - k)^t
$$

**Symbols.**

- $I_t$ is the score after iteration $t$, and $I_0$ is the start score.
- $c$ is the constant gain per iteration.
- $g$ is the growth rate per iteration, for example 0.10 for 10%.
- $I_{\max}$ is the ceiling, and $k$ (between 0 and 1) is the share of headroom gained per iteration.

**In plain English.** Linear: the same step each time. Exponential: the step grows with the score. Saturating: the step shrinks as the score nears its ceiling.

**Worked example.** Start at $I_0 = 20$ (a pass rate in percent).

| $t$ | Linear, $c = 3$ | Exponential, $g = 0.10$ | Saturating, $k = 0.3$, $I_{\max} = 60$ |
|---|---|---|---|
| 0 | 20 | 20.00 | 20.00 |
| 1 | 23 | 22.00 | 32.00 |
| 2 | 26 | 24.20 | 40.40 |
| 3 | 29 | 26.62 | 46.28 |
| 4 | 32 | 29.28 | 50.40 |
| 5 | 35 | 32.21 | 53.28 |

For the saturating rule, the first step is $20 + 0.3 \times (60 - 20) = 32$. The gains are 12, 8.4, 5.88, 4.12 and 2.88. Each gain is $1 - k = 0.7$ times the one before. The closed form gives the same value: at $t = 3$, $60 - 40 \times 0.7^3 = 46.28$.

**Assumptions.** The parameters $c$, $g$, $k$ and $I_{\max}$ stay constant across iterations. The score is one number without noise.

**When it is useful.** Use the gain sequence to tell the shapes apart. Constant gains suggest linear. Gains that grow by a constant factor suggest exponential. Gains that shrink by a constant factor suggest saturating.

**What it does not prove.** An exponential model of a pass rate must fail. With $g = 0.10$, it passes 100% at $t = \ln 5 / \ln 1.1 \approx 16.9$ iterations, which is impossible. On a bounded score, every growth model must slow near the top.

### 4.2 Fitting a saturating model to a real plateau

**Measured:** Iterative Reasoning Preference Optimization (Iterative RPO) trains Llama-2-70B-Chat with preference pairs built from answer correctness. Its GSM8K accuracies were 55.6, 73.1, 78.0, 81.1 and 81.6 (Pang et al., 2024, [arXiv:2404.19733](https://arxiv.org/abs/2404.19733), Section 3.1). The authors comment on these gains, which are percentage points:

> "the gain decays across the iterations (17.5%, 4.9%, 3.1%, 0.5%), indicating an upper limit on learning across iterations."

**Step 1: look at the gains.** The ratios of successive gains are $4.9/17.5 = 0.28$, $3.1/4.9 = 0.63$ and $0.5/3.1 = 0.16$. A pure saturating model predicts one constant ratio, $1 - k$. The ratios are not constant, so the model can only be approximate.

**Step 2: a hand fit.** The saturating rule says $g_t = k\,(I_{\max} - I_t) = k I_{\max} - k I_t$. So the gain is a straight line in the current level. Fit a line through the four points (level, gain). They are (55.6, 17.5), (73.1, 4.9), (78.0, 3.1) and (81.1, 0.5). Least squares gives a slope of $-0.661$ and an intercept of 54.07. So $k \approx 0.661$ and $I_{\max} \approx 54.07 / 0.661 \approx 81.8$.

**Step 3: a direct fit.** Fix $I_0 = 55.6$ and choose $k$ and $I_{\max}$ to minimize the squared residuals of $I_1$ to $I_4$. A numerical solver gives $I_{\max} = 81.90$ and $k = 0.651$.

| Iteration | Measured | Fitted | Residual |
|---|---|---|---|
| 1 | 73.1 | 72.74 | −0.36 |
| 2 | 78.0 | 78.71 | +0.71 |
| 3 | 81.1 | 80.79 | −0.31 |
| 4 | 81.6 | 81.51 | −0.09 |

The root mean square residual is 0.43 points. The fitted gains are 17.1, 6.0, 2.1 and 0.7. The model predicts a fifth gain of only 0.25 points.

**What the fit means.** **Our interpretation:** the data are consistent with a ceiling near 82% for this method, model and benchmark. The fit has 2 free numbers and only 4 data points, so it is weak evidence for the saturating form. A different curve with a ceiling would fit almost as well. The fit also says nothing about a different base model or a harder benchmark.

**More plateau evidence.** **Measured** unless marked otherwise:

1. ReST-EM: "exceeding a couple of iterations of ReST𝐸𝑀 leads to diminishing improvement". On MATH with PaLM 2-L, accuracy went from 41% at iteration 2 to 41.9% at iteration 3 (Singh et al., 2024, [arXiv:2312.06585](https://arxiv.org/abs/2312.06585)).
2. Mind the Gap: iterative self-improvement "saturates after two or three rounds, regardless of the model's capacity" (Song et al., 2024, [arXiv:2412.02674](https://arxiv.org/abs/2412.02674), Section 5).
3. The Meta-Rewarding paper measured a Self-Rewarding baseline on Arena-Hard. It went 20.6, 23.2, 26.3, 28.2 and then 27.3 (Wu et al., 2024, [arXiv:2407.19594](https://arxiv.org/abs/2407.19594)). The last step is a decrease, which no saturating model can produce.
4. Self-Rewarding Language Models: AlpacaEval rose 9.94, 15.38, 20.44, with gains of 5.44 and 5.06. No plateau is visible in 3 iterations. **Claimed:** the authors expect that the effect "likely saturates in real-world settings" (Yuan et al., 2024, [arXiv:2401.10020](https://arxiv.org/abs/2401.10020)).
5. Contrast: AlphaGo Zero kept improving over 40 days of self-play with a perfect, cheap evaluator, the game rules (Silver et al., 2017, Nature 550). Its domain is closed and fully specified. Do not transfer this result to open tasks.

### 4.3 Continuous models: $dI/dt = c\,I^{\alpha}$

> [!key] Term: returns exponent
> - **Name:** returns exponent $\alpha$.
> - **Meaning:** how strongly the current level speeds up further improvement.
> - **Problem it solves:** it turns the vague claim "improvement feeds on itself" into one number that a model can use.
> - **Example:** $\alpha = 0$ gives a line, $\alpha = 1$ an exponential, and $\alpha = 2$ a blow-up at a finite time.
> - **Link to RSI:** the intelligence-explosion argument needs $\alpha > 1$ for the improvement loop.
> - **Limits:** nobody has measured $\alpha$ for a self-improving AI system, and real limits cap every curve.

The intelligence-explosion literature uses continuous time. The question is how the **rate** of improvement depends on the current level.

**The idea.** If a more capable system improves itself faster, the growth rate rises with the level $I$. The exponent $\alpha$ says how strongly.

$$
\frac{dI}{dt} = c\,I^{\alpha}, \qquad I(0) = I_0 > 0
$$

**Symbols.**

- $I(t)$ is the level at time $t$. It is a positive number with no ceiling.
- $dI/dt$ is the rate of change of $I$.
- $c > 0$ is a constant rate factor.
- $\alpha \ge 0$ is the returns exponent.

**In plain English.** The speed of improvement is proportional to the current level raised to the power $\alpha$.

**Solution, step by step.** Separate the variables: $I^{-\alpha}\,dI = c\,dt$.

1. If $\alpha = 1$: integrate to get $\ln I = \ln I_0 + c\,t$. So $I(t) = I_0\,e^{c t}$. This is exponential growth.
2. If $\alpha \ne 1$: integrate to get $\frac{I^{1-\alpha} - I_0^{1-\alpha}}{1 - \alpha} = c\,t$. So:

$$
I(t) = \Big(I_0^{1-\alpha} + (1 - \alpha)\,c\,t\Big)^{\frac{1}{1-\alpha}}
$$

3. If $\alpha < 1$: the bracket grows linearly in $t$, and the power is positive. So $I$ grows like a polynomial in $t$, with no blow-up. The case $\alpha = 0$ is linear growth.
4. If $\alpha > 1$: the bracket shrinks and reaches zero at a finite time. The power is negative, so $I$ becomes infinite there:

$$
t^{*} = \frac{I_0^{1-\alpha}}{(\alpha - 1)\,c}
$$

**Worked example.** $I_0 = 1$ and $c = 0.1$.

| $t$ | $\alpha = 0.5$ | $\alpha = 1$ | $\alpha = 2$ |
|---|---|---|---|
| 0 | 1.000 | 1.000 | 1 |
| 2 | 1.210 | 1.221 | 1.25 |
| 5 | 1.563 | 1.649 | 2 |
| 8 | 1.960 | 2.226 | 5 |
| 9 | 2.103 | 2.460 | 10 |
| 9.9 | 2.235 | 2.691 | 100 |
| 10 | 2.250 | 2.718 | infinite |

For $\alpha = 2$, the solution is $I(t) = 1/(1 - 0.1\,t)$, and $t^{*} = 1/(1 \times 0.1) = 10$. For $\alpha = 1.5$, $t^{*} = 1/(0.5 \times 0.1) = 20$. We checked the table with a numerical solver.

Look at $t = 5$. The three curves are still close: 1.56, 1.65 and 2. Early data cannot tell them apart well. The difference appears late, just before the blow-up.

**Assumptions.**

1. Ability is one number $I$.
2. $c$ and $\alpha$ stay constant forever.
3. There is no ceiling, no cost and no delay.

**When it is useful.** It makes "explosion" precise: blow-up needs returns that rise faster than linearly in the level, $\alpha > 1$. It also shows that $\alpha = 1$ gives fast but finite growth.

**What it does not prove.** The blow-up is a property of the equation, not of any machine. Physical limits stop any real growth. Eth and Davidson note that $r$ must eventually fall toward 0 near physical limits.

### 4.4 Yudkowsky's toy equation (Theory and Speculation)

Yudkowsky asks "whether it's possible to get sustained returns on reinvesting cognitive improvements into further improving cognition" (Yudkowsky, 2013, *Intelligence Explosion Microeconomics*, Section 1). He borrows a picture from nuclear physics:

1. **Intelligence fizzle**, $k < 1$: "it requires exponentially greater investment of computing power to gain a linear return in performance."
2. **Intelligence combustion**, $k$ slightly above 1: "a gradual, continuous increase in the overall rate of economic growth".
3. **Intelligence explosion**, prompt $k$ much greater than 1.

The author warns that the analogy is "not meant to imply that an intelligence explosion ought to be similar to a nuclear pile." [L3: Feedback loops](/notes/ai/recursive-self-improvement/01-foundations/l3-feedback-loops) treats $k$ as a loop gain.

**The idea of the toy equation.** Computer speed doubles every 18 months for researchers of constant speed. Now let the researchers run on the computers. Then faster computers make faster research, which makes faster computers.

$$
\frac{dy}{dt} = e^{y} \quad \Rightarrow \quad y(t) = -\ln(c - t)
$$

**Symbols.**

- $y$ is the logarithm of computing speed.
- $t$ is time, and $c$ is a constant set by the start value.
- $\ln$ is the natural logarithm.

**In plain English.** The growth rate of log-speed equals the speed itself. Then speed reaches infinity at the finite time $t = c$.

**Worked example.** Take $y(0) = 0$, so $c = 1$.

1. Derivation: $e^{-y}\,dy = dt$, so $-e^{-y} = t - c$, so $y = -\ln(c - t)$.
2. $y(0.5) = -\ln 0.5 = 0.693$.
3. $y(0.9) = -\ln 0.1 = 2.303$.
4. $y(0.99) = 4.605$, and $y$ is infinite at $t = 1$.

The paper's illustration: doubling times of 18 months, then 9, then 4.5, and so on. Their sum is $18 \times (1 + \tfrac{1}{2} + \tfrac{1}{4} + \dots) = 36$ months, so speed becomes infinite after 36 months.

**Labels.** **Theory:** the mathematics is correct. **Speculation:** the author calls it a "fully-as-naive" extrapolation, not a forecast, and asks for return curves that history could falsify.

**What it does not prove.** It assumes that research speed scales exactly with hardware speed and that nothing else limits progress.

### 4.5 Bostrom's schema: optimization power over recalcitrance (Theory and Speculation)

Bostrom gives a schematic equation in Chapter 4 of *Superintelligence* (Bostrom, 2014). The book itself was not read for this course. The content comes from secondary reproductions, so the letter symbols may differ from the book.

$$
\frac{dI}{dt} = \frac{D}{R}, \qquad D = D_{\text{system}} + D_{\text{project}} + D_{\text{world}}
$$

**Symbols.**

- $I$ is the system's intelligence.
- $D$ is the optimization power: the quality-weighted effort applied to make the system smarter.
- $R$ is the recalcitrance: "how hard it is to make the system smarter by applying effort".
- $D_{\text{system}}$, $D_{\text{project}}$ and $D_{\text{world}}$ are the contributions of the system itself, the project team and the outside world.

**In plain English.** Speed of improvement equals effort applied divided by difficulty.

**Crossover.** The crossover is the point where $D_{\text{system}} > D_{\text{project}} + D_{\text{world}}$. After it, the system's own work drives most of its improvement.

**Worked example 1.** If optimization power doubles and recalcitrance triples, the rate becomes $2/3$ of what it was. Improvement slows although effort grew.

**Worked example 2: Bostrom's illustration.** Before crossover, capacity doubles every 18 months, $dI/dt = c\,I$. After crossover, the system adds its own power, and $dI/dt = (c + I)\,I$. The reproduction states three results. The next doubling takes 7.5 months. A thousandfold increase happens within 17.9 months. The curve has a singularity at 18 months.

**Our check.** Set $c = \ln 2 / 18$ per month, so the old doubling time is 18 months. Set $I = c$ at crossover. The exact solution is $I(t) = c\,I_0 e^{ct} / (c + I_0 - I_0 e^{ct})$ with $I_0 = c$.

1. Doubling: $e^{ct} = 4/3$, so $t = 18 \times \log_2(4/3) = 7.47$ months.
2. Thousandfold: $e^{ct} = 2000/1001$, so $t = 17.97$ months.
3. Singularity: $e^{ct} = 2$, so $t = 18$ months.

Our values match the reproduced figures closely.

**Labels.** **Theory:** the equation is a modeling frame, not a measured law. **Speculation:** the takeoff scenarios. The book also says that the assumption of constant recalcitrance fails near physical limits.

**What it does not prove.** Everything depends on how $R$ changes as $I$ rises. Nobody has measured that function for a self-improving system.

### 4.6 The Forethought returns parameter $r$ (model estimates)

Eth and Davidson give the modern, measurable version of the same question (Eth and Davidson, 2025, Forethought). They define "r gives the number of times software doubles for each time the cumulative work on software R&D doubles."

**The idea.** Suppose that doubling the total research effort makes software more than twice as good. Suppose also that the AI does the research itself. Then each doubling comes faster than the last.

$$
\text{software} \propto E^{\,r} \quad \Rightarrow \quad \text{one doubling of } E \text{ multiplies software by } 2^{r}
$$

**Symbols.**

- $E$ is the cumulative research effort spent on software.
- $r$ is the returns to software research and development (R&D).
- $\propto$ reads "is proportional to". **Our interpretation:** a power law is the simplest form with the property in the definition.

**In plain English.** With $r > 1$, research pays off more than proportionally.

**Worked example.**

1. For $r = 1.4$, one doubling of $E$ multiplies software by $2^{1.4} = 2.64$.
2. Turn it around: one software doubling needs $E$ to grow by $2^{1/r} = 2^{0.714} = 1.64$ times. That is "<2x as much research effort as the last", as the paper says.
3. Now assume that research effort per month is proportional to the current software level. That holds if AI does all the research on fixed hardware. Then the time for each software doubling is $2^{1/r} / 2 = 0.82$ times the time for the previous one. Progress speeds up.
4. For $r = 0.8$, the factor is $2^{1.25}/2 = 1.19$. Each doubling takes 19% longer. Progress slows.
5. For $r = 1$, the factor is exactly 1. Doublings take constant time, which is exponential growth.

**Our interpretation:** step 3 turns the model into $dE/dt \propto E^{r}$, which is the equation of section 4.3 with $\alpha = r$. So "$r > 1$" plays the same role as "$\alpha > 1$", Yudkowsky's "$k > 1$" and Bostrom's "optimization power grows faster than recalcitrance".

**The estimates.** Eth and Davidson estimate $r$ from past data (Epoch data). These are **model estimates** with large uncertainty, not measurements of a self-improving AI.

| Field | Estimate of $r$ |
|---|---|
| Computer vision | median 1.4 (5th to 95th percentile 0.8 to 2.4) |
| Computer chess | 0.8 |
| Reinforcement learning sample efficiency | 1.6 |
| SAT solvers | 3.5 |
| Linear programming | 1.1 |
| General algorithms | about 4, "with an especially large grain of salt" |

Their overall best guess "should perhaps be ~1-4, though with high uncertainty". With hardware held fixed, they "might reduce our best-guess estimate of r to ~0.5-2". Their conclusion: "it seems at least decently likely that an SIE would occur", but "we can't be confident either way."

**Labels.** **Measured:** the historical estimates, from past human research, with large uncertainty. **Speculation:** their application to future AI that does AI research.

**What it does not prove.** Past fields had human researchers and growing hardware. A future loop may have different returns. The estimates cross $r = 1$ inside their own uncertainty ranges.

### 4.7 Measured curves of self-improving agents

Now compare the models with measured agent curves.

| System | Start | Best | Iterations or budget | Noise of one score |
|---|---|---|---|---|
| DGM, SWE-bench (200-task subset) | 20.0% | 50.0% | 80 iterations, single run | about ±6.9 points (95%) |
| DGM, Polyglot (full) | 14.2% | 30.7% | 80 iterations, single run | 3 repeat runs on the 50-task subset: standard deviation 2.3 points |
| SICA, SWE-bench Verified (50 tasks) | 17% | 53% at iteration 14 | 15 iterations | about ±14 points (95%) |
| Huxley-Gödel Machine (HGM), SWE-Verified-60 | 40% | 56.7% | 800 task evaluations | one task is 1.67 points |

Sources: Zhang et al., 2025, [arXiv:2505.22954](https://arxiv.org/abs/2505.22954). Robeyns et al., 2025, [arXiv:2504.15228](https://arxiv.org/abs/2504.15228), Table 1. Wang et al., 2025, [arXiv:2510.21614](https://arxiv.org/abs/2510.21614), Table 2. The intervals are our arithmetic from L3.

**Look at the SICA series.** The third plot of section 5 shows all 16 scores on 50 tasks. They run from 0.17 at iteration 0 to 0.51 at iteration 15. In our count, 8 of the 15 changes are decreases. The best value, 0.53, appears at iteration 14, and iteration 15 gives 0.51.

**Our interpretation:** each point has a 95% interval of about ±13 to ±14 points. After iteration 9, the data cannot separate "slow linear gain", "plateau near 45%" and "noise around a flat line". A single run of 16 noisy points cannot choose between the models of this lesson.

**Look at the DGM lineage.** **Measured:** the score of the best agent's lineage "temporarily fell below that of its parent" at iterations 4 and 56. So even the path to the best agent was not monotone.

**The benchmark ceiling.** All these scores are pass rates between 0% and 100%. A pass rate near the top must rise slowly, whatever the system does. So a plateau on one benchmark is evidence about that benchmark, not proof that ability stopped.

### 4.8 What these equations do not prove

Each model in this lesson starts from an assumed form. Only measurement can test the form.

1. **The form is assumed.** $dI/dt = c\,I^{\alpha}$ explodes if $\alpha > 1$. But nobody has measured $\alpha$ for a self-improving system.
2. **"Ability" is not one number.** A gain on SWE-bench may not transfer to other tasks. Chalmers calls this the "correlation obstacle".
3. **Scores have ceilings.** A benchmark score must saturate. An unbounded model needs an unbounded measure.
4. **Noise hides the shape.** With intervals of ±14 points, 16 points of one run cannot separate linear, saturating and flat curves.
5. **Few points fit any smooth curve.** A 2-number fit to 4 points says little about the form.
6. **Extrapolation is a guess.** A curve fitted to 5 iterations says nothing certain about iteration 50.
7. **Limits matter.** Fixed compute, cost and physics cut every explosive solution short. Eth and Davidson discuss compute bottlenecks explicitly.

**Our interpretation:** the measured agent curves in this course rise, wobble and level off. They support "improvement within limits". They neither support nor exclude an explosion. None of them measures a loop whose improver keeps improving without a fixed outer part.

> [!example] Exercise 1: two calculations
> (a) A saturating loop has $I_0 = 30$, $I_{\max} = 70$ and $k = 0.25$. Compute $I_1$, $I_2$ and $I_3$. How many iterations does it need to reach 65 or more?
> (b) For $dI/dt = c\,I^{\alpha}$ with $\alpha = 3$, $c = 0.05$ and $I_0 = 2$, compute the blow-up time $t^{*}$.

```check
{
  "question": "Give the answers to Exercise 1 (a) and (b).",
  "hint": "(a) Use $I_t = 70 - 40 \\times 0.75^t$ and solve $40 \\times 0.75^t \\le 5$. (b) Use $t^{*} = I_0^{1-\\alpha} / ((\\alpha - 1)c)$.",
  "answer": "(a) $I_1 = 30 + 0.25 \\times 40 = 40$. $I_2 = 40 + 0.25 \\times 30 = 47.5$. $I_3 = 47.5 + 0.25 \\times 22.5 = 53.125$. To reach 65, the headroom must fall to 5 or less: $0.75^t \\le 0.125$, so $t \\ge \\ln 0.125 / \\ln 0.75 = 7.23$. The loop needs 8 iterations.\n\n(b) $t^{*} = 2^{-2} / (2 \\times 0.05) = 0.25 / 0.1 = 2.5$."
}
```

## 5. Graphs

The continuous models of section 4.3 and a saturating curve, all starting at 1. Note how close the curves stay until about $t = 6$.

```plot
{
  "title": "Growth models from I = 1: linear (ink), alpha = 0.5 (purple), exponential alpha = 1 (blue), alpha = 2 with blow-up at t = 10 (red), saturating to 3 (gold)",
  "xAxis": {"domain": [0, 12], "label": "time t"},
  "yAxis": {"domain": [0, 6], "label": "level I"},
  "disableZoom": true,
  "data": [
    {"fn": "1 + 0.1*x", "color": "#100D12"},
    {"fn": "(1 + 0.05*x)^2", "color": "#6A4C93"},
    {"fn": "exp(0.1*x)", "color": "#1E6091"},
    {"fn": "1/(1 - 0.1*x)", "range": [0, 9.8], "color": "#C81D25"},
    {"fn": "3 - 2*exp(-0.3*x)", "color": "#B8860B"}
  ]
}
```

The Iterative RPO plateau of section 4.2 with the fitted saturating curve. The model predicts almost no further gain.

```plot
{
  "title": "Iterative RPO on GSM8K: measured accuracy in blue, fitted saturating curve with ceiling 81.9 in gold",
  "xAxis": {"domain": [-0.2, 7], "label": "iteration"},
  "yAxis": {"domain": [50, 90], "label": "GSM8K accuracy (%)"},
  "disableZoom": true,
  "data": [
    {"points": [[0, 55.6], [1, 73.1], [2, 78.0], [3, 81.1], [4, 81.6]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 55.6], [1, 73.1], [2, 78.0], [3, 81.1], [4, 81.6]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true},
    {"fn": "81.90 - 26.30*exp(-1.0541*x)", "range": [0, 7], "color": "#B8860B"}
  ]
}
```

The SICA series of section 4.7 on 50 SWE-bench Verified tasks. Each point has a 95% interval of about ±14 points, larger than most steps between points.

```plot
{
  "title": "SICA score per iteration on 50 SWE-bench Verified tasks (blue), from Table 1",
  "xAxis": {"domain": [-0.5, 15.5], "label": "iteration"},
  "yAxis": {"domain": [0, 70], "label": "tasks solved (%)"},
  "disableZoom": true,
  "data": [
    {"points": [[0, 17], [1, 14], [2, 17], [3, 22], [4, 38], [5, 30], [6, 37], [7, 33], [8, 27], [9, 47], [10, 46], [11, 44], [12, 44], [13, 27], [14, 53], [15, 51]], "fnType": "points", "graphType": "polyline", "color": "#1E6091", "skipTip": true},
    {"points": [[0, 17], [1, 14], [2, 17], [3, 22], [4, 38], [5, 30], [6, 37], [7, 33], [8, 27], [9, 47], [10, 46], [11, 44], [12, 44], [13, 27], [14, 53], [15, 51]], "fnType": "points", "graphType": "scatter", "color": "#1E6091", "skipTip": true}
  ]
}
```

## 6. Video and animation

- [AI Self Improvement - Computerphile](https://www.youtube.com/watch?v=5qfIgCiYlfY) (Robert Miles). The RSI argument in plain words, with no mathematics. Watch it before sections 4.3 to 4.5, then ask which value of $\alpha$ the argument assumes.
- [Adv. LLM Agents MOOC: Learning to Reason with LLMs by Jason Weston](https://www.youtube.com/watch?v=_MNlLhU33H0) (Berkeley RDI). It covers Self-Rewarding, Iterative RPO and Meta-Rewarding, the sources of the plateau data in section 4.2.

## 7. Code

A least-squares fit of the saturating model to the Iterative RPO numbers. It uses SciPy.

```python
import numpy as np
from scipy.optimize import least_squares

y = np.array([55.6, 73.1, 78.0, 81.1, 81.6])
t = np.arange(5)

def model(p, t):
    i_max, k = p
    return i_max - (i_max - y[0]) * (1 - k) ** t

fit = least_squares(lambda p: model(p, t)[1:] - y[1:], x0=[82, 0.5])
print(np.round(fit.x, 3))            # about [81.902, 0.651]
print(np.round(model(fit.x, t), 2))  # 55.6, 72.74, 78.71, 80.79, 81.51
```

## 8. Common mistakes

1. **"A self-improving system grows exponentially."** Exponential growth needs constant percentage gains. Most measured loops show shrinking gains.
2. **"$\alpha = 1$ is an explosion."** It gives exponential growth with no blow-up. Finite-time blow-up needs $\alpha > 1$.
3. **"A good fit proves the model."** Two free numbers fitted to four points cannot exclude other curves.
4. **"The plateau shows the limit of the agent."** It may be the ceiling of the benchmark, or noise. A pass rate cannot pass 100%.
5. **"The r estimates show that an explosion will happen."** They are model estimates from past human research. The authors say "we can't be confident either way."
6. **"Bostrom's equation is a law."** It is a schema. Its outcome depends on how recalcitrance changes, which nobody has measured.
7. **"The highest point of a noisy series is the current level."** SICA's 53% is the best of 16 noisy points. L3 shows that such a maximum is biased upward.

## 9. One-minute explanation

Simple rules model a score over iterations: constant gains give a line, constant percentages an exponential, and shares of headroom a saturating curve. Measured loops, such as Iterative RPO on GSM8K, look saturating, with gains of 17.5, 4.9, 3.1 and 0.5 points. In continuous time, $dI/dt = c\,I^{\alpha}$ blows up in finite time only if $\alpha > 1$. Yudkowsky's toy equation, Bostrom's "optimization power over recalcitrance" and the Forethought parameter $r > 1$ are versions of this condition. They are theory and model estimates, not measurements of a self-improving AI. Measured agent curves are short, noisy and bounded by benchmark ceilings, so they cannot decide which model is true.

## 10. Check questions

```check
{
  "question": "A loop reports gains of 8, 6, 4.5 and 3.4 points over four iterations. Which recurrence fits best? Estimate $k$ and the remaining headroom after the fourth iteration.",
  "hint": "Compute the ratios of successive gains. In the saturating model, each gain is $k$ times the current headroom.",
  "answer": "The ratios are $6/8 = 0.75$, $4.5/6 = 0.75$ and $3.4/4.5 \\approx 0.76$. They are nearly constant, so the saturating recurrence fits, with $1 - k \\approx 0.75$ and $k \\approx 0.25$. The first gain is $k$ times the first headroom, so the start headroom is $8 / 0.25 = 32$ points. The four gains sum to 21.9, so about 10 points of headroom remain. The model predicts a next gain of about $0.25 \\times 10 = 2.5$ points."
}
```

```check
{
  "question": "Two models fit the first 5 time units of a curve almost equally well: $\\alpha = 1$ and $\\alpha = 2$, both with $I_0 = 1$ and $c = 0.1$. At what time do they differ by a factor of 2 or more? What does this mean for early evidence?",
  "hint": "Use the table of section 4.3.",
  "answer": "At $t = 5$, the values are 1.65 and 2.0, a ratio of 1.21. At $t = 8$, they are 2.23 and 5.0, a ratio of 2.25. So the factor of 2 appears between $t = 5$ and $t = 8$, close to the blow-up at $t = 10$. Early data cannot separate explosive from exponential growth. By the time the difference is large, most of the explosive growth has already happened."
}
```

```check
{
  "question": "Classify each statement as Measured, Theory, model estimate or Speculation: (a) Iterative RPO gained 0.5 points in its fourth iteration. (b) With $\\alpha > 1$, $dI/dt = cI^{\\alpha}$ becomes infinite at a finite time. (c) Returns to software R&D in computer vision have a median of 1.4. (d) AI research automation will cause a software intelligence explosion.",
  "hint": "Ask where each number or claim comes from.",
  "answer": "(a) Measured, from the paper's experiment. (b) Theory, a property of the equation that holds under its assumptions. (c) A model estimate from past data, with a range of 0.8 to 2.4. It is a measurement of past human research, not of a self-improving AI. (d) Speculation. Eth and Davidson themselves say they cannot be confident either way."
}
```

```check
{
  "question": "A blog post shows the SICA series. It says: 'the agent gains about 2.4 points per iteration, so 30 more iterations will reach 100%'. Give three separate objections.",
  "hint": "Think about noise, ceilings and extrapolation.",
  "answer": "First, noise: each point has a 95% interval of about ±14 points, and 8 of 15 changes are decreases. A straight line through such data is not a reliable rate.\n\nSecond, the ceiling: a pass rate cannot exceed 100%, and every bounded score must slow near its top. A linear model ignores this.\n\nThird, extrapolation: 16 points from one run say nothing certain about 30 more iterations. The SICA run itself was short, and the paper notes that runs did not saturate. Also, 53% is the best of 16 noisy points, so it overstates the level."
}
```

## 11. Summary and links

- Constant gains give lines, constant percentages give exponentials, and shares of headroom give saturating curves. Look at the ratios of successive gains.
- Measured training loops show shrinking gains, for example 17.5, 4.9, 3.1 and 0.5 points for Iterative RPO. Some even reverse.
- $dI/dt = c\,I^{\alpha}$ blows up in finite time only if $\alpha > 1$. Yudkowsky's $k$, Bostrom's schema and the Forethought $r$ express the same condition.
- These models are theory, model estimates or speculation. Measured agent curves are short, noisy and bounded, so they cannot decide between them.

Next, lesson L5 moves one level up. It scores the improver instead of the solution, and computes what a nested loop costs.

- Previous: [L3: Evaluation under noise](/notes/ai/recursive-self-improvement/04-mathematics/l3-evaluation-under-noise)
- Next: [L5: Optimizing the improver: meta-objectives and nested loops](/notes/ai/recursive-self-improvement/04-mathematics/l5-optimizing-the-improver)
- Related: [L1: Conditions for sustained improvement](/notes/ai/recursive-self-improvement/10-advanced/l1-conditions-for-sustained-improvement)
- Related: [L5: A short history from Good to agents](/notes/ai/recursive-self-improvement/02-core-idea/l5-history-from-good-to-agents)
- Related: [L7: Training-based self-improvement](/notes/ai/recursive-self-improvement/05-approaches/l7-training-based-self-improvement)

## References

- Richard Yuanzhe Pang, Weizhe Yuan, Kyunghyun Cho, He He, Sainbayar Sukhbaatar, Jason Weston. "Iterative Reasoning Preference Optimization". 2024. arXiv:2404.19733. https://arxiv.org/abs/2404.19733
- Avi Singh, John D. Co-Reyes, Rishabh Agarwal, et al. "Beyond Human Data: Scaling Self-Training for Problem-Solving with Language Models". Transactions on Machine Learning Research, 2024. arXiv:2312.06585. https://arxiv.org/abs/2312.06585
- Yuda Song, Hanlin Zhang, Carson Eisenach, Sham Kakade, Dean Foster, Udaya Ghai. "Mind the Gap: Examining the Self-Improvement Capabilities of Large Language Models". 2024. arXiv:2412.02674. https://arxiv.org/abs/2412.02674
- Weizhe Yuan, Richard Yuanzhe Pang, Kyunghyun Cho, et al. "Self-Rewarding Language Models". ICML 2024. arXiv:2401.10020. https://arxiv.org/abs/2401.10020
- Tianhao Wu, Weizhe Yuan, Olga Golovneva, et al. "Meta-Rewarding Language Models: Self-Improving Alignment with LLM-as-a-Meta-Judge". 2024. arXiv:2407.19594. https://arxiv.org/abs/2407.19594
- David Silver, Julian Schrittwieser, Karen Simonyan, et al. "Mastering the game of Go without human knowledge". Nature 550(7676): 354–359, 2017. DOI 10.1038/nature24270.
- Eliezer Yudkowsky. "Intelligence Explosion Microeconomics". Technical report 2013-1, Machine Intelligence Research Institute, 2013. https://intelligence.org/2013/04/29/intelligence-explosion-microeconomics-released/
- Nick Bostrom. *Superintelligence: Paths, Dangers, Strategies*. Oxford University Press, 2014. Chapter 4 read through secondary reproductions: https://www.greaterwrong.com/posts/GT8uvxBjidrmM3MCv/superintelligence-6-intelligence-explosion-kinetics
- Daniel Eth, Tom Davidson. "Will AI R&D Automation Cause a Software Intelligence Explosion?". Forethought, 26 March 2025. https://forethought.org/research/will-ai-r-and-d-automation-cause-a-software-intelligence-explosion
- David J. Chalmers. "The Singularity: A Philosophical Analysis". Journal of Consciousness Studies 17: 7–65, 2010. https://consc.net/papers/singularity.pdf
- Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, Jeff Clune. "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents". 2025. ICLR 2026. arXiv:2505.22954. https://arxiv.org/abs/2505.22954
- Maxime Robeyns, Martin Szummer, Laurence Aitchison. "A Self-Improving Coding Agent". 2025. arXiv:2504.15228. https://arxiv.org/abs/2504.15228
- Wenyi Wang, Piotr Piękos, Li Nanbo, et al. "Huxley-Gödel Machine: Human-Level Coding Agent Development by an Approximation of the Optimal Self-Improving Machine". 2025. ICLR 2026. arXiv:2510.21614. https://arxiv.org/abs/2510.21614
