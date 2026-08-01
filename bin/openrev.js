#!/usr/bin/env node
import { runCli } from '../packages/core/src/cli.ts';

const args = process.argv.slice(2);
runCli(args).catch((err) => {
  console.error('[OpenRev CLI Error]', err);
  process.exit(1);
});
