import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi, User, LoginInput, RegisterInput } from '@/lib/api';
import { useToast } from './use-toast';

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await authApi.login(data);
      return response.data;
    },
    onSuccess: (authResponse) => {
      queryClient.setQueryData(['currentUser'], authResponse.user);
      toast({
        title: t('toast.success'),
        description: t('auth.loginSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('auth.loginFailed'),
        variant: 'destructive',
      });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await authApi.register(data);
      return response.data;
    },
    onSuccess: (authResponse) => {
      queryClient.setQueryData(['currentUser'], authResponse.user);
      toast({
        title: t('toast.success'),
        description: t('auth.registerSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('auth.registerFailed'),
        variant: 'destructive',
      });
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast({
        title: t('toast.success'),
        description: t('auth.checkEmailDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('auth.forgotPasswordFailed'),
        variant: 'destructive',
      });
    },
  });
}

export function useResetPassword() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast({
        title: t('toast.success'),
        description: t('auth.passwordResetSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.response?.data?.error || t('auth.resetPasswordFailed'),
        variant: 'destructive',
      });
    },
  });
}

export function useVerifyResetToken() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyResetToken(token),
  });
}

