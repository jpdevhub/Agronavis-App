import type { Advisory, CurrentWeather, FarmField, FarmerProfile, SoilHealth } from '@agronavis/shared-types';
import { isPlausibleField } from '@/constants/field';

const LANGUAGE_NAME: Record<string, string> = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', pa: 'Punjabi',
  gu: 'Gujarati', te: 'Telugu', kn: 'Kannada',
};

/** Stated as a hard instruction — models drift back to English otherwise. */
const LANGUAGE_RULE = (code: string | undefined): string => {
  const name = LANGUAGE_NAME[code ?? 'en'] ?? 'English';
  return name === 'English'
    ? '- Write the entire answer in simple English.'
    : `- Write the entire answer in ${name}, in its own script. Do not answer in English.`;
};
import { platformSection, screenInfoFor } from './screenContext';

export interface FarmerContext {
  farmer: FarmerProfile | undefined;
  fields: FarmField[] | undefined;
  weather: CurrentWeather | undefined;
  soil: SoilHealth | undefined;
  advisories: Advisory[];
  /** Route the farmer is on, so directions match what is in front of them. */
  pathname?: string;
  /** Language code the answer must be written in. */
  replyLanguage?: string;
  /**
   * Set when the details came from the offline snapshot rather than a live read,
   * so the model can say how old they are instead of reporting them as current.
   */
  dataSavedAt?: string;
}

/** Plain wording for the prompt — the model reads this, so no ISO strings. */
function formatSyncAge(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'in an earlier session';
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const line = (label: string, value: string | number | null | undefined): string | null =>
  value === null || value === undefined || value === '' ? null : `${label}: ${value}`;

/**
 * The system prompt for Sahayak.
 *
 * Everything here is read from the farmer's own records — nothing invented. A
 * missing field is omitted rather than filled with a placeholder, so the model
 * is never told something untrue about the farm.
 */
export function buildSahayakPrompt(context: FarmerContext): string {
  const { farmer, fields, weather, soil, advisories } = context;

  const place = [farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ');
  const mapped = fields?.filter((f) => isPlausibleField(f.areaAcres));
  const totalAcres = mapped?.reduce((sum, f) => sum + f.areaAcres, 0);

  const facts = [
    line('Farmer', farmer?.fullName),
    line('Location', place),
    line('Land holding', totalAcres ? `${totalAcres.toFixed(2)} acres across ${mapped?.length} mapped field(s)` : null),
    line('Irrigation', farmer?.irrigationType),
    line('Soil type', farmer?.soilType),
    line('Crops grown', farmer?.primaryCrops?.length ? farmer.primaryCrops.join(', ') : null),
    line('Preferred language', farmer?.language),
  ].filter(Boolean);

  const conditions = [
    weather ? `Current weather: ${Math.round(weather.temp)}°C, ${weather.description}, humidity ${weather.humidity}%` : null,
    soil
      ? `Soil (${soil.source === 'lab' ? 'measured' : 'district estimate'}): nitrogen ${soil.levels.nitrogen}, phosphorus ${soil.levels.phosphorus}, potassium ${soil.levels.potassium}${soil.phLevel ? `, pH ${soil.phLevel}` : ''}`
      : null,
  ].filter(Boolean);

  const open = advisories
    .filter((a) => !a.read)
    .slice(0, 5)
    .map((a) => `- [${a.severity}] ${a.title}`);

  const sections = [
    'You are Sahayak, an agricultural assistant for Indian smallholder farmers.',
    '',
    'How to answer:',
    LANGUAGE_RULE(context.replyLanguage),
    '- Be specific and practical. Name quantities, timings and locally available inputs.',
    '- Ground every answer in the farm details below. Never invent a measurement.',
    '- If the details do not cover the question, say what you would need to know.',
    '- Keep answers short enough to read on a phone in a field.',
    '- Only describe features Agronavis actually has, listed below.',
  ];

  sections.push('', ...platformSection());

  if (context.dataSavedAt) {
    sections.push(
      '',
      `You are offline. These details were last synced ${formatSyncAge(context.dataSavedAt)}.`,
      '- Say so if the answer depends on the weather or an advisory, which may have changed.',
      '- Do not present them as current conditions.',
    );
  }

  if (facts.length > 0) sections.push('', 'This farm:', ...facts.map((f) => `- ${f}`));
  if (conditions.length > 0) sections.push('', 'Right now:', ...conditions.map((c) => `- ${c}`));
  if (open.length > 0) sections.push('', 'Open advisories:', ...open);

  const screen = context.pathname ? screenInfoFor(context.pathname) : null;
  if (screen) {
    sections.push(
      '',
      `The farmer is on the ${screen.name} screen. From here they can:`,
      ...screen.actions.map((a) => `- ${a}`),
      'Refer to this screen when the answer involves something they can do right now.',
    );
  }

  return sections.join('\n');
}

/** Short, factual banner text for the chat header. */
export function contextSummary(context: FarmerContext): string {
  const { farmer, fields } = context;
  const place = [farmer?.district, farmer?.state].filter(Boolean).join(', ');
  const acres = fields
    ?.filter((f) => isPlausibleField(f.areaAcres))
    .reduce((sum, f) => sum + f.areaAcres, 0);
  const parts = [
    acres ? `${acres.toFixed(1)} acres` : null,
    place || null,
  ].filter(Boolean);
  return parts.length > 0 ? `Answering for ${parts.join(' · ')}` : 'Add your farm details for tailored answers';
}
