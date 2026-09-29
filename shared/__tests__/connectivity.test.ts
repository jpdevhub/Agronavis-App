import { mapNetInfoToConnectivity, isUsable } from '../network/connectivity';

describe('mapNetInfoToConnectivity', () => {
  it('reports offline when the device says so', () => {
    expect(mapNetInfoToConnectivity({ isConnected: false, isInternetReachable: null })).toBe('offline');
  });

  it('reports online only when the internet is confirmed reachable', () => {
    expect(mapNetInfoToConnectivity({ isConnected: true, isInternetReachable: true })).toBe('online');
  });

  it('treats a link with no internet as degraded, not online', () => {
    expect(mapNetInfoToConnectivity({ isConnected: true, isInternetReachable: false })).toBe('degraded');
  });

  it('treats unresolved reachability as degraded', () => {
    expect(mapNetInfoToConnectivity({ isConnected: true, isInternetReachable: null })).toBe('degraded');
  });

  it('returns null before the OS has decided, so callers keep the old value', () => {
    expect(mapNetInfoToConnectivity({ isConnected: null, isInternetReachable: null })).toBeNull();
  });

  it('only counts online as usable', () => {
    expect(isUsable('online')).toBe(true);
    expect(isUsable('degraded')).toBe(false);
    expect(isUsable('offline')).toBe(false);
  });
});
