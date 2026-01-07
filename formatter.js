// formatter.js
// Format the list of assumptions into readable text for CLI output

function formatAssumptions(result) {
  const lines = [];
  lines.push('Assumptions:');
  if (!result.assumptions || result.assumptions.length === 0) {
    lines.push('- (none found)');
  } else {
    // result.assumptions is an array of {text, confidence}
    const sorted = Array.from(result.assumptions).slice().sort((a, b) => a.text.localeCompare(b.text));
    for (const a of sorted) {
      lines.push(`- ${a.text} (${a.confidence} confidence)`);
    }
  }
  return lines.join('\n');
}

// Export for CommonJS consumers
try { if (typeof module !== 'undefined' && module.exports) module.exports.formatAssumptions = formatAssumptions; } catch (e) {}

