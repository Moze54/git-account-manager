import os from 'node:os';
import path from 'node:path';

export const GAM_DIR = path.join(os.homedir(), '.git-account-manager');
export const ACCOUNTS_FILE = path.join(GAM_DIR, 'accounts.json');
export const SSH_DIR = path.join(os.homedir(), '.ssh');
export const SSH_CONFIG = path.join(SSH_DIR, 'config');

// Managed section markers inside ~/.ssh/config. Only content between these
// two lines is ever modified by gam; anything outside is left untouched.
export const BLOCK_BEGIN = '# >>> gam >>> do not edit; managed by git-account-manager';
export const BLOCK_END = '# <<< gam <<<';

export const PLATFORMS = {
  github: { host: 'github.com', label: 'GitHub' },
  gitee: { host: 'gitee.com', label: 'Gitee' },
  gitlab: { host: 'gitlab.com', label: 'GitLab' },
};
