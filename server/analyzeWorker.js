const { parentPort } = require('worker_threads');
const { parseSource } = require('../parser');
const { analyzeForIssues } = require('../analyzer');
const pyAdapter = require('../languages/python/adapter');

parentPort.on('message', (msg) => {
  const { code = '', lang = 'JavaScript' } = msg || {};
  const start = Date.now();
  try {
    if (lang === 'JavaScript') {
      const ast = parseSource(code);
      const issues = analyzeForIssues(ast, { language: 'js' }) || [];
      const findings = issues.map(i => ({ severity: i.severity || 'low', message: i.title || i.explanation || i.ruleId || 'issue', line: i.line || null }));
      parentPort.postMessage({ findings, meta: { durationMs: Date.now() - start } });
    } else if (lang === 'Python') {
      const adapted = pyAdapter.adapt({ source: code });
      if (!adapted) {
        parentPort.postMessage({ findings: [], error: 'Could not parse Python function', details: 'Parser returned no function', meta: { durationMs: Date.now() - start } });
        return;
      }
      const ast = adapted.ast;
      const issues = analyzeForIssues(ast, { language: 'python' }) || [];
      const findings = issues.map(i => ({ severity: i.severity || 'low', message: i.title || i.explanation || i.ruleId || 'issue', line: i.line || null }));
      parentPort.postMessage({ findings, meta: { durationMs: Date.now() - start } });
    } else {
      parentPort.postMessage({ findings: [], error: 'Unsupported language', details: `Unsupported language: ${lang}`, meta: { durationMs: Date.now() - start } });
    }
  } catch (err) {
    parentPort.postMessage({ findings: [], error: 'Analyzer failed', details: err && err.message ? String(err.message) : 'Unknown error', meta: { durationMs: Date.now() - start } });
  }
});
