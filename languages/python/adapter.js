// languages/python/adapter.js
// Convert a minimal Python parse result into a small Babel-like AST
// that the JS analyzer can process. This adapter is intentionally small
// and only supports the constructs needed by the MVP: attribute access,
// function calls, index access, and simple computed keys.

// Example conversion:
//   input: def f(user):\n    return user.profile.name.upper()
//   output: FunctionDeclaration { id: Identifier('f'), params: [Identifier('user')], body: { type: 'BlockStatement', body: [ ReturnStatement(arg) ] } }

function parseFunctionSource(parsed) {
  // parsed.source is the raw Python source. We'll locate the first `def` function
  // declaration and extract its name, parameters, and the return expression.
  const src = parsed.source;
  const funcRe = /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:\s*([\s\S]*)/m;
  const m = src.match(funcRe);
  const ast = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'anon' },
    params: [],
    body: {
      type: 'BlockStatement',
      body: []
    }
  };

  if (m) {
    const name = m[1];
    const params = m[2].split(',').map(s => s.trim()).filter(Boolean).map(n => ({ type: 'Identifier', name: n }));
    const bodySrc = m[3];
    ast.id.name = name;
    ast.params = params;
    // Find a return statement inside the function body (first return)
    const retRe = /return\s+([\s\S]*?)(?:\n|$)/;
    const rm = bodySrc.match(retRe);
    const retExpr = rm ? rm[1].trim() : null;
    if (retExpr) {
      // Handle simple boolean-or expressions like `a or b` by analyzing both sides.
      const parts = retExpr.split(/\s+or\s+/);
      for (const p of parts) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        ast.body.body.push({ type: 'ReturnStatement', argument: convertExpression(trimmed) });
      }
    }
    // If no explicit return expressions found, also scan assignments in the function body
    if (!ast.body.body.length) {
      const assignRe = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^\n]+)/g;
      let am;
      while ((am = assignRe.exec(bodySrc)) !== null) {
        const rhs = am[2].trim();
        if (rhs) ast.body.body.push({ type: 'ReturnStatement', argument: convertExpression(rhs) });
      }
    }
  } else {
    // No function found — treat the whole source as top-level and extract assignments
    const assignRe = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^\n]+)/g;
    let am;
    while ((am = assignRe.exec(src)) !== null) {
      const rhs = am[2].trim();
      if (rhs) ast.body.body.push({ type: 'ReturnStatement', argument: convertExpression(rhs) });
    }
  }

  return ast;
}

// Very small expression tokenizer that understands names, dots, parens, brackets, strings, numbers
function tokenize(expr) {
  const tokens = [];
  const re = /([a-zA-Z_][a-zA-Z0-9_]*)|(\d+)|(\.|\(|\)|\[|\]|\'[^']*\'|\"[^\"]*\")/g;
  let m;
  while ((m = re.exec(expr)) !== null) {
    tokens.push(m[0]);
  }
  return tokens;
}

function convertExpression(expr) {
  // Convert chains like user.profile.getName().upper() and indexed access
  const tokens = tokenize(expr);
  // We'll build a left-to-right AST
  let i = 0;
  function parsePrimary() {
    const t = tokens[i++];
    if (!t) return null;
    if (/^['"]/.test(t)) return { type: 'StringLiteral', value: t.slice(1, -1) };
    if (/^\d+$/.test(t)) return { type: 'NumericLiteral', value: Number(t) };
    return { type: 'Identifier', name: t };
  }

  let node = parsePrimary();
  while (i < tokens.length) {
    const tk = tokens[i++];
    if (tk === '.') {
      const prop = tokens[i++];
      // method call if followed by ()
      if (tokens[i] === '(') {
        // consume () arguments simplistically (only support no-arg calls in MVP or string/numeric literal args)
        i++; // consume '('
        const args = [];
        while (tokens[i] && tokens[i] !== ')') {
          const argTok = tokens[i++];
          if (argTok === ',') continue;
          if (/^['"]/.test(argTok)) args.push({ type: 'StringLiteral', value: argTok.slice(1, -1) });
          else if (/^\d+$/.test(argTok)) args.push({ type: 'NumericLiteral', value: Number(argTok) });
          else args.push({ type: 'Identifier', name: argTok });
        }
        if (tokens[i] === ')') i++; // consume ')'
        node = { type: 'CallExpression', callee: { type: 'MemberExpression', object: node, property: { type: 'Identifier', name: prop }, computed: false }, arguments: args };
      } else {
        node = { type: 'MemberExpression', object: node, property: { type: 'Identifier', name: prop }, computed: false };
      }
    } else if (tk === '[') {
      const keyTok = tokens[i++];
      let keyNode;
      if (/^['"]/.test(keyTok)) keyNode = { type: 'StringLiteral', value: keyTok.slice(1, -1) };
      else if (/^\d+$/.test(keyTok)) keyNode = { type: 'NumericLiteral', value: Number(keyTok) };
      else keyNode = { type: 'Identifier', name: keyTok };
      if (tokens[i] === ']') i++; // consume ']'
      node = { type: 'MemberExpression', object: node, property: keyNode, computed: true };
    } else if (tk === '(') {
      // a call without preceding dot (e.g., fn()) — handle if node is Identifier
      const args = [];
      while (tokens[i] && tokens[i] !== ')') {
        const argTok = tokens[i++];
        if (argTok === ',') continue;
        if (/^['"]/.test(argTok)) args.push({ type: 'StringLiteral', value: argTok.slice(1, -1) });
        else if (/^\d+$/.test(argTok)) args.push({ type: 'NumericLiteral', value: Number(argTok) });
        else args.push({ type: 'Identifier', name: argTok });
      }
      if (tokens[i] === ')') i++;
      node = { type: 'CallExpression', callee: node, arguments: args };
    } else {
      // unknown token — ignore
    }
  }
  return node;
}

function adapt(parsed) {
  const fn = parseFunctionSource(parsed);
  if (!fn) return null;
  return { ast: fn };
}

// Export for CommonJS consumers
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.adapt = adapt;
    module.exports.convertExpression = convertExpression;
  }
} catch (e) {}
