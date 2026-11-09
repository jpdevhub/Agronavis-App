import { canRunSahayak, detectModelVariant } from '../modelFile';

let mockMemory: number | null = 0;
// A getter, because the module namespace an `import * as` produces is
// read-only — assigning to it in a test silently does nothing.
jest.mock('expo-device', () => ({
  get totalMemory() {
    return mockMemory;
  },
}));
jest.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///docs/' }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

/**
 * Which phones are offered the assistant at all.
 *
 * The smaller model is 2.6 GB and has to stay resident to answer. On a phone
 * with two gigabytes free once Android has taken its share, the system evicts
 * it almost as fast as it loads — the assistant spends its life reloading and
 * the phone slows down around it. The farmer pays for the download first.
 *
 * Reported memory runs above the retail figure because it counts kernel and
 * GPU shared memory, so these use reported numbers throughout.
 */
const GB = 1024 * 1024 * 1024;
const reports = (gb: number) => {
  mockMemory = gb * GB;
};

describe('phones that are offered Sahayak', () => {
  it.each([
    ['retail 4 GB', 4],
    ['retail 3 GB', 3.5],
  ])('turns it down on a %s phone', (_label, gb) => {
    reports(gb);
    expect(canRunSahayak()).toBe(false);
  });

  it.each([
    ['retail 6 GB', 6],
    ['retail 8 GB', 10],
    ['retail 12 GB', 14],
  ])('offers it on a %s phone', (_label, gb) => {
    reports(gb);
    expect(canRunSahayak()).toBe(true);
  });

  it('offers it when the phone will not say how much it has', () => {
    mockMemory = null;
    // The check exists to spare phones known to be too small, not to withhold
    // the feature wherever the OS declines to answer.
    expect(canRunSahayak()).toBe(true);
  });
});

describe('which model a phone gets', () => {
  it('gives the larger one only to phones with room to spare', () => {
    reports(14);
    expect(detectModelVariant()).toBe('e4b');
  });

  it('gives the smaller one to an ordinary phone', () => {
    reports(10);
    expect(detectModelVariant()).toBe('e2b');
  });
});
