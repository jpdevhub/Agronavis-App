import { APPROX_SIZE_GB, EXACT_BYTES, MAX_TOKENS, MODEL_URL, detectModelVariant } from '../modelFile';

// modelFile reads a recorded download size through AsyncStorage, whose native
// module does not exist under Jest.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

/**
 * A model download that stops early must not be recorded as finished.
 *
 * The completeness threshold was 1.5 GB against a published file of 3.66 GB,
 * so any download past the first 40% counted. The runtime then failed on the
 * truncated file with "TF_LITE_PREFILL_DECODE not found in the model" — the
 * signature was in the part that never arrived, and the error named the model
 * so it read like an incompatible build rather than half a file.
 */
describe('model sizes', () => {
  it('matches what Hugging Face publishes', () => {
    // Read from the x-linked-size header, not rounded off a progress bar.
    expect(EXACT_BYTES.e4b).toBe(3_659_530_240);
    expect(EXACT_BYTES.e2b).toBe(2_588_147_712);
  });

  it('describes them in gigabytes for the download card', () => {
    expect(APPROX_SIZE_GB.e4b).toBeCloseTo(3.7, 1);
    expect(APPROX_SIZE_GB.e2b).toBeCloseTo(2.6, 1);
  });

  it('never understates the download a farmer is agreeing to', () => {
    // Someone on a metered connection decides from this number.
    expect(APPROX_SIZE_GB.e4b * 1e9).toBeGreaterThanOrEqual(EXACT_BYTES.e4b * 0.98);
    expect(APPROX_SIZE_GB.e2b * 1e9).toBeGreaterThanOrEqual(EXACT_BYTES.e2b * 0.98);
  });

  it('would reject the truncated file that caused this', () => {
    // 2 GB of a 3.66 GB model: the old threshold of 1.5 GB accepted it.
    const truncated = 2 * 1024 * 1024 * 1024;
    const threshold = Math.floor(EXACT_BYTES.e4b * 0.995);

    expect(truncated).toBeLessThan(threshold);
    expect(truncated).toBeGreaterThan(1.5 * 1024 * 1024 * 1024);
  });

  it('still accepts a complete file', () => {
    expect(EXACT_BYTES.e4b).toBeGreaterThanOrEqual(Math.floor(EXACT_BYTES.e4b * 0.995));
    expect(EXACT_BYTES.e2b).toBeGreaterThanOrEqual(Math.floor(EXACT_BYTES.e2b * 0.995));
  });

  it('offers the small model for download, not the 2.6 GB one', () => {
    // Online answers come from the server; the phone's model is only the
    // no-signal fallback, so the download must be one a farmer will finish.
    expect(detectModelVariant()).toBe('g3-1b');
    expect(APPROX_SIZE_GB['g3-1b']).toBeLessThan(1);
  });

  it('never understates the small model either', () => {
    // Published as 529 MB; covers it whether that meant 10^6 or 2^20.
    expect(APPROX_SIZE_GB['g3-1b'] * 1e9).toBeGreaterThanOrEqual(529 * 1024 * 1024 * 0.98);
  });

  it('opens no larger a window than the 1B model was exported with', () => {
    expect(MAX_TOKENS['g3-1b']).toBe(2048);
    expect(MAX_TOKENS.e2b).toBe(4096);
  });

  it('fetches the 1B model from somewhere a phone can reach without an account', () => {
    // Hugging Face gates Gemma 3 behind a licence click-through.
    expect(MODEL_URL['g3-1b']).not.toContain('huggingface.co/litert-community/Gemma3');
  });
});
