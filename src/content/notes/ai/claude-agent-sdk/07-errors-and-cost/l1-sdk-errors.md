---
title: "L1: SDK errors"
order: 1
summary: "The SDK's error classes, where each one is raised, and what each one means. Why CLINotFoundError can name a file that exists, proven with an experiment: a missing shebang interpreter or a missing ELF loader gives the same FileNotFoundError, and __cause__ (errno, filename) shows the truth. ProcessError and the stderr callback, ResultError and terminal_reason, CLIJSONDecodeError and max_buffer_size, AssistantMessage.error, RateLimitEvent, and a retry-fail-report table."
status: not-started
tags: [agent-sdk, errors, cli-not-found, errno, result-error, retries]
---

## 1. The question this idea answers

A chat service works on a laptop. After a deployment to a container platform, every request fails with:

```text
CLINotFoundError: Claude Code not found at: /app/.venv/lib/python3.12/site-packages/claude_agent_sdk/_bundled/claude
```

An engineer opens a shell in the container and runs `ls -l` on that path. The file is there, and it is executable. So what is "not found"?

This lesson answers that question with a reproducible experiment. It then covers every error that the SDK raises or reports, and where in the source it comes from. For each one it says what a service should do: retry, fail, or report.

## 2. Mental model

> [!analogy] A switchboard that says "number not found"
> You ask a switchboard operator to connect you to an office. The connection fails. The operator has only two phrases: "number not found" for one kind of failure and "could not connect" for every other kind. But "number not found" covers several faults. The office may not exist. The office may exist without its internal exchange. Or its wiring may use the wrong standard. The operator staples the technician's ticket to the report. The ticket has the real code.
>
> The SDK is the operator. The error class is the phrase. The chained exception, `__cause__`, is the technician's ticket with the operating system's error number.
>
> **Where it stops working:** a technician's ticket names the faulty part. The operating system's error often names the file that you tried to start, even when the missing part is a different file. You must combine the error number with a check of your own to find the real cause.

## 3. Terms

| Term | Plain meaning |
|---|---|
| `ClaudeSDKError` | The base class of all SDK errors. |
| `CLIConnectionError` | The SDK could not start or talk to the CLI process. |
| `CLINotFoundError` | A subclass of `CLIConnectionError`. The SDK maps every `FileNotFoundError` at process start to it, unless the working directory is missing. |
| `ProcessError` | The CLI process ended with a non-zero exit code. |
| `ResultError` | A subclass of `ProcessError`. The CLI reported an error result, then exited. It carries the result's fields. |
| `CLIJSONDecodeError` | A line on the CLI's stdout was not valid JSON, or was longer than `max_buffer_size`. |
| exception chaining | `raise B from A` stores the original exception `A` in `B.__cause__`. |
| `errno` | The number of an operating system error, for example 2 for ENOENT. |
| ENOENT, ENOEXEC, EACCES | "No such file or directory" (2), "Exec format error" (8), "Permission denied" (13) on Linux. |
| shebang | The first line of a script, such as `#!/usr/bin/python3`. It names the interpreter that runs the script. |
| ELF loader | The program interpreter that a dynamically linked Linux binary needs, for example `/lib64/ld-linux-x86-64.so.2`. |
| `terminal_reason` | A field of the result that names why the loop ended, for example `api_error` or `max_turns`. |
| stderr callback | The `stderr` option: a function that receives each line of the CLI's error output. |
| `max_buffer_size` | The largest stdout line, in bytes, that the SDK accepts. The default is 1,048,576 bytes. |

## 4. Method and math

### 4.1 The hierarchy

From `_errors.py` (SDK 0.2.165, commit b6e9d12):

```text
ClaudeSDKError
├── CLIConnectionError
│   └── CLINotFoundError        message "Claude Code not found", optional cli_path
├── ProcessError                exit_code, stderr
│   └── ResultError             subtype, errors, result, api_error_status, terminal_reason, session_id, data
├── CLIJSONDecodeError          line, original_error
└── MessageParseError           data   (not exported from claude_agent_sdk)
```

`claude_agent_sdk` exports `ClaudeSDKError`, `CLIConnectionError`, `CLINotFoundError`, `ProcessError`, `ResultError` and `CLIJSONDecodeError`. `MessageParseError` is not in the package's exports, so catch it as `ClaudeSDKError`.

### 4.2 Where each error is raised

| Error and message | Source (commit b6e9d12) | When |
|---|---|---|
| `CLINotFoundError("Claude Code not found. Install with: ...")` | `subprocess_cli.py` lines 321 and 332, in `_find_cli` | No bundled binary, nothing on `PATH`, nothing in the fixed folders |
| `CLIConnectionError("Refusing to execute batch script ...")` | `subprocess_cli.py` line 438 | On Windows, the CLI path is a `.bat` or `.cmd` file |
| `CLIConnectionError("Working directory does not exist: ...")` | `subprocess_cli.py` lines 901 to 908 | Process start fails with `FileNotFoundError` and `cwd` is missing |
| `CLINotFoundError("Claude Code not found at: ...")` | `subprocess_cli.py` lines 909 to 911 | Process start fails with `FileNotFoundError` and `cwd` exists |
| `CLIConnectionError("Failed to start Claude Code: ...")` | `subprocess_cli.py` lines 912 to 915 | Process start fails with any other exception |
| `CLIConnectionError("Cannot write to terminated process ...")` and related | `subprocess_cli.py` lines 1068 to 1087 | The SDK writes to stdin after the CLI died |
| `CLIJSONDecodeError` (malformed line) | `subprocess_cli.py` line 220 | A stdout line starts with `{` but is not valid JSON |
| `CLIJSONDecodeError` (buffer) | `subprocess_cli.py` lines 1110 to 1118 | One line is longer than `max_buffer_size` |
| `ProcessError("Command failed with exit code N")` | `subprocess_cli.py` lines 1156 to 1162 | The CLI exits with a non-zero code |
| `ResultError` | `_internal/query.py` line 528 | Replaces that `ProcessError` when an error result came just before the exit |
| `CLIConnectionError("Not connected. Call connect() first.")` | `client.py`, many methods | A `ClaudeSDKClient` method is called before `connect()` |
| `MessageParseError` | `_internal/message_parser.py` | A known message type misses a required field |

This is the code at lines 901 to 915 of `subprocess_cli.py`, word for word:

```python
        except FileNotFoundError as e:
            # Check if the error comes from the working directory or the CLI
            if self._cwd and not Path(self._cwd).exists():
                error = CLIConnectionError(
                    f"Working directory does not exist: {self._cwd}"
                )
                self._exit_error = error
                raise error from e
            error = CLINotFoundError(f"Claude Code not found at: {self._cli_path}")
            self._exit_error = error
            raise error from e
        except Exception as e:
            error = CLIConnectionError(f"Failed to start Claude Code: {e}")
            self._exit_error = error
            raise error from e
```

The rule is simple: the class depends only on the type of the operating system exception, not on its cause.

### 4.3 The experiment: a file that exists, and "not found"

On Linux, starting a program calls `execve`. It returns ENOENT not only when the program file is missing. It also returns ENOENT when the interpreter in a script's shebang line is missing, and when the loader that a dynamic binary requests is missing. Python turns ENOENT into `FileNotFoundError`, and the exception's `filename` is the program you started.

The test files, built in the sandbox:

| File | How it was built |
|---|---|
| `does_not_exist` | Not created |
| `shebang_missing.js` | First line `#!/opt/node99/bin/node`, which does not exist. Execute bit set. |
| `crlf.sh` | First line `#!/bin/sh` followed by `\r\n` (Windows line endings), so the interpreter name is `/bin/sh\r` |
| `missing_loader_bin` | A C program built with `gcc -Wl,--dynamic-linker=/lib/ld-musl-x86_64.so.1`, a loader that is not installed |
| `windows_like.exe` | A few bytes that start with `MZ`, the start of a Windows executable. Execute bit set. |
| `no_exec_bit.sh` | A valid script without the execute bit |

The core of the test, run with Python 3.13 (the same results came from `anyio.open_process`, which the SDK uses):

```python
import errno, os, subprocess

for path in paths:
    try:
        subprocess.Popen([path]).wait()
    except OSError as e:
        print(type(e).__name__, e.errno, errno.errorcode[e.errno], os.path.exists(e.filename))
```

Then each file was passed to the real SDK 0.2.165 as `cli_path`. The real output, with the folder shortened to `/lab`:

| Test file | OS exception, errno | `e.filename` exists? | SDK error |
|---|---|---|---|
| `does_not_exist` | `FileNotFoundError`, 2 ENOENT | no | `CLINotFoundError: Claude Code not found at: /lab/does_not_exist` |
| `shebang_missing.js` | `FileNotFoundError`, 2 ENOENT | **yes** | `CLINotFoundError: Claude Code not found at: /lab/shebang_missing.js` |
| `crlf.sh` | `FileNotFoundError`, 2 ENOENT | **yes** | `CLINotFoundError: Claude Code not found at: /lab/crlf.sh` |
| `missing_loader_bin` | `FileNotFoundError`, 2 ENOENT | **yes** | `CLINotFoundError: Claude Code not found at: /lab/missing_loader_bin` |
| `windows_like.exe` | `OSError`, 8 ENOEXEC | yes | `CLIConnectionError: Failed to start Claude Code: [Errno 8] Exec format error: '/lab/windows_like.exe'` |
| `no_exec_bit.sh` | `PermissionError`, 13 EACCES | yes | `CLIConnectionError: Failed to start Claude Code: [Errno 13] Permission denied: '/lab/no_exec_bit.sh'` |
| missing `cwd` `/srv/no_such_dir` | `FileNotFoundError`, 2 ENOENT, filename is the `cwd` | no | `CLIConnectionError: Working directory does not exist: /srv/no_such_dir` |

Three rows say "not found" for a file that exists. A version check runs first, but `_check_claude_version` catches every exception and ignores it, so it hides nothing and reveals nothing.

> [!key] The class is a category, the cause is the diagnosis
> `CLINotFoundError` means "the operating system said ENOENT when the SDK started the CLI". It does not mean "the CLI is not installed". Always log `__cause__.errno`, `__cause__.filename` and whether that file exists.

Is this realistic for the bundled CLI? In the sandbox, the bundled binary of an installed SDK (0.2.159, CLI 2.1.281) is a dynamically linked ELF file that requests `/lib64/ld-linux-x86-64.so.2` (checked with `readelf -l`). A container image without that loader, for example a musl-based image, would give the `missing_loader_bin` row. This was not tested on such an image.

### 4.4 Reading `__cause__`

| `__cause__` | `os.path.exists(filename)` | Likely cause | Next check |
|---|---|---|---|
| ENOENT, filename is `cli_path` | no | The file is missing or the path is wrong | List the folder. Check `cli_path`. |
| ENOENT, filename is `cli_path` | yes | A missing interpreter or loader | Read the first line of the file. Run `file` and `readelf -l` on it. |
| ENOENT, `os.path.lexists` true but `exists` false | no | A broken symbolic link | `readlink -f` the path |
| ENOEXEC | yes | Wrong format: another CPU type, another OS, or a script without a shebang | `file` on the path |
| EACCES | yes | No execute bit, a directory, or a mount that forbids execution | `ls -l`, mount options |

```python
try:
    async for message in query(prompt=prompt, options=options):
        ...
except CLIConnectionError as e:          # also catches CLINotFoundError
    cause = e.__cause__
    if isinstance(cause, OSError):
        log.error("CLI start failed: %s errno=%s filename=%s exists=%s",
                  type(e).__name__, cause.errno, cause.filename,
                  cause.filename is not None and os.path.exists(cause.filename))
    raise
```

The tests ran on Linux. Windows reports start failures with its own error codes, which were not tested.

### 4.5 ProcessError and the stderr callback

When the CLI exits with a non-zero code and reported no error result, the SDK raises `ProcessError`. A fake CLI (a script that writes one line to stderr and exits with code 3) gave this with SDK 0.2.165:

```text
ProcessError: Command failed with exit code 3 (exit code: 3)
Error output: Check stderr output for details
    exit_code=3 stderr='Check stderr output for details'
```

The `stderr` attribute is a fixed text, not the real output. The real line went to the stderr of the Python process, because the SDK pipes stderr "only when the caller registered a callback" (source comment). With `stderr=lines.append` in the options, the callback received:

```text
['fatal: ANTHROPIC_FOUNDRY_RESOURCE is not set']
```

The `ProcessError.stderr` attribute still held the placeholder. So keep the last lines yourself:

```python
from collections import deque

stderr_tail: deque[str] = deque(maxlen=50)
options = ClaudeAgentOptions(stderr=stderr_tail.append)
# on ProcessError: log "\n".join(stderr_tail) together with exit_code
```

The source also isolates the callback: an exception inside it is logged at debug level and the next lines still arrive.

### 4.6 ResultError and terminal_reason

The CLI ends a failed run with a `result` message that has `is_error: true`, then exits with a non-zero code. Since SDK 0.2.140, the SDK replaces the bare `ProcessError` with `ResultError`. The docstring says that it "carries the result's payload, so callers can branch on *why* the run failed without string matching". The Python reference adds: "check `terminal_reason` before `subtype`".

Two runs with a fake CLI and SDK 0.2.165:

```text
--- an API failure ---
ResultMessage subtype=success is_error=True terminal_reason=api_error api_error_status=529
raised ResultError: Claude Code returned an error result: API Error: 529 Overloaded (exit code: 1)
  subtype=success terminal_reason=api_error api_error_status=529 errors=[] exit_code=1
  isinstance ProcessError: True; __cause__=ProcessError('Command failed with exit code 1 ...')

--- the turn limit ---
ResultMessage subtype=error_max_turns is_error=True terminal_reason=max_turns api_error_status=None
raised ResultError: Claude Code returned an error result: Reached maximum number of turns (1) (exit code: 1)
```

Three facts follow:

1. The `ResultMessage` arrives first, then the exception. Read cost and session id from the message before the exception.
2. On an API failure, `subtype` is `"success"`. Only `terminal_reason` and `is_error` show the failure.
3. `except ProcessError` still catches it, because `ResultError` is a subclass.

### 4.7 CLIJSONDecodeError and max_buffer_size

The SDK reads stdout line by line. A line that starts with `{` but does not parse raises `CLIJSONDecodeError`. Lines that do not start with `{` are skipped and logged at debug level. A line longer than `max_buffer_size` also raises `CLIJSONDecodeError`, even if it is valid JSON. The default is `_DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024`, so 1,048,576 bytes.

A fake CLI wrote one assistant message with a 2,000,000-character text:

```text
raised CLIJSONDecodeError: Failed to decode JSON: JSON message exceeded maximum buffer size of 1048576 bytes...
  original_error=ValueError('Buffer size 1114112 exceeds limit 1048576')
```

The same run with `max_buffer_size=4_000_000` passed. A tool result is one JSON line too. So a data tool that returns a 1.2 MB table breaks the stream, not only the model's context.

### 4.8 Errors inside messages: AssistantMessage.error and RateLimitEvent

Some failures do not raise. They arrive as data.

**`AssistantMessage.error`** has the type `Literal["authentication_failed", "billing_error", "rate_limit", "invalid_request", "server_error", "unknown"]` in `types.py`. The Python reference warns: "The underlying CLI process can emit error types this Literal doesn't list, such as `max_output_tokens`. The SDK passes the value through unmodified, so treat strings outside this list the way you treat `unknown`."

**`RateLimitEvent`** has `rate_limit_info` with `status` (`allowed`, `allowed_warning`, `rejected`), `resets_at` (a Unix time), `rate_limit_type` (`five_hour`, `seven_day`, `seven_day_opus`, `seven_day_sonnet`, `overage`), `utilization` (0.0 to 1.0) and `raw`. A fake CLI frame gave:

```text
RateLimitEvent status=allowed_warning type=five_hour utilization=0.91 resets_at=1792000000
```

The type names describe subscription windows. Whether a deployment on Microsoft Foundry emits these events is not confirmed.

### 4.9 A handling strategy

The CLI already retries failed API requests. The env-vars page says that `CLAUDE_CODE_MAX_RETRIES` overrides "the number of times to retry failed API requests (default: 10)" (checked on 2026-10-13). So an `api_error` result means that 10 retries already failed. One more immediate retry in your code rarely helps.

| Signal | Typical cause | Retry? | Action |
|---|---|---|---|
| `CLINotFoundError` | Missing file, interpreter or loader | No | Fail the health check at startup. Log `__cause__`. |
| `CLIConnectionError`, "Working directory does not exist" | Wrong `cwd` | No | Fix the configuration. |
| `CLIConnectionError`, "Failed to start", EACCES or ENOEXEC | Permissions or wrong binary | No | Fail at startup. |
| `ProcessError` without a result | CLI crash or a configuration error | Once, if the stderr tail looks transient | Report with the stderr tail. |
| `ResultError`, `terminal_reason == "api_error"`, status 429, 500 or 529 | Provider overload or outage after the CLI's retries | Later, with a delay | Tell the user to try again. Resume the session, which keeps the work so far. |
| `ResultError`, `error_max_turns` or `error_max_budget_usd` | Your limit | No automatic retry | Report. Resume with a higher limit only on a rule that you chose. |
| `ResultError`, `error_during_execution` | Interrupted or crashed run | No | Report. Cost fields can be zero after a crash. |
| `CLIJSONDecodeError`, buffer | One huge message | No | Make tool results smaller, or raise `max_buffer_size`. |
| `CLIJSONDecodeError`, malformed | CLI and SDK versions do not match | No | Report. Pin matching versions. |
| `AssistantMessage.error` is `authentication_failed` or `billing_error` | Credentials or account | No | Alert operations. |
| `RateLimitEvent` with `rejected` | A limit window is full | After `resets_at` | Pause new work until then. |

> [!trap] A retry with a new session repeats the work
> After an `api_error`, a retry that starts a new session runs every tool call again. A retry that resumes the session id from the `ResultMessage` continues from the saved work ([Sessions L2](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork)).

### 4.10 Production view

| Concern | What to do |
|---|---|
| Startup | Run one short `query()` at deployment time. Fail the deployment on any `CLIConnectionError`. |
| Observability | Log the class, `__cause__.errno`, `__cause__.filename`, `exit_code`, `terminal_reason`, `api_error_status` and the stderr tail. Never log only `str(e)`. |
| Reliability | Retry only API errors, only with a delay, and resume the session. |
| Limits | Treat `error_max_turns` and `error_max_budget_usd` as results, not crashes. |
| Logging setup | For errors other than `ResultError`, the SDK logs "Fatal error in message reader: ..." at error level through Python logging (logger `claude_agent_sdk._internal.query`). Route that logger to your log system. |

## 5. Code

These exercises go in `claude-agent-sdk/15-errors.ipynb`. Exercises 1.1 to 1.3 need no API key.

**Exercise 1.1: extend the experiment.** Rebuild the test files of section 4.3. Then add two new cases: a directory passed as `cli_path`, and a symbolic link to a missing file. Write your predictions for both before you run them.

Acceptance tests:

- Your results for the six original files match the table of section 4.3.
- For each new case, you record the OS exception, errno, `os.path.exists`, `os.path.lexists` and the SDK error class, and you compare them with your predictions.

**Exercise 1.2: a diagnosis function.** Write `diagnose_start_error(exc) -> str`. It reads `exc.__cause__` and returns one sentence that names the likely cause, by the table of section 4.4.

Acceptance tests:

- Each of the eight cases from exercise 1.1 gives a different, correct sentence.
- An exception with no `__cause__` gives "no operating system error attached".

**Exercise 1.3: a fake CLI.** Write a small script that acts as a CLI: it answers the `initialize` control request, reads one user message, writes a `result` line with `is_error: true`, then exits with code 1 when stdin closes. Pass it as `cli_path`.

Acceptance tests:

- `query()` yields a `ResultMessage` with your `terminal_reason`, then raises `ResultError`.
- `e.__cause__` is a `ProcessError` with `exit_code == 1`.
- In a second mode the script writes a line to stderr and exits with code 3. Your `stderr` callback receives the line, and `ProcessError.stderr` still holds the placeholder.

**Exercise 1.4: classify.** Write `classify(signal) -> Literal["retry_later", "fail", "report"]` for the rows of section 4.9, where `signal` is an exception or a message object.

Acceptance test: a table-driven test with one case per row passes.

## 6. Common mistakes

1. **"CLINotFoundError means the CLI is not installed."** It means ENOENT at start. A missing interpreter or loader gives the same error.
2. **Logging only `str(e)`.** The useful facts are in `__cause__`: errno and filename.
3. **Reading `ProcessError.stderr`.** It holds a fixed placeholder. Collect the lines with the `stderr` callback.
4. **Checking only `subtype == "success"`.** An API failure reports `success` with `terminal_reason == "api_error"`.
5. **Retrying at once, in a new session.** The CLI already retried 10 times. Wait, then resume.
6. **Returning a 2 MB tool result.** It can break the stdout stream with `CLIJSONDecodeError`, before the model even sees it.

## 7. One-minute explanation

All SDK errors derive from `ClaudeSDKError`. `CLIConnectionError` covers failures to start or talk to the CLI. Its subclass `CLINotFoundError` is raised for any `FileNotFoundError` at start when the working directory exists. On Linux that error also appears when the file exists but its shebang interpreter or its ELF loader is missing. So the class name can mislead. The chained exception in `__cause__` holds the real errno and filename, and a check whether that file exists tells the cases apart. `ProcessError` means a non-zero exit, and its `stderr` attribute is only a placeholder, so collect the real lines with the `stderr` callback. `ResultError`, a subclass of `ProcessError`, carries the error result's fields: check `terminal_reason` first, because an API failure reports subtype `success`. `CLIJSONDecodeError` means a bad line or a line above `max_buffer_size`, 1 MB by default. Retry only API errors, after a delay, and resume the session instead of starting a new one.

## 8. Check questions

```check
{
  "question": "A service raises CLINotFoundError for /app/bin/claude. In a shell, ls -l shows the file with its execute bit. Name two causes that fit, and the two attributes you log to tell them apart.",
  "hint": "Which other files does execve need?",
  "answer": "The file's shebang interpreter is missing, or the ELF loader that the binary requests is missing (for example on an image without that C library). Both give ENOENT. Log e.__cause__.errno and e.__cause__.filename, and whether that file exists: errno 2 with an existing file points to the interpreter or loader. Then read the first line of the file, or run file and readelf -l on it."
}
```

```check
{
  "question": "Which SDK error do you get when cli_path names a file without the execute bit, and why not CLINotFoundError?",
  "answer": "CLIConnectionError with the message Failed to start Claude Code: [Errno 13] Permission denied. The operating system raises PermissionError, not FileNotFoundError, and the SDK maps only FileNotFoundError to CLINotFoundError. Every other exception becomes CLIConnectionError."
}
```

```check
{
  "question": "Your code catches ProcessError and logs e.stderr, which always says \"Check stderr output for details\". How do you get the real error text?",
  "answer": "Pass a stderr callback in ClaudeAgentOptions, for example a deque append, and log the collected lines with the exception. The SDK pipes stderr only when the callback is set, and it never copies the lines into ProcessError.stderr."
}
```

```check
{
  "question": "A run raises ResultError with subtype \"success\". Is that a contradiction? What do you check, and what do you do?",
  "answer": "No. When the final API request fails, Claude Code reports subtype success with the cause in terminal_reason, for example api_error, and api_error_status holds the HTTP status. Check terminal_reason first. For api_error with 429, 500 or 529, the CLI has already retried, so wait and then resume the same session, or tell the user to try again."
}
```

## 9. Links

- Previous in the priority path: [Context window L2: Compaction controls](/notes/ai/claude-agent-sdk/06-context-window/l2-compaction-controls)
- Next: [L2: Cost and usage fields](/notes/ai/claude-agent-sdk/07-errors-and-cost/l2-cost-and-usage-fields)
- How the SDK starts the CLI: [Foundations L1: What the SDK is](/notes/ai/claude-agent-sdk/01-foundations/l1-what-the-sdk-is)
- Result subtypes: [Foundations L2: The agent loop](/notes/ai/claude-agent-sdk/01-foundations/l2-the-agent-loop)
- Resume after a failure: [Sessions L2: resume, continue and fork](/notes/ai/claude-agent-sdk/04-sessions/l2-resume-continue-fork)
- [Glossary](/notes/ai/claude-agent-sdk/glossary)
