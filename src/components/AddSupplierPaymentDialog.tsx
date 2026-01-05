import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSupplierPayment } from '@/hooks/use-supplier-payments';
import { useSuppliers } from '@/hooks/use-suppliers';
import { usePurchasesBySupplier } from '@/hooks/use-purchases';
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
import { Textarea } from '@/components/ui/textarea';

interface AddSupplierPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSupplierId?: string | null;
}

export default function AddSupplierPaymentDialog({ open, onOpenChange, defaultSupplierId }: AddSupplierPaymentDialogProps) {
  const { t } = useTranslation();
  const createPayment = useCreateSupplierPayment();
  const { data: suppliers } = useSuppliers();
  const [supplierId, setSupplierId] = useState(defaultSupplierId || '');
  const { data: purchases } = usePurchasesBySupplier(supplierId);
  const [purchaseId, setPurchaseId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Get credit purchases for selected supplier
  const creditPurchases = purchases?.filter((p) => p.isCredit && (p.totalCost - (p.paidAmount || 0)) > 0) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !amount) {
      return;
    }

    try {
      await createPayment.mutateAsync({
        supplierId,
        purchaseId: purchaseId || undefined,
        amount: parseFloat(amount),
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      setSupplierId('');
      setPurchaseId('');
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  useEffect(() => {
    if (defaultSupplierId) {
      setSupplierId(defaultSupplierId);
    }
  }, [defaultSupplierId]);

  useEffect(() => {
    if (!open) {
      if (!defaultSupplierId) {
        setSupplierId('');
      }
      setPurchaseId('');
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [open, defaultSupplierId]);

  useEffect(() => {
    if (supplierId) {
      setPurchaseId('');
    }
  }, [supplierId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('supplierPayments.addPayment')}</DialogTitle>
          <DialogDescription>{t('supplierPayments.addPaymentDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">{t('supplierPayments.supplier')} *</Label>
              <Select value={supplierId} onValueChange={setSupplierId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('supplierPayments.selectSupplier')} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {supplierId && creditPurchases.length > 0 && (
              <div>
                <Label htmlFor="purchase">{t('supplierPayments.linkToPurchase')}</Label>
                <Select value={purchaseId} onValueChange={setPurchaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('supplierPayments.selectPurchase')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('supplierPayments.none')}</SelectItem>
                    {creditPurchases.map((purchase) => {
                      const remaining = purchase.totalCost - (purchase.paidAmount || 0);
                      return (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          {purchase.shoe?.name} - {remaining.toLocaleString()} IQD {t('supplierPayments.remaining')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="amount">{t('supplierPayments.amount')} (IQD) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentDate">{t('supplierPayments.paymentDate')}</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('supplierPayments.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('supplierPayments.notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? t('common.loading') : t('supplierPayments.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

