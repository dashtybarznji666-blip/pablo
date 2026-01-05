import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { saleApi, Sale, CreateSaleInput, SalesStats, UserSalesStats } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useSales(skip: number = 0, take: number = 100) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['sales', skip, take],
    queryFn: async () => {
      const response = await saleApi.getAll(skip, take);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes - sales change frequently
  });
}

export function useTodaySales(skip: number = 0, take: number = 100) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['sales', 'today', skip, take],
    queryFn: async () => {
      const response = await saleApi.getToday(skip, take);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 1 * 60 * 1000, // 1 minute - today's sales change very frequently
  });
}

export function useSalesStats() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['sales', 'stats'],
    queryFn: async () => {
      const response = await saleApi.getStats();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes - stats update moderately
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateSaleInput) => saleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['user-sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'sales-stats'] });
      toast({
        title: t('toast.success'),
        description: t('toast.saleCreated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToCreateSale'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAllSales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => saleApi.deleteAll(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: t('toast.success'),
        description: t('sales.allSalesDeleted', { count: response.data.deletedCount }),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('sales.failedToDeleteAllSales'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAllShippingSales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => saleApi.deleteAllShipping(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'online'] });
      toast({
        title: t('toast.success'),
        description: t('shipping.allShippingSalesDeleted', { count: response.data.deletedCount }),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('shipping.failedToDeleteAllShippingSales'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => saleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'online'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['user-sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'sales-stats'] });
      toast({
        title: t('toast.success'),
        description: t('sales.saleDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('sales.failedToDeleteSale'),
        variant: 'destructive',
      });
    },
  });
}

export function useSalesByUser(userId: string, skip: number = 0, take: number = 100) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['sales', 'user', userId, skip, take],
    queryFn: async () => {
      const response = await saleApi.getSalesByUser(userId, skip, take);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUserSalesStats(userId: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['user-sales-stats', userId],
    queryFn: async () => {
      const response = await saleApi.getUserSalesStats(userId);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}


