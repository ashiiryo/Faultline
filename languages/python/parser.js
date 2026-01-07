// languages/python/parser.js
// Lightweight Python parser wrapper for MVP.
// NOTE: This is a simple, deterministic parser for extracting a single
// function body and return expression. For more complete parsing, a
// proper parser like tree-sitter would be preferable, but this keeps the
// project dependency-free and deterministic for the MVP.

function parseSource(source) {
  // Return a minimal object with raw source for adapter to consume.
  return { source };
}

// Export for CommonJS consumers
try { if (typeof module !== 'undefined' && module.exports) module.exports.parseSource = parseSource; } catch (e) {}
