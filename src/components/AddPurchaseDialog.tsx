import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePurchase } from '@/hooks/use-purchases';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useShoes } from '@/hooks/use-shoes';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface AddPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPurchaseDialog({ open, onOpenChange }: AddPurchaseDialogProps) {
  const { t } = useTranslation();
  const createPurchase = useCreatePurchase();
  const { data: suppliers } = useSuppliers();
  const { data: shoes } = useShoes();
  const [supplierId, setSupplierId] = useState('');
  const [shoeId, setShoeId] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [addToStock, setAddToStock] = useState(true);
  const [notes, setNotes] = useState('');

  const selectedShoe = shoes?.find((s) => s.id === shoeId);
  const availableSizes = useMemo(() => {
    if (!selectedShoe?.sizes) return [];
    try {
      const parsed = JSON.parse(selectedShoe.sizes);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }, [selectedShoe]);

  const totalCost = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitCost) || 0;
    return qty * cost;
  }, [quantity, unitCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !shoeId || !size || !quantity || !unitCost) {
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplierId,
        shoeId,
        size,
        quantity: parseInt(quantity),
        unitCost: parseFloat(unitCost),
        isCredit,
        paidAmount: isCredit && paidAmount ? parseFloat(paidAmount) : undefined,
        addToStock,
        notes: notes.trim() || undefined,
      });
      setSupplierId('');
      setShoeId('');
      setSize('');
      setQuantity('');
      setUnitCost('');
      setIsCredit(false);
      setPaidAmount('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  useEffect(() => {
    if (!open) {
      setSupplierId('');
      setShoeId('');
      setSize('');
      setQuantity('');
      setUnitCost('');
      setIsCredit(false);
      setPaidAmount('');
      setNotes('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('purchases.addPurchase')}</DialogTitle>
          <DialogDescription>{t('purchases.addPurchaseDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">{t('purchases.supplier')} *</Label>
              <Select value={supplierId} onValueChange={setSupplierId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('purchases.selectSupplier')} />
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
            <div>
              <Label htmlFor="shoe">{t('purchases.shoe')} *</Label>
              <Select value={shoeId} onValueChange={setShoeId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('purchases.selectShoe')} />
                </SelectTrigger>
                <SelectContent>
                  {shoes?.map((shoe) => (
                    <SelectItem key={shoe.id} value={shoe.id}>
                      {shoe.name} - {shoe.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {shoeId && availableSizes.length > 0 && (
              <div>
                <Label htmlFor="size">{t('purchases.size')} *</Label>
                <Select value={size} onValueChange={setSize} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchases.selectSize')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">{t('purchases.quantity')} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitCost">{t('purchases.unitCost')} (IQD) *</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">
                {t('purchases.totalCost')}: {totalCost.toLocaleString()} IQD
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCredit"
                checked={isCredit}
                onCheckedChange={(checked) => setIsCredit(checked as boolean)}
              />
              <Label htmlFor="isCredit" className="cursor-pointer">
                {t('purchases.purchaseOnCredit')}
              </Label>
            </div>
            {isCredit && (
              <div>
                <Label htmlFor="paidAmount">{t('purchases.paidAmount')} (IQD)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={totalCost}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('purchases.remainingBalance')}: {(totalCost - (parseFloat(paidAmount) || 0)).toLocaleString()} IQD
                </p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addToStock"
                checked={addToStock}
                onCheckedChange={(checked) => setAddToStock(checked as boolean)}
              />
              <Label htmlFor="addToStock" className="cursor-pointer">
                {t('purchases.addToStock')}
              </Label>
            </div>
            <div>
              <Label htmlFor="notes">{t('purchases.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('purchases.notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createPurchase.isPending}>
              {createPurchase.isPending ? t('common.loading') : t('purchases.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








