import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useExchangeRate, useSetExchangeRate } from '@/hooks/use-exchange-rate';
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

interface ExchangeRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExchangeRateDialog({ open, onOpenChange }: ExchangeRateDialogProps) {
  const { t } = useTranslation();
  const { data: currentRate, isLoading } = useExchangeRate();
  const setRate = useSetExchangeRate();
  const [rate, setRateValue] = useState('');

  useEffect(() => {
    if (currentRate) {
      setRateValue(currentRate.toString());
    }
  }, [currentRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate || parseFloat(rate) <= 0) {
      alert(t('exchangeRate.enterValidRate'));
      return;
    }

    await setRate.mutateAsync(parseFloat(rate));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('exchangeRate.setRate')}</DialogTitle>
          <DialogDescription>
            {t('exchangeRate.setUsdToIqd')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rate">{t('exchangeRate.exchangeRateLabel')} *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRateValue(e.target.value)}
                placeholder={isLoading ? t('common.loading') : currentRate?.toString()}
                required
              />
              {currentRate && (
                <p className="text-xs text-muted-foreground">
                  {t('exchangeRate.currentRateLabel', { rate: currentRate.toLocaleString() })}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={setRate.isPending}>
              {setRate.isPending ? t('exchangeRate.updating') : t('exchangeRate.updateRate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

