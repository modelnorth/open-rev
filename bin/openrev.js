#!/usr/bin/env node
import { runCli } from '../packages/core/src/cli.ts';

const args = process.argv.slice(2);
const exitCode = await runCli(args).catch((err) => {
  console.error('[OpenRev CLI Error]', err);
  return 1;
});
process.exit(exitCode);
