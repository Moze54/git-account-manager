import { PLATFORMS } from '../config.js';
import { allAccounts, findAccount, upsertAccount } from '../accounts.js';
import { backupSshConfig, upsertHostEntry } from '../ssh-config.js';
import { generateKey, importKey, readPublicKey } from '../keys.js';
import { ask, choose } from '../prompt.js';
import { ok, warn, dim, bold } from '../style.js';

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function aliasFor(platform, host, name) {
  const label = platform === 'custom' ? host.split('.')[0] : platform;
  return `${label}-${name}`;
}

export async function addCommand(opts) {
  let { name, email, gitName, platform, host, port, key, sshOption } = opts;

  // Anything missing means we would need interactive prompts; refuse in
  // non-TTY contexts (scripts/CI) instead of hanging on stdin.
  const needsPrompt = !name || !email || !platform || (platform === 'custom' && !host);
  if (needsPrompt && !process.stdin.isTTY) {
    throw new Error(
      'interactive input is required but stdin is not a terminal; provide all options (-n/-e/-p/[-H/--port]) instead',
    );
  }

  if (!name) name = await ask('Account name (unique id, e.g. muzi-work)');
  if (!NAME_RE.test(name)) {
    throw new Error(`invalid account name "${name}": letters, digits, "-" and "_" only`);
  }
  if (findAccount(name)) throw new Error(`account "${name}" already exists`);

  if (!email) email = await ask('Email (used for git commits)');
  if (!email.includes('@')) throw new Error(`invalid email "${email}"`);

  if (!platform) {
    platform = await choose(
      'Platform:',
      [...Object.keys(PLATFORMS), 'custom'],
    );
  }
  if (!['github', 'gitee', 'gitlab', 'custom'].includes(platform)) {
    throw new Error(`unknown platform "${platform}" (github | gitee | gitlab | custom)`);
  }

  if (platform === 'custom') {
    while (!host) host = await ask('Git server host (e.g. git.example.com)');
    if (!port) port = await ask('SSH port (enter = 22)', '22');
  }

  if (!gitName && process.stdin.isTTY) {
    gitName = await ask('Commit display name (git user.name)', name);
  }
  gitName = gitName || name;

  const extraSshOptions = (sshOption ?? []).map((s) => String(s).trim()).filter(Boolean);
  for (const opt of extraSshOptions) {
    if (/[\r\n]/.test(opt)) throw new Error('--ssh-option must be a single-line ssh_config directive');
  }

  const keyPath = key ? importKey(key, name) : generateKey({ name, email });
  const account = {
    name,
    email,
    gitName,
    platform,
    host: platform === 'custom' ? host : PLATFORMS[platform].host,
    port: Number(port) || 22,
    alias: aliasFor(platform, host, name),
    keyPath,
    sshOptions: extraSshOptions,
    repos: [],
    createdAt: new Date().toISOString(),
  };

  backupSshConfig();
  upsertHostEntry(account);
  upsertAccount(account);

  console.log();
  console.log(ok(`✓ Account "${name}" added.`));
  console.log(`  alias      : ${account.alias}`);
  console.log(`  ssh key    : ${account.keyPath}`);
  console.log(`  ssh config : ${account.alias} entry written (backup at config.bak)`);
  if (extraSshOptions.length > 0) {
    console.log(`  ssh opts   : ${extraSshOptions.join(' | ')}`);
  }
  console.log();
  console.log(bold('Next steps:'));
  console.log('  1. Add this public key to your git platform:');
  console.log();
  console.log(dim(readPublicKey(name)));
  console.log();
  console.log(`  2. Verify authentication:  gam test ${name}`);
  console.log(`  3. Bind a repo:            cd <repo> && gam use ${name}`);

  if (!key && !process.env.GAM_SMOKE) {
    // freshly generated keys have no passphrase; surface the hardening tip
    console.log();
    console.log(warn('Note: the new key has no passphrase. Fine for dev machines;'));
    console.log('      harden it later with: ssh-keygen -p -f ' + account.keyPath);
  }
}
