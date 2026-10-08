import { Platform } from 'react-native';
import client, { api } from '../api';

/**
 * The upload helper is the only place a file leaves this app, and the way it
 * fails is silent: leave this client's default `application/json` on a
 * multipart request and axios serialises the form to JSON, the server finds no
 * file, and the farmer is told their photo could not be read. That is exactly
 * what happened on the web. These drive the real helper through a stub adapter
 * and assert what actually goes on the wire.
 */
jest.mock('@/utils/supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

async function sentBy(os: 'web' | 'android') {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

  let seen: { data: unknown; contentType: unknown } | undefined;
  client.defaults.adapter = async (config) => {
    seen = { data: config.data, contentType: config.headers?.['Content-Type'] };
    return {
      data: { success: true, data: null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  globalThis.fetch = (async () => ({ blob: async () => new Blob(['leaf']) })) as never;

  await api.upload('/crops/diagnose', 'data:image/png;base64,AAAA', 'scan.png', 'image/png', 'image');
  return seen!;
}

describe('multipart upload', () => {
  it('sends a real form on the web, under no content type of ours', async () => {
    const { data, contentType } = await sentBy('web');
    // Still a form rather than JSON — this is the assertion that matters.
    expect(data).toBeInstanceOf(FormData);
    // Cleared, so the browser fills it in with the boundary.
    expect(contentType).toBeNull();
  });

  it('sends a form on a device and names the multipart type itself', async () => {
    const { data, contentType } = await sentBy('android');
    expect(data).toBeInstanceOf(FormData);
    expect(contentType).toBe('multipart/form-data');
  });
});
