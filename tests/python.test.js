// tests/python.test.js
// Unit tests for Python adapter + analyzer integration

let parseSource, adapt, analyzeFunction, analyzeForIssues;
beforeAll(async () => {
  const p = await import('../languages/python/parser.js');
  parseSource = p.parseSource || (p.default && p.default.parseSource) || p.default || p;
  const ad = await import('../languages/python/adapter.js');
  adapt = ad.adapt || (ad.default && ad.default.adapt) || ad.default || ad;
  const a = await import('../analyzer.js');
  analyzeFunction = a.analyzeFunction || (a.default && a.default.analyzeFunction) || a.default || a.analyzeFunction || a;
  analyzeForIssues = a.analyzeForIssues || (a.default && a.default.analyzeForIssues) || a.default || a.analyzeForIssues || a;
});

function assumptionsFromPython(src) {
  const parsed = parseSource(src);
  const adapted = adapt(parsed);
  if (!adapted || !adapted.ast) return new Set();
  const res = analyzeFunction(adapted.ast);
  return new Set(res.assumptions);
}

describe('python adapter + analyzer', () => {
  test('attribute access and call', () => {
    const src = `def f(user):\n    return user.profile.get_name().upper()`;
    const s = assumptionsFromPython(src);
    expect(Array.from(s).some(a => a.text === 'user is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'user.profile exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'get_name is a valid function' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'upper is a valid function' && a.confidence === 'high')).toBe(true);
  });

  test('index and dict.get handling', () => {
    const src = `def f(d):\n    return d.get('a') or d['a']`;
    const s = assumptionsFromPython(src);
    // dict.get should be seen as a method call
    expect(Array.from(s).some(a => a.text === "get is a valid function" && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'd["a"] exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'd is a dict' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === "d.get may return undefined (key may be absent)" && a.confidence === 'high')).toBe(true);
  });

  test('dict.get followed by attribute access produces a single warning', () => {
    // dynamically loaded at top via beforeAll
    const src = `def f(d):\n    return d.get('a').upper()`;
    const parsed = parseSource(src);
    const adapted = adapt(parsed);
    const issues = analyzeForIssues(adapted.ast, { language: 'python' });
    const got = issues.filter(i => i.ruleId === 'py:dict-get-maybe-none');
    expect(got.length).toBe(1);
    expect(got[0].title).toContain('may return None');
  });
});
