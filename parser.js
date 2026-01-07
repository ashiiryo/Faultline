// parser.js (ES module)
const parser = require('@babel/parser');

function parseSource(source) {
  // Use a permissive set of plugins to handle modern JS
  return parser.parse(source, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'classProperties',
      'optionalChaining',
      'nullishCoalescingOperator',
      'objectRestSpread',
      'optionalCatchBinding'
    ]
  });
}

// Export for CommonJS consumers (tests/CLI)
try { if (typeof module !== 'undefined' && module.exports) module.exports.parseSource = parseSource; } catch (e) {}
