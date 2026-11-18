import { allAccounts, findAccount, bindRepo } from '../accounts.js';
import { repoRoot, remotes, remoteUrl, setRemoteUrl, setLocal, getLocal } from '../gitrepo.js';
import { parseRemoteUrl, rewriteToAlias } from '../url.js';
import { ok, fail, warn } from '../style.js';

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

  const info = parseRemoteUrl(url);
  if (!info) throw new Error(`cannot parse remote URL: ${url}`);

  const newUrl = rewriteToAlias(url, account.alias);
  if (!newUrl) throw new Error(`cannot parse remote URL: ${url}`);

  // Safety guard: rewriting is host-blind, so binding e.g. a GitHub repo to a
  // company account would silently send it to the company server. Only allow
  // the account's own host (or its alias, for idempotent re-binding) unless
  // the caller explicitly forces it.
  const remoteHost = info.host.toLowerCase();
  const accountHost = String(account.host ?? '').toLowerCase();
  const ownsHost = remoteHost === accountHost || remoteHost === account.alias.toLowerCase();

  if (!ownsHost && !opts.force) {
    throw new Error(
      `remote "${remoteName}" points to ${info.host}, but account "${account.name}" manages ${account.host}; ` +
        'refusing to rewrite it to the wrong server (use --force to override)',
    );
  }
  if (ownsHost && info.port && Number(info.port) !== Number(account.port ?? 22) && !opts.force) {
    throw new Error(
      `remote "${remoteName}" uses port ${info.port}, but account "${account.name}" is configured for port ${account.port}; ` +
        'refusing to rewrite it (use --force to override)',
    );
  }
  if (!ownsHost && opts.force) {
    console.log(warn(`⚠ Forcing rewrite: ${info.host} → ${account.host} (${account.alias})`));
  }

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
