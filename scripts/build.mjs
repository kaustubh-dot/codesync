import { cp, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

await rm('build', { recursive: true, force: true });
await mkdir('build', { recursive: true });
await cp('public', 'build', { recursive: true });

await build({
  absWorkingDir: process.cwd(),
  entryPoints: [
    { in: 'src/index.tsx', out: 'main' },
    { in: 'src/background.ts', out: 'background' },
    { in: 'src/scripts/leetcode.ts', out: 'leetcode' },
    { in: 'src/scripts/codeforces.ts', out: 'codeforces' },
  ],
  outdir: './build',
  entryNames: 'static/scripts/[name]',
  assetNames: 'static/media/[name]-[hash]',
  publicPath: '.',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome102',
  minify: true,
  legalComments: 'none',
  loader: {
    '.css': 'css',
  },
});
