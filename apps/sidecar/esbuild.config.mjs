import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/bundle.mjs',
  sourcemap: true,
  minify: false,
  // Native addons cannot be bundled
  external: ['better-sqlite3', 'argon2'],
  // Resolve workspace packages
  alias: {
    '@obs-tuya/shared': '../../packages/shared/src/index.ts',
  },
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
  },
})

console.log('Bundle created: dist/bundle.mjs')
