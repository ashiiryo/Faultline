let parseSource, analyzeForIssues;
beforeAll(async () => {
  const p = await import('../parser.js');
  parseSource = p.parseSource || (p.default && p.default.parseSource) || p.default || p;
  const a = await import('../analyzer.js');
  analyzeForIssues = a.analyzeForIssues || (a.default && a.default.analyzeForIssues) || a.default || a.analyzeForIssues || a;
});

describe('issue analysis', () => {
  test('deduplicate unsafe property access in chains', () => {
    const src = `function f(user) { user.profile.name.toUpperCase(); user.profile.name; }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    // only one unsafe-property-access for the chain
    const unsafe = issues.filter(i => i.ruleId === 'js:unsafe-property-access');
    expect(unsafe.length).toBe(1);
    // each issue should have required fields (title/explanation replaced message)
    for (const it of issues) {
      expect(it.ruleId).toBeTruthy();
      expect(it.title).toBeTruthy();
      expect(it.explanation).toBeTruthy();
      expect(typeof it.line === 'number' || it.line === null).toBeTruthy();
      expect(['low','medium','high']).toContain(it.severity);
      expect(it.suggestedFix).toBeDefined();
    }
  });

  test('method call warnings appear once per receiver+method', () => {
    const src = `function f(x) { x.map(a => a); x.map(a => a); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    const mapIssues = issues.filter(i => i.ruleId === 'js:assume-array');
    expect(mapIssues.length).toBe(1);
  });

  test('string method produces assume-string and suppresses unsafe property', () => {
    const src = `function f(x) { x.trim(); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    expect(issues.some(i => i.ruleId === 'js:assume-string')).toBe(true);
    expect(issues.some(i => i.ruleId === 'js:unsafe-property-access')).toBe(false);
  });

  test('promise method produces assume-promise and suppresses unsafe property', () => {
    const src = `function f(p) { p.then(() => {}); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    expect(issues.some(i => i.ruleId === 'js:assume-promise')).toBe(true);
    expect(issues.some(i => i.ruleId === 'js:unsafe-property-access')).toBe(false);
  });

  test('call result followed by string method collapses to one finding with returns wording', () => {
    const src = `function f(user) { user.get('email').trim(); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    // should have a single assume-string about the call result
    const s = issues.filter(i => i.ruleId === 'js:assume-string');
    expect(s.length).toBe(1);
    expect(s[0].title).toContain("returns a string");
    expect(s[0].explanation).toBeTruthy();
    // no unsafe-property-access noise
    expect(issues.some(i => i.ruleId === 'js:unsafe-property-access')).toBe(false);
  });

  test('fetch().then(res => res.json()) collapses to a single fetch-response-json finding', () => {
    const src = `function f(api) { fetch('/x').then(res => res.json()); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    const got = issues.filter(i => i.ruleId === 'js:fetch-response-json');
    expect(got.length).toBe(1);
    expect(got[0].title).toContain('fetch');
    // ensure no unsafe-property-access noise
    expect(issues.some(i => i.ruleId === 'js:unsafe-property-access')).toBe(false);
  });

  test('response.json() direct call yields a response-based finding', () => {
    const src = `function f(res) { res.json(); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    const got = issues.filter(i => i.ruleId === 'js:response-json');
    expect(got.length).toBe(1);
    expect(got[0].title).toContain('Response');
  });

  test('promise.then(v => v.trim()) infers promise resolves to string', () => {
    const src = `function f(p) { p.then(v => v.trim()); }`;
    const ast = parseSource(src);
    const issues = analyzeForIssues(ast, { language: 'js' });
    const got = issues.filter(i => i.ruleId === 'js:promise-resolves-string');
    expect(got.length).toBe(1);
    expect(got[0].title).toContain('resolves to a string');
  });
});
