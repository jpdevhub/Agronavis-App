// A module, not a script — see the note in rate-limit.test.ts.
export {};

import fs from 'fs';
import path from 'path';

/**
 * `@agronavis/shared-types` must stay a types-only package.
 *
 * Its `package.json` points `main` at `src/index.ts`. That is fine while every
 * import of it is an `import type`, because those vanish at compile time and
 * the built server never loads the package at all. The first real value
 * imported from it changed that: `dist/server.js` required the package, Node
 * loaded the TypeScript source, could not resolve its extensionless relative
 * imports, and the API did not boot — on a deploy whose build had just
 * reported success.
 *
 * Typechecking cannot catch it, and neither can any test that imports the
 * package itself. This reads the source.
 */

const BACKEND_SRC = path.join(__dirname, '../../src');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const offenders = sourceFiles(BACKEND_SRC).flatMap((file) => {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/^import\s+(?!type\b)([^;]*?)\s+from\s+'@agronavis\/shared-types';/gm)]
    .map((match) => ({ file: path.relative(BACKEND_SRC, file), clause: match[1].trim() }));
});

describe('the backend never imports a runtime value from shared-types', () => {
  it('uses only `import type` for it', () => {
    expect(offenders).toEqual([]);
  });

  it('the package still declares itself source-only, so the rule above still applies', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../packages/shared-types/package.json'), 'utf8'),
    ) as { main: string };

    // If this ever points at built JavaScript, the constraint is lifted and
    // this whole file can go.
    expect(pkg.main).toMatch(/\.ts$/);
  });
});

describe('the two copies of the alert list agree', () => {
  const read = (p: string) =>
    [...fs.readFileSync(path.join(__dirname, p), 'utf8')
      .slice(0, 2000)
      .matchAll(/^\s+'([a-z_]+)',$/gm)].map((m) => m[1]);

  it('backend and app offer the same categories, in the same order', () => {
    const backend = read('../../src/modules/notifications/alert-categories.ts');
    const app = read('../../../constants/alerts.ts');

    expect(backend.length).toBeGreaterThan(0);
    // A switch the app shows and the server does not know about is a switch
    // that silently does nothing.
    expect(app).toEqual(backend);
  });
});
