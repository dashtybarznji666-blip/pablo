import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { stockApi, Stock, AddStockInput, BulkAddStockInput } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useStock(skip: number = 0, take: number = 100) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['stock', skip, take],
    queryFn: async () => {
      const response = await stockApi.getAll(skip, take);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading, // Only fetch when authenticated and auth check is complete
    staleTime: 3 * 60 * 1000, // 3 minutes - stock changes moderately
  });
}

export function useLowStock(threshold?: number) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['stock', 'low', threshold],
    queryFn: async () => {
      const response = await stockApi.getLowStock(threshold);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading, // Only fetch when authenticated and auth check is complete
    staleTime: 2 * 60 * 1000, // 2 minutes - low stock alerts need to be somewhat current
  });
}

export function useStockByShoeId(shoeId: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['stock', 'shoe', shoeId],
    queryFn: async () => {
      const response = await stockApi.getByShoeId(shoeId);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!shoeId, // Only fetch when authenticated and shoeId is provided
    staleTime: 3 * 60 * 1000, // 3 minutes - stock changes moderately
  });
}

export function useAddStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: AddStockInput) => stockApi.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: t('toast.success'),
        description: t('toast.stockAdded'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToAddStock'),
        variant: 'destructive',
      });
    },
  });
}

export function useBulkAddStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: BulkAddStockInput) => stockApi.bulkAdd(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      const addedCount = Array.isArray(response.data) ? response.data.length : 0;
      toast({
        title: t('toast.success'),
        description: t('toast.stockAddedForSizes', { count: addedCount }),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToAddStock'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      stockApi.update(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: t('toast.success'),
        description: t('toast.stockUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateStock'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => stockApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: t('toast.success'),
        description: t('toast.stockDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeleteStock'),
        variant: 'destructive',
      });
    },
  });
}


