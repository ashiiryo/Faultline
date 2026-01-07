<div align="center">

<img src="assets/logo.png" alt="Faultline Logo" width="120"/>

# ⚡ Faultline

### Find hidden assumptions in code — before they break production.

A **lightweight, deterministic static analyzer** for JavaScript and Python that surfaces unsafe assumptions, implicit contracts, and fragile logic with clean, human-readable explanations.

<br/>

![Status](https://img.shields.io/badge/status-active-success)
![Languages](https://img.shields.io/badge/languages-JS%20%7C%20Python-blue)
![Deterministic](https://img.shields.io/badge/output-deterministic-purple)
![Upgradeable](https://img.shields.io/badge/design-extensible-orange)

</div>

---

## ✨ What is Faultline?

**Faultline** analyzes your code and highlights *assumptions you didn’t realize you were making*.

Examples:
- Assuming `fetch().json()` always succeeds
- Assuming `dict.get()` never returns `None`
- Assuming a promise resolves to a specific type
- Assuming chained calls are always safe

Instead of flooding you with noise, Faultline collapses entire chains into **one clean, actionable finding**.

---

## 🧠 Why Faultline exists

Most bugs don’t come from syntax errors.  
They come from **assumptions**.

Faultline focuses on:
- 🔍 Signal over noise
- 🧠 Human-readable explanations
- 📏 Deterministic output (same input → same results)
- 🧩 Easy extensibility for future languages

---

## 🚀 Features

### Core
- ✅ JavaScript & Python support
- ✅ Deterministic findings
- ✅ Chain suppression (no duplicate noise)
- ✅ Friendly titles + explanations
- ✅ Suggested fixes
- ✅ Severity levels

### JavaScript
- `fetch().then(res => res.json())`
- `Response.json()` / `Response.text()`
- Promise resolution inference
- Optional chaining handling

### Python
- `requests.get(...).json()`
- `dict.get()` → possible `None`
- Safe built-in inference (MVP)

### UI
- Clean, modern layout
- Loading animation
- Side-by-side editor & actions
- Analyze / Clear / Export
- No backend calls — browser-safe

---

## 🖥️ Usage

### Web UI
1. Paste your code
2. Select language (JS / Python)
3. Click **Analyze**
4. Review assumptions instantly

### CLI (optional)
```bash
node index.js --lang js --file example.js
node index.js --lang python --file example.py --json
🧪 Testing
npm test
npm run test:coverage


All analyzers are fully tested with deterministic snapshots.

## 🔮 Future Plans

- Faultline is highly upgradable.

- Planned / on-demand expansions:

## 🌍 More languages (Go, Rust, Java, Lua)
## 📜 External rule definitions (JSON-driven)

## 🧠 Smarter inference via AST engines

## 🎨 More UI polish & exports

## 🧪 CI + GitHub

- New features can be added on demand without redesigning the core.

## 🤝 Contributing

- PRs are welcome.
- If you want to
- new language
- New inference rules

- UI improvements

- Open an issue first — let’s discuss.

## 📜 License

MIT License © 2026
Built with intent, not noise.

<div align="center">

## ⚡ Faultline —
Because assumptions are where bugs are born.

</div> ```
