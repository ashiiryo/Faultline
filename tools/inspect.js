const { parseSource } = require('../parser');
const { analyzeForIssues } = require('../analyzer');
const src = `function f(user) { user.profile.name.toUpperCase(); user.profile.name; }`;
const ast = parseSource(src);
console.log(JSON.stringify(analyzeForIssues(ast), null, 2));
