import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSastScan } from '../../../scripts/run-sast.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

describe('SAST Configuration & Static Security Audit Suite', () => {
  it('verifies that .semgrep/rules.yml exists with required security rules', () => {
    const rulesPath = path.join(ROOT_DIR, '.semgrep/rules.yml');
    assert.ok(fs.existsSync(rulesPath), '.semgrep/rules.yml must exist');

    const content = fs.readFileSync(rulesPath, 'utf-8');
    assert.ok(content.includes('sriram-hardcoded-crypto-secret'));
    assert.ok(content.includes('sriram-constant-time-hmac'));
    assert.ok(content.includes('sriram-nosql-injection-regex'));
    assert.ok(content.includes('sriram-cors-wildcard-with-credentials'));
  });

  it('verifies that .semgrepignore exists with proper exclusion patterns', () => {
    const ignorePath = path.join(ROOT_DIR, '.semgrepignore');
    assert.ok(fs.existsSync(ignorePath), '.semgrepignore must exist');

    const content = fs.readFileSync(ignorePath, 'utf-8');
    assert.ok(content.includes('node_modules/'));
    assert.ok(content.includes('client/.next/'));
    assert.ok(content.includes('server/dist/'));
  });

  it('verifies that CI security workflow exists with automated scanning triggers', () => {
    const workflowPath = path.join(ROOT_DIR, '.github/workflows/security-sast.yml');
    assert.ok(fs.existsSync(workflowPath), 'security-sast.yml workflow must exist');

    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(content.includes('semgrep-action'));
    assert.ok(content.includes('npm audit'));
  });

  it('runs local SAST scanner across production codebase with 0 vulnerabilities', () => {
    const result = runSastScan(['server/src', 'client/src']);
    assert.ok(result.filesScanned > 50, `Expected > 50 files scanned, got ${result.filesScanned}`);
    assert.equal(result.findings.length, 0, `Expected 0 SAST findings, got: ${JSON.stringify(result.findings)}`);
  });
});
