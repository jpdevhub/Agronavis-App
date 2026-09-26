import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { advisoryApi, taskApi } from '@/services/endpoints';
import { useConnectivity } from '@/shared/network/ConnectivityProvider';
import { readQueue, removeFromQueue, type PendingMutation } from './mutationQueue';

async function replay(mutation: PendingMutation): Promise<void> {
  switch (mutation.kind) {
    case 'task.complete':
      await taskApi.complete(mutation.targetId);
      return;
    case 'task.skip':
      await taskApi.skip(mutation.targetId);
      return;
    case 'advisory.read':
      await advisoryApi.markRead(mutation.targetId);
  }
}

/**
 * Flushes work done offline once the connection returns.
 *
 * A mutation is dropped from the queue only after the server accepts it, so a
 * failed replay is retried on the next reconnect rather than lost.
 */
export function useSyncOnReconnect(): void {
  const { isOnline, reconnectCount } = useConnectivity();
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!isOnline || running.current) return;

    running.current = true;
    void (async () => {
      try {
        const queue = await readQueue();
        if (queue.length === 0) return;

        const settled: string[] = [];
        for (const mutation of queue) {
          try {
            await replay(mutation);
            settled.push(mutation.id);
          } catch {
            // Leave it queued; the next reconnect will try again.
          }
        }
        if (settled.length > 0) {
          await removeFromQueue(settled);
          await queryClient.invalidateQueries();
        }
      } finally {
        running.current = false;
      }
    })();
  }, [isOnline, reconnectCount, queryClient]);
}
