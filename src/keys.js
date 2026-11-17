import fs from 'node:fs';
import path from 'node:path';
import { SSH_DIR } from './config.js';
import { run } from './run.js';

export function keyPathFor(name) {
  return path.join(SSH_DIR, `gacc_${name}`);
}

export function generateKey({ name, email }) {
  const p = keyPathFor(name);
  if (fs.existsSync(p)) throw new Error(`key already exists: ${p}`);
  fs.mkdirSync(SSH_DIR, { recursive: true });
  const r = run('ssh-keygen', ['-t', 'ed25519', '-f', p, '-N', '', '-C', email]);
  if (r.code !== 0) throw new Error(`ssh-keygen failed: ${r.stderr.trim()}`);
  return p;
}

export function importKey(srcPath, name) {
  const src = path.resolve(srcPath);
  if (!fs.existsSync(src)) throw new Error(`private key not found: ${src}`);
  const pub = src + '.pub';
  if (!fs.existsSync(pub)) throw new Error(`matching public key not found: ${pub}`);
  const dest = keyPathFor(name);
  if (fs.existsSync(dest)) throw new Error(`key already exists: ${dest}`);
  fs.mkdirSync(SSH_DIR, { recursive: true });
  fs.copyFileSync(src, dest);
  fs.copyFileSync(pub, dest + '.pub');
  return dest;
}

export function readPublicKey(name) {
  const p = keyPathFor(name) + '.pub';
  if (!fs.existsSync(p)) throw new Error(`public key not found: ${p}`);
  return fs.readFileSync(p, 'utf8').trim();
}

export function deleteKey(name) {
  const p = keyPathFor(name);
  fs.unlinkSync(p);
  try {
    fs.unlinkSync(p + '.pub');
  } catch {
    // public key missing is fine at this point
  }
}
