#!/usr/bin/env node

/**
 * Local Static Application Security Testing (SAST) Scanner
 * Runs AST-like pattern matching and security checks across client & server code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SECURITY_PATTERNS = [
  {
    id: 'SEC-001',
    ruleId: 'hardcoded-razorpay-live-secret',
    severity: 'CRITICAL',
    message: 'Hardcoded live Razorpay secret key detected in source code.',
    regex: /['"]rzp_live_[a-zA-Z0-9]{14,}['"]/,
  },
  {
    id: 'SEC-002',
    ruleId: 'hardcoded-jwt-secret-string',
    severity: 'HIGH',
    message: 'Hardcoded JWT secret detected. Always read from process.env.JWT_SECRET.',
    regex: /jwt\.(?:sign|verify)\([^,]+,\s*['"][^'"]{8,}['"]/,
  },
  {
    id: 'SEC-003',
    ruleId: 'insecure-crypto-signature-compare',
    severity: 'HIGH',
    message: 'Timing-attack vulnerable signature comparison. Use crypto.timingSafeEqual().',
    regex: /(?:signature|expectedSignature)\s*===/,
  },
  {
    id: 'SEC-004',
    ruleId: 'dangerous-eval-usage',
    severity: 'CRITICAL',
    message: 'eval() or new Function() allows arbitrary code execution.',
    regex: /\b(?:eval|new\s+Function)\s*\(/,
  },
];

const IGNORED_PATHS = [
  'node_modules',
  '.next',
  'dist',
  '.git',
  '.superpowers',
  'coverage',
  'scripts',
  'package-lock.json',
  'run-sast.js',
];

function getAllSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (IGNORED_PATHS.some((ignored) => relPath.includes(ignored))) {
      continue;
    }

    if (entry.isDirectory()) {
      getAllSourceFiles(fullPath, fileList);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) && !entry.name.includes('.test.')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

export function runSastScan(targetDirs = ['server/src', 'client/src']) {
  const findings = [];
  let filesScanned = 0;

  for (const dirName of targetDirs) {
    const fullDir = path.join(ROOT_DIR, dirName);
    const files = getAllSourceFiles(fullDir);
    filesScanned += files.length;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];

        for (const rule of SECURITY_PATTERNS) {
          if (rule.regex.test(lineContent)) {
            findings.push({
              ruleId: rule.ruleId,
              severity: rule.severity,
              file: path.relative(ROOT_DIR, file).replace(/\\/g, '/'),
              line: i + 1,
              message: rule.message,
              snippet: lineContent.trim(),
            });
          }
        }
      }
    }
  }

  return { findings, filesScanned };
}

// CLI Execution Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🔍 Running Local Static Application Security Testing (SAST)...');
  const startTime = Date.now();
  const { findings, filesScanned } = runSastScan();
  const elapsed = Date.now() - startTime;

  console.log(`📦 Scanned ${filesScanned} source files in ${elapsed}ms.`);

  if (findings.length === 0) {
    console.log('✅ SAST Scan Passed: 0 security vulnerabilities detected!');
    process.exit(0);
  } else {
    console.error(`❌ SAST Scan Failed: Found ${findings.length} security finding(s):`);
    for (const f of findings) {
      console.error(`  - [${f.severity}] ${f.file}:${f.line} -> ${f.message}`);
      console.error(`    ${f.snippet}`);
    }
    process.exit(1);
  }
}
