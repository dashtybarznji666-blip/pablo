import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supplierApi, Supplier, CreateSupplierInput, UpdateSupplierInput, SupplierBalance } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useSuppliers() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await supplierApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function useSupplier(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      const response = await supplierApi.getById(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
  });
}

export function useSupplierWithBalance(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['suppliers', id, 'with-balance'],
    queryFn: async () => {
      const response = await supplierApi.getWithBalance(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
  });
}

export function useSupplierBalance(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['suppliers', id, 'balance'],
    queryFn: async () => {
      const response = await supplierApi.getBalance(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateSupplierInput) => supplierApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: t('toast.success'),
        description: t('toast.supplierCreated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToCreateSupplier'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierInput }) =>
      supplierApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: t('toast.success'),
        description: t('toast.supplierUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateSupplier'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => supplierApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: t('toast.success'),
        description: t('toast.supplierDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeleteSupplier'),
        variant: 'destructive',
      });
    },
  });
}


