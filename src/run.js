import { spawnSync } from 'node:child_process';

// Run an external command (git / ssh / ssh-keygen) and return its result.
// Never throws on non-zero exit; callers decide how to handle `code`.
export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    windowsHide: true,
    ...opts,
  });
  return {
    code: res.status,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
  };
}
