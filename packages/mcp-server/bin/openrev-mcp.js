#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const child = spawn(
  process.execPath,
  ['--import', 'tsx', '--no-warnings', entry],
  { stdio: 'inherit' }
);

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('[openrev-mcp] Failed to start:', err);
  process.exit(1);
});
