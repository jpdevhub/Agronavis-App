/**
 * Material 3 Expressive shapes.
 *
 * Expressive puts meaning in silhouette, not only in colour: a reading that
 * is good and one that needs attention differ in outline before anyone reads
 * the label. The design uses these, each with a job —
 *
 *   cookie9 / cookie12  scores and actions
 *   clover / flower     soil nutrients
 *   sunny               weather and badges
 *   pentagon            a quieter badge
 *
 * They are generated rather than drawn, so one function serves every size and
 * the lobes stay even. Paths are in a 0..size box, ready for react-native-svg.
 */

export type ShapeName =
  | 'cookie9'
  | 'cookie12'
  | 'clover'
  | 'sunny'
  | 'softburst'
  | 'flower'
  | 'pentagon';

interface Spec {
  /** Lobes around the circle. */
  lobes: number;
  /**
   * Trough radius as a fraction of the crest. Lower bites deeper.
   *
   * The outline is a cosine swept around the circle — radius rises and falls
   * `lobes` times between `inner` and 1 — so every lobe is identical and the
   * curve has no corner to overshoot. Building it from arcs instead, a crest
   * arc meeting a trough arc, grows a horn at each junction.
   */
  inner: number;
  /** Plain polygon with rounded corners instead of a scallop. */
  polygon?: boolean;
  /** Corner radius as a fraction of the side, polygons only. */
  corner?: number;
  /** Turns the shape so it sits the way the design has it. */
  rotate?: number;
}

const SPECS: Record<ShapeName, Spec> = {
  cookie9: { lobes: 9, inner: 0.88 },
  cookie12: { lobes: 12, inner: 0.9 },
  clover: { lobes: 4, inner: 0.52, rotate: 45 },
  sunny: { lobes: 8, inner: 0.86 },
  softburst: { lobes: 10, inner: 0.87 },
  flower: { lobes: 8, inner: 0.66 },
  pentagon: { lobes: 5, inner: 1, polygon: true, corner: 0.22, rotate: -90 },
};

type Point = readonly [number, number];

/**
 * Catmull-Rom through the vertices, converted to cubic Béziers.
 *
 * The curve passes through every point with a tangent taken from its
 * neighbours, which is what makes a lobe plump. Bowing each edge outwards
 * instead — the obvious first attempt — gives spikes, because the curve then
 * leaves the crest at the wrong angle.
 */
function smoothClosed(points: Point[]): string {
  const n = points.length;
  const at = (i: number) => points[((i % n) + n) % n];
  const [x0, y0] = at(0);
  let d = `M${x0.toFixed(2)},${y0.toFixed(2)}`;

  for (let i = 0; i < n; i += 1) {
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [xPrev, yPrev] = at(i - 1);
    const [xNext, yNext] = at(i + 2);
    const c1x = x1 + (x2 - xPrev) / 6;
    const c1y = y1 + (y2 - yPrev) / 6;
    const c2x = x2 - (xNext - x1) / 6;
    const c2y = y2 - (yNext - y1) / 6;
    d +=
      `C${c1x.toFixed(2)},${c1y.toFixed(2)} ` +
      `${c2x.toFixed(2)},${c2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return `${d}Z`;
}

/** A regular polygon whose corners are rounded by a quadratic. */
function roundedPolygon(sides: number, r: number, cx: number, cy: number, corner: number, start: number): string {
  const verts: Point[] = Array.from({ length: sides }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / sides;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
  const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  let d = '';
  for (let i = 0; i < sides; i += 1) {
    const prev = verts[(i - 1 + sides) % sides];
    const cur = verts[i];
    const next = verts[(i + 1) % sides];
    const inFrom = lerp(cur, prev, corner);
    const outTo = lerp(cur, next, corner);
    d += i === 0 ? `M${inFrom[0].toFixed(2)},${inFrom[1].toFixed(2)}` : `L${inFrom[0].toFixed(2)},${inFrom[1].toFixed(2)}`;
    d += `Q${cur[0].toFixed(2)},${cur[1].toFixed(2)} ${outTo[0].toFixed(2)},${outTo[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

export function shapePath(name: ShapeName, size: number): string {
  const spec = SPECS[name];
  const r = size / 2;
  const cx = r;
  const cy = r;
  const start = ((spec.rotate ?? 0) * Math.PI) / 180 - Math.PI / 2;

  if (spec.polygon) {
    return roundedPolygon(spec.lobes, r, cx, cy, spec.corner ?? 0.3, start);
  }

  // Sample the cosine densely enough that the smoothing follows it rather
  // than inventing its own curve between lobes.
  const PER_LOBE = 12;
  const count = spec.lobes * PER_LOBE;
  const mid = (1 + spec.inner) / 2;
  const amp = (1 - spec.inner) / 2;

  const points: Point[] = Array.from({ length: count }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / count;
    const radius = r * (mid + amp * Math.cos(spec.lobes * (a - start)));
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)] as const;
  });

  return smoothClosed(points);
}

/** Every shape the design uses, for a gallery or a test. */
export const SHAPE_NAMES = Object.keys(SPECS) as ShapeName[];
