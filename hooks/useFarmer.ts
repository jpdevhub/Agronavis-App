import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FarmerProfile, UpdateFarmerPayload } from '@agronavis/shared-types';
import { farmerApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';

export type { FarmerProfile };

export function useFarmer() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['farmer', user?.id],
    queryFn: farmerApi.me,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateFarmer() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (payload: UpdateFarmerPayload) => farmerApi.update(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(['farmer', user?.id], profile);
    },
  });
}
