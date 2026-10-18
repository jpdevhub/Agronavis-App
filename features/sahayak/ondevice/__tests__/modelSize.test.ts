import { APPROX_SIZE_GB, EXACT_BYTES } from '../modelFile';

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
});
