import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSales, useTodaySales, useDeleteAllSales, useDeleteSale } from '@/hooks/use-sales';
import { useShoes } from '@/hooks/use-shoes';
import { useUsers } from '@/hooks/use-users';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, DollarSign, Trash2, Search, Grid3x3, Table2, Download, FileText, X } from 'lucide-react';
import AddSaleDialog from '@/components/AddSaleDialog';
import { Sale } from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewMode = 'list' | 'table';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'profit-desc' | 'profit-asc' | 'name-asc' | 'name-desc' | 'default';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function Sales() {
  const { t } = useTranslation();
  const { data: sales, isLoading } = useSales();
  const { data: todaySales } = useTodaySales();
  const { data: shoes } = useShoes();
  const { data: users } = useUsers();
  const deleteAllSales = useDeleteAllSales();
  const deleteSale = useDeleteSale();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterOnline, setFilterOnline] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Get unique categories and brands from sales
  const categories = useMemo(() => {
    if (!sales) return [];
    return Array.from(new Set(sales.map(s => s.shoe?.category).filter(Boolean))) as string[];
  }, [sales]);

  const brands = useMemo(() => {
    if (!sales) return [];
    return Array.from(new Set(sales.map(s => s.shoe?.brand).filter(Boolean))).sort() as string[];
  }, [sales]);

  // Filter and sort sales
  const filteredAndSortedSales = useMemo(() => {
    if (!sales) return [];

    let filtered = sales.filter((sale) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        sale.shoe?.name.toLowerCase().includes(searchLower) ||
        sale.shoe?.brand.toLowerCase().includes(searchLower) ||
        sale.shoe?.category.toLowerCase().includes(searchLower) ||
        sale.shoe?.sku?.toLowerCase().includes(searchLower) ||
        sale.size.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = filterCategory === 'all' || sale.shoe?.category === filterCategory;

      // Brand filter
      const matchesBrand = filterBrand === 'all' || sale.shoe?.brand === filterBrand;

      // Online filter
      const matchesOnline =
        filterOnline === 'all' ||
        (filterOnline === 'online' && sale.isOnline) ||
        (filterOnline === 'offline' && !sale.isOnline);

      // User filter
      const matchesUser =
        filterUser === 'all' ||
        (filterUser === 'no-user' && !sale.userId) ||
        (filterUser === sale.userId);

      // Date filter
      const saleDate = new Date(sale.createdAt);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesDate = saleDate >= today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = saleDate >= monthAgo;
      } else if (dateFilter === 'year') {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        matchesDate = saleDate >= yearAgo;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesOnline && matchesUser && matchesDate;
    });

    // Sort
    if (sortOption !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'date-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'amount-desc':
            return b.totalPrice - a.totalPrice;
          case 'amount-asc':
            return a.totalPrice - b.totalPrice;
          case 'profit-desc':
            return b.profit - a.profit;
          case 'profit-asc':
            return a.profit - b.profit;
          case 'name-asc':
            return (a.shoe?.name || '').localeCompare(b.shoe?.name || '');
          case 'name-desc':
            return (b.shoe?.name || '').localeCompare(a.shoe?.name || '');
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [sales, searchQuery, filterCategory, filterBrand, filterOnline, filterUser, dateFilter, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSales.slice(start, start + itemsPerPage);
  }, [filteredAndSortedSales, currentPage, itemsPerPage]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!filteredAndSortedSales) return { totalSales: 0, totalRevenue: 0, totalProfit: 0, averageSale: 0 };
    const totalRevenue = filteredAndSortedSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = filteredAndSortedSales.reduce((sum, sale) => sum + sale.profit, 0);
    return {
      totalSales: filteredAndSortedSales.length,
      totalRevenue,
      totalProfit,
      averageSale: filteredAndSortedSales.length > 0 ? totalRevenue / filteredAndSortedSales.length : 0,
    };
  }, [filteredAndSortedSales]);

  // Export to Excel
  const handleExport = () => {
    if (!filteredAndSortedSales || filteredAndSortedSales.length === 0) return;

    const headers = [
      t('sales.date'),
      t('sales.shoeName'),
      t('sales.brand'),
      t('sales.category'),
      t('sales.size'),
      t('sales.quantity'),
      t('sales.unitPrice'),
      t('sales.totalPrice'),
      t('sales.profit'),
      t('sales.online'),
    ];
    const rows = filteredAndSortedSales.map((sale) => [
      new Date(sale.createdAt).toLocaleString(),
      sale.shoe?.name || '',
      sale.shoe?.brand || '',
      sale.shoe?.category || '',
      sale.size,
      sale.quantity,
      sale.unitPrice,
      sale.totalPrice,
      sale.profit,
      sale.isOnline ? t('common.yes') : t('common.no'),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');

    const maxWidth = headers.map((header, i) => {
      const headerLength = header.length;
      const maxDataLength = Math.max(
        ...rows.map((row) => String(row[i] || '').length)
      );
      return Math.max(headerLength, maxDataLength, 10);
    });

    worksheet['!cols'] = maxWidth.map((w) => ({ wch: w }));

    XLSX.writeFile(workbook, `sales-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print PDF
  const handlePrintPDF = async () => {
    if (!filteredAndSortedSales || filteredAndSortedSales.length === 0) return;

    try {
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.width = '1123px';
      printContainer.style.padding = '20px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      const isRTL = document.documentElement.dir === 'rtl';
      if (isRTL) {
        printContainer.style.direction = 'rtl';
      }

      // Header
      const header = document.createElement('div');
      header.style.marginBottom = '20px';
      header.style.borderBottom = '2px solid #333';
      header.style.paddingBottom = '15px';

      const title = document.createElement('h1');
      title.textContent = t('sales.title');
      title.style.margin = '0 0 10px 0';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.color = '#000';

      const date = document.createElement('div');
      date.textContent = new Date().toLocaleDateString();
      date.style.fontSize = '12px';
      date.style.color = '#666';
      date.style.textAlign = isRTL ? 'left' : 'right';

      header.appendChild(title);
      header.appendChild(date);

      // Statistics
      const statsSection = document.createElement('div');
      statsSection.style.display = 'flex';
      statsSection.style.gap = '15px';
      statsSection.style.marginBottom = '20px';
      statsSection.style.flexDirection = isRTL ? 'row-reverse' : 'row';

      const stats = [
        { label: t('sales.totalSales'), value: statistics.totalSales },
        { label: t('sales.totalRevenue'), value: statistics.totalRevenue.toLocaleString() + ' IQD' },
        { label: t('sales.totalProfit'), value: statistics.totalProfit.toLocaleString() + ' IQD' },
      ];

      stats.forEach((stat) => {
        const statBox = document.createElement('div');
        statBox.style.flex = '1';
        statBox.style.padding = '10px';
        statBox.style.backgroundColor = '#f5f5f5';
        statBox.style.borderRadius = '4px';
        statBox.style.textAlign = 'center';

        const label = document.createElement('div');
        label.textContent = stat.label;
        label.style.fontSize = '12px';
        label.style.color = '#666';
        label.style.marginBottom = '5px';

        const value = document.createElement('div');
        value.textContent = String(stat.value);
        value.style.fontSize = '18px';
        value.style.fontWeight = 'bold';
        value.style.color = '#000';

        statBox.appendChild(label);
        statBox.appendChild(value);
        statsSection.appendChild(statBox);
      });

      // Table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';
      table.style.marginTop = '20px';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#333';
      headerRow.style.color = '#fff';

      const headers = [
        t('sales.date'),
        t('sales.shoeName'),
        t('sales.size'),
        t('sales.quantity'),
        t('sales.totalPrice'),
        t('sales.profit'),
      ];
      headers.forEach((headerText) => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '10px';
        th.style.textAlign = 'left';
        th.style.border = '1px solid #ddd';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      filteredAndSortedSales.forEach((sale, index) => {
        const row = document.createElement('tr');
        if (index % 2 === 0) {
          row.style.backgroundColor = '#f9f9f9';
        }

        const rowData = [
          new Date(sale.createdAt).toLocaleString(),
          sale.shoe?.name || '',
          sale.size,
          sale.quantity.toString(),
          sale.totalPrice.toLocaleString() + ' IQD',
          sale.profit.toLocaleString() + ' IQD',
        ];

        rowData.forEach((cellText) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '8px';
          td.style.border = '1px solid #ddd';
          td.style.color = '#000';
          row.appendChild(td);
        });

        tbody.appendChild(row);
      });

      table.appendChild(tbody);

      printContainer.appendChild(header);
      printContainer.appendChild(statsSection);
      printContainer.appendChild(table);
      document.body.appendChild(printContainer);

      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(printContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > 0) {
        position = heightLeft - pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('sales.pdfGenerationError') || 'Failed to generate PDF');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterBrand('all');
    setFilterOnline('all');
    setFilterUser('all');
    setDateFilter('all');
    setSortOption('date-desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    filterCategory !== 'all' ||
    filterBrand !== 'all' ||
    filterOnline !== 'all' ||
    filterUser !== 'all' ||
    dateFilter !== 'all';

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
          <h1 className="text-3xl font-bold">{t('sales.title')}</h1>
          <p className="text-muted-foreground">{t('sales.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {sales && sales.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExport} disabled={filteredAndSortedSales.length === 0}>
                <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('sales.export')}
              </Button>
              <Button variant="outline" onClick={handlePrintPDF} disabled={filteredAndSortedSales.length === 0}>
                <FileText className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('sales.printPDF')}
              </Button>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t('sales.deleteAll')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('sales.deleteAllConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('sales.deleteAllConfirmDescription', { count: sales.length })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteAllSales.mutate();
                        setDeleteDialogOpen(false);
                      }}
                      disabled={deleteAllSales.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteAllSales.isPending ? t('common.loading') : t('sales.deleteAllConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('sales.addSale')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('sales.totalSales')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('sales.totalRevenue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRevenue.toLocaleString()} IQD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('sales.totalProfit')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.totalProfit.toLocaleString()} IQD
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('sales.averageSale')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 })} IQD
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(value) => { setDateFilter(value as DateFilter); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('sales.filterByDate')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="today">{t('dashboard.today')}</SelectItem>
                <SelectItem value="week">{t('sales.lastWeek')}</SelectItem>
                <SelectItem value="month">{t('sales.lastMonth')}</SelectItem>
                <SelectItem value="year">{t('sales.lastYear')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={(value) => { setFilterCategory(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('sales.filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`shoes.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Brand Filter */}
            <Select value={filterBrand} onValueChange={(value) => { setFilterBrand(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('sales.filterByBrand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Online Filter */}
            <Select value={filterOnline} onValueChange={(value) => { setFilterOnline(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('sales.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="online">{t('sales.online')}</SelectItem>
                <SelectItem value="offline">{t('sales.offline')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={(value) => { setFilterUser(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('sales.filterByUser')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="no-user">{t('sales.noUser')}</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder={t('sales.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t('sales.sortByDateDesc')}</SelectItem>
                <SelectItem value="date-asc">{t('sales.sortByDateAsc')}</SelectItem>
                <SelectItem value="amount-desc">{t('sales.sortByAmountDesc')}</SelectItem>
                <SelectItem value="amount-asc">{t('sales.sortByAmountAsc')}</SelectItem>
                <SelectItem value="profit-desc">{t('sales.sortByProfitDesc')}</SelectItem>
                <SelectItem value="profit-asc">{t('sales.sortByProfitAsc')}</SelectItem>
                <SelectItem value="name-asc">{t('sales.sortByNameAsc')}</SelectItem>
                <SelectItem value="name-desc">{t('sales.sortByNameDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters and Clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('sales.clearFilters')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('sales.showingResults', { count: filteredAndSortedSales.length })}
              </span>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Items per page */}
            <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 {t('sales.perPage')}</SelectItem>
                <SelectItem value="25">25 {t('sales.perPage')}</SelectItem>
                <SelectItem value="50">50 {t('sales.perPage')}</SelectItem>
                <SelectItem value="100">100 {t('sales.perPage')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Display */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {paginatedSales.length > 0 ? (
            paginatedSales.map((sale) => (
              <Card key={sale.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{sale.shoe?.name}</div>
                        {sale.isOnline && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            {t('sales.online')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {sale.shoe?.brand} • {t(`shoes.${sale.shoe?.category}`)} • {t('stock.size')} {sale.size} • {t('stock.quantity')}: {sale.quantity}
                      </div>
                      {sale.user && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('sales.soldBy')}: {sale.user.name} ({sale.user.phoneNumber})
                        </div>
                      )}
                      {!sale.user && sale.userId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('sales.soldBy')}: {t('sales.unknownUser')}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(sale.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right rtl:text-left">
                        <div className="font-bold">{sale.totalPrice.toLocaleString()} IQD</div>
                        <div className="text-sm text-green-600 font-semibold">
                          {t('sales.profit')}: {sale.profit.toLocaleString()} IQD
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('sales.unitPrice')}: {sale.unitPrice.toLocaleString()} IQD
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteSaleId(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {hasActiveFilters ? t('sales.noResultsFound') : t('sales.noSalesYet')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? t('sales.tryAdjustingFilters') : t('sales.startRecording')}
                </p>
                {!hasActiveFilters && (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t('sales.addSale')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">{t('sales.date')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.shoeName')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.brand')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.category')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.size')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.quantity')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.unitPrice')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.totalPrice')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.profit')}</th>
                    <th className="text-left p-4 font-semibold">{t('sales.soldBy')}</th>
                    <th className="text-left p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.length > 0 ? (
                    paginatedSales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 text-sm">{new Date(sale.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {sale.shoe?.name}
                            {sale.isOnline && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                {t('sales.online')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{sale.shoe?.brand}</td>
                        <td className="p-4">{t(`shoes.${sale.shoe?.category}`)}</td>
                        <td className="p-4">{sale.size}</td>
                        <td className="p-4">{sale.quantity}</td>
                        <td className="p-4">{sale.unitPrice.toLocaleString()} IQD</td>
                        <td className="p-4 font-semibold">{sale.totalPrice.toLocaleString()} IQD</td>
                        <td className="p-4 font-semibold text-green-600">{sale.profit.toLocaleString()} IQD</td>
                        <td className="p-4 text-sm">
                          {sale.user ? (
                            <div>
                              <div>{sale.user.name}</div>
                              <div className="text-xs text-muted-foreground">{sale.user.phoneNumber}</div>
                            </div>
                          ) : sale.userId ? (
                            <span className="text-muted-foreground">{t('sales.unknownUser')}</span>
                          ) : (
                            <span className="text-muted-foreground">{t('sales.noUser')}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteSaleId(sale.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-12 text-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          {hasActiveFilters ? t('sales.noResultsFound') : t('sales.noSalesYet')}
                        </h3>
                        <p className="text-muted-foreground">
                          {hasActiveFilters ? t('sales.tryAdjustingFilters') : t('sales.startRecording')}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('sales.showing', {
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, filteredAndSortedSales.length),
              total: filteredAndSortedSales.length,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('sales.previous')}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('sales.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddSaleDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        shoes={shoes || []}
      />

      <AlertDialog open={deleteSaleId !== null} onOpenChange={(open) => !open && setDeleteSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sales.deleteSaleConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sales.deleteSaleConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSaleId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSaleId) {
                  deleteSale.mutate(deleteSaleId);
                  setDeleteSaleId(null);
                }
              }}
              disabled={deleteSale.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSale.isPending ? t('common.loading') : t('sales.deleteSaleConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
