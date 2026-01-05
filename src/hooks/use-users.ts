import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { userApi, User, UpdateUserInput, UserSalesStats } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useUsers() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && isAdmin,
  });
}

export function useUser(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await userApi.getById(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: t('toast.success'),
        description: t('toast.userUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateUser'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: t('toast.success'),
        description: t('toast.userDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeleteUser'),
        variant: 'destructive',
      });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => userApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: t('toast.success'),
        description: t('toast.userActivated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToActivateUser'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => userApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: t('toast.success'),
        description: t('toast.userDeactivated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeactivateUser'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'user' }) =>
      userApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: t('toast.success'),
        description: t('toast.userRoleUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateUserRole'),
        variant: 'destructive',
      });
    },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      userApi.resetUserPassword(id, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: t('toast.success'),
        description: t('users.passwordResetSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToResetPassword'),
        variant: 'destructive',
      });
    },
  });
}

export function useUsersWithSalesStats() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return useQuery({
    queryKey: ['users', 'sales-stats'],
    queryFn: async () => {
      const response = await userApi.getAllWithSalesStats();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUserWithSalesStats(id: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['users', id, 'sales-stats'],
    queryFn: async () => {
      const response = await userApi.getUserWithSalesStats(id);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUserSalesStats(userId: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['user-sales-stats', userId],
    queryFn: async () => {
      const response = await userApi.getUserWithSalesStats(userId);
      return response.data?.salesStats;
    },
    enabled: isAuthenticated && !authLoading && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

