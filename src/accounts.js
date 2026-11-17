import fs from 'node:fs';
import { ACCOUNTS_FILE, GAM_DIR } from './config.js';

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    if (!Array.isArray(data.accounts)) throw new Error('bad shape');
    return data;
  } catch {
    return { accounts: [] };
  }
}

function save(data) {
  fs.mkdirSync(GAM_DIR, { recursive: true });
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2) + '\n');
}

export function allAccounts() {
  return load().accounts;
}

export function findAccount(name) {
  return allAccounts().find((a) => a.name === name) ?? null;
}

export function upsertAccount(account) {
  const data = load();
  const i = data.accounts.findIndex((a) => a.name === account.name);
  if (i >= 0) data.accounts[i] = account;
  else data.accounts.push(account);
  save(data);
}

export function deleteAccount(name) {
  const data = load();
  data.accounts = data.accounts.filter((a) => a.name !== name);
  save(data);
}

// Record that `repoPath` is now bound to account `name`; drop the repo from
// every other account so the bookkeeping always reflects the live binding.
export function bindRepo(name, repoPath) {
  const data = load();
  for (const a of data.accounts) {
    a.repos = (a.repos ?? []).filter((p) => p !== repoPath);
  }
  const account = data.accounts.find((a) => a.name === name);
  if (account) {
    account.repos = account.repos ?? [];
    account.repos.push(repoPath);
  }
  save(data);
}
