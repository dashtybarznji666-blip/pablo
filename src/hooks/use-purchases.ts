import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { purchaseApi, Purchase, CreatePurchaseInput, UpdatePurchaseInput } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function usePurchases() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await purchaseApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function usePurchasesBySupplier(supplierId: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['purchases', 'supplier', supplierId],
    queryFn: async () => {
      const response = await purchaseApi.getBySupplier(supplierId);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!supplierId,
  });
}

export function usePurchase(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: async () => {
      const response = await purchaseApi.getById(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreatePurchaseInput) => purchaseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: t('toast.success'),
        description: t('toast.purchaseCreated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToCreatePurchase'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseInput }) =>
      purchaseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: t('toast.success'),
        description: t('toast.purchaseUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdatePurchase'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => purchaseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: t('toast.success'),
        description: t('toast.purchaseDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeletePurchase'),
        variant: 'destructive',
      });
    },
  });
}


