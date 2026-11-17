import { allAccounts, findAccount, bindRepo } from '../accounts.js';
import { repoRoot, remotes, remoteUrl, setRemoteUrl, setLocal, getLocal } from '../gitrepo.js';
import { rewriteToAlias } from '../url.js';
import { ok, fail } from '../style.js';

export function useCommand(accountName, opts) {
  const root = repoRoot();
  if (!root) throw new Error('not inside a git repository');

  const account = findAccount(accountName);
  if (!account) {
    const names = allAccounts().map((a) => a.name);
    throw new Error(
      `account "${accountName}" not found. Available: ${names.join(', ') || '(none — run "gam add")'}`,
    );
  }

  const remoteName = opts.remote ?? 'origin';
  const url = remoteUrl(remoteName);
  if (!url) {
    const list = remotes();
    throw new Error(
      `remote "${remoteName}" not found. Available remotes: ${list.join(', ') || '(none)'}`,
    );
  }

  const newUrl = rewriteToAlias(url, account.alias);
  if (!newUrl) throw new Error(`cannot parse remote URL: ${url}`);

  setRemoteUrl(remoteName, newUrl);
  setLocal('user.name', account.gitName);
  setLocal('user.email', account.email);
  bindRepo(account.name, root);

  console.log(ok(`✓ Repo bound to account "${account.name}"`));
  console.log(`  remote ${remoteName} : ${fail(url)} → ${ok(newUrl)}`);
  console.log(`  user.name  : ${getLocal('user.name')}`);
  console.log(`  user.email : ${getLocal('user.email')}`);
  console.log();
  console.log(`Commits and pushes in this repo now use "${account.name}".`);
  console.log(`Push will only work after the public key is added to ${account.host} (gam test ${account.name}).`);
}
