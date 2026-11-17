import { allAccounts } from '../accounts.js';
import { repoRoot, remotes, remoteUrl, getLocal } from '../gitrepo.js';
import { aliasFromUrl } from '../url.js';
import { ok, dim, warn } from '../style.js';

export function currentCommand(opts) {
  const root = repoRoot();
  if (!root) throw new Error('not inside a git repository');

  const remoteName = opts.remote ?? 'origin';
  let url = remoteUrl(remoteName);
  if (!url) {
    const list = remotes();
    if (list.length === 0) throw new Error('this repo has no remotes');
    url = remoteUrl(list[0]);
  }

  const alias = aliasFromUrl(url);
  const account = alias
    ? allAccounts().find((a) => a.alias === alias) ?? null
    : null;

  if (!account) {
    console.log(warn('This repo is NOT bound to any gam account.'));
    console.log(`  remote: ${url}`);
    console.log(`Bind one with: gam use <account>`);
    return;
  }

  console.log(ok(`Bound account: ${account.name}`));
  console.log(`  remote     : ${url}`);
  console.log(`  user.name  : ${getLocal('user.name') ?? dim('(not set)')}`);
  console.log(`  user.email : ${getLocal('user.email') ?? dim('(not set)')}`);
}
