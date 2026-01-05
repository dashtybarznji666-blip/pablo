import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { exchangeRateApi } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useExchangeRate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      const response = await exchangeRateApi.getCurrent();
      return response.data.rate;
    },
    enabled: isAuthenticated && !authLoading, // Only fetch when authenticated and auth check is complete
    staleTime: 5 * 60 * 1000, // 5 minutes - exchange rate changes occasionally
  });
}

export function useSetExchangeRate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (rate: number) => exchangeRateApi.setRate(rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rate'] });
      toast({
        title: t('toast.success'),
        description: t('exchangeRate.rateUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('exchangeRate.rateUpdated'),
        variant: 'destructive',
      });
    },
  });
}

