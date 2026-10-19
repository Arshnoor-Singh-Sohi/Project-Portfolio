---
title: "M1 Python foundations"
order: 1
summary: "Values, functions, data structures, classes, errors, files, types, packages and tests: the Python base under every AI service."
---

This module teaches Python from zero. AI code is mostly glue code: it reads config, builds requests, walks nested JSON replies, calls tools and handles errors. Each lesson uses examples from that work, such as token counts, model replies and tool arguments. Concurrency (threads, generators and `asyncio`) comes in [module M2](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m02-concurrency-foundations).

**Outcome:** you can write a small Python application split across several files, with type annotations, tests and locked dependencies. Module M2 adds the last part of the roadmap outcome: many external API calls at the same time.

**Before this module:** nothing. This is the start of the path. Read the [L0 roadmap](/notes/ai/ai-engineering/01-software-engineering-fundamentals/roadmap) first for the order of all modules.

| Code | Lesson | Core idea | Exercise runs in | Status |
|---|---|---|---|---|
| 1.1 | [Values, names and types](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l1-values-names-and-types) | Every value is an object with a type. A name is a label on one object. | Browser lab | not started |
| 1.2 | [Control flow and functions](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l2-control-flow-and-functions) | `if`, `for`, `while`, retry loops, parameters, defaults, keyword-only options. | Browser lab | not started |
| 1.3 | [Lists, tuples, sets, dicts and comprehensions](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l3-core-data-structures) | Pick the right container. Walk a nested model reply by type, not by index. | Browser lab | not started |
| 1.4 | [Mutability, references and scope](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l4-mutability-references-and-scope) | Shared lists, shared defaults and shallow copies leak data. LEGB scope. | Browser lab | not started |
| 1.5 | [Classes, objects and dataclasses](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l5-classes-and-dataclasses) | `self`, bound methods, dunder methods, dataclasses, composition over inheritance. | Browser lab | not started |
| 1.6 | [Exceptions and context managers](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l6-exceptions-and-context-managers) | `try`/`except`/`finally`, the exception tree, `raise ... from`, `with` and clean-up. | Browser lab | not started |
| 1.7 | [Files, paths, environment variables and JSON](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l7-files-paths-env-and-json) | `pathlib`, encodings, config from the environment, JSON and CSV. | Browser lab | not started |
| 1.8 | [Type annotations, typed models and Pydantic](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l8-type-annotations-and-pydantic) | Annotations for checkers, `Callable` and iterator types, Pydantic validation at run time. | Browser lab | not started |
| 1.9 | [Modules, packages and uv projects](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l9-modules-packages-and-uv) | Imports, packages, the `src/` layout, `pyproject.toml`, lock files, `uv`. | Local practice project | not started |
| 1.10 | [Tests, logging and debugging](/notes/ai/ai-engineering/01-software-engineering-fundamentals/m01-python-foundations/l10-tests-and-debugging) | pytest, reading tracebacks, log lines, `breakpoint()`, checking code that an agent wrote. | Local practice project | not started |

## How to study this module

1. Read one lesson. Answer its check questions before you reveal the answers.
2. Do the exercises yourself. A browser lab runs Python 3.14 in the page. Lessons 1.9 and 1.10 need a real project on your computer, because they use `uv` and `pytest` from a terminal.
3. Explain the lesson back in your own words, with the one-minute explanation as a guide.

## Related subject

The [Python for AI Services](/notes/software-engineering/python) subject goes deeper into `uv`, `pytest` fixtures and `asyncio` for agent services. Module M1 is the beginner path to it.
