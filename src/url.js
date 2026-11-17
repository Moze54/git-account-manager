// Parse a git remote URL into { host, path } regardless of its scheme.
// Supports: git@host:path, ssh://git@host[:port]/path, https://host[:port]/path
export function parseRemoteUrl(url) {
  let m = url.match(/^git@([^:/]+):(.+)$/);
  if (m) return { host: m[1], path: m[2] };
  m = url.match(/^ssh:\/\/git@([^/:]+)(?::\d+)?\/(.+)$/);
  if (m) return { host: m[1], path: m[2] };
  m = url.match(/^https?:\/\/([^/:]+)(?::\d+)?\/(.+)$/);
  if (m) return { host: m[1], path: m[2] };
  return null;
}

// Rewrite a remote URL to the alias form: git@<alias>:<original path>.
// The alias is a Host entry in ~/.ssh/config that routes to the right key.
export function rewriteToAlias(url, alias) {
  const info = parseRemoteUrl(url);
  if (!info) return null;
  return `git@${alias}:${info.path}`;
}

// Extract the Host alias from a rewritten remote URL, or null if it is not
// in alias form.
export function aliasFromUrl(url) {
  const m = url.match(/^git@([^:]+):/);
  return m ? m[1] : null;
}
