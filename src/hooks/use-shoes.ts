import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { shoeApi, Shoe, CreateShoeInput, UpdateShoeInput } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useShoes(skip: number = 0, take: number = 100) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['shoes', skip, take],
    queryFn: async () => {
      const response = await shoeApi.getAll(skip, take);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading, // Only fetch when authenticated and auth check is complete
    staleTime: 10 * 60 * 1000, // 10 minutes - shoes are relatively static
  });
}

export function useShoe(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['shoes', id],
    queryFn: async () => {
      const response = await shoeApi.getById(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id, // Only fetch when authenticated and id is provided
    staleTime: 10 * 60 * 1000, // 10 minutes - shoes are relatively static
  });
}

export function useCreateShoe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateShoeInput) => shoeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoes'] });
      toast({
        title: t('toast.success'),
        description: t('toast.shoeCreated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToCreateShoe'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateShoe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShoeInput }) =>
      shoeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoes'] });
      toast({
        title: t('toast.success'),
        description: t('toast.shoeUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateShoe'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteShoe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => shoeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoes'] });
      toast({
        title: t('toast.success'),
        description: t('toast.shoeDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeleteShoe'),
        variant: 'destructive',
      });
    },
  });
}


