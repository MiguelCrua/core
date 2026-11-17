import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const target = new URL('../.cloudflare-assets/', import.meta.url);
await rm(target, { recursive: true, force: true });
await cp(new URL('dist/', root), target, { recursive: true });
await mkdir(new URL('__private/', target));
await cp(new URL('private/Core - Workbook.pdf', root), new URL('__private/workbook.pdf', target));
console.log('CORE prêt pour Cloudflare.');
