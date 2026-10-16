---
title: "L7: JSON Schema for tool arguments"
order: 7
summary: "JSON from zero, then every JSON Schema 2020-12 keyword a tool needs, each with a valid and an invalid instance and the measured validator message. MCP's rules for inputSchema and outputSchema in 2025-11-25 and 2026-07-28, the $ref rules, provider strict modes, schemas generated from Python types and Pydantic, validation with jsonschema, and a bad and a good search_orders schema."
status: not-started
tags: [mcp, json-schema, tools, inputschema, pydantic, validation, strict-mode]
---

## 1. The question this idea answers

The model never sees the code of a tool. It sees the tool's `name`, its `description` and its `inputSchema`. From that JSON alone it must decide which arguments to write ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)). The server, the host and sometimes the model provider then check those arguments against the same schema. So the schema is a contract between four parties, and every keyword in it has an exact meaning.

The friend's interviewer "kept digging into the specifics of the arguments you pass when building MCP in its JSON schema". Expect questions like these. What is the difference between `required` and a property with a `default`? What does `additionalProperties: false` do inside an `allOf`? Is `3.0` an integer? Is `format: "date"` checked? What exactly did revision 2026-07-28 change for `inputSchema`? How does the Python SDK turn a type hint into a schema, and does it validate the same way as a JSON Schema validator?

This lesson answers them from first principles. Every validator message in it was measured with the Python library `jsonschema` 4.26, and every MCP example was checked against the official MCP `schema.json`.

## 2. Mental model

> [!analogy] A building inspector's checklist
> A schema is a checklist, and an instance is a building. Each line of the checklist is one keyword: "has a fire exit", "ceiling at least 2.4 m", "no more than 3 floors". The inspector checks every line on its own, and the building passes only if every line passes. Some lines are not checks at all. "Architect: R. Patel" or "Suggested paint: white" are notes for the reader. In JSON Schema these are **annotations**: `title`, `description`, `default`, `examples`.
>
> A line the inspector does not know, such as "x-mcp-header: Region", is skipped. Lines can refer to a shared appendix (`$ref` to `$defs`). Lines can combine other checklists: "pass all of these" (`allOf`), "pass at least one" (`anyOf`), "pass exactly one" (`oneOf`), "if it is a hospital, then it also needs a helipad" (`if`/`then`).
>
> **Where it stops working:** an inspector checks the form, not the truth. A valid date can be the wrong date, and a valid customer ID can belong to another customer. And the model is not an inspector. It reads the checklist as text and writes a building that usually fits. Only constrained decoding or a validator makes the fit certain.

## 3. Terms

| Term | Plain meaning |
|---|---|
| JSON | A text format for data with six value types: object, array, string, number, boolean and null (RFC 8259). |
| JSON Schema | A JSON document that describes which JSON values are allowed. |
| instance | The JSON value that is checked, for example the `arguments` of a tool call. |
| keyword | One property of a schema, such as `type` or `maximum`. Each keyword checks one thing or adds one note. |
| assertion | A keyword that can make an instance invalid, such as `required` or `pattern`. |
| annotation | A keyword that only describes, such as `description`, `title`, `default` or `examples`. |
| dialect | A version of JSON Schema, named by a URI in `$schema`. MCP's default dialect is 2020-12. |
| meta-schema | The schema that every schema of a dialect must match. |
| validator | A program that checks an instance against a schema and reports errors. |
| `$defs` | A place inside a schema for named subschemas that other parts reuse. |
| `$ref` | A keyword that applies another schema, found by a URI such as `#/$defs/money`. |
| JSON Pointer | A path into a JSON document, such as `/$defs/money` (RFC 6901). |
| applicator | A keyword that applies subschemas: `properties`, `items`, `allOf`, `anyOf`, `oneOf`, `not`, `if`. |
| closed object | An object schema with `additionalProperties: false`. Unknown keys are invalid. |
| strict mode | A model provider setting that forces tool arguments to match a schema through constrained decoding. It supports only part of JSON Schema. |
| lax coercion | Pydantic's default behavior of converting input, for example the string `"7"` to the integer 7. |
| format checker | A validator option that makes `format` an assertion. Without it, `format` is only an annotation. |

All terms are also in the [Glossary](/notes/ai/llm-systems/glossary).

## 4. JSON from zero

### 4.1 Six types

JSON (RFC 8259) has exactly six kinds of values:

| JSON type | Example | Python after `json.loads` |
|---|---|---|
| object | `{"customer_id": "CUS-0042", "limit": 20}` | `dict` |
| array | `["pending", "shipped"]` | `list` |
| string | `"2026-10-15"` | `str` |
| number | `20`, `-3.5`, `1e3` | `int` or `float` |
| boolean | `true`, `false` | `bool` |
| null | `null` | `None` |

There is no date type, no integer type and no enum type in JSON. A date is a string. An integer is a number. JSON has no `NaN` and no infinity. An object is a set of name and value pairs, and RFC 8259 says that the names SHOULD be unique.

JSON Schema adds one type name on top: `"integer"`. The 2020-12 validation spec (section 6.1.1) defines it as "any number with a zero fractional part". So `3.0` is an integer, `3.5` is not, and the string `"3"` is not. A boolean is not a number in JSON, so `true` is not an integer either.

> [!example] Worked example: which values are integers?
> Schema `{"type": "integer"}`, measured with `jsonschema`:
>
> | Instance | Result | Reason |
> |---|---|---|
> | `3` | valid | a number with no fraction |
> | `3.0` | valid | the fractional part is zero |
> | `3.5` | invalid: `3.5 is not of type 'integer'` | fraction 0.5 |
> | `"3"` | invalid: `'3' is not of type 'integer'` | a string |
> | `true` | invalid: `True is not of type 'integer'` | a boolean |

### 4.2 Large numbers

JSON itself does not limit the size of a number, but many parsers store numbers as IEEE 754 doubles. A double holds every integer exactly only up to $2^{53} - 1 = 9{,}007{,}199{,}254{,}740{,}991$. Above that, two different IDs can become the same number. So send large IDs as strings. MCP uses this limit for `x-mcp-header` values ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)).

## 5. What JSON Schema is

### 5.1 Schema, instance, keyword

A **schema** is a JSON object (or the booleans `true` and `false`). Each property of the object is a **keyword**. A validator applies every keyword to the instance on its own and joins the results. The instance is valid only if no assertion fails. The validator ignores keywords that it does not know. In these notes, a property with `"x-mcp-header": "Region"` validated exactly like the same property without it.

Two boolean schemas exist. `true` accepts every instance, like `{}`. `false` rejects every instance. `"items": false` uses this to forbid extra array items.

### 5.2 Dialects and `$schema`

JSON Schema has versions, called **dialects**, for example draft-04, draft-07, 2019-09 and 2020-12. A schema names its dialect in `$schema`. The 2020-12 meta-schema URI is `https://json-schema.org/draft/2020-12/schema`.

MCP's rules (2025-11-25 and 2026-07-28, identical text, checked on 2026-10-15):

1. A schema without `$schema` uses JSON Schema 2020-12.
2. A schema **MAY** name another dialect in `$schema`. The spec's example uses `http://json-schema.org/draft-07/schema#`.
3. Implementations **MUST** support at least 2020-12 and **SHOULD** document which other dialects they support.
4. They **MUST** validate schemas by their declared or default dialect and **MUST** handle an unsupported dialect "gracefully by returning an appropriate error".

Revision 2025-11-25 introduced the default (SEP-1613: "Establish JSON Schema 2020-12 as the default dialect"). Revision 2025-06-18 named no default for tool schemas, and its own `schema.json` used draft-07.

The dialect changes the meaning of some keywords. These differences appear in real tool schemas:

| Topic | draft-07 | 2020-12 |
|---|---|---|
| Reusable subschemas | `definitions` | `$defs` |
| Tuple arrays | `items` as an array of schemas | `prefixItems`, and `items` for the rest |
| Dependencies | `dependencies` | `dependentRequired` and `dependentSchemas` |
| Keywords next to `$ref` | ignored | applied |
| Closing objects across `allOf` | not possible | `unevaluatedProperties` |

The `$ref` row is measured. The schema `{"$defs": {"s": {"type": "string"}}, "$ref": "#/$defs/s", "maxLength": 3}` rejects `"abcd"` in 2020-12. The draft-07 schema `{"$schema": "http://json-schema.org/draft-07/schema#", "definitions": {"s": {"type": "string"}}, "$ref": "#/definitions/s", "maxLength": 3}` accepts `"abcd"`, because draft-07 ignores `maxLength` next to `$ref`.

## 6. The keyword reference

Each table row shows a small schema, one valid instance, one invalid instance and the first error message of `jsonschema` 4.26 for the invalid one.

> [!key] Three facts that answer half of all schema questions
> 1. Properties are optional unless they are listed in `required`.
> 2. Extra properties are allowed unless `additionalProperties` (or `unevaluatedProperties`) is `false`.
> 3. Annotations (`title`, `description`, `default`, `examples`) never make an instance invalid, and `format` is an annotation unless a format checker is enabled.

### 6.1 `type`

| Keyword | Schema | Valid | Invalid | Measured message for the invalid instance |
|---|---|---|---|---|
| `type` | `{"type": "string"}` | `"CUS-0042"` | `42` | `42 is not of type 'string'` |
| `type` integer | `{"type": "integer"}` | `3.0` | `"3"` | `'3' is not of type 'integer'` |
| `type` integer | `{"type": "integer"}` | `3` | `true` | `True is not of type 'integer'` |
| `type` list | `{"type": ["string", "null"]}` | `null` | `0` | `0 is not of type 'string', 'null'` |

`type` takes one name or a list of names. A list means "any of these". `["string", "null"]` is the usual way to write a nullable field, and OpenAI's strict mode uses it for optional fields (section 9).

### 6.2 Object keywords

| Keyword | Schema | Valid | Invalid | Measured message for the invalid instance |
|---|---|---|---|---|
| `required` | `{"type": "object", "properties": {"q": {"type": "string"}}, "required": ["q"]}` | `{"q": "x"}` | `{}` | `'q' is a required property` |
| `properties` | `{"type": "object", "properties": {"q": {"type": "string"}}}` | `{"q": "x", "extra": 1}` | `{"q": 1}` | `1 is not of type 'string'` |
| `additionalProperties: false` | `{"type": "object", "properties": {"q": {"type": "string"}}, "additionalProperties": false}` | `{"q": "x"}` | `{"q": "x", "limt": 5}` | `Additional properties are not allowed ('limt' was unexpected)` |
| `additionalProperties` schema | `{"type": "object", "additionalProperties": {"type": "integer"}}` | `{"a": 1}` | `{"a": "1"}` | `'1' is not of type 'integer'` |
| `dependentRequired` | `{"type": "object", "dependentRequired": {"start": ["end"]}}` | `{"start": "a", "end": "b"}` | `{"start": "a"}` | `'end' is a dependency of 'start'` |
| `minProperties` | `{"type": "object", "minProperties": 1}` | `{"a": 1}` | `{}` | `{} should be non-empty` |

The meaning of each:

1. `properties` maps a key name to the schema for its value. It checks only keys that are present. The `properties` row shows that an extra key `extra` is valid, because nothing forbids it.
2. `required` lists the keys that must be present. It says nothing about their values.
3. `additionalProperties` applies to every key that is not named in `properties` and does not match `patternProperties`. `false` forbids such keys. A schema checks their values.
4. `patternProperties` maps a regular expression on key names to a schema, for example `{"^x-": {"type": "string"}}`. `propertyNames` checks the key names themselves.
5. `minProperties` and `maxProperties` count keys. `dependentRequired` says "if key A is present, keys B and C must be present too".

> [!trap] Optional is not the same as nullable
> A key that is not in `required` may be absent. A key with `"type": ["string", "null"]` may be `null`. These are two different things. `{}` and `{"status": null}` are different instances, and a schema can accept one and reject the other.

### 6.3 Annotations: `title`, `description`, `default`, `examples`

| Keyword | Meaning | Checked? |
|---|---|---|
| `title` | A short name for a schema or a property. Pydantic adds one to every property. | no |
| `description` | A longer explanation. For tools, the reader is the model. | no |
| `default` | A value to use when the key is absent. | no |
| `examples` | An array of sample values. The 2020-12 spec says they are RECOMMENDED to be valid. | no |
| `deprecated` | A boolean that marks a property as discouraged. | no |
| `readOnly`, `writeOnly` | Hints for APIs. They have no use in tool arguments. | no |

Understanding JSON Schema says that `default` "is not used to fill in missing values during the validation process." So if the model omits `limit`, the server receives no `limit`, and the server code must apply 20.

### 6.4 Values and numbers: `enum`, `const`, `minimum`, `maximum`, `exclusiveMinimum`, `multipleOf`

| Keyword | Schema | Valid | Invalid | Measured message for the invalid instance |
|---|---|---|---|---|
| `enum` | `{"enum": ["pending", "shipped", null]}` | `null` | `"Shipped"` | `'Shipped' is not one of ['pending', 'shipped', None]` |
| `const` | `{"const": "v2"}` | `"v2"` | `"v1"` | `'v2' was expected` |
| `minimum` | `{"type": "integer", "minimum": 1, "maximum": 50}` | `1` | `0` | `0 is less than the minimum of 1` |
| `maximum` | `{"type": "integer", "minimum": 1, "maximum": 50}` | `50` | `51` | `51 is greater than the maximum of 50` |
| `exclusiveMinimum` | `{"type": "number", "exclusiveMinimum": 0}` | `0.01` | `0` | `0 is less than or equal to the minimum of 0` |
| `multipleOf` | `{"type": "integer", "multipleOf": 5}` | `15` | `12` | `12 is not a multiple of 5` |

1. `enum` lists every allowed value. The comparison is exact JSON equality, so `"Shipped"` is not `"shipped"`. If a field may be `null`, its `enum` must also list `null`, because `enum` checks every value.
2. `const` allows exactly one value. The spec calls it "functionally equivalent to an \"enum\" with a single value".
3. `minimum` and `maximum` are inclusive. `exclusiveMinimum` and `exclusiveMaximum` are strict, and in 2020-12 their value is a number. In draft-04 they were booleans.
4. `multipleOf` must be greater than 0.

> [!trap] `multipleOf` with decimals is a floating-point trap
> Many people write money as `{"type": "number", "multipleOf": 0.01}`. Measured with `jsonschema` 4.26: `19.99 is not a multiple of 0.01`, and `0.07 is not a multiple of 0.01`. The value 19.99 cannot be stored exactly in binary floating point, so the division 19.99 / 0.01 does not give a whole number. Use an integer of cents instead: `"total_cents": {"type": "integer", "minimum": 0}`, with the unit in the description.

### 6.5 Strings: `minLength`, `maxLength`, `pattern`, `format`

| Keyword | Schema | Valid | Invalid | Measured message for the invalid instance |
|---|---|---|---|---|
| `minLength` | `{"type": "string", "minLength": 2, "maxLength": 5}` | `"ab"` | `"a"` | `'a' is too short` |
| `maxLength` | `{"type": "string", "minLength": 2, "maxLength": 5}` | `"abcde"` | `"abcdef"` | `'abcdef' is too long` |
| `pattern` (not anchored) | `{"type": "string", "pattern": "ORD-[0-9]{4}"}` | `"xxORD-1001yy"` | `"ord-1001"` | `'ord-1001' does not match 'ORD-[0-9]{4}'` |
| `pattern` (anchored) | `{"type": "string", "pattern": "^ORD-[0-9]{4}$"}` | `"ORD-1001"` | `"xxORD-1001yy"` | `'xxORD-1001yy' does not match '^ORD-[0-9]{4}$'` |
| `format` with a format checker | `{"type": "string", "format": "date"}` | `"2026-10-15"` | `"2026-02-30"` | `'2026-02-30' is not a 'date'` |

1. `minLength` and `maxLength` count characters "as defined by RFC 8259". Measured: `jsonschema` counts Unicode code points, so two emoji have length 2, and `"é"` (one code point) fails `minLength: 2`.
2. `pattern` is a regular expression in the ECMA-262 dialect, and it is **not anchored**: the spec says that "regular expressions are not implicitly anchored". The first `pattern` row shows that `"xxORD-1001yy"` matches `ORD-[0-9]{4}`. Write `^...$` to match the whole string.
3. `format` names a known string format: `date`, `date-time`, `time`, `duration`, `email`, `uri`, `uuid`, `ipv4`, `ipv6`, `hostname` and others. In 2020-12, the format-annotation vocabulary is the default, and its assertion behavior "MUST be disabled by default". Measured: without a format checker, `jsonschema` accepted `"next tuesday"` and `"2026-02-30"` for `"format": "date"`. With `FormatChecker()`, it rejected both.

> [!trap] `format: "date"` alone does not stop bad dates
> If you need a date, write `"type": "string", "format": "date"`, add `"pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"`, say "ISO 8601 date YYYY-MM-DD" in the description, and enable a format checker in your validator. The pattern catches "last week" in every validator. The format checker also catches February 30.

### 6.6 Arrays: `items`, `prefixItems`, `minItems`, `maxItems`, `uniqueItems`, `contains`

| Keyword | Schema | Valid | Invalid | Measured message for the invalid instance |
|---|---|---|---|---|
| `items` | `{"type": "array", "items": {"type": "string"}}` | `["a", "b"]` | `["a", 1]` | `1 is not of type 'string'` |
| `minItems` | `{"type": "array", "minItems": 1}` | `["a"]` | `[]` | `[] should be non-empty` |
| `maxItems` | `{"type": "array", "maxItems": 3}` | `["a", "b", "c"]` | `["a", "b", "c", "d"]` | `['a', 'b', 'c', 'd'] is too long` |
| `uniqueItems` | `{"type": "array", "uniqueItems": true}` | `["a", "b"]` | `["a", "a"]` | `['a', 'a'] has non-unique elements` |
| `prefixItems` + `items: false` | `{"type": "array", "prefixItems": [{"type": "number"}, {"type": "number"}], "items": false}` | `[1, 2]` | `[1, 2, 3]` | `Expected at most 2 items but found 1 extra: 3` |
| `contains` | `{"type": "array", "contains": {"const": "admin"}}` | `["x", "admin"]` | `["x"]` | `['x'] does not contain items matching the given schema` |

`items` applies one schema to every element. In 2020-12, `prefixItems` checks the first elements by position, and `items` then checks only the elements after them. `contains` needs at least one matching element, and `minContains` and `maxContains` change that count.

### 6.7 Nested objects

A property can itself be an object schema with its own `properties`, `required` and `additionalProperties`. Each object level is closed or open on its own. A root with `additionalProperties: false` does not close a nested object. The `$defs` example of section 6.8 closes both levels.

### 6.8 `$defs` and `$ref`

`$defs` stores named subschemas. `$ref` applies one of them. The reference `#/$defs/money` is a URI fragment that holds a JSON Pointer. Start at the root of this document (`#`), go into the key `$defs`, then into the key `money`. In a pointer, `~1` replaces a `/` and `~0` replaces a `~` inside a key name (RFC 6901).

```json
{
  "type": "object",
  "$defs": {
    "money": {
      "type": "object",
      "properties": {"amount_cents": {"type": "integer", "minimum": 0}, "currency": {"enum": ["USD", "CAD"]}},
      "required": ["amount_cents", "currency"],
      "additionalProperties": false
    }
  },
  "properties": {"min_total": {"$ref": "#/$defs/money"}, "max_total": {"$ref": "#/$defs/money"}},
  "additionalProperties": false
}
```

The instance `{"max_total": {"amount_cents": -5, "currency": "EUR"}}` gives two errors, measured: `-5 is less than the minimum of 0; 'EUR' is not one of ['USD', 'CAD']`. One definition checks two properties. A `$ref` may also refer to its own parent, which makes a recursive schema, for example a tree of categories.

MCP adds rules for `$ref` in 2026-07-28 (basic overview, "`$ref` Resolution"):

1. "Implementations **MUST NOT** automatically dereference `$ref` values that resolve to a network URI."
2. An opt-in mode that fetches non-local references **MAY** exist. It "**MUST** be disabled by default" and "**SHOULD** enforce an allowlist of hosts or at minimum reject loopback, link-local, and private network addresses, apply timeouts and size limits, and log dereferenced URIs."
3. "Schemas that fail to validate due to an unresolved external `$ref` **SHOULD** be rejected rather than silently treated as permissive."

The reason is security. The server writes the schema, and the client validates with it. A `$ref` to `http://169.254.169.254/...` would make the client fetch an internal URL for the server. That is server-side request forgery ([L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security)). Keep every `$ref` local, in `#/$defs/...`.

### 6.9 Composition: `allOf`, `anyOf`, `oneOf`, `not`

| Keyword | Schema | Valid | Invalid | Measured message for the invalid instance |
|---|---|---|---|---|
| `anyOf` | `{"anyOf": [{"type": "string"}, {"type": "integer"}]}` | `3` | `2.5` | `2.5 is not valid under any of the given schemas` |
| `not` | `{"not": {"const": "admin"}}` | `"user"` | `"admin"` | `'admin' should not be valid under {'const': 'admin'}` |
| `allOf` | `{"allOf": [{"type": "integer"}, {"minimum": 0}]}` | `4` | `-1` | `-1 is less than the minimum of 0` |

The 2020-12 core spec defines them exactly. `allOf`: valid if valid against all subschemas. `anyOf`: valid against "at least one". `oneOf`: valid against "exactly one". `not`: valid if the instance "fails to validate successfully against the schema".

`oneOf` fails in two ways: when no branch matches, and when two or more branches match. This schema wants an order ID or a customer ID:

```json
{
  "type": "object",
  "oneOf": [
    {"properties": {"order_id": {"type": "string"}}, "required": ["order_id"]},
    {"properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]}
  ]
}
```

Measured: `{"order_id": "ORD-1001"}` and `{"customer_id": "CUS-0042"}` are valid. `{}` is invalid ("not valid under any of the given schemas"). `{"order_id": "ORD-1001", "customer_id": "CUS-0042"}` is also invalid: `{'order_id': 'ORD-1001', 'customer_id': 'CUS-0042'} is valid under each of ...`. If the branches overlap by mistake, `oneOf` rejects inputs that look correct, and its message is hard for a model to act on.

> [!trap] `additionalProperties: false` cannot see into `allOf`
> This schema combines a paging part and a query part:
>
> ```json
> {
>   "type": "object",
>   "allOf": [
>     {"properties": {"limit": {"type": "integer"}}},
>     {"properties": {"query": {"type": "string"}}, "additionalProperties": false}
>   ]
> }
> ```
>
> The call `{"query": "x", "limit": 5}` fails with `Additional properties are not allowed ('limit' was unexpected)` (measured). `additionalProperties` sees only the `properties` of its own schema object. `limit` is declared in the other branch, so it counts as extra. In 2020-12 the fix is `"unevaluatedProperties": false` at the root, without `additionalProperties`. It counts every property that any subschema evaluated. With that change, `{"query": "x", "limit": 5}` is valid and a typo still fails: `Unevaluated properties are not allowed ('lmit' was unexpected)`.

### 6.10 Conditions: `if`, `then`, `else`

`if` holds a schema whose result is not an error by itself. If the instance matches `if`, it must also match `then`. If it does not match, it must match `else`. The core spec adds: "when \"if\" is not present, both \"then\" and \"else\" MUST be entirely ignored."

A search tool with two modes: a date range, or the last N days:

```json
{
  "type": "object",
  "properties": {
    "mode": {"enum": ["range", "recent"]},
    "start": {"type": "string", "format": "date"},
    "end": {"type": "string", "format": "date"},
    "days": {"type": "integer", "minimum": 1}
  },
  "required": ["mode"],
  "if": {"properties": {"mode": {"const": "range"}}},
  "then": {"required": ["start", "end"]},
  "else": {"required": ["days"]},
  "additionalProperties": false
}
```

| Arguments | Measured result |
|---|---|
| `{"mode": "range", "start": "2026-10-01", "end": "2026-10-15"}` | valid |
| `{"mode": "range", "days": 7}` | invalid: 'start' is a required property and 'end' is a required property |
| `{"mode": "recent", "days": 7}` | valid |
| `{"mode": "recent"}` | invalid: 'days' is a required property |

Note the `if` schema has no `required`. An `if` with only `properties` also matches an object that has no `mode` key at all. Here `mode` is required at the root, so that case cannot happen.

### 6.11 The keyword sheet

| Keyword | Applies to | One-line rule |
|---|---|---|
| `type` | all | Name or list of names from object, array, string, number, integer, boolean, null. |
| `enum`, `const` | all | The value equals one listed value, or the one value. |
| `properties` | object | Checks the value of each named key that is present. |
| `required` | object | Named keys must be present. |
| `additionalProperties` | object | Rule for keys not named in `properties` or `patternProperties`. |
| `unevaluatedProperties` | object | Rule for keys that no subschema evaluated, including `allOf` and `$ref`. |
| `patternProperties`, `propertyNames` | object | Rules by key name pattern, and for the names themselves. |
| `minProperties`, `maxProperties`, `dependentRequired` | object | Key counts, and keys that need other keys. |
| `minimum`, `maximum` | number | Inclusive bounds. |
| `exclusiveMinimum`, `exclusiveMaximum` | number | Strict bounds, numbers in 2020-12. |
| `multipleOf` | number | Value divided by it is a whole number. Avoid with decimals. |
| `minLength`, `maxLength` | string | Length in characters. |
| `pattern` | string | ECMA-262 regex, not anchored. |
| `format` | string | Annotation by default. An assertion only with a format checker. |
| `items`, `prefixItems` | array | Element rules, by position for `prefixItems`. |
| `minItems`, `maxItems`, `uniqueItems`, `contains` | array | Counts, uniqueness, at least one match. |
| `allOf`, `anyOf`, `oneOf`, `not` | all | All, at least one, exactly one, none. |
| `if`, `then`, `else` | all | Conditional rules. |
| `$defs`, `$ref` | all | Reuse a named subschema through a JSON Pointer. |
| `title`, `description`, `default`, `examples` | all | Annotations. Never checked. |

![Alt text: each inputSchema rule, its result and the value it checks, and three failures of an invalid call](/notes/media/llm-systems/figures/07-7-schema-to-instance.svg)

## 7. MCP's rules for `inputSchema` and `outputSchema`

### 7.1 `inputSchema` must be an object schema

The 2026-07-28 `schema.ts` comment says: "Tool arguments are always JSON objects, so `type: \"object\"` is required at the root. Beyond that, any JSON Schema 2020-12 keyword may appear alongside `type` — including composition keywords (`oneOf`, `anyOf`, `allOf`, `not`), conditional keywords (`if`/`then`/`else`), reference keywords (`$ref`, `$defs`, `$anchor`), and any other standard validation or annotation keywords." The tools page adds that it "**MUST** be a valid JSON Schema object (not `null`)".

Measured against the official `schema.json` files with `jsonschema`:

| Tool definition | 2025-11-25 | 2026-07-28 |
|---|---|---|
| `inputSchema` without `"type": "object"` | invalid | invalid |
| `inputSchema` with `"type": "array"` | invalid | invalid |
| `inputSchema` with `oneOf` and `additionalProperties` at the root | valid | valid |
| `outputSchema` with `"type": "array"` | invalid | valid |

The third row needs an explanation. The 2025-11-25 TypeScript type of `inputSchema` listed only `$schema`, `type`, `properties` and `required`. But the generated `schema.json` did not forbid other keys, and the 2025-11-25 tools page itself recommended `additionalProperties: false`. So extra keywords were tolerated, but not promised. Revision 2026-07-28 (SEP-2106) makes the promise explicit: "Loosen `inputSchema` and `outputSchema` to allow any JSON Schema 2020-12 keywords, and `structuredContent` to allow any JSON value."

### 7.2 A tool with no parameters

The spec gives two valid forms:

1. `{"type": "object", "additionalProperties": false}`: "**Recommended**: explicitly accepts only empty objects".
2. `{"type": "object"}`: "accepts any object (including with properties)".

Measured: the Python SDK 2.3.0 generates `{"type": "object", "properties": {}, "title": "get_timeArguments"}` for a function with no parameters. That is the second, open form.

### 7.3 `outputSchema` and `structuredContent`

In 2025-11-25, `outputSchema` needed `"type": "object"` at the root, and `structuredContent` had to be a JSON object. In 2026-07-28, `outputSchema` can be any 2020-12 schema and `structuredContent` any JSON value. In both revisions the server **MUST** conform to the output schema and the client **SHOULD** validate. The server **SHOULD** also send the data as JSON text ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)).

### 7.4 Bounds on expensive schemas

Composition keywords and `$defs` "can be expensive to validate", so implementations "**SHOULD** apply reasonable bounds, such as a maximum schema depth, a cap on the total number of subschemas, or a per-validation time budget, to prevent a malicious schema from acting as a Denial-of-Service vector against the validator" (2026-07-28). A malicious server could send a deeply nested `anyOf` that takes a very long time to check.

### 7.5 Elicitation uses a restricted subset

The `requestedSchema` of a form-mode elicitation is not a full JSON Schema. It allows only a flat object whose properties are primitive schemas: string, number or integer, boolean, and enum forms ([L9](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots)).

## 8. How the model sees the schema

The model does not run a validator. The host puts the schema into the model request as JSON text, and the model reads it like any other text ([tools are context](/notes/ai/context-engineering/06-tools-and-mcp/l1-tools-are-context)). Three consequences follow:

1. **Descriptions do the teaching.** `"pattern": "^CUS-[0-9]{4}$"` is precise, but "Customer ID, format CUS-NNNN, for example CUS-0042" is what the model copies.
2. **Every word costs input tokens on every request.** The tool list is part of the prompt prefix. Keep it stable and in a deterministic order, so caching works ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)).
3. **Without constrained decoding, the schema is a request, not a guarantee.** The model can still write `"limit": "twenty"`. With a provider's strict mode, the decoder masks every token that would break the schema ([sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output)). But strict modes support only a subset of JSON Schema.

## 9. Provider strict modes

### 9.1 What the providers accept

| Provider | How to enable | Schema rules |
|---|---|---|
| Anthropic | `"strict": true` next to `name`, `description` and `input_schema` | `additionalProperties` must be `false` on objects. Not supported: recursive schemas, numerical constraints (`minimum`, `maximum`, `multipleOf`), string constraints (`minLength`, `maxLength`), array constraints beyond `minItems` of 0 or 1, external `$ref`. Supported: `enum`, `const`, `anyOf`, `allOf` (not with `$ref`), local `$ref`, `default` and simple `pattern` regexes. Supported formats: `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid`. Limits per request: 20 strict tools, 24 optional parameters, 16 parameters with union types. Checked on 2026-10-15. |
| OpenAI | `"strict": true` on the function | `additionalProperties` must be `false` for each object. All fields in `properties` must be in `required`. An optional field becomes nullable. As quoted in [the older schema lesson](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs), checked on 2026-10-12. These notes could not reload that page on 2026-10-15. |

So a rich MCP schema often needs a second, simpler copy for the model provider. The server keeps the full schema and validates with it.

### 9.2 What the transformation does

For an OpenAI-style strict copy:

1. Close every object with `additionalProperties: false`.
2. Put every property into `required`.
3. Make each optional property nullable: add `"null"` to its `type`, and add `null` to its `enum`.
4. Move constraints that the provider may not support into the description, so the model still reads them.

The server must then treat `null` as "absent" and apply the default itself.

### 9.3 The result

Exercise 3 asks you to write this transform, and its check block holds a reference solution. Applied to the good `search_orders` schema of section 13, the reference solution changes two of the properties like this (measured):

```json
{
  "limit": {
    "type": ["integer", "null"],
    "description": "Orders per page, 1 to 50. Default 20. Rules: minimum=1, maximum=50, default=20."
  },
  "status": {
    "type": ["string", "null"],
    "enum": ["pending", "shipped", "cancelled", null],
    "description": "Only orders with this status. Omit for all statuses."
  }
}
```

`limit` lost `minimum`, `maximum` and `default`, and the description now carries them as text. `status` accepts `null`, and its `enum` contains `null`. Both keys are now in `required`, so the model must send `"limit": null` when it has no value.

## 10. From Python types to JSON Schema

### 10.1 The SDK builds `inputSchema` from the signature

The Python SDK 2.3.0 reads the function signature with Pydantic and publishes the resulting JSON Schema. The code:

```python
from typing import Annotated, Literal
from pydantic import Field
from mcp.server import MCPServer

mcp = MCPServer("orders")

@mcp.tool()
def search_orders(
    customer_id: Annotated[str, Field(description="Customer ID, for example CUS-0042",
                                      pattern=r"^CUS-\d{4}$")],
    status: Annotated[Literal["pending", "shipped", "cancelled"] | None,
                      Field(description="Filter by status")] = None,
    limit: Annotated[int, Field(ge=1, le=50, description="Max rows, 1 to 50")] = 20,
) -> list[str]:
    """Search the orders of one customer. Returns order IDs, newest first."""
    return []
```

The `inputSchema` that `list_tools()` returned in these notes:

```json
{
  "properties": {
    "customer_id": {
      "description": "Customer ID, for example CUS-0042",
      "pattern": "^CUS-\\d{4}$",
      "title": "Customer Id",
      "type": "string"
    },
    "status": {
      "anyOf": [{"enum": ["pending", "shipped", "cancelled"], "type": "string"}, {"type": "null"}],
      "default": null,
      "description": "Filter by status",
      "title": "Status"
    },
    "limit": {
      "default": 20,
      "description": "Max rows, 1 to 50",
      "maximum": 50,
      "minimum": 1,
      "title": "Limit",
      "type": "integer"
    }
  },
  "required": ["customer_id"],
  "title": "search_ordersArguments",
  "type": "object"
}
```

And the `outputSchema` built from the return type `list[str]`, on one line:

```json
{"properties": {"result": {"items": {"type": "string"}, "title": "Result", "type": "array"}}, "required": ["result"], "title": "search_ordersOutput", "type": "object"}
```

How each piece maps:

| Python | JSON Schema produced | Note |
|---|---|---|
| `customer_id: str` with no default | `"type": "string"`, and the name in `required` | A parameter without a default is required. |
| `Field(description=...)` | `"description"` | The text the model reads. |
| `Field(pattern=...)` | `"pattern"` | Kept as written. |
| `Literal["pending", ...]` | `"enum": [...]` | |
| `Optional[X] = None` | `"anyOf": [{...}, {"type": "null"}]`, `"default": null` | Optional and nullable together. The code above writes it with the union syntax of Python 3.10. |
| `Field(ge=1, le=50)` | `"minimum": 1`, `"maximum": 50` | `gt` and `lt` give `exclusiveMinimum` and `exclusiveMaximum`. |
| `= 20` | `"default": 20` | An annotation for the model. Pydantic applies it in code. |
| parameter name | `"title": "Customer Id"` | Pydantic adds a title to every property. |
| function name | `"title": "search_ordersArguments"` | The root title. |
| `date` | `"type": "string", "format": "date"` | Measured with a separate function. |
| a `BaseModel` parameter | `"$ref": "#/$defs/DateRange"` and a `$defs` entry | Measured with a separate function. |
| return type `list[str]` | object with one required property `result` | The SDK wraps non-object results. |
| a `Context` parameter | nothing | The SDK injects it. The model never sees it. |


Two measured facts matter in an interview. First, the generated schema has no `additionalProperties: false`, and an extra argument such as `"c": 3` was silently ignored. Second, the SDK validates with Pydantic, not with a JSON Schema validator, and Pydantic's default mode converts input:

| Argument for `a: int` | Python SDK 2.3.0 (Pydantic lax mode) | `jsonschema` with `{"type": "integer"}` |
|---|---|---|
| `2` | accepted | valid |
| `2.0` | accepted as 2 | valid |
| `"2"` | accepted as 2 | invalid |
| `true` | accepted as 1 | invalid |
| `1.5` | rejected: `Input should be a valid integer, got a number with a fractional part` | invalid |

So the server accepts more than its published schema allows. That is usually harmless, but it means that a host that validates with `jsonschema` and a server that validates with Pydantic can disagree. A test suite should cover both.

![Alt text: what the model, the host, the server SDK and the tool code each check, and how failures return to the model](/notes/media/llm-systems/figures/07-7-validation-layers.svg)

### 10.2 Pydantic directly: closed objects and extra keywords

A Pydantic model gives full control:

```python
from datetime import date
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field

class SearchOrdersArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customer_id: Annotated[str, Field(pattern=r"^CUS-[0-9]{4}$",
                                      description="Customer ID, format CUS-NNNN.",
                                      json_schema_extra={"x-mcp-header": "Customer"})]
    created_from: Annotated[date | None, Field(description="First day, YYYY-MM-DD.")] = None
    limit: Annotated[int, Field(ge=1, le=50, examples=[20])] = 20
```

Its `model_json_schema()` output, measured. This excerpt keeps the root keys and one property:

```json
{
  "additionalProperties": false,
  "properties": {
    "customer_id": {
      "description": "Customer ID, format CUS-NNNN.",
      "pattern": "^CUS-[0-9]{4}$",
      "title": "Customer Id",
      "type": "string",
      "x-mcp-header": "Customer"
    }
  },
  "required": ["customer_id"],
  "title": "SearchOrdersArgs",
  "type": "object"
}
```

Three details:

1. `ConfigDict(extra="forbid")` produces `"additionalProperties": false`, and validation then fails on `limt` with `Extra inputs are not permitted [type=extra_forbidden, input_value=7, input_type=int]`.
2. `json_schema_extra` adds any key, here the MCP `x-mcp-header`.
3. Lax mode turned `"7"` into `7`. With `strict=True`, Pydantic said: `Input should be a valid integer [type=int_type, input_value='7', input_type=str]`.

If you pass such a model as one tool parameter, the SDK nests it under the parameter name, with a `$ref` to `$defs` (measured). To publish this exact schema as the root `inputSchema`, use the low-level server API, which takes the schema as data ([L13](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server)).

## 11. Validate with the `jsonschema` library

A host or a server can validate arguments with the same rules that the model saw. This function returns one actionable message per problem:

```python
from jsonschema import Draft202012Validator, FormatChecker

def validate_args(schema: dict, args: dict) -> list[str]:
    """Return one actionable message per problem. An empty list means valid."""
    Draft202012Validator.check_schema(schema)            # the schema itself must be valid
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    problems = []
    for err in sorted(validator.iter_errors(args), key=lambda e: list(e.absolute_path)):
        where = "/".join(str(p) for p in err.absolute_path) or "(root)"
        hint = err.schema.get("description", "") if isinstance(err.schema, dict) else ""
        problems.append(f"{where}: {err.message}. Rule: {err.validator}={err.validator_value!r}. {hint}".strip())
    return problems
```

What each line does:

1. `check_schema` validates the schema against the 2020-12 meta-schema, so a broken schema fails early.
2. `FormatChecker()` turns `format` into an assertion, so `"2026-02-30"` fails for `format: "date"`.
3. `iter_errors` returns every error, not only the first. `absolute_path` is the path inside the instance, `validator` is the failing keyword and `validator_value` is its value.
4. The description of the failing subschema becomes the hint, because it already tells the model the expected format.

Output for `{"customer_id": "42", "limit": 500, "limt": 5}` against the good schema of section 13:

```text
(root): Additional properties are not allowed ('limt' was unexpected). Rule: additionalProperties=False.
customer_id: '42' does not match '^CUS-[0-9]{4}$'. Rule: pattern='^CUS-[0-9]{4}$'. Customer ID, format CUS-NNNN, for example CUS-0042.
limit: 500 is greater than the maximum of 50. Rule: maximum=50. Orders per page, 1 to 50. Default 20.
```

Each line names the field, the broken rule, the received value and the expected format. A server returns these lines as the text of a result with `isError: true` ([L6](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)).

## 12. Design rules for argument schemas

| Rule | Why | Example |
|---|---|---|
| Use `enum` for fixed choices | The model cannot invent values, and strict mode enforces it. | `"status": {"enum": ["pending", "shipped", "cancelled"]}` |
| Put IDs, formats and units into descriptions | The model copies examples. | "Customer ID, format CUS-NNNN, for example CUS-0042." |
| Use integers for money | `multipleOf: 0.01` fails on 19.99. | `"min_total_cents": {"type": "integer"}` |
| Use ISO 8601 strings for dates | JSON has no date type. | `"format": "date"` plus a pattern and "YYYY-MM-DD, UTC" |
| Keep few and flat parameters | Every nested object and every parameter is a chance for a wrong value. | 3 to 6 top-level keys |
| Close objects | A typo such as `limt` is caught instead of ignored. | `"additionalProperties": false` |
| Anchor patterns | Patterns are not anchored. | `"^CUS-[0-9]{4}$"` |
| Bound every number and list | It stops huge pages and runaway costs. | `"limit": {"minimum": 1, "maximum": 50}` |
| Use opaque cursors for pages | The model must not compute offsets. | `page_token`, from the previous result |
| Prefer two tools over a complex `oneOf` | Models handle simple schemas better, and errors are clearer. | `get_order(order_id)` and `list_customer_orders(customer_id)` |
| Apply defaults in code | `default` is only an annotation. | `limit = args.get("limit", 20)` |
| Keep every `$ref` local | Network references are forbidden by default and unsafe. | `"$ref": "#/$defs/money"` |

## 13. A full example: `search_orders`, bad and good

### 13.1 The bad schema

```json
{
  "type": "object",
  "properties": {
    "q": {"type": "string"},
    "status": {"type": "string", "description": "order status"},
    "from": {"type": "string", "description": "start date"},
    "max": {"type": "number"},
    "options": {"type": "object"}
  }
}
```

Its problems:

1. `q` and `max` are cryptic names, and nothing says what they mean.
2. `status` is free text. The model can write "Shipped", "sent" or "delivered".
3. `from` is a date with no format, no time zone and no example.
4. `max` is a `number`, so 2.5 and 1,000,000 are both valid.
5. `options` is an open object. The model can put anything into it.
6. Nothing is required, and the object is open, so `{}` and `{"limt": 10}` are both valid.

### 13.2 The good schema

```json
{
  "type": "object",
  "properties": {
    "customer_id": {
      "type": "string",
      "pattern": "^CUS-[0-9]{4}$",
      "description": "Customer ID, format CUS-NNNN, for example CUS-0042."
    },
    "status": {
      "type": "string",
      "enum": ["pending", "shipped", "cancelled"],
      "description": "Only orders with this status. Omit for all statuses."
    },
    "created_from": {
      "type": "string",
      "format": "date",
      "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
      "description": "First creation day, ISO 8601 date YYYY-MM-DD, inclusive, UTC."
    },
    "created_to": {
      "type": "string",
      "format": "date",
      "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
      "description": "Last creation day, ISO 8601 date YYYY-MM-DD, inclusive, UTC."
    },
    "min_total_cents": {
      "type": "integer",
      "minimum": 0,
      "description": "Smallest order total in US cents. 2500 means USD 25.00."
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 20,
      "description": "Orders per page, 1 to 50. Default 20."
    },
    "page_token": {
      "type": "string",
      "description": "Opaque token from the previous result. Omit on the first call."
    }
  },
  "required": ["customer_id"],
  "dependentRequired": {"created_to": ["created_from"]},
  "additionalProperties": false
}
```

### 13.3 Measured results

Every case was checked with `jsonschema` and a format checker:

| Case | Arguments | Bad schema | Good schema |
|---|---|---|---|
| A correct call | `{"customer_id": "CUS-0042", "status": "shipped", "limit": 10}` | valid | valid |
| Customer name instead of ID | `{"customer_id": "Priya Raman"}` | valid | invalid: 'Priya Raman' does not match '^CUS-[0-9]{4}$' |
| Wrong case in the status | `{"customer_id": "CUS-0042", "status": "Shipped"}` | valid | invalid: 'Shipped' is not one of ['pending', 'shipped', 'cancelled'] |
| Words instead of a date | `{"customer_id": "CUS-0042", "created_from": "last week"}` | valid | invalid: 'last week' is not a 'date' |
| Impossible date | `{"customer_id": "CUS-0042", "created_from": "2026-02-30"}` | valid | invalid: '2026-02-30' is not a 'date' |
| Dollars as a float | `{"customer_id": "CUS-0042", "min_total_cents": 25.5}` | valid | invalid: 25.5 is not of type 'integer' |
| Page too large | `{"customer_id": "CUS-0042", "limit": 500}` | valid | invalid: 500 is greater than the maximum of 50 |
| Typo in a field name | `{"customer_id": "CUS-0042", "limt": 10}` | valid | invalid: Additional properties are not allowed ('limt' was unexpected) |
| End without a start | `{"customer_id": "CUS-0042", "created_to": "2026-10-15"}` | valid | invalid: 'created_from' is a dependency of 'created_to' |

The bad schema accepts every case, including the wrong ones. The good schema rejects every wrong case with a message that names the field and the rule. Two wrong cases still pass the good schema, so a business rule must catch them. One is a real customer ID that belongs to another tenant. The other is a date range in the wrong order. The tool code checks those ([L11](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security)).

```video
{
  "src": "/notes/media/llm-systems/manim/m33-tool-call-validated-against-schema.mp4",
  "caption": "A tool call travels from the model to the server and each argument is checked against its JSON Schema keyword by keyword."
}
```

### Exercises

Put your code in `C:\Users\ASohi\Downloads\AI\agent-harness-lab\llm-systems\json_schema.ipynb`.

1. **A conditional refund schema.** Write the `inputSchema` of `create_refund`. Its properties are `order_id` (`ORD-NNNN`), `kind` (`full` or `partial`), `amount_cents` (integer, at least 1), `reason` and `note`. `reason` is one of `damaged`, `late`, `wrong_item`, `other`. `note` has at most 500 characters. `amount_cents` is required for a partial refund and forbidden for a full refund. `note` is required when `reason` is `other`. Unknown keys are invalid.
   - Acceptance test: with `Draft202012Validator`, a full refund with reason `late` and a partial refund with `amount_cents: 500` are valid. A partial refund without an amount, a full refund with an amount, reason `other` without a note, and an extra key `notes` are invalid. The tool also validates against the 2026-07-28 MCP `Tool` definition.
   - Hint 1: put two `if`/`then` pairs inside an `allOf`.
   - Hint 2: "forbidden" can be written as `{"not": {"required": ["amount_cents"]}}`.
2. **Apply defaults after validation.** Write `apply_defaults(schema, args)`. It returns a new dictionary in which every top-level property that is absent or `null` gets its schema `default`, if the schema has one. It never changes a value that the model sent.
   - Acceptance test: with the good schema of section 13, `{"customer_id": "CUS-0042"}` becomes `{"customer_id": "CUS-0042", "limit": 20}`. `{"customer_id": "CUS-0042", "limit": null}` (from a strict copy) also gives `limit` 20. `{"customer_id": "CUS-0042", "limit": 5}` keeps 5. The input dictionary is not changed.
   - Hint 1: copy the input first.
   - Hint 2: `null` arrives in Python as `None`.
3. **A strict copy.** Write `to_strict(schema)` as described in section 9.2.
   - Acceptance test: for the good schema, all seven properties are in `required` and the root has `additionalProperties: false`. `{"customer_id": "CUS-0042"}` plus `null` for the other six keys is valid against the copy. `limit` matches section 9.3.
   - Hint 1: transform the children before you change the parent.
   - Hint 2: an `enum` that allows `null` must contain `null`.
4. **Debug a schema.** A paging schema is reused with `"allOf": [{"$ref": "#/$defs/paging"}]`, where `paging` declares `limit` and `page_token`. The root declares `query`, requires it, and sets `"additionalProperties": false`. Explain why `{"query": "x", "limit": 5}` fails and fix the schema.
   - Acceptance test: after the fix, `{"query": "x", "limit": 5}` is valid and `{"query": "x", "limt": 5}` is invalid.
   - Hint 1: which `properties` keyword can `additionalProperties` see?
   - Hint 2: 2020-12 has a keyword that sees through `$ref`.

## 14. Common mistakes

1. **"The validator inserts the `default` of a missing property."** `default` is an annotation. The server code applies it.
2. **"`format: \"date\"` rejects bad dates."** Only with a format checker. Add a `pattern` and enable the checker.
3. **"A `pattern` must match the whole string."** Patterns are not anchored. Write `^` and `$`.
4. **"`required` means the value cannot be null."** `required` means the key must be present. Nullability depends on `type`.
5. **"`additionalProperties: false` at the root closes the whole schema."** It sees only its own `properties`. Use `unevaluatedProperties: false` with `allOf` and `$ref`, and close nested objects on their own.
6. **"`3.0` is not an integer."** In JSON Schema it is. `"3"` and `true` are not.
7. **"`oneOf` means pick one branch."** It means exactly one branch matches. Overlapping branches make valid input fail.
8. **"The SDK enforces the schema it publishes."** The Python SDK validates with Pydantic in lax mode. It accepted `"2"` and `true` for an `int`, and it ignored extra keys.
9. **"Any JSON Schema works with every provider's strict mode."** Strict modes support a subset. Build a strict copy, and keep the full validation on the server.

## 15. One-minute explanation

An MCP tool's `inputSchema` is a JSON Schema, by default dialect 2020-12, and its root must be `"type": "object"` because arguments are always a JSON object. A validator applies every keyword on its own. `type`, `enum`, `minimum`, `pattern`, `required` and `additionalProperties` are assertions. `title`, `description`, `default` and `examples` are annotations, so the validator never applies a default. `format` is only an annotation unless a format checker is on. Properties are optional unless listed in `required`, and extra keys are allowed unless `additionalProperties` is false. With `allOf` or `$ref` you need `unevaluatedProperties`, because `additionalProperties` sees only its own `properties`. Revision 2026-07-28 allows any 2020-12 keyword in `inputSchema` and `outputSchema` and any JSON value in `structuredContent`, and it forbids automatic network `$ref` resolution. The Python SDK builds the schema from type hints with Pydantic, but it validates in lax mode, so it accepts `"2"` for an integer. Provider strict modes support only a subset, so I keep a full schema on the server and send a simpler strict copy to the model.

## 16. Check questions

```check
{
  "question": "Which of these instances are valid against `{\"type\": \"integer\"}` in JSON Schema 2020-12: `3`, `3.0`, `3.5`, `\"3\"`, `true`? Which ones does the Python SDK 2.3.0 accept for a parameter typed `int`?",
  "hint": "A boolean is not a number in JSON.",
  "answer": "JSON Schema: `3` and `3.0` are valid, because 2020-12 defines integer as \"any number with a zero fractional part\". `3.5`, `\"3\"` and `true` are invalid (measured with jsonschema 4.26). The SDK validates with Pydantic in lax mode: it accepted `3`, `3.0`, `\"3\"` and `true` (as 1), and rejected only `3.5` (measured in these notes). So the server accepts more than its published schema allows."
}
```

```check
{
  "question": "A tool has `\"limit\": {\"type\": \"integer\", \"default\": 20}`. The model sends `{}`. What does the validator do, what does the server receive, and who applies 20?",
  "answer": "The validator reports no error, because `limit` is not required and `default` is an annotation. Understanding JSON Schema says that `default` \"is not used to fill in missing values during the validation process.\" The server receives `{}` without `limit`. The server code must apply 20, for example `args.get(\"limit\", 20)` or a Pydantic field default. The Python SDK applies the function's default value, because it builds a Pydantic model from the signature."
}
```

```check
{
  "question": "Interview follow-up: write a schema in which exactly one of `order_id` and `customer_id` must be present. Then explain why the naive `oneOf` with two `required` branches can surprise you, and give a version with `not`.",
  "hint": "oneOf fails when zero branches or two or more branches match.",
  "answer": "Naive version: `{\"type\": \"object\", \"oneOf\": [{\"required\": [\"order_id\"]}, {\"required\": [\"customer_id\"]}]}`. It rejects `{}` (no branch matches) and rejects both keys together (both branches match, and `oneOf` needs exactly one). That is the wanted behavior here, but the error messages are hard to read: jsonschema reports \"is valid under each of ...\" (measured). The surprise appears when the branches overlap by accident, for example two branches with only `properties` and no `required`. Then `{}`, `{\"order_id\": \"x\"}` and `{\"customer_id\": \"c\"}` all match both branches, so `oneOf` rejects them (measured). A clearer version: `{\"type\": \"object\", \"anyOf\": [{\"required\": [\"order_id\"]}, {\"required\": [\"customer_id\"]}], \"not\": {\"required\": [\"order_id\", \"customer_id\"]}}`. For models, an even simpler design is two tools, `get_order(order_id)` and `list_customer_orders(customer_id)`."
}
```

```check
{
  "question": "Interview follow-up: a schema uses `allOf` to combine a shared paging schema with a query schema, and puts `\"additionalProperties\": false` at the root. The call `{\"query\": \"x\", \"limit\": 5}` fails. Why, and what is the 2020-12 fix?",
  "answer": "`additionalProperties` sees only the `properties` and `patternProperties` keywords of its own schema object. The root has `properties: {query}`, and `limit` is declared only inside the `allOf` branch. So for `additionalProperties`, `limit` is an extra key, and the call fails with \"Additional properties are not allowed ('limit' was unexpected)\" (measured). The fix in 2020-12 is `\"unevaluatedProperties\": false` at the root instead. It counts every property that any subschema evaluated, including properties declared in `allOf` branches and in `$ref` targets. Then `limit` passes, and a typo such as `limt` still fails. Check first that your model provider supports `unevaluatedProperties`, or flatten the schema."
}
```

```check
{
  "question": "Interview follow-up: what are MCP's rules for `$ref` inside `inputSchema` in 2026-07-28, and why do they exist?",
  "answer": "JSON Schema 2020-12 allows `$ref` to an absolute URI. MCP 2026-07-28 says that implementations MUST NOT automatically dereference `$ref` values that resolve to a network URI. An opt-in mode that fetches non-local references MAY exist, but it MUST be off by default. It SHOULD use an allowlist of hosts or at least reject loopback, link-local and private addresses. It SHOULD also apply timeouts and size limits, and log each fetched URI. A schema that fails because of an unresolved external `$ref` SHOULD be rejected, not treated as permissive. The reason: a server controls the schema. A network `$ref` would let an untrusted server make the client fetch internal URLs (server-side request forgery), leak information, or hang. Local references such as `#/$defs/money` are fine. The spec also asks for bounds on composition keywords: depth, number of subschemas and a time budget. A malicious schema can be a denial-of-service attack on the validator."
}
```

```check
{
  "question": "Interview follow-up: you must send this MCP property to a model provider in strict mode: `\"limit\": {\"type\": \"integer\", \"minimum\": 1, \"maximum\": 50, \"default\": 20}`, and `limit` is optional. What do you change, and what must the server still do?",
  "answer": "Strict modes support a subset of JSON Schema. The Anthropic docs list numerical constraints such as `minimum` and `maximum` as not supported, and require `additionalProperties: false` on objects (checked on 2026-10-15). OpenAI's strict mode also requires every property in `required` (checked on 2026-10-12). So the strict copy becomes `\"limit\": {\"type\": [\"integer\", \"null\"], \"description\": \"... Rules: minimum=1, maximum=50, default=20.\"}`, `limit` joins `required`, and the parent gets `additionalProperties: false`. The model must now send `\"limit\": null` when it has no value. The strict copy no longer enforces the range. So the server must still validate the original schema (1 to 50), and it must map `null` to the default 20."
}
```

```check
{
  "question": "A server sends `outputSchema: {\"type\": \"array\", \"items\": {\"type\": \"string\"}}`. Is the tool definition valid under the official schema.json of 2025-11-25 and of 2026-07-28?",
  "answer": "Measured in these notes with jsonschema against the official files. It is invalid under 2025-11-25, where `outputSchema` must have `type: \"object\"` at the root. It is valid under 2026-07-28, where SEP-2106 allows any JSON Schema 2020-12 for `outputSchema` and any JSON value for `structuredContent`."
}
```

```check
{
  "question": "Exercise 1: show a reference solution.",
  "answer": "```json\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"order_id\": {\"type\": \"string\", \"pattern\": \"^ORD-[0-9]{4}$\", \"description\": \"Order ID, format ORD-NNNN.\"},\n    \"kind\": {\n      \"enum\": [\"full\", \"partial\"],\n      \"description\": \"full refunds the whole order. partial needs amount_cents.\"\n    },\n    \"amount_cents\": {\n      \"type\": \"integer\",\n      \"minimum\": 1,\n      \"description\": \"Refund in US cents. Only for kind partial.\"\n    },\n    \"reason\": {\"enum\": [\"damaged\", \"late\", \"wrong_item\", \"other\"]},\n    \"note\": {\"type\": \"string\", \"maxLength\": 500, \"description\": \"Required when reason is other.\"}\n  },\n  \"required\": [\"order_id\", \"kind\", \"reason\"],\n  \"allOf\": [\n    {\n      \"if\": {\"properties\": {\"kind\": {\"const\": \"partial\"}}},\n      \"then\": {\"required\": [\"amount_cents\"]},\n      \"else\": {\"not\": {\"required\": [\"amount_cents\"]}}\n    },\n    {\"if\": {\"properties\": {\"reason\": {\"const\": \"other\"}}}, \"then\": {\"required\": [\"note\"]}}\n  ],\n  \"additionalProperties\": false\n}\n```\n\nAll six acceptance tests pass with `jsonschema.Draft202012Validator` (measured). The `else` branch uses `not` with `required` to forbid `amount_cents` for a full refund."
}
```

```check
{
  "question": "Exercise 2: show a reference solution.",
  "answer": "```python\nimport copy\n\ndef apply_defaults(schema: dict, args: dict) -> dict:\n    out = copy.deepcopy(args)                      # never change the caller's dictionary\n    for name, sub in schema.get(\"properties\", {}).items():\n        if out.get(name) is None and isinstance(sub, dict) and \"default\" in sub:\n            out[name] = copy.deepcopy(sub[\"default\"])\n    return out\n```\n\nAll four acceptance checks pass (measured). `out.get(name) is None` covers both an absent key and a JSON `null`. Run it after validation, so a wrong type never reaches it."
}
```

```check
{
  "question": "Exercise 3: show a reference solution.",
  "answer": "```python\nimport copy\n\nUNSUPPORTED = (\"minimum\", \"maximum\", \"exclusiveMinimum\", \"exclusiveMaximum\", \"multipleOf\",\n               \"minLength\", \"maxLength\", \"pattern\", \"format\", \"default\", \"dependentRequired\")\n\ndef to_strict(schema: dict) -> dict:\n    \"\"\"Return a copy for OpenAI-style strict mode: closed objects, every property\n    required, optional properties nullable, unsupported rules moved into text.\"\"\"\n    s = copy.deepcopy(schema)\n    rules = [f\"{k}={s.pop(k)!r}\" for k in UNSUPPORTED if k in s]\n    if rules:\n        s[\"description\"] = (s.get(\"description\", \"\") + \" Rules: \" + \", \".join(rules) + \".\").strip()\n    if s.get(\"type\") == \"object\":\n        props = s.get(\"properties\", {})\n        required = set(s.get(\"required\", []))\n        for name, sub in props.items():\n            sub = to_strict(sub)\n            if name not in required:                       # optional -> nullable\n                sub[\"type\"] = [sub[\"type\"], \"null\"] if isinstance(sub.get(\"type\"), str) else sub.get(\"type\")\n                if \"enum\" in sub:\n                    sub[\"enum\"] = sub[\"enum\"] + [None]\n            props[name] = sub\n        s[\"required\"] = list(props)\n        s[\"additionalProperties\"] = False\n    if s.get(\"type\") == \"array\" and isinstance(s.get(\"items\"), dict):\n        s[\"items\"] = to_strict(s[\"items\"])\n    return s\n```\n\nLine by line: `UNSUPPORTED` lists the keywords that move into the description, including `default` and `dependentRequired`, because a strict copy cannot express an absent key. The `rules` list removes each one from the copy and records it as `name=value`. For an object, each property is transformed first, and an optional property gets `\"null\"` in its type and `null` in its enum. Then every key goes into `required` and `additionalProperties` becomes `false`. Arrays are transformed through their `items` schema. Applied to the good schema, all seven properties are required, and the call `{\"customer_id\": \"CUS-0042\", \"status\": null, \"created_from\": null, \"created_to\": null, \"min_total_cents\": null, \"limit\": null, \"page_token\": null}` is valid (measured). This version is conservative: it moves every constraint that at least one provider rejects. If you target one provider, keep what it supports."
}
```

```check
{
  "question": "Exercise 4: show a reference solution.",
  "answer": "The validator reports `Additional properties are not allowed ('limit' was unexpected)` for `{\"query\": \"x\", \"limit\": 5}` (measured). The root `additionalProperties: false` does not see `limit`, which is declared inside the `$ref` target. Replace `\"additionalProperties\": false` with `\"unevaluatedProperties\": false`:\n\n```json\n{\n  \"type\": \"object\",\n  \"allOf\": [{\"$ref\": \"#/$defs/paging\"}],\n  \"$defs\": {\"paging\": {\"properties\": {\"limit\": {\"type\": \"integer\"}, \"page_token\": {\"type\": \"string\"}}}},\n  \"properties\": {\"query\": {\"type\": \"string\"}},\n  \"required\": [\"query\"],\n  \"unevaluatedProperties\": false\n}\n```\n\nNow `{\"query\": \"x\", \"limit\": 5}` is valid and `{\"query\": \"x\", \"limt\": 5}` is invalid (measured)."
}
```

## 17. Links

- Previous: [L6: Tools in depth](/notes/ai/llm-systems/07-mcp/l6-tools-in-depth)
- Next: [L8: Resources and prompts](/notes/ai/llm-systems/07-mcp/l8-resources-and-prompts)
- [L9: MRTR, elicitation, sampling and roots](/notes/ai/llm-systems/07-mcp/l9-mrtr-elicitation-sampling-and-roots): the restricted elicitation schema
- [L11: Authorization and security](/notes/ai/llm-systems/07-mcp/l11-authorization-and-security): `$ref` and server-side request forgery
- [L13: Build an MCP server and client](/notes/ai/llm-systems/07-mcp/l13-build-an-mcp-server): from a Python function to a tool schema
- [Sampling and structured output](/notes/ai/llm-systems/04-inference/l5-sampling-and-structured-output): how constrained decoding enforces a schema
- Older lesson: [Tool schemas and structured outputs](/notes/ai/context-engineering/06-tools-and-mcp/l3-tool-schemas-and-structured-outputs)
- Drill: [L4: Drill: MCP](/notes/ai/llm-systems/08-interview-drills/l4-chain-mcp)

### Sources

All checked on 2026-10-15 unless the text gives another date.

- JSON Schema 2020-12 Core: https://json-schema.org/draft/2020-12/json-schema-core
- JSON Schema 2020-12 Validation: https://json-schema.org/draft/2020-12/json-schema-validation
- Understanding JSON Schema, annotations: https://json-schema.org/understanding-json-schema/reference/annotations
- RFC 8259 (JSON): https://www.rfc-editor.org/rfc/rfc8259 and RFC 6901 (JSON Pointer): https://www.rfc-editor.org/rfc/rfc6901
- MCP specification 2026-07-28, Overview, "JSON Schema Usage" and "`$ref` Resolution": https://modelcontextprotocol.io/specification/2026-07-28/basic
- MCP specification 2026-07-28, Tools: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- MCP specification 2025-11-25, Overview and Key Changes: https://modelcontextprotocol.io/specification/2025-11-25/basic and https://modelcontextprotocol.io/specification/2025-11-25/changelog
- MCP specification 2026-07-28, Key Changes (SEP-2106): https://modelcontextprotocol.io/specification/2026-07-28/changelog
- MCP `schema.ts` and `schema.json` for both revisions: https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/schema
- Anthropic structured outputs, JSON Schema limitations: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Anthropic strict tool use: https://platform.claude.com/docs/agents-and-tools/tool-use/strict-tool-use
- Python `jsonschema` 4.26, Pydantic 2.13 and the MCP Python SDK 2.3.0 (https://pypi.org/project/mcp/), run in these notes
