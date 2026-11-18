import fs from 'node:fs';
import { SSH_CONFIG, SSH_DIR, BLOCK_BEGIN, BLOCK_END } from './config.js';

function readRaw() {
  try {
    return fs.readFileSync(SSH_CONFIG, 'utf8');
  } catch {
    return '';
  }
}

export function backupSshConfig() {
  try {
    fs.copyFileSync(SSH_CONFIG, SSH_CONFIG + '.bak');
  } catch {
    // no config file yet, nothing to back up
  }
}

// Split raw config text into: before the managed block, inside it, after it.
// A missing or unterminated block is treated as an empty block so the next
// write recreates it properly.
function splitBlock(raw) {
  const i = raw.indexOf(BLOCK_BEGIN);
  if (i === -1) return { before: raw, inside: '', after: '' };
  const j = raw.indexOf(BLOCK_END, i + BLOCK_BEGIN.length);
  if (j === -1) return { before: raw, inside: '', after: raw.slice(i) };
  return {
    before: raw.slice(0, i),
    inside: raw.slice(i + BLOCK_BEGIN.length, j),
    after: raw.slice(j + BLOCK_END.length),
  };
}

function segments(inside) {
  // Entries start at a line beginning with "Host ". Split keeping the delimiter.
  return inside
    .split(/(?=^Host )/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildHostEntry(acc) {
  const lines = [
    `Host ${acc.alias}`,
    `    HostName ${acc.host}`,
  ];
  if (acc.port && acc.port !== 22) lines.push(`    Port ${acc.port}`);
  lines.push(
    `    User git`,
    `    IdentityFile ${acc.keyPath}`,
    `    IdentitiesOnly yes`,
  );
  // Per-account extra ssh_config lines (e.g. legacy key algorithms required by
  // self-hosted servers). Rendered inside the managed block so `gam remove`
  // cleans them up with the rest of the entry.
  for (const opt of acc.sshOptions ?? []) lines.push(`    ${opt}`);
  return lines.join('\n');
}

function writeBlock(before, segs, after) {
  fs.mkdirSync(SSH_DIR, { recursive: true });
  let out;
  if (segs.length === 0) {
    out = before + after;
  } else {
    const inside = '\n' + segs.join('\n\n') + '\n';
    out = before + BLOCK_BEGIN + inside + BLOCK_END + after;
  }
  fs.writeFileSync(SSH_CONFIG, out.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
}

export function upsertHostEntry(acc) {
  const { before, inside, after } = splitBlock(readRaw());
  const entry = buildHostEntry(acc);
  const segs = segments(inside).filter(
    (s) => s !== `Host ${acc.alias}` && !s.startsWith(`Host ${acc.alias}\n`),
  );
  segs.push(entry);
  writeBlock(before, segs, after);
}

export function removeHostEntry(alias) {
  const raw = readRaw();
  if (!raw.includes(BLOCK_BEGIN)) return;
  const { before, inside, after } = splitBlock(raw);
  const segs = segments(inside).filter(
    (s) => s !== `Host ${alias}` && !s.startsWith(`Host ${alias}\n`),
  );
  writeBlock(before, segs, after);
}
