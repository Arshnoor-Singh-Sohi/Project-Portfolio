---
title: "Algorithms: sorting and growth rates"
summary: "Write insertion sort and merge sort with a comparison counter, then measure how the work grows with the input size."
collection: "Algorithms"
tags: [algorithms, sorting, complexity]
packages: [numpy, matplotlib]
level: "Beginner"
order: 60
objectives:
  - "Write insertion sort and merge sort, and count their comparisons."
  - "Predict the best, worst and average comparison counts of insertion sort."
  - "Read a growth plot and tell n² from n log n."
---
# Algorithms: sorting and growth rates

Big-O notation says how the work of an algorithm grows when the input grows. Here you do not trust the formula: you **count** the work and plot it.

Each sort returns two things: the sorted list and the number of comparisons it made (each time it asks "is a < b?").

## 1. Insertion sort

Take the items one by one. Move each new item left until the item before it is not larger.

```python
def insertion_sort(items):
    """Return (sorted copy of items, number of comparisons)."""
    a = list(items)
    comparisons = 0
    # TODO
    raise NotImplementedError("Write insertion_sort(items)")
```

```check
{
  "question": "Stuck? Where do you add 1 to the counter?",
  "hint": "Add 1 every time you compare two items, also the last comparison that stops the inner loop.",
  "answer": "for i in range(1, len(a)): j = i; while j > 0: comparisons += 1; if a[j - 1] > a[j]: swap them and j -= 1; else: break. Return a, comparisons."
}
```

```python
import random
import lab

for trial in range(5):
    data = [random.randint(-50, 50) for _ in range(random.randint(0, 30))]
    lab.check(f"sorts random list {trial + 1}", insertion_sort(data)[0], sorted(data))
n = 20
lab.check("already sorted: n - 1 comparisons", insertion_sort(range(n))[1], n - 1)
lab.check("reversed: n(n - 1)/2 comparisons", insertion_sort(range(n, 0, -1))[1], n * (n - 1) // 2)
lab.check("empty list", insertion_sort([]), ([], 0))
```

## 2. Merge sort

Split the list in two halves, sort each half (with merge sort), then merge the two sorted halves.

```python
def merge_sort(items):
    """Return (sorted copy of items, number of comparisons)."""
    a = list(items)
    # TODO
    raise NotImplementedError("Write merge_sort(items)")
```

```python
for trial in range(5):
    data = [random.random() for _ in range(random.randint(0, 40))]
    lab.check(f"merge sort, random list {trial + 1}", merge_sort(data)[0], sorted(data))
lab.check("merge sort on 64 items needs at most n log2 n comparisons", merge_sort(random.sample(range(64), 64))[1] <= 64 * 6)
```

## 3. Measure the growth

```python
import numpy as np
import matplotlib.pyplot as plt

max_n = 300        # @param {type:"slider", min:20, max:1000, step:20}
order = "random"   # @param ["random", "sorted", "reversed"]

sizes = list(range(10, max_n + 1, max(1, max_n // 20)))


def make(n):
    if order == "sorted":
        return list(range(n))
    if order == "reversed":
        return list(range(n, 0, -1))
    return random.Random(n).sample(range(n), n)


ins = [insertion_sort(make(n))[1] for n in sizes]
mer = [merge_sort(make(n))[1] for n in sizes]
ns = np.array(sizes)

plt.figure(figsize=(7, 4))
plt.plot(sizes, ins, "o-", ms=3, label="insertion sort")
plt.plot(sizes, mer, "o-", ms=3, label="merge sort")
plt.plot(ns, ns ** 2 / 4, "--", label="n² / 4")
plt.plot(ns, ns * np.log2(ns), ":", label="n log₂ n")
plt.xlabel("n"); plt.ylabel("comparisons"); plt.legend(); plt.title(f"{order} input")
print(f"n = {sizes[-1]}: insertion {ins[-1]:,} comparisons, merge {mer[-1]:,}")
```

## Observations

1. For which input order is insertion sort faster than merge sort? Why?
2. Your plot shows comparisons, not seconds. What else costs time in a real program?
3. Python's `sorted` uses Timsort. Why does it use insertion sort for short runs?
