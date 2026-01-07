let parse, adapt, analyzeForIssues;
beforeAll(async () => {
  const p = await import('../languages/python/parser.js');
  parse = p.parseSource || (p.default && p.default.parseSource) || p.default || p;
  const ad = await import('../languages/python/adapter.js');
  adapt = ad.adapt || (ad.default && ad.default.adapt) || ad.default || ad;
  const a = await import('../analyzer.js');
  analyzeForIssues = a.analyzeForIssues || (a.default && a.default.analyzeForIssues) || a.default || a.analyzeForIssues || a;
});

describe('python nested get chain', () => {
  test('double get chain produces exactly one warning', () => {
    const src = `def f(d):\n    email = d.get("user").get("email")\n    print(email)`;
    const parsed = parse(src);
    const adapted = adapt(parsed);
    const issues = analyzeForIssues(adapted.ast, { language: 'python' });
    const relevant = issues.filter(i => i.ruleId && i.ruleId.startsWith('py:') );
    expect(relevant.length).toBe(1);
  });
});
