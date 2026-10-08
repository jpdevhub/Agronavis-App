import { holdCapture, readCapture, releaseCapture } from '../capture';

describe('scan capture', () => {
  it('hands back a ticket short enough for a URL', () => {
    const id = holdCapture(`data:image/png;base64,${'A'.repeat(200000)}`);
    expect(id.length).toBeLessThan(32);
  });

  it('returns the photograph for its own ticket', () => {
    const id = holdCapture('file:///tmp/leaf.jpg');
    expect(readCapture(id)).toBe('file:///tmp/leaf.jpg');
  });

  it('returns nothing for a stale ticket', () => {
    const first = holdCapture('file:///tmp/one.jpg');
    holdCapture('file:///tmp/two.jpg');
    expect(readCapture(first)).toBeNull();
  });

  it('returns nothing once released', () => {
    const id = holdCapture('file:///tmp/leaf.jpg');
    releaseCapture(id);
    expect(readCapture(id)).toBeNull();
  });

  it('keeps the current photograph when a stale ticket is released', () => {
    const first = holdCapture('file:///tmp/one.jpg');
    const second = holdCapture('file:///tmp/two.jpg');
    releaseCapture(first);
    expect(readCapture(second)).toBe('file:///tmp/two.jpg');
  });

  it('survives a missing ticket', () => {
    expect(readCapture(undefined)).toBeNull();
    expect(() => releaseCapture(undefined)).not.toThrow();
  });
});
