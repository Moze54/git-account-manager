import { styleText } from 'node:util';

export const ok = (s) => styleText('green', s);
export const fail = (s) => styleText('red', s);
export const warn = (s) => styleText('yellow', s);
export const dim = (s) => styleText('gray', s);
export const bold = (s) => styleText('bold', s);
