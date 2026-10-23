import type { QueryClient } from '@tanstack/react-query';
import type { MandiPrice, MandiSearchResult } from '@agronavis/shared-types';
import { marketApi } from '@/services/endpoints';

/**
 * Mandi rates, fetched only when a farmer actually asks about them.
 *
 * Deliberately not part of the context Sahayak loads at open. Everything the
 * assistant knows up front comes from cache precisely so the screen appears
 * at once; adding a network call to that path is what made it slow and blank
 * before. A price question is rare enough, and specific enough, to be worth
 * one request at the moment it is asked.
 *
 * The reason to do it at all is that a language model asked "what is wheat
 * selling for" will answer with a number. Without the real figures in front
 * of it that number is invented, and a farmer who hauls a crop to market on
 * an invented price has lost a day and a cartage fee.
 */

/** A quintal is 100 kg. Rates are published per quintal; farmers sell in both. */
const KG_PER_QUINTAL = 100;

/** Enough to answer about any crop in the district, short enough to stay fast. */
const MAX_ROWS = 14;

/** Long enough for a cold API, short enough that nobody thinks it has hung. */
const TIMEOUT_MS = 7_000;

/**
 * Words that mean "what is it worth".
 *
 * Hindi and Bengali written in Latin script as well as their own, because
 * that is how people actually type on a phone keyboard they have not
 * switched.
 */
const PRICE_WORDS = [
  'price', 'prices', 'rate', 'rates', 'mandi', 'market', 'selling', 'sell',
  'worth', 'quintal', 'kg', 'kilo', 'msp', 'cost',
  'bhav', 'bhaav', 'daam', 'dam', 'kimat', 'keemat', 'mulya',
  'भाव', 'दाम', 'मंडी', 'कीमत', 'रेट', 'मूल्य',
  'দাম', 'বাজার', 'মূল্য', 'দর',
];

/** Whether this question is about what a crop is worth. */
export function asksAboutPrices(question: string): boolean {
  const text = question.toLowerCase();
  return PRICE_WORDS.some((word) => {
    // Latin words match on a boundary so "kg" does not fire inside "kgf" and
    // "rate" does not fire inside "generate"; scripts without word breaks are
    // matched plainly.
    if (!/^[a-z]+$/.test(word)) return text.includes(word);
    return new RegExp(`\\b${word}\\b`).test(text);
  });
}

const rupees = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Both units, because the rate is quoted per quintal and sold by the kg. */
function priceLine(row: MandiPrice): string {
  const perKg = row.modalPrice / KG_PER_QUINTAL;
  const name = row.variety && row.variety !== row.commodity
    ? `${row.commodity} (${row.variety})`
    : row.commodity;

  const spread = row.minPrice && row.maxPrice && row.minPrice !== row.maxPrice
    ? `, ranging ${rupees(row.minPrice)}–${rupees(row.maxPrice)} per quintal`
    : '';
  const where = row.marketsReporting > 0
    ? `, from ${row.marketsReporting} mandi${row.marketsReporting === 1 ? '' : 's'}`
    : '';

  return `- ${name}: ${rupees(row.modalPrice)} per quintal (₹${perKg.toFixed(2)} per kg)${spread}${where}`;
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('mandi lookup timed out')), TIMEOUT_MS);
      }),
    ]);
  } finally {
    // The loser of the race keeps its timer alive otherwise, which holds the
    // event loop open for seconds after every answer.
    if (timer) clearTimeout(timer);
  }
}

/**
 * The prompt lines for today's rates near this farmer, or the line that tells
 * the model it has none.
 *
 * Reads the cache the Live Mandi screen fills before asking the network, so a
 * farmer who has already looked at prices pays nothing for asking about them.
 */
export async function mandiFacts(
  queryClient: QueryClient,
  place: { state?: string | null; district?: string | null },
): Promise<string[]> {
  const state = place.state?.trim();
  if (!state) {
    return [
      '',
      'You do not have mandi rates for this farmer, because their state is not set.',
      '- Say you cannot quote a price, and that setting their district in the profile will fix it.',
      '- Do not estimate a rate.',
    ];
  }

  const key = ['market', 'mandi', state, ''];
  let result = queryClient.getQueryData<MandiSearchResult>(key);

  if (!result) {
    try {
      result = await withTimeout(
        marketApi.mandi({
          state,
          ...(place.district ? { district: place.district } : {}),
        }),
      );
      queryClient.setQueryData(key, result);
    } catch {
      return [
        '',
        "You could not reach today's mandi rates just now.",
        '- Say the rates could not be fetched and suggest the Live Mandi screen.',
        '- Do not quote a price from memory. An invented rate sends someone to market for nothing.',
      ];
    }
  }

  const rows = (result?.rows ?? []).slice(0, MAX_ROWS);
  if (rows.length === 0) {
    return [
      '',
      `No mandi near ${place.district ?? state} has reported a price recently.`,
      '- Say so plainly rather than estimating one.',
    ];
  }

  const where = result?.district || place.district || state;
  const asOf = rows[0]?.arrivalDate ? ` as last reported on ${rows[0].arrivalDate}` : '';

  return [
    '',
    `Mandi rates near ${where}${asOf}:`,
    ...rows.map(priceLine),
    '',
    'Using these rates:',
    '- Quote only what is listed above. These are the real figures.',
    '- Give both units: per quintal and per kg. A quintal is 100 kg.',
    '- If the crop they asked about is not listed, say you do not have its rate today.',
    '- These are mandi rates, not a guaranteed price; what a trader offers can differ.',
  ];
}
