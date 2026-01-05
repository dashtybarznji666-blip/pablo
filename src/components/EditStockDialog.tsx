import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateStock } from '@/hooks/use-stock';
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
import { Stock } from '@/lib/api';

interface EditStockDialogProps {
  stock: Stock;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditStockDialog({ stock, open, onOpenChange }: EditStockDialogProps) {
  const { t } = useTranslation();
  const updateStock = useUpdateStock();
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (stock) {
      setQuantity(stock.quantity.toString());
    }
  }, [stock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum) || quantityNum < 0) {
      alert(t('stock.enterValidQuantity'));
      return;
    }

    try {
      await updateStock.mutateAsync({
        id: stock.id,
        quantity: quantityNum,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Error updating stock:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('stock.editStock')}</DialogTitle>
          <DialogDescription>
            {t('stock.editStockDescription', { 
              shoeName: stock.shoe?.name || '', 
              size: stock.size 
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('stock.quantity')} *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateStock.isPending}>
              {updateStock.isPending ? t('stock.updating') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

