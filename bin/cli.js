#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from '../src/commands/add.js';
import { listCommand } from '../src/commands/list.js';
import { useCommand } from '../src/commands/use.js';
import { currentCommand } from '../src/commands/current.js';
import { pubCommand } from '../src/commands/pub.js';
import { testCommand } from '../src/commands/test.js';
import { removeCommand } from '../src/commands/remove.js';
import { fail } from '../src/style.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version, description } = require('../package.json');

const program = new Command();
program
  .name('gam')
  .description(description)
  .version(version);

program
  .command('add')
  .description('add a git account (generates or imports an SSH key)')
  .option('-n, --name <name>', 'unique account name')
  .option('-e, --email <email>', 'commit email')
  .option('-g, --git-name <name>', 'commit display name (git user.name)')
  .option('-p, --platform <platform>', 'github | gitee | gitlab | custom')
  .option('-H, --host <host>', 'git server host (custom platform)')
  .option('--port <port>', 'SSH port (custom platform, default 22)')
  .option('-k, --key <path>', 'import an existing private key instead of generating one')
  .action(addCommand);

program
  .command('list')
  .alias('ls')
  .description('list all accounts')
  .action(listCommand);

program
  .command('use <account>')
  .description('bind the current repo to an account (local user + remote URL)')
  .option('-r, --remote <name>', 'remote name to rewrite', 'origin')
  .action(useCommand);

program
  .command('current')
  .description('show which account the current repo is bound to')
  .option('-r, --remote <name>', 'remote name to inspect', 'origin')
  .action(currentCommand);

program
  .command('pub <account>')
  .description('print the account public key')
  .action(pubCommand);

program
  .command('test <account>')
  .description('verify platform authentication for an account')
  .action(testCommand);

program
  .command('remove <account>')
  .alias('rm')
  .description('remove an account (keeps key files unless --purge)')
  .option('--purge', 'also delete the key files', false)
  .option('-y, --yes', 'skip interactive confirmation (for scripts)', false)
  .action(removeCommand);

program.parseAsync().catch((e) => {
  console.error(fail(`✗ ${e.message}`));
  process.exit(1);
});
