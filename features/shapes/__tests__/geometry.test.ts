import { shapePath, SHAPE_NAMES, type ShapeName } from '../geometry';

/**
 * The shapes are generated, so what is worth pinning is that every one stays
 * inside its box and closes. A path that overflows crops against the next
 * card; one that does not close fills wrong.
 */
describe('Expressive shape geometry', () => {
  const points = (d: string) =>
    [...d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

  it.each(SHAPE_NAMES)('%s stays inside its box', (name: ShapeName) => {
    const size = 64;
    const all = points(shapePath(name, size));
    expect(all.length).toBeGreaterThan(4);
    for (const [x, y] of all) {
      // Control points reach furthest; a little outside the box is the curve
      // bowing, not an escape.
      expect(x).toBeGreaterThan(-size * 0.2);
      expect(x).toBeLessThan(size * 1.2);
      expect(y).toBeGreaterThan(-size * 0.2);
      expect(y).toBeLessThan(size * 1.2);
    }
  });

  it.each(SHAPE_NAMES)('%s closes', (name: ShapeName) => {
    expect(shapePath(name, 40).endsWith('Z')).toBe(true);
  });

  it('scales with the size it is given', () => {
    const small = points(shapePath('clover', 20));
    const large = points(shapePath('clover', 80));
    const spread = (p: readonly (readonly [number, number])[]) =>
      Math.max(...p.map(([x]) => x)) - Math.min(...p.map(([x]) => x));
    expect(spread(large) / spread(small)).toBeCloseTo(4, 1);
  });

  it('gives each shape its own outline', () => {
    const paths = SHAPE_NAMES.map((n) => shapePath(n, 48));
    expect(new Set(paths).size).toBe(SHAPE_NAMES.length);
  });
});
