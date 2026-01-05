import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResetUserPassword } from '@/hooks/use-users';
import { User } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetUserPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResetUserPasswordDialog({
  user,
  open,
  onOpenChange,
}: ResetUserPasswordDialogProps) {
  const { t } = useTranslation();
  const resetPassword = useResetUserPassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    try {
      await resetPassword.mutateAsync({
        id: user.id,
        newPassword: newPassword.trim(),
      });
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.resetPassword')}</DialogTitle>
          <DialogDescription>{t('users.resetPasswordDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">{t('users.newPassword')} *</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('users.newPassword')}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('auth.passwordHint')}</p>
            </div>
            <div>
              <Label htmlFor="confirm-new-password">{t('users.confirmNewPassword')} *</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('users.confirmNewPassword')}
                required
                minLength={6}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">{t('auth.passwordsDoNotMatch')}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? t('common.loading') : t('users.resetPassword')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








