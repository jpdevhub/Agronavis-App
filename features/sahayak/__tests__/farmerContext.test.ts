import { buildSahayakPrompt } from '../farmerContext';

const farmer = {
  id: 'f1', email: 'a@b.c', fullName: 'Karan Singh', phone: null, language: 'hi',
  state: 'West Bengal', district: 'Hooghly', village: 'Kanthadhar', avatarUrl: null,
  landHoldingAcres: null, primaryCrops: ['Rice'], irrigationType: 'drip', soilType: null,
  onboardingComplete: true, twoFactorEnabled: false, yearsOfExperience: null,
  createdAt: '2026-01-01',
} as never;

const empty = {
  farmer: undefined, fields: undefined, weather: undefined,
  soil: undefined, advisories: [],
};

describe('buildSahayakPrompt', () => {
  it('tells the model what the platform can do', () => {
    const prompt = buildSahayakPrompt(empty);
    expect(prompt).toContain('Agronavis can do the following');
    expect(prompt).toContain('mandi prices');
  });

  it('omits facts it does not have rather than inventing them', () => {
    const prompt = buildSahayakPrompt(empty);
    expect(prompt).not.toContain('Location:');
    expect(prompt).not.toMatch(/undefined|null/);
  });

  it('includes only the farm details that exist', () => {
    const prompt = buildSahayakPrompt({ ...empty, farmer });
    expect(prompt).toContain('Karan Singh');
    expect(prompt).toContain('Kanthadhar, Hooghly, West Bengal');
    expect(prompt).toContain('Irrigation: drip');
    expect(prompt).not.toContain('Soil type:');
  });

  it('describes the screen the farmer is on', () => {
    const prompt = buildSahayakPrompt({ ...empty, farmer, pathname: '/(tabs)/farm/map' });
    expect(prompt).toContain('Map a field screen');
    expect(prompt).toContain('tap four corners');
  });

  it('matches a nested route before its parent', () => {
    expect(buildSahayakPrompt({ ...empty, pathname: '/(tabs)/scan/result' }))
      .toContain('Scan result screen');
    expect(buildSahayakPrompt({ ...empty, pathname: '/(tabs)/farm' }))
      .toContain('My Farms screen');
  });

  it('reports real measurements when they are present', () => {
    const prompt = buildSahayakPrompt({
      ...empty,
      farmer,
      fields: [{ id: '1', farmId: 'f', name: 'North', areaAcres: 2.5, areaHectares: 1,
                 centerLatitude: 22.7, centerLongitude: 88.3, polygon: null, createdAt: '' }] as never,
      weather: { temp: 29.4, description: 'broken clouds', humidity: 87 } as never,
    });
    expect(prompt).toContain('2.50 acres across 1 mapped field(s)');
    expect(prompt).toContain('29°C, broken clouds, humidity 87%');
  });
});
