import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateExpense } from '@/hooks/use-expenses';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddExpenseDialog({ open, onOpenChange }: AddExpenseDialogProps) {
  const { t } = useTranslation();
  const createExpense = useCreateExpense();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other',
    type: 'daily' as 'daily' | 'monthly',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      alert(t('expenses.fillRequiredFields'));
      return;
    }

    await createExpense.mutateAsync({
      ...formData,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      date: new Date(formData.date).toISOString(),
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      type: 'daily',
      date: new Date().toISOString().split('T')[0],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('expenses.addExpense')}</DialogTitle>
          <DialogDescription>{t('expenses.recordNewExpense')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('expenses.titleLabel')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('expenses.titlePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('expenses.description')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('expenses.optionalDescription')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('expenses.amount')} *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('expenses.date')} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('expenses.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">{t('expenses.salary')}</SelectItem>
                    <SelectItem value="rent">{t('expenses.rent')}</SelectItem>
                    <SelectItem value="utilities">{t('expenses.utilities')}</SelectItem>
                    <SelectItem value="supplies">{t('expenses.supplies')}</SelectItem>
                    <SelectItem value="other">{t('expenses.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t('expenses.type')} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'daily' | 'monthly') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('expenses.daily')}</SelectItem>
                    <SelectItem value="monthly">{t('expenses.monthly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? t('shoes.creating') : t('shoes.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
