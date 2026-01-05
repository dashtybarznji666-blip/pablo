import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateUserRole } from '@/hooks/use-users';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface UserRoleDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserRoleDialog({ user, open, onOpenChange }: UserRoleDialogProps) {
  const { t } = useTranslation();
  const updateUserRole = useUpdateUserRole();
  const [role, setRole] = useState<'admin' | 'user'>(user.role);

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateUserRole.mutateAsync({
        id: user.id,
        role,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.changeRole')}</DialogTitle>
          <DialogDescription>
            {t('users.changeRoleDescription')}: {user.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">{t('users.role')} *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'user')} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('users.roleUser')}</SelectItem>
                  <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateUserRole.isPending}>
              {updateUserRole.isPending ? t('common.loading') : t('users.updateRole')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








