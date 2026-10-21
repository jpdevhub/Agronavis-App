import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi, communitySafetyApi } from '@/services/endpoints';

/** The fixed reasons a farmer can pick from, in the order the sheet shows them. */
export const REPORT_REASONS = [
  { key: 'spam',           label: 'Spam or an advertisement' },
  { key: 'abuse',          label: 'Abusive or hateful' },
  { key: 'misinformation', label: 'Wrong or misleading farming advice' },
  { key: 'off_topic',      label: 'Nothing to do with farming' },
  { key: 'impersonation',  label: 'Pretending to be someone else' },
  { key: 'other',          label: 'Something else' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['key'];

export function useReportContent() {
  return useMutation({
    mutationFn: ({ type, id, reason, note }: {
      type: 'post' | 'reply';
      id: string;
      reason: ReportReason;
      note?: string;
    }) => communitySafetyApi.report(type, id, reason, note),
  });
}

/**
 * Blocking and unblocking both change who the feed contains, so both refetch
 * it. The posts list and every open reply thread are filtered server-side.
 */
function useBlockMutation(call: (farmerId: string) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community'] }),
  });
}

/** The block list, for the screen that lets a farmer lift one. */
export function useBlockedFarmers() {
  return useQuery({
    queryKey: ['community', 'blocks'],
    queryFn: communitySafetyApi.listBlocked,
    staleTime: 60_000,
  });
}

export function useBlockFarmer() {
  return useBlockMutation(communitySafetyApi.block);
}

export function useUnblockFarmer() {
  return useBlockMutation(communitySafetyApi.unblock);
}

/** Removing your own post or reply. The server checks the authorship again. */
export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: 'post' | 'reply'; id: string }) =>
      type === 'post' ? communityApi.deletePost(id) : communityApi.deleteReply(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community'] }),
  });
}
