import { findAccount } from '../accounts.js';
import { run } from '../run.js';
import { ok, fail, dim, warn } from '../style.js';

// Platforms and self-hosted servers report success differently; some reject
// shell access entirely after a successful auth ("shell request failed"), so
// we cannot rely on "successfully authenticated" wording alone.
const SUCCESS_RE =
  /successfully authenticated|welcome to gitlab|authenticated via|\bhi there\b|shell request failed/i;
const FAILURE_RE =
  /permission denied|authentication failed|connection refused|connection closed|connection timed out|could not resolve hostname|host key verification failed|no matching host key type|no route to host|network is unreachable|too many authentication failures/i;

function meaningfulLine(out) {
  return (
    out
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('**') && !l.includes('openssh.com/pq'))[0] || ''
  );
}

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
  const line = meaningfulLine(out);

  // Exit code 0 is definitive; otherwise trust a success marker, but never
  // when the output also carries a hard failure marker (GitHub/Gitee reply
  // with success text yet exit 1).
  const succeeded =
    r.code === 0 || SUCCESS_RE.test(out) || (!FAILURE_RE.test(out) && /authenticated/i.test(out));

  if (succeeded) {
    console.log(ok(`✓ Authenticated to ${account.host}${line ? ': ' + line : ''}`));
    return;
  }

  console.log(fail(`✗ Authentication failed (exit ${r.code})`));
  if (out) console.log(dim(out));
  if (/permission denied|authentication failed/i.test(out)) {
    console.log(fail('Is the public key added to your platform account? (gam pub ' + accountName + ')'));
  } else {
    console.log(warn('Check network/SSH reachability and the Host entry for ' + account.alias + '.'));
  }
  process.exitCode = 1;
}
