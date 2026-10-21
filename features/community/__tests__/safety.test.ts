import fs from 'fs';
import path from 'path';
import client from '@/services/api';
import { communitySafetyApi } from '@/services/endpoints';
import { REPORT_REASONS } from '@/hooks/useCommunitySafety';

/**
 * The app half of reporting and blocking.
 *
 * Two of these are contract tests against the server's own source. The app
 * and the API live in one repo but are built and shipped separately: an
 * installed APK keeps calling whatever path it was compiled with, so a path
 * that quietly stops matching — `/community/posts/…` against a route spelled
 * `/community/post/…`, or a reason the server's enum does not list — is a
 * 404 or a 400 on a farmer's phone, with the report lost and the person who
 * sent it told nothing. Typechecking cannot catch either; these can.
 */

jest.mock('@/utils/supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

const BACKEND = path.join(__dirname, '../../../backend/src/modules/community');
const routeSource = fs.readFileSync(path.join(BACKEND, 'community.routes.ts'), 'utf8');
const schemaSource = fs.readFileSync(path.join(BACKEND, 'community.schema.ts'), 'utf8');

type Sent = { method?: string; url?: string; data?: unknown };

/** Runs a client call through a stub adapter and reports what went on the wire. */
async function sent(call: () => Promise<unknown>): Promise<Sent> {
  let seen: Sent = {};
  client.defaults.adapter = async (config) => {
    seen = {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    };
    return { data: { success: true, data: null }, status: 200, statusText: 'OK', headers: {}, config };
  };
  await call();
  return seen;
}

describe('what the app puts on the wire', () => {
  it('reports a post', async () => {
    const seen = await sent(() => communitySafetyApi.report('post', 'p1', 'abuse'));

    expect(seen.method).toBe('POST');
    expect(seen.url).toBe('/community/post/p1/report');
    expect(seen.data).toEqual({ reason: 'abuse' });
  });

  it('reports a reply', async () => {
    const seen = await sent(() => communitySafetyApi.report('reply', 'r1', 'spam'));
    expect(seen.url).toBe('/community/reply/r1/report');
  });

  it('omits the note rather than sending an empty one', async () => {
    const withNote = await sent(() => communitySafetyApi.report('post', 'p1', 'other', 'sells fake seed'));
    expect(withNote.data).toEqual({ reason: 'other', note: 'sells fake seed' });

    // The server caps the note but does not accept an empty string for it;
    // sending `note: ''` would turn a valid report into a 400.
    const noNote = await sent(() => communitySafetyApi.report('post', 'p1', 'other', ''));
    expect(noNote.data).toEqual({ reason: 'other' });
  });

  it('blocks and unblocks the same farmer at the same path', async () => {
    const block = await sent(() => communitySafetyApi.block('f9'));
    const unblock = await sent(() => communitySafetyApi.unblock('f9'));

    expect(block.method).toBe('POST');
    expect(unblock.method).toBe('DELETE');
    expect(block.url).toBe('/community/block/f9');
    expect(unblock.url).toBe(block.url);
  });

  it('reads the block list', async () => {
    const seen = await sent(() => communitySafetyApi.listBlocked());
    expect(seen.method).toBe('GET');
    expect(seen.url).toBe('/community/blocks');
  });
});

describe('the app and the server agree', () => {
  it('calls paths the server actually routes', () => {
    // The route strings as the server declares them, minus the Express
    // parameter syntax.
    for (const route of ['/:type(post|reply)/:id/report', '/block/:id', '/blocks']) {
      expect(routeSource).toContain(`'${route}'`);
    }
  });

  it('offers only reasons the server will accept', () => {
    const accepted = schemaSource
      .slice(schemaSource.indexOf('export const reportSchema'))
      .match(/'([a-z_]+)'/g)
      ?.map((s) => s.replaceAll("'", ''));

    expect(accepted).toBeTruthy();
    for (const { key } of REPORT_REASONS) {
      expect(accepted).toContain(key);
    }
  });

  it('gives every reason wording a farmer can choose between', () => {
    const labels = REPORT_REASONS.map((r) => r.label);

    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) {
      expect(label.length).toBeGreaterThan(6);
      // No jargon: these are read by someone deciding in a hurry.
      expect(label).not.toMatch(/content|violation|guideline|policy/i);
    }
    // "Something else" has to be last, or it is the one everybody taps.
    expect(REPORT_REASONS.at(-1)?.key).toBe('other');
  });
});
