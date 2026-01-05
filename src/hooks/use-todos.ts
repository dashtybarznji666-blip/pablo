import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { purchaseApi, SupplierTodoGroup } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useTodos() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await purchaseApi.getTodosGroupedBySupplier();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function useMarkAsTodo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => purchaseApi.markAsTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({
        title: t('toast.success'),
        description: t('toast.purchaseMarkedAsTodo'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToMarkAsTodo'),
        variant: 'destructive',
      });
    },
  });
}

export function useMarkAsDone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => purchaseApi.markAsDone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({
        title: t('toast.success'),
        description: t('toast.purchaseMarkedAsDone'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToMarkAsDone'),
        variant: 'destructive',
      });
    },
  });
}







