import { asksAboutPrices, mandiFacts } from '../mandiFacts';
import type { QueryClient } from '@tanstack/react-query';

jest.mock('@/services/endpoints', () => ({
  marketApi: { mandi: jest.fn() },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { marketApi } = require('@/services/endpoints');

/**
 * Rates reach Sahayak only when someone asks for them, and when they do they
 * have to be the real ones.
 *
 * A model asked what wheat is selling for will answer with a number whether
 * or not it knows one. A farmer who carts a crop to market on an invented
 * price has lost a day and the cartage, so every path that cannot produce a
 * real figure has to tell the model to say so rather than estimate.
 */

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  commodity: 'Wheat', variety: 'Dara', state: 'Punjab', district: 'Ludhiana', market: 'Khanna',
  minPrice: 2200, maxPrice: 2600, modalPrice: 2425, unit: '₹/quintal',
  marketsReporting: 7, markets: ['Khanna'], arrivalDate: '2026-10-21', ...over,
});

const emptyClient = () => ({
  getQueryData: jest.fn(() => undefined),
  setQueryData: jest.fn(),
}) as unknown as QueryClient;

beforeEach(() => jest.clearAllMocks());

describe('noticing a price question', () => {
  it.each([
    'what is the mandi rate for wheat',
    'Wheat ka bhav kya hai',
    'गेहूं का भाव क्या है',
    'আজ ধানের দাম কত',
    'how much per quintal should I sell at',
    'what is my paddy worth right now',
  ])('catches %j', (q) => {
    expect(asksAboutPrices(q)).toBe(true);
  });

  it.each([
    'when should I irrigate my field',
    'my leaves have yellow spots',
    'will it rain tomorrow',
    // "rate" inside another word must not trigger a network call.
    'how do I generate a soil report',
  ])('leaves %j alone', (q) => {
    expect(asksAboutPrices(q)).toBe(false);
  });
});

describe('the facts handed to the model', () => {
  it('gives every rate in both quintal and kg', async () => {
    marketApi.mandi.mockResolvedValue({ rows: [row()], source: 'agmarknet', state: 'Punjab', district: 'Ludhiana' });

    const lines = (await mandiFacts(emptyClient(), { state: 'Punjab', district: 'Ludhiana' })).join('\n');

    expect(lines).toContain('₹2,425 per quintal');
    // 2425 / 100. A farmer sells by the kg and the rate is quoted by the
    // quintal, so doing the division wrong is a hundredfold error.
    expect(lines).toContain('₹24.25 per kg');
    expect(lines).toContain('A quintal is 100 kg');
  });

  it('names the range and how many mandis reported it', async () => {
    marketApi.mandi.mockResolvedValue({ rows: [row()], source: 'agmarknet', state: 'Punjab', district: 'Ludhiana' });

    const lines = (await mandiFacts(emptyClient(), { state: 'Punjab' })).join('\n');

    expect(lines).toContain('₹2,200–₹2,600 per quintal');
    expect(lines).toContain('from 7 mandis');
  });

  it('forbids quoting a crop that is not listed', async () => {
    marketApi.mandi.mockResolvedValue({ rows: [row()], source: 'agmarknet', state: 'Punjab', district: 'Ludhiana' });

    const lines = (await mandiFacts(emptyClient(), { state: 'Punjab' })).join('\n');

    expect(lines).toContain('do not have its rate today');
    expect(lines).toContain('Quote only what is listed above');
  });

  it('tells the model to say nothing rather than guess when the lookup fails', async () => {
    marketApi.mandi.mockRejectedValue(new Error('offline'));

    const lines = (await mandiFacts(emptyClient(), { state: 'Punjab' })).join('\n');

    expect(lines).toContain('Do not quote a price from memory');
  });

  it('says so when no mandi has reported', async () => {
    marketApi.mandi.mockResolvedValue({ rows: [], source: 'agmarknet', state: 'Punjab', district: 'Ludhiana' });

    const lines = (await mandiFacts(emptyClient(), { state: 'Punjab', district: 'Ludhiana' })).join('\n');

    expect(lines).toContain('No mandi near Ludhiana has reported');
  });

  it('asks for a district rather than guessing when the farmer has no state', async () => {
    const lines = (await mandiFacts(emptyClient(), { state: null, district: null })).join('\n');

    expect(lines).toContain('Do not estimate a rate');
    expect(marketApi.mandi).not.toHaveBeenCalled();
  });

  it('uses what Live Mandi already fetched instead of asking again', async () => {
    const client = {
      getQueryData: jest.fn(() => ({ rows: [row()], source: 'agmarknet', state: 'Punjab', district: 'Ludhiana' })),
      setQueryData: jest.fn(),
    } as unknown as QueryClient;

    const lines = (await mandiFacts(client, { state: 'Punjab' })).join('\n');

    expect(lines).toContain('₹24.25 per kg');
    // Asking about prices after looking at them must cost nothing.
    expect(marketApi.mandi).not.toHaveBeenCalled();
  });

  it('keeps the prompt short enough not to slow the answer', async () => {
    const many = Array.from({ length: 60 }, (_, i) => row({ commodity: `Crop${i}` }));
    marketApi.mandi.mockResolvedValue({ rows: many, source: 'agmarknet', state: 'Punjab', district: '' });

    const lines = await mandiFacts(emptyClient(), { state: 'Punjab' });

    expect(lines.filter((l) => l.startsWith('- Crop')).length).toBeLessThanOrEqual(14);
  });
});
