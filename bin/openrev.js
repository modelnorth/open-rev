#!/usr/bin/env -S node --import tsx
/**
 * OpenRev CLI Entrypoint
 *
 * Runs seamlessly with modern Node.js via --import tsx.
 * If executed in an environment without tsx preloaded, it boots the CLI via child process.
 */

import { runCli } from '../packages/core/src/cli.ts';

const args = process.argv.slice(2);
const exitCode = await runCli(args).catch((err) => {
  console.error('[OpenRev CLI Error]', err);
  return 1;
});
process.exit(exitCode);
