import { run } from './run.js';

export function repoRoot() {
  const r = run('git', ['rev-parse', '--show-toplevel']);
  return r.code === 0 ? r.stdout.trim() : null;
}

export function remotes() {
  const r = run('git', ['remote']);
  return r.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function remoteUrl(name) {
  const r = run('git', ['remote', 'get-url', name]);
  return r.code === 0 ? r.stdout.trim() : null;
}

export function setRemoteUrl(name, url) {
  const r = run('git', ['remote', 'set-url', name, url]);
  if (r.code !== 0) throw new Error(`failed to update remote "${name}": ${r.stderr.trim()}`);
}

export function setLocal(key, value) {
  const r = run('git', ['config', '--local', key, value]);
  if (r.code !== 0) throw new Error(`git config ${key} failed: ${r.stderr.trim()}`);
}

export function getLocal(key) {
  const r = run('git', ['config', '--local', '--get', key]);
  return r.code === 0 ? r.stdout.trim() : null;
}
