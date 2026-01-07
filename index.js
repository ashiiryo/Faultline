#!/usr/bin/env node
// index.js — CLI entry point
const fs = require('fs');
const path = require('path');

async function loadTools() {
  // dynamic import ES modules so CLI works regardless of module system
  const parserMod = await import('./parser.js');
  const analyzerMod = await import('./analyzer.js');
  const formatterMod = await import('./formatter.js');
  return { parseSource: parserMod.parseSource || (parserMod.default && parserMod.default.parseSource), analyzeFunction: analyzerMod.analyzeFunction || (analyzerMod.default && analyzerMod.default.analyzeFunction), formatAssumptions: formatterMod.formatAssumptions || (formatterMod.default && formatterMod.default.formatAssumptions) };
}

async function main() {
  const argv = process.argv.slice(2);
  // simple CLI flags parser: --json, --lang <lang>, --file <path>
  let outJson = false;
  let lang = 'js';
  let fileArg = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') { outJson = true; }
    else if (a === '--lang') { lang = argv[++i] || 'js'; }
    else if (a === '--file') { fileArg = argv[++i]; }
    else if (!fileArg && !a.startsWith('--')) { fileArg = a; }
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }

  if (!fileArg) {
    console.error('Usage: node index.js [--json] [--lang js] --file <input.js>');
    process.exit(2);
  }

  if (lang !== 'js' && lang !== 'python') {
    console.error(`Unsupported language: ${lang}. Supported: 'js' and 'python' (MVP).`);
    process.exit(2);
  }

  const file = path.resolve(process.cwd(), fileArg);
  let src;
  try {
    src = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`Failed to read ${file}: ${e.message}`);
    process.exit(2);
  }

  try {
    const tools = await loadTools();
    const parseSource = tools.parseSource;
    const analyzeFunction = tools.analyzeFunction;
    const formatAssumptions = tools.formatAssumptions;

    if (lang === 'python') {
      const pyParser = await import('./languages/python/parser.js');
      const pyAdapter = await import('./languages/python/adapter.js');
      const parsed = pyParser.parseSource(src);
      const adapted = pyAdapter.adapt(parsed);
      if (!adapted || !adapted.ast) {
        console.error('Failed to parse Python source');
        process.exit(1);
      }
      const result = analyzeFunction(adapted.ast);
      if (outJson) {
        console.log(JSON.stringify({ assumptions: result.assumptions }, null, 2));
      } else {
        console.log(formatAssumptions(result));
      }
      return;
    }
    const ast = parseSource(src);
    const result = analyzeFunction(ast);
    if (outJson) {
      // result.assumptions is array of {text, confidence}
      console.log(JSON.stringify({ assumptions: result.assumptions }, null, 2));
    } else {
      console.log(formatAssumptions(result));
    }
  } catch (e) {
    console.error('Error analyzing file:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

if (require.main === module) main();
