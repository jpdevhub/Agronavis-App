import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Remembers where a farmer was last sent after signing in.
 *
 * Where to land is decided by one call to the API — it answers whether
 * onboarding is finished and whether two-factor is on. On a cold instance that
 * call can take most of a minute, and the app was showing a full-screen wait
 * for the whole of it.
 *
 * For anyone who has signed in on this device before, the answer is already
 * known and almost never changes. So it is cached and used immediately, and
 * the call still runs behind the screen to correct the rare case where it has.
 * Only a farmer signing in on a device for the first time waits.
 */
export type Landing = {
  onboardingComplete: boolean;
  twoFactorEnabled: boolean;
};

const key = (userId: string): string => `landing:${userId}`;

export async function readLanding(userId: string): Promise<Landing | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Landing>;
    if (typeof parsed.onboardingComplete !== 'boolean') return null;
    return {
      onboardingComplete: parsed.onboardingComplete,
      twoFactorEnabled: parsed.twoFactorEnabled === true,
    };
  } catch {
    return null;
  }
}

export async function writeLanding(userId: string, landing: Landing): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(landing));
  } catch {
    // A cache that cannot be written just means the next sign-in waits.
  }
}

export async function clearLanding(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(userId));
  } catch {
    /* nothing to do */
  }
}
