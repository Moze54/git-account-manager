import { findAccount } from '../accounts.js';
import { readPublicKey } from '../keys.js';
import { ok, dim } from '../style.js';

export function pubCommand(accountName) {
  const account = findAccount(accountName);
  if (!account) throw new Error(`account "${accountName}" not found`);
  console.log(ok(`# public key of "${accountName}" — paste this into ${account.host}`));
  console.log(readPublicKey(accountName));
  console.log();
  console.log(dim(`Authenticating as ${account.email}`));
}
