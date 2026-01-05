import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBulkAddStock, useStockByShoeId } from '@/hooks/use-stock';
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
import { Shoe } from '@/lib/api';

const ALL_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shoes: Shoe[];
}

export default function AddStockDialog({ open, onOpenChange, shoes }: AddStockDialogProps) {
  const { t } = useTranslation();
  const bulkAddStock = useBulkAddStock();
  const [shoeId, setShoeId] = useState('');
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, string>>({});

  const selectedShoe = shoes.find((s) => s.id === shoeId);
  const { data: existingStock } = useStockByShoeId(shoeId);

  // Initialize size quantities when shoe is selected - use all sizes 38-48
  useEffect(() => {
    if (shoeId) {
      const initialQuantities: Record<string, string> = {};
      ALL_SIZES.forEach((size: string) => {
        initialQuantities[size] = '';
      });
      setSizeQuantities(initialQuantities);
    } else {
      setSizeQuantities({});
    }
  }, [shoeId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setShoeId('');
      setSizeQuantities({});
    }
  }, [open]);

  const handleQuantityChange = (size: string, value: string) => {
    setSizeQuantities({
      ...sizeQuantities,
      [size]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoeId) {
      alert(t('stock.pleaseSelectShoe'));
      return;
    }

    // Filter out empty quantities and create stock entries
    const stockEntries = Object.entries(sizeQuantities)
      .filter(([_, quantity]) => quantity && parseInt(quantity) > 0)
      .map(([size, quantity]) => ({
        size,
        quantity: parseInt(quantity),
      }));

    if (stockEntries.length === 0) {
      alert(t('stock.enterQuantitiesForAtLeastOneSize'));
      return;
    }

    try {
      await bulkAddStock.mutateAsync({
        shoeId,
        stockEntries,
      });

      // Reset form and close dialog on success
      setShoeId('');
      setSizeQuantities({});
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Error adding stock:', error);
    }
  };

  const getCurrentStock = (size: string) => {
    const stockItem = existingStock?.find((s) => s.size === size);
    return stockItem?.quantity || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('stock.addStock')}</DialogTitle>
          <DialogDescription>{t('stock.stockQuantities')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shoe">{t('stock.selectShoe')} *</Label>
              <Select value={shoeId} onValueChange={setShoeId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('stock.selectShoe')} />
                </SelectTrigger>
                <SelectContent>
                  {shoes.map((shoe) => (
                    <SelectItem key={shoe.id} value={shoe.id}>
                      {shoe.name} - {shoe.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedShoe && (
              <div className="space-y-4">
                <Label>{t('stock.stockQuantities')} *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  {ALL_SIZES.map((size: string) => {
                    const currentStock = getCurrentStock(size);
                    return (
                      <div key={size} className="space-y-1">
                        <Label htmlFor={`size-${size}`} className="text-sm font-medium">
                          {t('stock.size')} {size} {currentStock > 0 && `(${t('stock.current')}: ${currentStock})`}
                        </Label>
                        <Input
                          id={`size-${size}`}
                          type="number"
                          min="0"
                          value={sizeQuantities[size] || ''}
                          onChange={(e) => handleQuantityChange(size, e.target.value)}
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stock.enterQuantities')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={bulkAddStock.isPending || !shoeId}
            >
              {bulkAddStock.isPending ? t('stock.adding') : t('stock.addStock')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


