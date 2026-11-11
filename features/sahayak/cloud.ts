import type { SahayakChatResponse, SahayakSource } from '@agronavis/shared-types';
import { ApiError } from '@/services/api';
import { sahayakApi } from '@/services/endpoints';

/**
 * Sahayak online.
 *
 * Answers come from open-weight models on the server, grounded in Kisan Call
 * Centre answers and state crop guides (backend/src/modules/sahayak). A
 * question is a few kilobytes each way, so this works on a 2G signal where a
 * 2.6 GB model download never would.
 *
 * Off by default nowhere; EXPO_PUBLIC_SAHAYAK_ONLINE=off turns it off for a
 * build that must not send questions to a server.
 */
export const ONLINE_ENABLED = process.env.EXPO_PUBLIC_SAHAYAK_ONLINE !== 'off';

export interface OnlineQuestion {
  question: string;
  /** The same system prompt the on-phone model reads. */
  context: string;
  history: { role: 'user' | 'assistant'; text: string }[];
  facts: string[];
  state?: string | null;
  language: string;
}

export async function askOnline(q: OnlineQuestion): Promise<SahayakChatResponse> {
  return sahayakApi.chat({
    question: q.question,
    context: q.context.slice(0, 12_000),
    history: q.history.slice(-6).map((m) => ({ role: m.role, text: m.text.slice(0, 4_000) })),
    facts: q.facts.slice(0, 12),
    state: q.state ?? undefined,
    language: q.language,
  });
}

/**
 * Where the notes came from, under the answer.
 *
 * Only what the answer cited — the server drops the rest — so a farmer can see
 * that "spray at 0.6 g per litre" came from the Kisan Call Centre and not from
 * a model's imagination.
 */
export function withSources(answer: string, sources: SahayakSource[]): string {
  if (sources.length === 0) return answer;
  const lines = sources.map((s, i) => `${i + 1}. ${s.url ? `[${s.label}](${s.url})` : s.label}`);
  return `${answer}\n\n**Sources**\n${lines.join('\n')}`;
}

export type OnlineFailure =
  /** No network, timed out, or the server is asleep: try the phone, or keep it for later. */
  | 'unreachable'
  /** The server has no model right now (no keys, every free quota spent). */
  | 'unavailable'
  /** This farmer has used today's online answers. */
  | 'daily-limit'
  /** A real error, e.g. a malformed request. Retrying will not help. */
  | 'failed';

export function classifyOnlineFailure(error: unknown): OnlineFailure {
  if (!(error instanceof ApiError)) return 'unreachable';
  if (error.status === undefined) return 'unreachable';
  if (error.code === 'RATE_LIMITED_ASSISTANT_DAILY') return 'daily-limit';
  if (error.status === 429 || error.status === 503 || error.status === 502 || error.status >= 500) {
    return 'unavailable';
  }
  return 'failed';
}
