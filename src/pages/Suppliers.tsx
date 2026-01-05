import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSuppliers, useDeleteSupplier, useSupplierBalance, useSupplierWithBalance } from '@/hooks/use-suppliers';
import { useSupplierPaymentsBySupplier, useDeleteSupplierPayment } from '@/hooks/use-supplier-payments';
import { usePurchases, useDeletePurchase, usePurchasesBySupplier } from '@/hooks/use-purchases';
import { useTodos, useMarkAsDone } from '@/hooks/use-todos';
import { useMarkAsTodo } from '@/hooks/use-todos';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Building2, CreditCard, Eye, ShoppingBag, ListChecks, CheckCircle2 } from 'lucide-react';
import AddSupplierDialog from '@/components/AddSupplierDialog';
import EditSupplierDialog from '@/components/EditSupplierDialog';
import AddSupplierPaymentDialog from '@/components/AddSupplierPaymentDialog';
import AddPurchaseDialog from '@/components/AddPurchaseDialog';
import { Supplier, Purchase, SupplierTodoGroup } from '@/lib/api';

export default function Suppliers() {
  const { t } = useTranslation();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: purchases, isLoading: purchasesLoading } = usePurchases();
  const { data: todos, isLoading: todosLoading } = useTodos();
  const deleteSupplier = useDeleteSupplier();
  const deletePurchase = useDeletePurchase();
  const markAsTodo = useMarkAsTodo();
  const markAsDone = useMarkAsDone();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [paymentSupplierId, setPaymentSupplierId] = useState<string | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [addPurchaseDialogOpen, setAddPurchaseDialogOpen] = useState(false);
  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<string>('name-asc');
  
  // Purchase filters
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterCredit, setFilterCredit] = useState<string>('all');
  const [filterTodo, setFilterTodo] = useState<string>('all');
  const [purchaseSortOption, setPurchaseSortOption] = useState<string>('date-desc');
  
  // Todo filters
  const [todoSearchQuery, setTodoSearchQuery] = useState('');
  const [todoSortOption, setTodoSortOption] = useState<string>('name-asc');

  const filteredAndSortedSuppliers = useMemo(() => {
    if (!suppliers) return [];

    let filtered = suppliers.filter((supplier) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.contact?.toLowerCase().includes(searchLower) ||
        supplier.address?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return filtered;
  }, [suppliers, searchQuery, sortOption]);

  const filteredAndSortedPurchases = useMemo(() => {
    if (!purchases) return [];

    let filtered = purchases.filter((purchase) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        purchase.shoe?.name.toLowerCase().includes(searchLower) ||
        purchase.supplier?.name.toLowerCase().includes(searchLower) ||
        purchase.size.toLowerCase().includes(searchLower);

      const matchesSupplier = filterSupplier === 'all' || purchase.supplierId === filterSupplier;
      const matchesCredit =
        filterCredit === 'all' ||
        (filterCredit === 'credit' && purchase.isCredit) ||
        (filterCredit === 'paid' && !purchase.isCredit);

      const matchesTodo =
        filterTodo === 'all' ||
        (filterTodo === 'todo' && purchase.isTodo) ||
        (filterTodo === 'not-todo' && !purchase.isTodo);

      return matchesSearch && matchesSupplier && matchesCredit && matchesTodo;
    });

    filtered = [...filtered].sort((a, b) => {
      if (purchaseSortOption === 'date-desc') {
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      } else if (purchaseSortOption === 'date-asc') {
        return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      } else if (purchaseSortOption === 'amount-desc') {
        return b.totalCost - a.totalCost;
      } else if (purchaseSortOption === 'amount-asc') {
        return a.totalCost - b.totalCost;
      }
      return 0;
    });

    return filtered;
  }, [purchases, searchQuery, filterSupplier, filterCredit, filterTodo, purchaseSortOption]);

  const filteredAndSortedTodos = useMemo(() => {
    if (!todos) return [];

    let filtered = todos.filter((group) => {
      const searchLower = todoSearchQuery.toLowerCase();
      const matchesSearch =
        !todoSearchQuery ||
        group.supplier.name.toLowerCase().includes(searchLower) ||
        group.supplier.contact?.toLowerCase().includes(searchLower) ||
        group.purchases.some(
          (p) =>
            p.shoe.name.toLowerCase().includes(searchLower) ||
            p.size.toLowerCase().includes(searchLower)
        );

      return matchesSearch;
    });

    filtered = [...filtered].sort((a, b) => {
      if (todoSortOption === 'name-asc') {
        return a.supplier.name.localeCompare(b.supplier.name);
      } else if (todoSortOption === 'name-desc') {
        return b.supplier.name.localeCompare(a.supplier.name);
      } else if (todoSortOption === 'date-desc') {
        const aLatest = Math.max(...a.purchases.map((p) => new Date(p.purchaseDate).getTime()));
        const bLatest = Math.max(...b.purchases.map((p) => new Date(p.purchaseDate).getTime()));
        return bLatest - aLatest;
      } else if (todoSortOption === 'date-asc') {
        const aLatest = Math.max(...a.purchases.map((p) => new Date(p.purchaseDate).getTime()));
        const bLatest = Math.max(...b.purchases.map((p) => new Date(p.purchaseDate).getTime()));
        return aLatest - bLatest;
      }
      return 0;
    });

    return filtered;
  }, [todos, todoSearchQuery, todoSortOption]);

  // Statistics
  const supplierStats = useMemo(() => {
    return {
      totalSuppliers: filteredAndSortedSuppliers.length,
    };
  }, [filteredAndSortedSuppliers]);

  const purchaseStats = useMemo(() => {
    if (!purchases) return { totalPurchases: 0, totalCost: 0, totalCredit: 0, totalPaid: 0 };
    const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
    const creditPurchases = purchases.filter((p) => p.isCredit);
    const totalCredit = creditPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    return {
      totalPurchases: purchases.length,
      totalCost,
      totalCredit,
      totalPaid,
    };
  }, [purchases]);

  const todoStats = useMemo(() => {
    if (!todos) return { totalTodos: 0, totalSuppliers: 0, totalCost: 0 };
    const totalTodos = todos.reduce((sum, group) => sum + group.purchases.length, 0);
    const totalCost = todos.reduce(
      (sum, group) => sum + group.purchases.reduce((pSum, p) => pSum + p.totalCost, 0),
      0
    );
    return {
      totalTodos,
      totalSuppliers: todos.length,
      totalCost,
    };
  }, [todos]);

  const isLoading = suppliersLoading || purchasesLoading || todosLoading;

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
          <h1 className="text-3xl font-bold">{t('suppliers.title')}</h1>
          <p className="text-muted-foreground">{t('suppliers.subtitle')}</p>
        </div>
        {activeTab === 'suppliers' && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('suppliers.addSupplier')}
          </Button>
        )}
        {activeTab === 'purchases' && (
          <Button onClick={() => setAddPurchaseDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('purchases.addPurchase')}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">{t('suppliers.title')}</TabsTrigger>
          <TabsTrigger value="purchases">{t('purchases.title')}</TabsTrigger>
          <TabsTrigger value="todos">{t('todos.title')}</TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('suppliers.totalSuppliers')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supplierStats.totalSuppliers}</div>
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
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('suppliers.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">{t('suppliers.sortByNameAsc')}</SelectItem>
                    <SelectItem value="name-desc">{t('suppliers.sortByNameDesc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={() => setEditSupplier(supplier)}
                onDelete={() => setDeleteSupplierId(supplier.id)}
                onViewDetails={() => setSelectedSupplierId(supplier.id)}
                onAddPayment={() => {
                  setPaymentSupplierId(supplier.id);
                  setAddPaymentDialogOpen(true);
                }}
              />
            ))}
          </div>

          {filteredAndSortedSuppliers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('suppliers.noSuppliersFound')}</h3>
                <p className="text-muted-foreground mb-4">{t('suppliers.startAdding')}</p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t('suppliers.addSupplier')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('purchases.totalPurchases')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.totalPurchases}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('purchases.totalCost')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.totalCost.toLocaleString()} IQD</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('purchases.totalCredit')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {purchaseStats.totalCredit.toLocaleString()} IQD
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('purchases.totalPaid')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {purchaseStats.totalPaid.toLocaleString()} IQD
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <SelectValue placeholder={t('purchases.filterBySupplier')} />
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
                <Select value={filterCredit} onValueChange={setFilterCredit}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchases.filterByCredit')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="credit">{t('purchases.credit')}</SelectItem>
                    <SelectItem value="paid">{t('purchases.paid')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterTodo} onValueChange={setFilterTodo}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchases.filterByTodo')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="todo">{t('purchases.todo')}</SelectItem>
                    <SelectItem value="not-todo">{t('purchases.notTodo')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={purchaseSortOption} onValueChange={setPurchaseSortOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchases.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">{t('purchases.sortByDateDesc')}</SelectItem>
                    <SelectItem value="date-asc">{t('purchases.sortByDateAsc')}</SelectItem>
                    <SelectItem value="amount-desc">{t('purchases.sortByAmountDesc')}</SelectItem>
                    <SelectItem value="amount-asc">{t('purchases.sortByAmountAsc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Purchases List */}
          <div className="space-y-2">
            {filteredAndSortedPurchases.map((purchase) => {
              const remainingBalance = purchase.isCredit
                ? purchase.totalCost - (purchase.paidAmount || 0)
                : 0;
              return (
                <Card key={purchase.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{purchase.shoe?.name || t('purchases.unknownShoe')}</div>
                          {purchase.isCredit && (
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                              {t('purchases.credit')}
                            </span>
                          )}
                          {purchase.isTodo && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                              <ListChecks className="h-3 w-3" />
                              {t('purchases.todo')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {purchase.supplier?.name} • {t('purchases.size')} {purchase.size} • {t('purchases.quantity')}: {purchase.quantity}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right rtl:text-left">
                          <div className="font-bold">{purchase.totalCost.toLocaleString()} IQD</div>
                          {purchase.isCredit && remainingBalance > 0 && (
                            <div className="text-sm text-orange-600 font-semibold">
                              {t('purchases.remaining')}: {remainingBalance.toLocaleString()} IQD
                            </div>
                          )}
                          {purchase.isCredit && purchase.paidAmount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {t('purchases.paid')}: {purchase.paidAmount.toLocaleString()} IQD
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!purchase.isTodo && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsTodo.mutate(purchase.id)}
                              disabled={markAsTodo.isPending}
                              title={t('purchases.markAsTodo')}
                            >
                              <ListChecks className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletePurchaseId(purchase.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAndSortedPurchases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('purchases.noPurchasesFound')}</h3>
                <p className="text-muted-foreground mb-4">{t('purchases.startAdding')}</p>
                <Button onClick={() => setAddPurchaseDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t('purchases.addPurchase')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Todos Tab */}
        <TabsContent value="todos" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('todos.totalTodos')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todoStats.totalTodos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('todos.totalSuppliers')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todoStats.totalSuppliers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('todos.totalCost')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todoStats.totalCost.toLocaleString()} IQD</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                  <Input
                    placeholder={t('common.search')}
                    value={todoSearchQuery}
                    onChange={(e) => setTodoSearchQuery(e.target.value)}
                    className="pl-9 rtl:pl-3 rtl:pr-9"
                  />
                </div>
                <Select value={todoSortOption} onValueChange={setTodoSortOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('todos.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">{t('todos.sortByNameAsc')}</SelectItem>
                    <SelectItem value="name-desc">{t('todos.sortByNameDesc')}</SelectItem>
                    <SelectItem value="date-desc">{t('todos.sortByDateDesc')}</SelectItem>
                    <SelectItem value="date-asc">{t('todos.sortByDateAsc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Todos List Grouped by Supplier */}
          <div className="space-y-4">
            {filteredAndSortedTodos.map((group) => (
              <SupplierTodoGroupCard key={group.supplier.id} group={group} />
            ))}
          </div>

          {filteredAndSortedTodos.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('todos.noTodos')}</h3>
                <p className="text-muted-foreground">{t('todos.noTodosDescription')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddSupplierDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {editSupplier && (
        <EditSupplierDialog
          supplier={editSupplier}
          open={!!editSupplier}
          onOpenChange={(open) => !open && setEditSupplier(null)}
        />
      )}
      {selectedSupplierId && (
        <SupplierDetailDialog
          supplierId={selectedSupplierId}
          open={!!selectedSupplierId}
          onOpenChange={(open) => !open && setSelectedSupplierId(null)}
          onAddPayment={() => {
            setPaymentSupplierId(selectedSupplierId);
            setAddPaymentDialogOpen(true);
            setSelectedSupplierId(null);
          }}
        />
      )}
      {paymentSupplierId && (
        <AddSupplierPaymentDialog
          open={addPaymentDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setPaymentSupplierId(null);
            }
            setAddPaymentDialogOpen(open);
          }}
          defaultSupplierId={paymentSupplierId}
        />
      )}
      <AddPurchaseDialog open={addPurchaseDialogOpen} onOpenChange={setAddPurchaseDialogOpen} />
      <AlertDialog open={deleteSupplierId !== null} onOpenChange={(open) => !open && setDeleteSupplierId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('suppliers.deleteSupplierConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('suppliers.deleteSupplierConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSupplierId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSupplierId) {
                  deleteSupplier.mutate(deleteSupplierId);
                  setDeleteSupplierId(null);
                }
              }}
              disabled={deleteSupplier.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplier.isPending ? t('common.loading') : t('suppliers.deleteSupplierConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deletePurchaseId !== null} onOpenChange={(open) => !open && setDeletePurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchases.deletePurchaseConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('purchases.deletePurchaseConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePurchaseId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePurchaseId) {
                  deletePurchase.mutate(deletePurchaseId);
                  setDeletePurchaseId(null);
                }
              }}
              disabled={deletePurchase.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePurchase.isPending ? t('common.loading') : t('purchases.deletePurchaseConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SupplierCard({
  supplier,
  onEdit,
  onDelete,
  onViewDetails,
  onAddPayment,
}: {
  supplier: Supplier;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onAddPayment: () => void;
}) {
  const { t } = useTranslation();
  const { data: balance } = useSupplierBalance(supplier.id);

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {supplier.name}
        </CardTitle>
        {supplier.contact && (
          <CardDescription>{supplier.contact}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {supplier.address && (
            <div>
              <div className="text-xs text-muted-foreground">{t('suppliers.address')}</div>
              <div className="text-sm">{supplier.address}</div>
            </div>
          )}
          {balance && balance.outstandingBalance > 0 && (
            <div>
              <div className="text-xs text-muted-foreground">{t('suppliers.outstandingBalance')}</div>
              <div className="text-lg font-bold text-orange-600">
                {balance.outstandingBalance.toLocaleString()} IQD
              </div>
            </div>
          )}
          {balance && balance.outstandingBalance === 0 && (
            <div>
              <div className="text-xs text-muted-foreground">{t('suppliers.balance')}</div>
              <div className="text-sm text-green-600">{t('suppliers.noBalance')}</div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <Eye className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('common.view')}
            </Button>
            {balance && balance.outstandingBalance > 0 && (
              <Button variant="default" size="sm" onClick={onAddPayment}>
                <CreditCard className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('supplierPayments.addPayment')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierDetailDialog({
  supplierId,
  open,
  onOpenChange,
  onAddPayment,
}: {
  supplierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPayment: () => void;
}) {
  const { t } = useTranslation();
  const { data: supplier } = useSupplierWithBalance(supplierId);
  const { data: payments } = useSupplierPaymentsBySupplier(supplierId);
  const { data: purchases } = usePurchasesBySupplier(supplierId);
  const deletePayment = useDeleteSupplierPayment();
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState('info');

  if (!supplier) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {supplier.name}
          </DialogTitle>
          <DialogDescription>{t('suppliers.supplierDetails')}</DialogDescription>
        </DialogHeader>
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">{t('suppliers.information')}</TabsTrigger>
            <TabsTrigger value="purchases">{t('purchases.title')}</TabsTrigger>
            <TabsTrigger value="balance">{t('suppliers.balance')}</TabsTrigger>
            <TabsTrigger value="payments">{t('supplierPayments.title')}</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-4">
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium">{t('suppliers.name')}</div>
                <div className="text-sm text-muted-foreground">{supplier.name}</div>
              </div>
              {supplier.contact && (
                <div>
                  <div className="text-sm font-medium">{t('suppliers.contact')}</div>
                  <div className="text-sm text-muted-foreground">{supplier.contact}</div>
                </div>
              )}
              {supplier.address && (
                <div>
                  <div className="text-sm font-medium">{t('suppliers.address')}</div>
                  <div className="text-sm text-muted-foreground">{supplier.address}</div>
                </div>
              )}
              {supplier.notes && (
                <div>
                  <div className="text-sm font-medium">{t('suppliers.notes')}</div>
                  <div className="text-sm text-muted-foreground">{supplier.notes}</div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="purchases" className="space-y-4">
            <div className="space-y-2">
              {purchases && purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <Card key={purchase.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{purchase.shoe?.name || t('purchases.unknownShoe')}</div>
                            {purchase.isCredit && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                {t('purchases.credit')}
                              </span>
                            )}
                            {purchase.isTodo && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                                <ListChecks className="h-3 w-3" />
                                {t('purchases.todo')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t('purchases.size')} {purchase.size} • {t('purchases.quantity')}: {purchase.quantity}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right rtl:text-left">
                          <div className="font-bold">{purchase.totalCost.toLocaleString()} IQD</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('purchases.noPurchasesFound')}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="balance" className="space-y-4">
            {supplier.balance && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('suppliers.balanceDetails')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('suppliers.totalCredit')}</span>
                      <span className="font-semibold">{supplier.balance.totalCredit.toLocaleString()} IQD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('suppliers.totalPaid')}</span>
                      <span className="font-semibold text-green-600">
                        {supplier.balance.totalPaid.toLocaleString()} IQD
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-medium">{t('suppliers.outstandingBalance')}</span>
                      <span className={`font-bold text-lg ${supplier.balance.outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {supplier.balance.outstandingBalance.toLocaleString()} IQD
                      </span>
                    </div>
                  </CardContent>
                </Card>
                {supplier.balance.outstandingBalance > 0 && (
                  <Button onClick={onAddPayment} className="w-full">
                    <CreditCard className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t('supplierPayments.addPayment')}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t('supplierPayments.paymentHistory')}</h3>
              <Button onClick={onAddPayment} size="sm">
                <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('supplierPayments.addPayment')}
              </Button>
            </div>
            <div className="space-y-2">
              {payments && payments.length > 0 ? (
                payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div className="font-semibold">{payment.amount.toLocaleString()} IQD</div>
                          </div>
                          {payment.purchase && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {t('supplierPayments.forPurchase')}: {payment.purchase.shoe?.name} ({payment.purchase.size})
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </div>
                          {payment.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{payment.notes}</div>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletePaymentId(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('supplierPayments.noPaymentsFound')}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
      </DialogContent>
    </Dialog>
  );
}

function SupplierTodoGroupCard({
  group,
}: {
  group: SupplierTodoGroup;
}) {
  const { t } = useTranslation();
  const { data: balance } = useSupplierBalance(group.supplier.id);
  const markAsDone = useMarkAsDone();

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>{group.supplier.name}</CardTitle>
          </div>
          {balance && balance.outstandingBalance > 0 && (
            <div className="text-sm text-orange-600 font-semibold">
              {t('todos.outstandingBalance')}: {balance.outstandingBalance.toLocaleString()} IQD
            </div>
          )}
        </div>
        {group.supplier.contact && (
          <CardDescription>{group.supplier.contact}</CardDescription>
        )}
        {group.supplier.address && (
          <CardDescription className="text-xs">{group.supplier.address}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {group.purchases.map((purchase) => {
            const remainingBalance = purchase.isCredit
              ? purchase.totalCost - purchase.paidAmount
              : 0;
            return (
              <Card key={purchase.id} className="bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{purchase.shoe.name}</div>
                        {purchase.isCredit && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            {t('purchases.credit')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('purchases.size')} {purchase.size} • {t('purchases.quantity')}: {purchase.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right rtl:text-left">
                        <div className="font-bold">{purchase.totalCost.toLocaleString()} IQD</div>
                        {purchase.isCredit && remainingBalance > 0 && (
                          <div className="text-sm text-orange-600 font-semibold">
                            {t('purchases.remaining')}: {remainingBalance.toLocaleString()} IQD
                          </div>
                        )}
                        {purchase.isCredit && purchase.paidAmount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {t('purchases.paid')}: {purchase.paidAmount.toLocaleString()} IQD
                          </div>
                        )}
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => markAsDone.mutate(purchase.id)}
                        disabled={markAsDone.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        {t('todos.markAsDone')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
