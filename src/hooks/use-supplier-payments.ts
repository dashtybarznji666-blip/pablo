import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supplierPaymentApi, SupplierPayment, CreateSupplierPaymentInput, UpdateSupplierPaymentInput } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useSupplierPayments() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['supplier-payments'],
    queryFn: async () => {
      const response = await supplierPaymentApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function useSupplierPaymentsBySupplier(supplierId: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['supplier-payments', 'supplier', supplierId],
    queryFn: async () => {
      const response = await supplierPaymentApi.getBySupplier(supplierId);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!supplierId,
  });
}

export function useSupplierPayment(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['supplier-payments', id],
    queryFn: async () => {
      const response = await supplierPaymentApi.getById(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
  });
}

export function useCreateSupplierPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateSupplierPaymentInput) => supplierPaymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({
        title: t('toast.success'),
        description: t('toast.supplierPaymentCreated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToCreateSupplierPayment'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSupplierPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierPaymentInput }) =>
      supplierPaymentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({
        title: t('toast.success'),
        description: t('toast.supplierPaymentUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateSupplierPayment'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSupplierPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => supplierPaymentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({
        title: t('toast.success'),
        description: t('toast.supplierPaymentDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeleteSupplierPayment'),
        variant: 'destructive',
      });
    },
  });
}


