// tests/integration.test.js
// Integration tests that run the CLI end-to-end and verify output.

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI = path.resolve(__dirname, '..', 'index.js');

function runCli(args) {
  try {
    const out = execFileSync('node', [CLI, ...args], { encoding: 'utf8' });
    return { stdout: out, stderr: null };
  } catch (e) {
    return { stdout: e.stdout && e.stdout.toString(), stderr: e.stderr && e.stderr.toString(), code: e.status };
  }
}

describe('CLI integration', () => {
  test('default output is readable for getUsername example', () => {
    const file = path.resolve(__dirname, '..', 'examples', 'getUsername.js');
    const { stdout } = runCli(['--file', file]);
    expect(stdout).toContain('Assumptions:');
    expect(stdout).toContain('- user is not null or undefined (high confidence)');
    expect(stdout).toContain('- user.profile.name is a string (medium confidence)');
  });

  test('--json outputs valid JSON with assumptions array', () => {
    const file = path.resolve(__dirname, '..', 'examples', 'getUsername.js');
    const { stdout } = runCli(['--file', file, '--json']);
    const obj = JSON.parse(stdout);
    expect(Array.isArray(obj.assumptions)).toBe(true);
    expect(obj.assumptions.some(a => a.text === 'user is not null or undefined' && a.confidence === 'high')).toBe(true);
  });

  test('--lang js is accepted and other langs rejected', () => {
    const file = path.resolve(__dirname, '..', 'examples', 'getUsername.js');
    const ok = runCli(['--file', file, '--lang', 'js']);
    expect(ok.stdout).toContain('Assumptions:');
    const bad = runCli(['--file', file, '--lang', 'py']);
    expect(bad.stderr || bad.stdout).toContain("Unsupported language: py");
  });

  test('date and regex inference (integration)', () => {
    const file = path.resolve(__dirname, '..', 'examples', 'dateAndRegex.js');
    const { stdout } = runCli(['--file', file]);
    expect(stdout).toContain('- date is not null or undefined');
    expect(stdout).toContain('- date.getFullYear exists');
    expect(stdout).toContain('- getFullYear is a valid function');
    expect(stdout).toContain('- re is not null or undefined');
    expect(stdout).toContain('- test is a valid function');
    expect(stdout).toContain('- re is a RegExp');
  });

  test('python integration: --lang python --file', () => {
    const file = path.resolve(__dirname, '..', 'examples', 'get_username.py');
    const { stdout } = runCli(['--file', file, '--lang', 'python']);
    expect(stdout).toContain('Assumptions:');
    expect(stdout).toContain('- user is not null or undefined');
    expect(stdout).toContain('- user.profile exists');
    expect(stdout).toContain('- upper is a valid function');
  });
});
