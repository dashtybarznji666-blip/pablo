import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { expenseApi, Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseStats } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useExpenses() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await expenseApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 3 * 60 * 1000, // 3 minutes - expenses change moderately
  });
}

export function useDailyExpenses(date?: Date) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['expenses', 'daily', date?.toISOString()],
    queryFn: async () => {
      const response = await expenseApi.getDaily(date?.toISOString());
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function useMonthlyExpenses(year?: number, month?: number) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['expenses', 'monthly', year, month],
    queryFn: async () => {
      const response = await expenseApi.getMonthly(year, month);
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function useExpenseStats(startDate?: Date, endDate?: Date) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['expenses', 'stats', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const response = await expenseApi.getStats(
        startDate?.toISOString(),
        endDate?.toISOString()
      );
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}

export function useTodayExpenses() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['expenses', 'today'],
    queryFn: async () => {
      const response = await expenseApi.getToday();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 1 * 60 * 1000, // 1 minute - today's expenses change frequently
  });
}

export function useMonthExpenses() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['expenses', 'month'],
    queryFn: async () => {
      const response = await expenseApi.getMonth();
      return response.data;
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - monthly stats change less frequently
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateExpenseInput) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: t('toast.success'),
        description: t('toast.expenseCreated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToCreateExpense'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: t('toast.success'),
        description: t('toast.expenseUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToUpdateExpense'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: t('toast.success'),
        description: t('toast.expenseDeleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('toast.failedToDeleteExpense'),
        variant: 'destructive',
      });
    },
  });
}
