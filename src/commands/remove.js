import fs from 'node:fs';
import { findAccount, deleteAccount } from '../accounts.js';
import { backupSshConfig, removeHostEntry } from '../ssh-config.js';
import { deleteKey, keyPathFor } from '../keys.js';
import { confirm } from '../prompt.js';
import { ok, warn } from '../style.js';

export async function removeCommand(accountName, opts) {
  const account = findAccount(accountName);
  if (!account) throw new Error(`account "${accountName}" not found`);

  const repos = account.repos ?? [];
  if (repos.length > 0) {
    console.log(warn(`The following ${repos.length} repo(s) are bound to this account.`));
    console.log(warn('Their remote URLs will keep pointing to a dead alias until you re-run "gam use":'));
    for (const p of repos) console.log(`  - ${p}`);
    console.log();
  }

  const purge = opts.purge ?? false;
  if (purge) {
    if (!process.stdin.isTTY && !opts.yes) {
      throw new Error('--purge deletes key files; in non-interactive shells add --yes to confirm');
    }
    if (process.stdin.isTTY && !opts.yes) {
      const q = `Permanently delete private key ${account.keyPath}?`;
      if (!(await confirm(q))) {
        console.log('Aborted. Key file kept.');
        return;
      }
    }
  }

  backupSshConfig();
  removeHostEntry(account.alias);
  deleteAccount(account.name);

  if (purge) {
    if (!fs.existsSync(keyPathFor(accountName))) {
      throw new Error(`key file not found: ${keyPathFor(accountName)}`);
    }
    deleteKey(accountName);
    console.log(ok(`✓ Account "${accountName}" removed (key files deleted).`));
  } else {
    console.log(ok(`✓ Account "${accountName}" removed (ssh config + registry).`));
    console.log(`  Key files kept on disk; delete manually if unwanted: ${account.keyPath}`);
    console.log(`  Or re-run with: gam remove ${accountName} --purge`);
  }
}
