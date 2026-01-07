let analyze;
beforeAll(async () => {
  const mod = await import('../analyzer.js');
  analyze = mod.analyze || (mod.default && mod.default.analyze) || mod.default || mod;
});

describe('analyzer API', () => {
  test('returns deterministic shape for JavaScript', async () => {
    const res = await analyze('function f() { return 1; }', 'JavaScript');
    expect(res).toHaveProperty('findings');
    expect(Array.isArray(res.findings)).toBe(true);
    expect(res).toHaveProperty('meta');
    expect(typeof res.meta.durationMs).toBe('number');
  });

  test('handles invalid JS gracefully', async () => {
    const res = await analyze('this is not valid js', 'JavaScript');
    expect(res).toHaveProperty('findings');
    expect(Array.isArray(res.findings)).toBe(true);
    expect(res).toHaveProperty('meta');
    // Either an error string is present or findings empty
    expect(typeof res.meta.durationMs).toBe('number');
  });

  test('returns deterministic shape for Python', async () => {
    const res = await analyze('def f(d):\n    return d.get("x")', 'Python');
    expect(res).toHaveProperty('findings');
    expect(Array.isArray(res.findings)).toBe(true);
    expect(res).toHaveProperty('meta');
    expect(typeof res.meta.durationMs).toBe('number');
    // Python placeholder should return a visible low-severity finding
    expect(res.findings.length).toBeGreaterThan(0);
    expect(res.findings[0].severity).toBe('low');
    expect(res.findings[0].title.toLowerCase()).toContain('python');
  });
});
