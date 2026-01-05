import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface SizeGridProps {
  selectedSizes: string[];
  onSizeToggle: (size: string) => void;
  mode: 'multi' | 'single';
  disabledSizes?: string[];
  availableSizes?: string[];
  showStockInfo?: boolean;
  getStockInfo?: (size: string) => { quantity: number; isLowStock?: boolean };
}

const ALL_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];

export default function SizeGrid({
  selectedSizes,
  onSizeToggle,
  mode,
  disabledSizes = [],
  availableSizes = [],
  showStockInfo = false,
  getStockInfo,
}: SizeGridProps) {
  const { t } = useTranslation();

  const handleSizeClick = (size: string) => {
    if (disabledSizes.includes(size)) return;
    onSizeToggle(size);
  };

  const isSelected = (size: string) => selectedSizes.includes(size);
  const isDisabled = (size: string) => disabledSizes.includes(size);
  const isAvailable = (size: string) => availableSizes.length === 0 || availableSizes.includes(size);

  if (mode === 'multi') {
    return (
      <div 
        className="grid grid-cols-4 md:grid-cols-6 gap-2 p-2 border rounded-lg bg-muted/30"
        role="group"
        aria-label={t('shoes.sizes') || 'Shoe sizes'}
      >
        {ALL_SIZES.map((size) => {
          const stockInfo = getStockInfo?.(size);
          const checked = isSelected(size);
          const disabled = isDisabled(size);
          const stockText = stockInfo 
            ? stockInfo.quantity > 0 
              ? `${stockInfo.quantity} ${t('stock.units') || 'units'}`
              : t('sales.outOfStock') || 'Out of stock'
            : '';
          const ariaLabel = `${t('stock.size') || 'Size'} ${size}${stockText ? `, ${stockText}` : ''}${checked ? ', ' + (t('common.selected') || 'selected') : ''}`;
          
          return (
            <div key={size} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 w-full">
                <Checkbox
                  id={`size-${size}`}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => handleSizeClick(size)}
                  className="flex-shrink-0"
                  aria-label={ariaLabel}
                  aria-describedby={showStockInfo && stockInfo ? `stock-info-${size}` : undefined}
                />
                <label
                  htmlFor={`size-${size}`}
                  className={cn(
                    "text-sm font-medium cursor-pointer flex-1 text-center",
                    disabled && "opacity-50 cursor-not-allowed",
                    checked && !disabled && "text-primary"
                  )}
                  aria-label={ariaLabel}
                >
                  {size}
                </label>
              </div>
              {showStockInfo && stockInfo && (
                <span 
                  id={`stock-info-${size}`}
                  className={cn(
                    "text-xs",
                    stockInfo.quantity === 0 ? "text-destructive" : 
                    stockInfo.isLowStock ? "text-orange-500" : 
                    "text-muted-foreground"
                  )}
                  aria-live="polite"
                >
                  {stockInfo.quantity > 0 ? stockInfo.quantity : t('sales.outOfStock')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Single select mode (buttons)
  return (
    <div 
      className="grid grid-cols-4 md:grid-cols-6 gap-2 p-2 border rounded-lg bg-muted/30"
      role="group"
      aria-label={t('sales.selectSize') || 'Select shoe size'}
    >
      {ALL_SIZES.map((size, index) => {
        const stockInfo = getStockInfo?.(size);
        const selected = isSelected(size);
        const disabled = isDisabled(size);
        const available = isAvailable(size);
        const stockText = stockInfo 
          ? stockInfo.quantity > 0 
            ? `${stockInfo.quantity} ${t('stock.units') || 'units'}`
            : t('sales.outOfStock') || 'Out of stock'
          : '';
        const ariaLabel = `${t('stock.size') || 'Size'} ${size}${stockText ? `, ${stockText}` : ''}${selected ? ', ' + (t('common.selected') || 'selected') : ''}`;
        
        return (
          <div key={size} className="flex flex-col items-center gap-1">
            <Button
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={() => handleSizeClick(size)}
              className={cn(
                "w-full min-w-0",
                !available && !selected && "opacity-50"
              )}
              aria-label={ariaLabel}
              aria-pressed={selected}
              aria-describedby={showStockInfo && stockInfo ? `stock-info-${size}` : undefined}
              tabIndex={disabled ? -1 : 0}
            >
              {size}
            </Button>
            {showStockInfo && stockInfo && (
              <span 
                id={`stock-info-${size}`}
                className={cn(
                  "text-xs",
                  stockInfo.quantity === 0 ? "text-destructive" : 
                  stockInfo.isLowStock ? "text-orange-500" : 
                  "text-muted-foreground"
                )}
                aria-live="polite"
              >
                {stockInfo.quantity > 0 ? stockInfo.quantity : t('sales.outOfStock')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}





