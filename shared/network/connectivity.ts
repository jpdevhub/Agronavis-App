/** `degraded` means the device has a link but the internet is not reachable. */
export type Connectivity = 'online' | 'degraded' | 'offline';

export interface NetInfoLike {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

/**
 * Maps a NetInfo snapshot to our three states.
 *
 * Returns null while the OS has not decided yet — callers keep the previous
 * value rather than flashing "offline" on every cold start.
 */
export function mapNetInfoToConnectivity(state: NetInfoLike): Connectivity | null {
  if (state.isConnected === false) return 'offline';
  if (state.isConnected !== true) return null;
  // Reachability null means "not resolved yet"; treat it as degraded, not online.
  return state.isInternetReachable === true ? 'online' : 'degraded';
}

export const isUsable = (c: Connectivity): boolean => c === 'online';
