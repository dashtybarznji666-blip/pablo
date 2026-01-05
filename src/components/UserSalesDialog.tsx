import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSalesByUser, useUserSalesStats } from '@/hooks/use-sales';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, DollarSign, TrendingUp, ShoppingCart, Download, X } from 'lucide-react';
import { Sale } from '@/lib/api';
import * as XLSX from 'xlsx';

interface UserSalesDialogProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserSalesDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserSalesDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [skip, setSkip] = useState(0);
  const take = 50;

  const { data: sales, isLoading: salesLoading } = useSalesByUser(
    userId || '',
    skip,
    take
  );
  const { data: stats, isLoading: statsLoading } = useUserSalesStats(userId || '');

  const filteredSales = useMemo(() => {
    if (!sales) return [];

    let filtered = sales.filter((sale) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        sale.shoe?.name.toLowerCase().includes(searchLower) ||
        sale.shoe?.brand.toLowerCase().includes(searchLower) ||
        sale.shoe?.sku.toLowerCase().includes(searchLower);

      const saleDate = new Date(sale.createdAt);
      const now = new Date();
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' &&
          saleDate.toDateString() === now.toDateString()) ||
        (dateFilter === 'week' &&
          saleDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'month' &&
          saleDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

      return matchesSearch && matchesDate;
    });

    return filtered;
  }, [sales, searchQuery, dateFilter]);

  const handleExport = () => {
    if (!filteredSales || filteredSales.length === 0) return;

    const exportData = filteredSales.map((sale) => ({
      Date: new Date(sale.createdAt).toLocaleDateString(),
      'Shoe Name': sale.shoe?.name || '',
      Brand: sale.shoe?.brand || '',
      SKU: sale.shoe?.sku || '',
      Size: sale.size,
      Quantity: sale.quantity,
      'Unit Price (IQD)': sale.unitPrice,
      'Total Price (IQD)': sale.totalPrice,
      'Profit (IQD)': sale.profit,
      'Exchange Rate': sale.exchangeRate || '',
      'Is Online': sale.isOnline ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `${userName}_sales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('users.userSales', { name: userName })}</DialogTitle>
          <DialogDescription>{t('users.userSalesDescription')}</DialogDescription>
        </DialogHeader>

        {statsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">{t('common.loading')}</div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('users.totalSales')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSales || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('users.totalRevenue')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US').format(stats.totalRevenue || 0)} IQD
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('users.totalProfit')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('en-US').format(stats.totalProfit || 0)} IQD
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('users.averageSaleAmount')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US').format(stats.averageSaleAmount || 0)} IQD
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.filterByDate')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="today">{t('common.today')}</SelectItem>
                <SelectItem value="week">{t('common.thisWeek')}</SelectItem>
                <SelectItem value="month">{t('common.thisMonth')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={!filteredSales || filteredSales.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
          </div>

          {salesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">{t('common.loading')}</div>
            </div>
          ) : filteredSales.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('users.noSalesFound')}</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredSales.map((sale) => (
                <Card key={sale.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{sale.shoe?.name || t('common.unknown')}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sale.shoe?.brand} - {sale.shoe?.sku} | {t('common.size')}: {sale.size} | {t('common.quantity')}: {sale.quantity}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(sale.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">{t('sales.totalPrice')}</div>
                          <div className="font-semibold">
                            {new Intl.NumberFormat('en-US').format(sale.totalPrice)} IQD
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('sales.profit')}</div>
                          <div className="font-semibold text-green-600">
                            {new Intl.NumberFormat('en-US').format(sale.profit)} IQD
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

