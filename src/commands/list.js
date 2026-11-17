import { allAccounts } from '../accounts.js';
import { dim, bold } from '../style.js';

export function listCommand() {
  const accounts = allAccounts();
  if (accounts.length === 0) {
    console.log('No accounts yet. Add one with: gam add');
    return;
  }
  const cols = {
    name: 'NAME',
    email: 'EMAIL',
    platform: 'PLATFORM',
    alias: 'SSH ALIAS',
    key: 'KEY',
    repos: 'REPOS',
  };
  const rows = accounts.map((a) => ({
    name: a.name,
    email: a.email,
    platform: a.platform,
    alias: `git@${a.alias}`,
    key: a.keyPath,
    repos: String((a.repos ?? []).length),
  }));
  const width = {};
  for (const k of Object.keys(cols)) {
    width[k] = Math.max(cols[k].length, ...rows.map((r) => r[k].length));
  }
  const line = (r) =>
    Object.keys(cols)
      .map((k) => r[k].padEnd(width[k]))
      .join('  ');
  console.log(bold(line(cols)));
  for (const r of rows) console.log(line(r));
  console.log();
  console.log(dim(`Total: ${accounts.length} account(s). Use "gam use <name>" inside a repo to bind it.`));
}
