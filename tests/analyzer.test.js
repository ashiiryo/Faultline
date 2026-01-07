// tests/analyzer.test.js
// Unit tests for Faultline analyzer (core cases and edge cases).

let parseSource, analyzeFunction, formatAssumptions;
beforeAll(async () => {
  const p = await import('../parser.js');
  parseSource = p.parseSource || (p.default && p.default.parseSource) || p.default || p;
  const a = await import('../analyzer.js');
  analyzeFunction = a.analyzeFunction || (a.default && a.default.analyzeFunction) || a.default || a.analyzeFunction || a;
  const f = await import('../formatter.js');
  formatAssumptions = f.formatAssumptions || (f.default && f.default.formatAssumptions) || f.default || f;
});

// Helper to get assumptions set
function assumptionsFromSrc(src) {
  const ast = parseSource(src);
  const res = analyzeFunction(ast);
  return new Set(res.assumptions);
}

describe('analyzer core cases', () => {
  test('MemberExpression: obj.a.b', () => {
    const src = `function f(obj) { return obj.a.b; }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'obj is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'obj.a exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'obj.a.b exists' && a.confidence === 'high')).toBe(true);
  });

  test('CallExpression: fn()', () => {
    const src = `function f() { return fn(); }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'fn is defined and is a function' && a.confidence === 'high')).toBe(true);
  });

  test('Method call: obj.method()', () => {
    const src = `function f(o) { return o.method(); }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'o is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'o.method exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'method is a valid function' && a.confidence === 'high')).toBe(true);
  });

  test('Array/computed access: arr[i] and obj[prop]', () => {
    const src = `function f(arr, i, obj, prop) { return arr[i] + obj[prop]; }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'arr is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'arr[i] exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'prop (computed key) is defined' && a.confidence === 'low')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'obj[prop] exists' && a.confidence === 'high')).toBe(true);
  });

  test('Nested objects + chained calls: user.profile.getName().toUpperCase()', () => {
    const src = `function f(user) { return user.profile.getName().toUpperCase(); }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'user is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'user.profile exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'getName is a valid function' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'user.profile.getName() exists' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'toUpperCase is a valid function' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'user.profile.getName() is a string' && a.confidence === 'medium')).toBe(true);
  });
});

describe('edge cases and optional chaining', () => {
  test('optional chaining usage is detected', () => {
    const src = `function f(user) { return user?.profile?.name?.toUpperCase(); }`;
    const s = assumptionsFromSrc(src);
    // optional chaining should be reported
    const hasOptional = Array.from(s).some(x => x.text && x.text.includes('optional chaining used'));
    expect(hasOptional).toBe(true);
    // Should not assert user non-null because first access is optional
    expect(Array.from(s).some(a => a.text === 'user is not null or undefined' && a.confidence === 'high')).toBe(false);
    // but still infer string for receiver of toUpperCase
    expect(Array.from(s).some(a => a.text === 'user.profile.name is a string' && a.confidence === 'medium')).toBe(true);
  });

  test('computed literal properties', () => {
    const src = `function f(obj) { return obj["foo"]; }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'obj is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'obj["foo"] exists' && a.confidence === 'high')).toBe(true);
  });

  test('array method inference (map/filter/reduce)', () => {
    const src = `function f(arr) { return arr.map(x => x*2); }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'arr is not null or undefined' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'map is a valid function' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'arr is an array' && a.confidence === 'high')).toBe(true);
  });

  test('promise method inference (then/catch/finally)', () => {
    const src = `function f(p) { return p.then(x => x); }`;
    const s = assumptionsFromSrc(src);
    expect(Array.from(s).some(a => a.text === 'then is a valid function' && a.confidence === 'high')).toBe(true);
    expect(Array.from(s).some(a => a.text === 'p is a Promise' && a.confidence === 'high')).toBe(true);
  });

  test('deduplication and formatter output', () => {
    const src = `function f(user) { user.profile.name.toUpperCase(); user.profile.name; }`;
    const ast = parseSource(src);
    const res = analyzeFunction(ast);
    // assumptions should be unique by (text + confidence)
    const unique = new Set(res.assumptions.map(a => `${a.text}||${a.confidence}`));
    expect(unique.size).toBe(res.assumptions.length);

    // formatter should produce readable bullets
    const out = formatAssumptions(res);
    expect(out.startsWith('Assumptions:')).toBe(true);
    expect(out.includes('- user.profile.name is a string (medium confidence)')).toBe(true);
  });
});
