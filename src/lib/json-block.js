// src/lib/json-block.js
// Shared JSON parsing for fence blocks such as ```video and ```check.

// Parses a fence body as a JSON object. Returns { spec, error }.
export function parseJsonBlock(code) {
  try {
    const spec = JSON.parse(code);
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
      return { spec: null, error: 'The block must be one JSON object, like { "key": "value" }.' };
    }
    return { spec, error: null };
  } catch (err) {
    return { spec: null, error: err && err.message ? err.message : 'Invalid JSON.' };
  }
}
