import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useExpenses, useDeleteExpense, useTodayExpenses, useMonthExpenses } from '@/hooks/use-expenses';
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
import { Plus, Edit, Trash2, DollarSign, Calendar, Search, Grid3x3, Table2, Download, FileText, X } from 'lucide-react';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import EditExpenseDialog from '@/components/EditExpenseDialog';
import { Expense } from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewMode = 'list' | 'table';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc' | 'title-desc' | 'category-asc' | 'category-desc' | 'type-asc' | 'type-desc' | 'default';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function Expenses() {
  const { t } = useTranslation();
  const { data: expenses, isLoading } = useExpenses();
  const { data: todayStats } = useTodayExpenses();
  const { data: monthStats } = useMonthExpenses();
  const deleteExpense = useDeleteExpense();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Category labels
  const categoryLabels: Record<string, string> = {
    salary: t('expenses.salary'),
    rent: t('expenses.rent'),
    utilities: t('expenses.utilities'),
    supplies: t('expenses.supplies'),
    other: t('expenses.other'),
  };

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    if (!expenses) return [];

    let filtered = expenses.filter((expense) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        expense.title.toLowerCase().includes(searchLower) ||
        expense.description?.toLowerCase().includes(searchLower) ||
        categoryLabels[expense.category]?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;

      // Type filter
      const matchesType = filterType === 'all' || expense.type === filterType;

      // Date filter
      const expenseDate = new Date(expense.date);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesDate = expenseDate >= today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = expenseDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = expenseDate >= monthAgo;
      } else if (dateFilter === 'year') {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        matchesDate = expenseDate >= yearAgo;
      }

      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });

    // Sort
    if (sortOption !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'date-desc':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'category-asc':
            return (categoryLabels[a.category] || a.category).localeCompare(categoryLabels[b.category] || b.category);
          case 'category-desc':
            return (categoryLabels[b.category] || b.category).localeCompare(categoryLabels[a.category] || a.category);
          case 'type-asc':
            return a.type.localeCompare(b.type);
          case 'type-desc':
            return b.type.localeCompare(a.type);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [expenses, searchQuery, filterCategory, filterType, dateFilter, sortOption, categoryLabels]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedExpenses.slice(start, start + itemsPerPage);
  }, [filteredAndSortedExpenses, currentPage, itemsPerPage]);

  // Calculate statistics based on filtered results
  const statistics = useMemo(() => {
    if (!filteredAndSortedExpenses) return {
      totalExpenses: 0,
      count: 0,
      averageExpense: 0,
    };
    const totalExpenses = filteredAndSortedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      totalExpenses,
      count: filteredAndSortedExpenses.length,
      averageExpense: filteredAndSortedExpenses.length > 0 ? totalExpenses / filteredAndSortedExpenses.length : 0,
    };
  }, [filteredAndSortedExpenses]);

  // Export to Excel
  const handleExport = () => {
    if (!filteredAndSortedExpenses || filteredAndSortedExpenses.length === 0) return;

    const headers = [
      t('expenses.date'),
      t('expenses.title'),
      t('expenses.description'),
      t('expenses.category'),
      t('expenses.type'),
      t('expenses.amount'),
    ];
    const rows = filteredAndSortedExpenses.map((expense) => [
      new Date(expense.date).toLocaleDateString(),
      expense.title,
      expense.description || '',
      categoryLabels[expense.category] || expense.category,
      expense.type,
      expense.amount,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    const maxWidth = headers.map((header, i) => {
      const headerLength = header.length;
      const maxDataLength = Math.max(
        ...rows.map((row) => String(row[i] || '').length)
      );
      return Math.max(headerLength, maxDataLength, 10);
    });

    worksheet['!cols'] = maxWidth.map((w) => ({ wch: w }));

    XLSX.writeFile(workbook, `expenses-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print PDF
  const handlePrintPDF = async () => {
    if (!filteredAndSortedExpenses || filteredAndSortedExpenses.length === 0) return;

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
      title.textContent = t('expenses.title');
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
        { label: t('expenses.totalExpenses'), value: statistics.totalExpenses.toLocaleString() + ' IQD' },
        { label: t('expenses.count'), value: statistics.count },
        { label: t('expenses.averageExpense'), value: statistics.averageExpense.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' IQD' },
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
        t('expenses.date'),
        t('expenses.title'),
        t('expenses.category'),
        t('expenses.type'),
        t('expenses.amount'),
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
      filteredAndSortedExpenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        if (index % 2 === 0) {
          row.style.backgroundColor = '#f9f9f9';
        }

        const rowData = [
          new Date(expense.date).toLocaleDateString(),
          expense.title,
          categoryLabels[expense.category] || expense.category,
          expense.type,
          expense.amount.toLocaleString() + ' IQD',
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

      pdf.save(`expenses-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('expenses.pdfGenerationError') || 'Failed to generate PDF');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterType('all');
    setDateFilter('all');
    setSortOption('date-desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    filterCategory !== 'all' ||
    filterType !== 'all' ||
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
          <h1 className="text-3xl font-bold">{t('expenses.title')}</h1>
          <p className="text-muted-foreground">{t('expenses.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {expenses && expenses.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExport} disabled={filteredAndSortedExpenses.length === 0}>
                <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('expenses.export')}
              </Button>
              <Button variant="outline" onClick={handlePrintPDF} disabled={filteredAndSortedExpenses.length === 0}>
                <FileText className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('expenses.printPDF')}
              </Button>
            </>
          )}
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('expenses.addExpense')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('expenses.todaysExpenses')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(todayStats?.totalExpenses || 0).toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.count || 0} {todayStats?.count !== 1 ? t('expenses.expenses_plural') : t('expenses.expense')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('expenses.thisMonth')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(monthStats?.totalExpenses || 0).toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {monthStats?.count || 0} {monthStats?.count !== 1 ? t('expenses.expenses_plural') : t('expenses.expense')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('expenses.totalExpenses')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalExpenses.toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.count} {t('expenses.expenses_plural')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('expenses.averageExpense')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {t('expenses.averagePerExpense')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                <SelectValue placeholder={t('expenses.filterByDate')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="today">{t('dashboard.today')}</SelectItem>
                <SelectItem value="week">{t('expenses.lastWeek')}</SelectItem>
                <SelectItem value="month">{t('expenses.lastMonth')}</SelectItem>
                <SelectItem value="year">{t('expenses.lastYear')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={(value) => { setFilterCategory(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('expenses.filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="salary">{t('expenses.salary')}</SelectItem>
                <SelectItem value="rent">{t('expenses.rent')}</SelectItem>
                <SelectItem value="utilities">{t('expenses.utilities')}</SelectItem>
                <SelectItem value="supplies">{t('expenses.supplies')}</SelectItem>
                <SelectItem value="other">{t('expenses.other')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={(value) => { setFilterType(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('expenses.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="daily">{t('expenses.daily')}</SelectItem>
                <SelectItem value="monthly">{t('expenses.monthly')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder={t('expenses.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t('expenses.sortByDateDesc')}</SelectItem>
                <SelectItem value="date-asc">{t('expenses.sortByDateAsc')}</SelectItem>
                <SelectItem value="amount-desc">{t('expenses.sortByAmountDesc')}</SelectItem>
                <SelectItem value="amount-asc">{t('expenses.sortByAmountAsc')}</SelectItem>
                <SelectItem value="title-asc">{t('expenses.sortByTitleAsc')}</SelectItem>
                <SelectItem value="title-desc">{t('expenses.sortByTitleDesc')}</SelectItem>
                <SelectItem value="category-asc">{t('expenses.sortByCategoryAsc')}</SelectItem>
                <SelectItem value="category-desc">{t('expenses.sortByCategoryDesc')}</SelectItem>
                <SelectItem value="type-asc">{t('expenses.sortByTypeAsc')}</SelectItem>
                <SelectItem value="type-desc">{t('expenses.sortByTypeDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters and Clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t('expenses.clearFilters')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('expenses.showingResults', { count: filteredAndSortedExpenses.length })}
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
                <SelectItem value="10">10 {t('expenses.perPage')}</SelectItem>
                <SelectItem value="25">25 {t('expenses.perPage')}</SelectItem>
                <SelectItem value="50">50 {t('expenses.perPage')}</SelectItem>
                <SelectItem value="100">100 {t('expenses.perPage')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Display */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {paginatedExpenses.length > 0 ? (
            paginatedExpenses.map((expense) => (
              <Card key={expense.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{expense.title}</h3>
                        <span className="px-2 py-1 text-xs bg-secondary rounded">
                          {categoryLabels[expense.category] || expense.category}
                        </span>
                        <span className="px-2 py-1 text-xs bg-primary/10 rounded">
                          {expense.type}
                        </span>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right rtl:text-left">
                        <div className="text-lg font-bold">{expense.amount.toLocaleString()} IQD</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditExpense(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteExpenseId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                  {hasActiveFilters ? t('expenses.noResultsFound') : t('expenses.noExpensesFound')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters ? t('expenses.tryAdjustingFilters') : t('expenses.startTracking')}
                </p>
                {!hasActiveFilters && (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t('expenses.addExpense')}
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
                    <th className="text-left p-4 font-semibold">{t('expenses.date')}</th>
                    <th className="text-left p-4 font-semibold">{t('expenses.title')}</th>
                    <th className="text-left p-4 font-semibold">{t('expenses.description')}</th>
                    <th className="text-left p-4 font-semibold">{t('expenses.category')}</th>
                    <th className="text-left p-4 font-semibold">{t('expenses.type')}</th>
                    <th className="text-left p-4 font-semibold">{t('expenses.amount')}</th>
                    <th className="text-left p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.length > 0 ? (
                    paginatedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 text-sm">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="p-4">{expense.title}</td>
                        <td className="p-4 text-sm text-muted-foreground">{expense.description || '-'}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-xs bg-secondary rounded">
                            {categoryLabels[expense.category] || expense.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-xs bg-primary/10 rounded">
                            {expense.type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold">{expense.amount.toLocaleString()} IQD</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteExpenseId(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          {hasActiveFilters ? t('expenses.noResultsFound') : t('expenses.noExpensesFound')}
                        </h3>
                        <p className="text-muted-foreground">
                          {hasActiveFilters ? t('expenses.tryAdjustingFilters') : t('expenses.startTracking')}
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
            {t('expenses.showing', {
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, filteredAndSortedExpenses.length),
              total: filteredAndSortedExpenses.length,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('expenses.previous')}
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
              {t('expenses.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddExpenseDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {editExpense && (
        <EditExpenseDialog
          expense={editExpense}
          open={!!editExpense}
          onOpenChange={(open) => !open && setEditExpense(null)}
        />
      )}

      <AlertDialog open={deleteExpenseId !== null} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('expenses.deleteExpenseConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('expenses.deleteExpenseConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteExpenseId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteExpenseId) {
                  deleteExpense.mutate(deleteExpenseId);
                  setDeleteExpenseId(null);
                }
              }}
              disabled={deleteExpense.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending ? t('common.loading') : t('expenses.deleteExpenseConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
