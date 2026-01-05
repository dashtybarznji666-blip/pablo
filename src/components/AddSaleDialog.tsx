import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSale } from '@/hooks/use-sales';
import { useStockByShoeId } from '@/hooks/use-stock';
import { useExchangeRate } from '@/hooks/use-exchange-rate';
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
import SizeGrid from '@/components/SizeGrid';
import { Shoe } from '@/lib/api';

const ALL_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];

interface AddSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shoes: Shoe[];
  isOnline?: boolean;
}

export default function AddSaleDialog({ open, onOpenChange, shoes, isOnline = false }: AddSaleDialogProps) {
  const { t } = useTranslation();
  const createSale = useCreateSale();
  const { data: exchangeRate } = useExchangeRate();
  const [shoeId, setShoeId] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const selectedShoe = shoes.find((s) => s.id === shoeId);
  
  // Safely parse sizes JSON
  let availableSizes: string[] = [];
  if (selectedShoe) {
    try {
      availableSizes = JSON.parse(selectedShoe.sizes || '[]');
      if (!Array.isArray(availableSizes)) {
        availableSizes = [];
      }
    } catch (error) {
      console.error('Error parsing sizes:', error);
      availableSizes = [];
    }
  }
  
  const { data: stock } = useStockByShoeId(shoeId);

  const getAvailableQuantity = (size: string) => {
    const stockItem = stock?.find((s) => s.size === size);
    return stockItem?.quantity || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoeId || !size || !quantity) {
      alert(t('sales.fillAllFields'));
      return;
    }

    const qty = parseInt(quantity);
    const availableQty = getAvailableQuantity(size);
    if (qty > availableQty) {
      alert(`${t('sales.insufficientStock')}: ${availableQty}`);
      return;
    }

    const priceIQD = unitPrice ? parseFloat(unitPrice) : selectedShoe?.price || 0;

    try {
      await createSale.mutateAsync({
        shoeId,
        size,
        quantity: qty,
        unitPrice: priceIQD,
        isOnline: isOnline,
      });

      // Reset form and close dialog on success
      setShoeId('');
      setSize('');
      setQuantity('1');
      setUnitPrice('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Error creating sale:', error);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setShoeId('');
      setSize('');
      setQuantity('1');
      setUnitPrice('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sales.addSale')}</DialogTitle>
          <DialogDescription>{t('sales.recordSale')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shoe">{t('sales.selectShoe')} *</Label>
              <Select value={shoeId} onValueChange={setShoeId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('sales.selectShoe')} />
                </SelectTrigger>
                <SelectContent>
                  {shoes.map((shoe) => (
                    <SelectItem key={shoe.id} value={shoe.id}>
                      {shoe.name} - {shoe.brand} ({shoe.price.toLocaleString()} IQD)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedShoe && (
              <div className="space-y-2">
                <Label>{t('sales.selectSize')} *</Label>
                <SizeGrid
                  selectedSizes={size ? [size] : []}
                  onSizeToggle={(selectedSize) => {
                    // Single select: if clicking the same size, deselect it
                    if (size === selectedSize) {
                      setSize('');
                    } else {
                      setSize(selectedSize);
                    }
                  }}
                  mode="single"
                  disabledSizes={ALL_SIZES.filter(s => getAvailableQuantity(s) === 0)}
                  showStockInfo={true}
                  getStockInfo={(s) => ({
                    quantity: getAvailableQuantity(s),
                    isLowStock: getAvailableQuantity(s) > 0 && getAvailableQuantity(s) <= 3
                  })}
                />
              </div>
            )}

            {selectedShoe && size && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">{t('sales.unitPrice')}</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder={`${t('common.default')}: ${selectedShoe.price.toLocaleString()} IQD`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('sales.defaultPrice')}: {selectedShoe.price.toLocaleString()} IQD
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t('stock.quantity')} *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={getAvailableQuantity(size)}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('sales.available')}: {getAvailableQuantity(size)} {t('stock.units')}
                  </p>
                </div>
              </>
            )}

            {selectedShoe && size && quantity && exchangeRate && typeof exchangeRate === 'number' && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">{t('sales.saleSummary')}</div>
                <div className="text-lg font-semibold">
                  {t('sales.total')}: {(parseFloat(unitPrice || selectedShoe.price.toString()) * parseInt(quantity || '0')).toLocaleString()} IQD
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('sales.costUsd')}: ${selectedShoe.costPrice.toFixed(2)} × {quantity} = ${(selectedShoe.costPrice * parseInt(quantity || '0')).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('sales.costIqd')}: {((selectedShoe.costPrice * exchangeRate) * parseInt(quantity || '0')).toLocaleString()} IQD
                </div>
                <div className="text-sm font-semibold text-green-600">
                  {t('sales.profit')}: {(
                    (parseFloat(unitPrice || selectedShoe.price.toString()) - (selectedShoe.costPrice * exchangeRate)) *
                    parseInt(quantity || '0')
                  ).toLocaleString()} IQD
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.exchangeRate')}: 1 USD = {exchangeRate.toLocaleString()} IQD
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createSale.isPending || !size || !quantity}>
              {createSale.isPending ? t('sales.processing') : t('sales.completeSale')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


