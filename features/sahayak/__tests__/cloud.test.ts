import { ApiError } from '@/services/api';
import { classifyOnlineFailure, withSources } from '../cloud';

jest.mock('@/services/endpoints', () => ({ sahayakApi: { chat: jest.fn(), status: jest.fn() } }));
// No TypeScript parameter properties in here: babel-jest compiles them to
// assignments the mock hoisting reads as out-of-scope variables.
jest.mock('@/services/api', () => {
  class ApiError extends Error {
    status?: number;
    code?: string;
    constructor(message: string, status?: number, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return { ApiError };
});

describe('withSources', () => {
  it('lists what the answer cited, linked where there is a link', () => {
    expect(
      withSources('Apply potash [1].', [
        { label: 'Kisan Call Centre · West Bengal · rice', url: null },
        { label: 'Boro rice guide', url: 'https://example.org/boro.pdf' },
      ]),
    ).toBe(
      'Apply potash [1].\n\n**Sources**\n1. Kisan Call Centre · West Bengal · rice\n2. [Boro rice guide](https://example.org/boro.pdf)',
    );
  });

  it('adds nothing when nothing was cited', () => {
    expect(withSources('Hello.', [])).toBe('Hello.');
  });
});

describe('classifyOnlineFailure', () => {
  it('treats no signal and a sleeping server as "try the phone or keep it"', () => {
    expect(classifyOnlineFailure(new ApiError('No connection'))).toBe('unreachable');
    expect(classifyOnlineFailure(new Error('Network Error'))).toBe('unreachable');
  });

  it('treats spent free quotas as unavailable, not as the farmer\'s fault', () => {
    expect(classifyOnlineFailure(new ApiError('busy', 503, 'ASSISTANT_UNAVAILABLE'))).toBe('unavailable');
    expect(classifyOnlineFailure(new ApiError('slow down', 429, 'RATE_LIMITED_ASSISTANT'))).toBe('unavailable');
  });

  it('recognises the daily allowance', () => {
    expect(classifyOnlineFailure(new ApiError('limit', 429, 'RATE_LIMITED_ASSISTANT_DAILY'))).toBe('daily-limit');
  });

  it('does not retry a request the server rejected', () => {
    expect(classifyOnlineFailure(new ApiError('bad', 400, 'BAD_REQUEST'))).toBe('failed');
  });
});
