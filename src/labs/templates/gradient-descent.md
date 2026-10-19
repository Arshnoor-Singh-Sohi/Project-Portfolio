---
title: "Linear regression with gradient descent"
summary: "Write the loss, its gradient and the training loop from first principles, check the gradient numerically, and explore the learning rate."
collection: "Machine Learning"
tags: [machine-learning, gradient-descent, numpy]
packages: [numpy, matplotlib]
level: "Beginner"
order: 40
objectives:
  - "Write the mean squared error loss and its gradient by hand."
  - "Check a gradient with finite differences."
  - "Write a gradient descent loop and compare it with the exact solution."
  - "Explain what happens when the learning rate is too small or too large."
---
# Linear regression with gradient descent

A model $\hat y = w x + b$ has two numbers to learn: the slope $w$ and the intercept $b$. Training means: find the $w$ and $b$ that make the predictions close to the data.

1. **Loss**: one number that says how wrong the model is. Here: the mean squared error.
2. **Gradient**: the direction in which the loss grows fastest.
3. **Gradient descent**: take small steps against the gradient, again and again.

## 1. Make data

```python
import numpy as np
import matplotlib.pyplot as plt

true_w = 2.0      # @param {type:"slider", min:-5, max:5, step:0.5}
true_b = -1.0     # @param {type:"slider", min:-5, max:5, step:0.5}
noise = 1.0       # @param {type:"slider", min:0, max:5, step:0.25}
n = 50            # @param {type:"slider", min:5, max:500, step:5}

rng = np.random.default_rng(0)
x = rng.uniform(-3, 3, n)
y = true_w * x + true_b + noise * rng.standard_normal(n)

plt.figure(figsize=(6, 3.5))
plt.scatter(x, y, s=14, color="#1E6091")
plt.title(f"{n} points from y = {true_w}x + {true_b} + noise")
plt.xlabel("x"); plt.ylabel("y")
```

## 2. The loss

$$
L(w, b) = \frac{1}{n} \sum_{i=1}^{n} \left(w x_i + b - y_i\right)^2
$$

```python
def mse(w, b, x, y):
    """Mean squared error of the line y = w*x + b on the data."""
    # TODO
    raise NotImplementedError("Write mse(w, b, x, y)")
```

```python
import lab

lab.check("a perfect line has zero loss", mse(2.0, 1.0, np.array([0.0, 1.0]), np.array([1.0, 3.0])), 0.0)
lab.check("errors 1 and 3 give (1 + 9) / 2", mse(0.0, 0.0, np.array([5.0, 5.0]), np.array([1.0, 3.0])), 5.0)
```

## 3. The gradient

Take the derivative of $L$ with respect to $w$ and to $b$ by hand first. Write it on paper, then in code.

```python
def gradient(w, b, x, y):
    """Return (dL/dw, dL/db) for the mean squared error."""
    # TODO
    raise NotImplementedError("Write gradient(w, b, x, y)")
```

```check
{
  "question": "Stuck on the derivative? Call the error of one point e_i = w·x_i + b − y_i.",
  "hint": "The derivative of e² is 2e times the derivative of e. The derivative of e_i with respect to w is x_i, and with respect to b is 1.",
  "answer": "dL/dw = (2/n) · Σ e_i · x_i and dL/db = (2/n) · Σ e_i. In NumPy: `e = w * x + b - y`, then `return 2 * np.mean(e * x), 2 * np.mean(e)`."
}
```

**Never trust a gradient you wrote by hand until you check it.** The finite-difference test moves one number a tiny step $h$ and measures how the loss changes:

$$
\frac{\partial L}{\partial w} \approx \frac{L(w + h, b) - L(w - h, b)}{2h}
$$

```python
def numeric_gradient(w, b, x, y, h=1e-6):
    dw = (mse(w + h, b, x, y) - mse(w - h, b, x, y)) / (2 * h)
    db = (mse(w, b + h, x, y) - mse(w, b - h, x, y)) / (2 * h)
    return dw, db


for w0, b0 in [(0.0, 0.0), (1.5, -2.0), (-3.0, 4.0)]:
    lab.check(f"gradient at w={w0}, b={b0}", np.array(gradient(w0, b0, x, y)), np.array(numeric_gradient(w0, b0, x, y)), tol=1e-5)
```

## 4. Gradient descent

```python
def train(x, y, lr=0.1, steps=100):
    """Start at w = b = 0. Each step: w -= lr * dL/dw and b -= lr * dL/db.
    Return (w, b, losses), where losses holds the loss before every step."""
    # TODO
    raise NotImplementedError("Write train(x, y, lr, steps)")
```

```python
w_fit, b_fit, losses = train(x, y, lr=0.1, steps=200)
w_exact, b_exact = np.polyfit(x, y, 1)            # the exact least-squares answer
lab.check("matches the exact slope", w_fit, w_exact, tol=1e-3)
lab.check("matches the exact intercept", b_fit, b_exact, tol=1e-3)
lab.check("the loss went down", losses[-1] < losses[0])
```

## 5. Explore the learning rate

```python
lr = 0.1      # @param {type:"slider", min:0.001, max:0.6, step:0.001, label:"learning rate"}
steps = 60    # @param {type:"slider", min:5, max:500, step:5}

w_fit, b_fit, losses = train(x, y, lr=lr, steps=steps)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 3.5))
ax1.plot(losses, color="#C81D25")
ax1.set(yscale="log", title="loss at each step", xlabel="step")
ax2.scatter(x, y, s=10, color="#1E6091")
xs = np.linspace(-3, 3, 2)
ax2.plot(xs, w_fit * xs + b_fit, color="#C81D25", label=f"fit: {w_fit:.2f}x + {b_fit:.2f}")
ax2.plot(xs, w_exact * xs + b_exact, "k--", label="exact")
ax2.legend(); ax2.set_title("the line")
fig.tight_layout()
print(f"final loss {losses[-1]:.4g}")
```

## Observations

1. Find the smallest learning rate where the loss explodes. What does the loss curve look like?
2. With a very small learning rate, what do you need more of?
3. Why does the finite-difference check use $(L(w+h) - L(w-h)) / 2h$ and not $(L(w+h) - L(w)) / h$?
