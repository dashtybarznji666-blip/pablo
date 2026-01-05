import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupplierPayments, useDeleteSupplierPayment } from '@/hooks/use-supplier-payments';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Search, CreditCard, DollarSign } from 'lucide-react';
import AddSupplierPaymentDialog from '@/components/AddSupplierPaymentDialog';
import { SupplierPayment } from '@/lib/api';

export default function SupplierPayments() {
  const { t } = useTranslation();
  const { data: payments, isLoading } = useSupplierPayments();
  const { data: suppliers } = useSuppliers();
  const deletePayment = useDeleteSupplierPayment();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('date-desc');

  const filteredAndSortedPayments = useMemo(() => {
    if (!payments) return [];

    let filtered = payments.filter((payment) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        payment.supplier?.name.toLowerCase().includes(searchLower) ||
        payment.purchase?.shoe?.name.toLowerCase().includes(searchLower);

      const matchesSupplier = filterSupplier === 'all' || payment.supplierId === filterSupplier;

      return matchesSearch && matchesSupplier;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortOption === 'date-desc') {
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      } else if (sortOption === 'date-asc') {
        return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      } else if (sortOption === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortOption === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return filtered;
  }, [payments, searchQuery, filterSupplier, sortOption]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!payments) return { totalPayments: 0, totalAmount: 0 };
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalPayments: payments.length,
      totalAmount,
    };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('supplierPayments.title')}</h1>
          <p className="text-muted-foreground">{t('supplierPayments.subtitle')}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {t('supplierPayments.addPayment')}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('supplierPayments.totalPayments')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('supplierPayments.totalAmount')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.totalAmount.toLocaleString()} IQD
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger>
                <SelectValue placeholder={t('supplierPayments.filterBySupplier')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue placeholder={t('supplierPayments.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t('supplierPayments.sortByDateDesc')}</SelectItem>
                <SelectItem value="date-asc">{t('supplierPayments.sortByDateAsc')}</SelectItem>
                <SelectItem value="amount-desc">{t('supplierPayments.sortByAmountDesc')}</SelectItem>
                <SelectItem value="amount-asc">{t('supplierPayments.sortByAmountAsc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-2">
        {filteredAndSortedPayments.map((payment) => (
          <Card key={payment.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div className="font-semibold">{payment.supplier?.name}</div>
                  </div>
                  {payment.purchase && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('supplierPayments.forPurchase')}: {payment.purchase.shoe?.name} ({payment.purchase.size})
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right rtl:text-left">
                    <div className="font-bold text-green-600">{payment.amount.toLocaleString()} IQD</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeletePaymentId(payment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedPayments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('supplierPayments.noPaymentsFound')}</h3>
            <p className="text-muted-foreground mb-4">{t('supplierPayments.startAdding')}</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('supplierPayments.addPayment')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddSupplierPaymentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <AlertDialog open={deletePaymentId !== null} onOpenChange={(open) => !open && setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('supplierPayments.deletePaymentConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('supplierPayments.deletePaymentConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePaymentId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePaymentId) {
                  deletePayment.mutate(deletePaymentId);
                  setDeletePaymentId(null);
                }
              }}
              disabled={deletePayment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePayment.isPending ? t('common.loading') : t('supplierPayments.deletePaymentConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}








