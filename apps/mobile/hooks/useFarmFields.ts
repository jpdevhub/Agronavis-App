import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFieldPayload, FarmField } from '@agronavis/shared-types';
import { farmApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmStore } from '@/store/useFarmStore';

export type { FarmField };

export function useFarmFields() {
  const user = useAuthStore((s) => s.user);
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const setActiveField = useFarmStore((s) => s.setActiveField);

  const query = useQuery({
    queryKey: ['fields', user?.id],
    queryFn: farmApi.listFields,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const fields = query.data;

  useEffect(() => {
    if (activeFieldId || !fields?.length) return;
    const first = fields[0];
    setActiveField(first.id, first.farmId);
  }, [fields, activeFieldId, setActiveField]);

  return query;
}

export function useActiveField() {
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const { data } = useFarmFields();
  return data?.find((field) => field.id === activeFieldId) ?? null;
}

export function useCreateField() {
  const queryClient = useQueryClient();
  const setActiveField = useFarmStore((s) => s.setActiveField);

  return useMutation({
    mutationFn: (payload: CreateFieldPayload) => farmApi.createField(payload),
    onSuccess: (field) => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      setActiveField(field.id, field.farmId);
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  const clearActiveField = useFarmStore((s) => s.clearActiveField);
  const activeFieldId = useFarmStore((s) => s.activeFieldId);

  return useMutation({
    mutationFn: (fieldId: string) => farmApi.deleteField(fieldId),
    onSuccess: (_result, fieldId) => {
      if (fieldId === activeFieldId) clearActiveField();
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });
}
