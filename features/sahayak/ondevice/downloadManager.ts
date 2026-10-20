import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createModelDownload, type DownloadProgress } from './download';
import type { ModelVariant } from './modelFile';

/**
 * Keeps a model download alive while the farmer uses the rest of the app.
 *
 * The download used to live in the card's own state, so navigating away
 * unmounted the component and took several gigabytes of progress with it.
 * Nobody waits on a download screen for twenty minutes, and nobody should
 * have to.
 *
 * This holds it at module scope instead — outside React, outside the
 * navigator — and the card subscribes rather than owns. Leaving the screen
 * now does nothing to it, and coming back finds it exactly where it was.
 */

type Listener = (state: ManagerState) => void;

export interface ManagerState {
  variant: ModelVariant | null;
  running: boolean;
  progress: DownloadProgress | null;
  error: string | null;
  /** Set once the file is on disk and verified. */
  finishedPath: string | null;
  /** True when this run picked up a part-finished file. */
  resuming: boolean;
}

let state: ManagerState = {
  variant: null,
  running: false,
  progress: null,
  error: null,
  finishedPath: null,
  resuming: false,
};

const listeners = new Set<Listener>();
let handle: Awaited<ReturnType<typeof createModelDownload>> | null = null;

function publish(next: Partial<ManagerState>): void {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

export function getDownloadState(): ManagerState {
  return state;
}

export function subscribeToDownload(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tells the farmer it is done, since by then they are somewhere else.
 *
 * Android needs a channel before it will show anything, and one created at
 * send time is accepted — this is the only local notification the app sends,
 * so it carries its own.
 */
async function announce(title: string, body: string): Promise<void> {
  try {
    const granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sahayak-download', {
        name: 'Sahayak download',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { screen: '/sahayak' } },
      trigger: null,
      ...(Platform.OS === 'android' ? { identifier: 'sahayak-download' } : {}),
    });
  } catch {
    // A notification that cannot be shown is not a reason to fail a download
    // that has already succeeded.
  }
}

/**
 * Asks for notification permission at the one moment it earns the question.
 *
 * The app asks once at startup, which is before anyone knows what it is for.
 * Starting a multi-gigabyte download is the point at which being told when it
 * finishes is obviously worth something, so if the answer was no — or was
 * never asked — this is the moment to ask again. A refusal costs the farmer
 * nothing but a silent finish.
 */
async function ensureCanNotify(): Promise<void> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || !existing.canAskAgain) return;
    await Notifications.requestPermissionsAsync();
  } catch {
    // Not being able to ask is not a reason to stop the download.
  }
}

/** Starts the download, or does nothing if one is already running. */
export async function startDownload(variant: ModelVariant): Promise<void> {
  if (state.running) return;

  void ensureCanNotify();

  publish({ variant, running: true, error: null, finishedPath: null });

  try {
    handle = await createModelDownload(variant, (progress) => publish({ progress }));
    publish({ resuming: handle.resuming });

    const path = await handle.start();

    publish({ running: false, finishedPath: path });
    void announce(
      'Sahayak is ready',
      'The assistant finished downloading and can answer questions now.',
    );
  } catch (e) {
    const message = (e as Error).message ?? 'The download stopped.';
    publish({ running: false, error: message });

    // Pausing is deliberate and reported through pause(), not here.
    if (!/pause/i.test(message)) {
      void announce('Sahayak download stopped', `${message} Open Agronavis to continue it.`);
    }
  } finally {
    handle = null;
  }
}

export async function pauseDownload(): Promise<void> {
  if (!handle) return;
  try {
    await handle.pause();
  } finally {
    publish({ running: false });
    handle = null;
  }
}

/** Forgets a finished download so the card stops reporting it. */
export function acknowledgeDownload(): void {
  publish({ finishedPath: null, error: null });
}
