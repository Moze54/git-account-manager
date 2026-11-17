import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { dim } from './style.js';

async function withRl(fn) {
  const rl = readline.createInterface({ input, output });
  try {
    return await fn(rl);
  } finally {
    rl.close();
  }
}

export async function ask(question, def = '') {
  const suffix = def ? dim(` [${def}]`) : '';
  const ans = await withRl((rl) => rl.question(`${question}${suffix}: `));
  return ans.trim() || def;
}

export async function choose(question, items, defaultIdx = 0) {
  console.log(question);
  items.forEach((it, i) => console.log(`  ${i + 1}. ${it}${i === defaultIdx ? dim('  (default)') : ''}`));
  const a = await withRl((rl) =>
    rl.question(`Choose 1-${items.length} (enter = ${defaultIdx + 1}): `),
  );
  const n = Number.parseInt(a, 10);
  if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1];
  return items[defaultIdx];
}

export async function confirm(question) {
  const a = await withRl((rl) => rl.question(`${question} (y/N) `));
  return /^y(es)?$/i.test(a.trim());
}
