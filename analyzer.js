// analyzer.js
// 100% browser-safe, no backend, no fetch, no fs/path, no dynamic imports
// Exports exactly: export function analyze(code, language)

export async function analyze(code, language) {
  const start = Date.now();
  try {
    if (!code || typeof code !== "string" || code.trim() === "") {
      return { findings: [], meta: { durationMs: Date.now() - start, error: null } };
    }
    const lang = (language || "javascript").toLowerCase();
    if (lang === "javascript" || lang === "js") {
      // Naive property/method chain: detect foo.bar.baz, user.profile.name, etc.
      const lines = code.split("\n");
      const findings = [];
      const dotPattern = /([a-zA-Z_$][\w$]*\.){2,}[a-zA-Z_$][\w$]*/g; // e.g. foo.bar.baz
      for (let lineIdx = 0; lineIdx < lines.length; ++lineIdx) {
        const line = lines[lineIdx];
        const matches = line.match(dotPattern);
        if (matches) {
          for (const m of matches) {
            findings.push({
              severity: "HIGH",
              message: `Assumes ${m} exists`,
              line: lineIdx + 1
            });
          }
        }
      }
      return { findings, meta: { durationMs: Date.now() - start, error: null } };
    }
    
    if (lang === "python" || lang === "py") {
      const findings = [];
      const seenGetFindings = new Set();
      const lines = code.split("\n");
      for (let i = 0; i < lines.length; ++i) {
        let lineNum = i + 1;
        let line = lines[i];
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        
        // 1. Attribute access (foo.bar)
        let idx = line.indexOf(".");
        while (idx > 0 && idx < line.length - 1) {
          // ensure not method call, not import, not float, not ...
          let before = line[idx - 1];
          let after = line[idx + 1];
          // Only match a.b and not e.g. 1.2 or ...
          const isAlphaNumeric = c => /[a-zA-Z_\$0-9]/.test(c || "");
          if (isAlphaNumeric(before) && isAlphaNumeric(after)) {
            // Scan for root and property
            let left = line.slice(0, idx).trim().split(/\s|\+|\-|\*|\/|=|,|:|\(/).pop();
            let right = line.slice(idx + 1).trim().split(/\W/)[0];
            // skip dict/array access or float numbers
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(left) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(right)) {
              // attribute (NOT method call)
              let isMethodCall = line[idx + right.length + 1] === '(';
              if (!isMethodCall) {
                findings.push({
                  severity: "MEDIUM",
                  message: `Assumes ${left}.${right} exists`,
                  line: lineNum
                });
              }
            }
          }
          idx = line.indexOf(".", idx + 1);
        }

        // 2. Dictionary access (obj["key"]) or (obj['key'])
        let sq = line.indexOf("['");
        let dq = line.indexOf('["');
        while ((sq !== -1 && sq < line.length) || (dq !== -1 && dq < line.length)) {
          let idxq = sq !== -1 ? sq : dq;
          let open = line[idxq + 1];
          let close = open === "'" ? "'" : '"';
          let keyStart = idxq + 2;
          let keyEnd = line.indexOf(close + "]", keyStart);
          if (keyEnd !== -1) {
            let key = line.substring(keyStart, keyEnd);
            let dictVar = line.substring(0, idxq).trim().split(/\s|\+|\-|\*|\/|=|,|:|\(/).pop();
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dictVar)) {
              findings.push({
                severity: "MEDIUM",
                message: `Assumes key '${key}' exists in dictionary ${dictVar}`,
                line: lineNum
              });
            }
          }
          // Next occurrence
          if (sq !== -1) sq = line.indexOf("['", idxq + 2);
          if (dq !== -1) dq = line.indexOf('["', idxq + 2);
          if (idxq === sq) sq = -1; if (idxq === dq) dq = -1;
        }

        // 3. dict.get usage (emit ONE finding per unique dict+key only)
        let getIdx = line.indexOf('.get(');
        while (getIdx !== -1) {
          let left = line.slice(0, getIdx).trim().split(/\s|\+|\-|\*|\/|=|,|:|\(/).pop();
          let argSegment = line.slice(getIdx + 5);
          let key = null;
          if (argSegment.startsWith('"') || argSegment.startsWith("'")) {
            let delim = argSegment[0];
            let keyEndIdx = argSegment.indexOf(delim, 1);
            if (keyEndIdx > 1) key = argSegment.substring(1, keyEndIdx);
          }
          if (key && /^[a-zA-Z_0-9-]+$/.test(key) && left) {
            let sig = left+'||'+key;
            if (!seenGetFindings.has(sig)) {
              findings.push({
                severity: "MEDIUM",
                message: `Assumes key '${key}' may be missing in dictionary ${left}`,
                line: lineNum
              });
              seenGetFindings.add(sig);
            }
          }
          getIdx = line.indexOf('.get(', getIdx + 5);
        }

        // 4. Function call (foo())
        let callMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
        if (callMatch) {
          for (const m of callMatch) {
            let fn = m.split("(")[0].trim();
            // filter obvious Python keywords; skip 'if', 'for', 'while', etc.
            if (
              fn &&
              !['if','for','while','print','return','with','def','elif','except','class','finally','assert','try','pass','not','and','or','in','is','from','import','del','yield','lambda'].includes(fn)
            ) {
              findings.push({
                severity: "MEDIUM",
                message: `Assumes function ${fn} is callable`,
                line: lineNum
              });
            }
          }
        }
      }
      findings.sort((a, b) => {
        if(a.line!==b.line) return a.line-b.line;
        if(a.message < b.message) return -1;
        if(a.message > b.message) return 1;
        return 0;
      });
      return { findings, meta: { durationMs: Date.now() - start, error: null } };
    }

    return { findings: [], meta: { durationMs: Date.now() - start, error: `Unsupported language: ${language}` } };
  } catch (e) {
    return { findings: [], meta: { durationMs: Date.now() - start, error: "Python analyzer failed safely" } };
  }
}
