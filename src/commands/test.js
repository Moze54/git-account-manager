import { findAccount } from '../accounts.js';
import { run } from '../run.js';
import { ok, fail, dim } from '../style.js';

const SUCCESS_RE = /successfully authenticated|Welcome to GitLab/;

export function testCommand(accountName) {
  const account = findAccount(accountName);
  if (!account) throw new Error(`account "${accountName}" not found`);

  console.log(dim(`Testing: ssh -T git@${account.alias} ...`));
  const r = run(
    'ssh',
    ['-T', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', `git@${account.alias}`],
    { timeout: 30000 },
  );
  const out = (r.stdout + '\n' + r.stderr).trim();
  const firstLine = out.split('\n')[0] || '';

  // GitHub/Gitee reply with success text but exit code 1, so we match on output.
  if (SUCCESS_RE.test(out)) {
    console.log(ok(`✓ Authenticated to ${account.host}${firstLine ? ': ' + firstLine : ''}`));
    return;
  }
  console.log(fail(`✗ Authentication failed (exit ${r.code})`));
  if (out) console.log(dim(out));
  console.log(fail('Is the public key added to your platform account? (gam pub ' + accountName + ')'));
  process.exitCode = 1;
}
