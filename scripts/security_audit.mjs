/**
 * OpenRev Security Audit
 * Scans the repo for hardcoded secrets, sensitive file types, risky dependency
 * patterns, and security-sensitive code paths. Read-only; prints findings.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '_build']);
const SECRET_PATTERNS = [
  { name: 'OpenAI sk- key', re: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{20,}/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub token', re: /ghp_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,}/ },
  { name: 'Private key block', re: /-----BEGIN (RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY-----/ },
  { name: 'Slack token', re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
  { name: 'Generic assignment', re: /(API_KEY|APITOKEN|SECRET|PASSWORD|RESEND_API_KEY)\s*[:=]\s*["'][A-Za-z0-9_\-]{12,}["']/i }
];
const SENSITIVE_FILES = /\.(env|pem|key|p12|p8|pfx|cer)$/i;
const NODE_IMPORT = /from\s+['"]node:/;

function walk(dir, out = []) {
  for (const ent of readdirSync(dir)) {
    if (IGNORE.has(ent)) continue;
    const p = join(dir, ent);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function listTracked() {
  try {
    return execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
      .split('\n')
      .filter(Boolean)
      .filter((f) => !IGNORE.has(f.split('/')[0]));
  } catch {
    return walk('.');
  }
}

const findings = { secrets: [], sensitiveFiles: [], nodeImports: [] };
const files = listTracked();

for (const f of files) {
  if (SENSITIVE_FILES.test(f)) findings.sensitiveFiles.push(f);
  let content;
  try {
    content = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  for (const pat of SECRET_PATTERNS) {
    const m = content.match(pat.re);
    if (m) {
      findings.secrets.push({ file: f, type: pat.name, match: m[0].slice(0, 24) + '…' });
    }
  }
  if (/\.(ts|js|mjs)$/.test(f) && NODE_IMPORT.test(content)) {
    findings.nodeImports.push(f);
  }
}

console.log('=== SECURITY AUDIT ===\n');
console.log(`Tracked files scanned: ${files.length}`);

console.log('\n--- 1. Hardcoded secrets ---');
if (findings.secrets.length === 0) {
  console.log('NONE FOUND');
} else {
  for (const s of findings.secrets) console.log(`  ${s.file}: ${s.type} (${s.match})`);
}

console.log('\n--- 2. Sensitive file types committed ---');
if (findings.sensitiveFiles.length === 0) {
  console.log('NONE FOUND');
} else {
  for (const s of findings.sensitiveFiles) console.log(`  ${s}`);
}

console.log('\n--- 3. Files importing node:* builtins (browser-incompatible) ---');
console.log(`  count: ${findings.nodeImports.length}`);
console.log('  (informational — core is Node-only; UI/desktop are experimental and cannot bundle these)');

console.log('\n--- 4. Dependency snapshot ---');
try {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const pkgs = Object.keys(lock.packages || {}).length;
  console.log(`  packages in lockfile: ${pkgs}`);
  const devDeps = ['tsx', 'typescript', '@types/node'];
  for (const d of devDeps) {
    const v = lock.packages?.['']?.devDependencies?.[d];
    if (v) console.log(`  devDep ${d}: ${v}`);
  }
} catch {
  console.log('  (no lockfile readable)');
}

console.log('\n--- 5. Security-sensitive code paths (informational) ---');
const paths = [
  'packages/core/src/format/zip_reader.ts',
  'packages/core/src/format/axml_decoder.ts',
  'packages/core/src/db/sqlite_workspace.ts',
  'packages/core/src/security/sanitizer.ts',
  'packages/adapters/runtime.ts',
  'packages/core/src/artifacts/artifact_store.ts'
];
for (const p of paths) console.log(`  ${p}`);
