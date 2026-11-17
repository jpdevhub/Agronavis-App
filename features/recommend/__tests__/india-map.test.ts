import { geoArea, geoBounds, geoMercator } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';

const india = require('@/assets/geo/india-states.json') as FeatureCollection<Geometry, { name: string }>;

/**
 * The boundary file itself.
 *
 * d3 reads polygons on a sphere, where a ring wound the wrong way means the
 * whole globe minus that shape. A file wound the other way still parses, still
 * draws, and still fits — to the world, which collapses India to a dot. The
 * area check below is the only cheap way to catch it, so it guards every
 * future replacement of this asset.
 */
describe('the India boundary asset', () => {
  it('holds every state and union territory', () => {
    expect(india.features.length).toBeGreaterThanOrEqual(36);
    expect(india.features.every((f) => f.properties.name)).toBe(true);
  });

  it('is wound the way d3 reads a sphere', () => {
    // India covers ~0.08 steradians of a 12.57-steradian sphere. A reversed
    // ring reads as the complement and lands in the thousands.
    expect(geoArea(india)).toBeGreaterThan(0.05);
    expect(geoArea(india)).toBeLessThan(0.12);
  });

  it('stays inside India', () => {
    const [[west, south], [east, north]] = geoBounds(india);
    expect(west).toBeGreaterThan(66);   // west of Gujarat
    expect(east).toBeLessThan(98);      // east of Arunachal
    expect(south).toBeGreaterThan(6);   // Indira Point
    expect(north).toBeLessThan(38);     // Ladakh
  });

  it('projects to a shape that fills the phone, not a speck', () => {
    const projection = geoMercator().fitSize([390, 429], india);
    // Fitting the whole world into 390px gives a scale of 62. Anything near
    // that means the fit failed, whatever the file looks like on inspection.
    expect(projection.scale()).toBeGreaterThan(400);
  });

  it('names the states the recommendation API answers for', () => {
    const names = india.features.map((f) => f.properties.name);
    for (const state of ['West Bengal', 'Meghalaya', 'Karnataka', 'Bihar', 'Punjab', 'Tamil Nadu']) {
      expect(names).toContain(state);
    }
  });
});
