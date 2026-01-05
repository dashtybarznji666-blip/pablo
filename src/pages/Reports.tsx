import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSales } from '@/hooks/use-sales';
import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Download,
  FileText,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year' | '3months' | '6months' | 'lastYear';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
  const { t } = useTranslation();
  const { data: sales, isLoading: salesLoading, refetch: refetchSales } = useSales();
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Filter data by date range
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        const endDate = new Date(now.getFullYear() - 1, 11, 31);
        return {
          sales: sales?.filter((sale) => {
            const saleDate = new Date(sale.createdAt);
            return saleDate >= startDate! && saleDate <= endDate;
          }) || [],
          expenses: expenses?.filter((exp) => {
            const expDate = new Date(exp.date);
            return expDate >= startDate! && expDate <= endDate;
          }) || [],
        };
      default:
        return {
          sales: sales || [],
          expenses: expenses || [],
        };
    }

    return {
      sales: sales?.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return startDate ? saleDate >= startDate : true;
      }) || [],
      expenses: expenses?.filter((exp) => {
        const expDate = new Date(exp.date);
        return startDate ? expDate >= startDate : true;
      }) || [],
    };
  }, [sales, expenses, dateFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalSales = filteredData.sales.length;
    const totalRevenue = filteredData.sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = filteredData.sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalExpenses = filteredData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      totalExpenses,
      netProfit,
      profitMargin,
      expenseRatio,
      averageSale,
    };
  }, [filteredData]);

  // Previous period comparison
  const previousPeriodStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 14);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 6, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 2, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      default:
        return null;
    }

    const prevSales = sales?.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    }) || [];

    const prevExpenses = expenses?.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= startDate && expDate <= endDate;
    }) || [];

    const prevRevenue = prevSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const prevProfit = prevSales.reduce((sum, sale) => sum + sale.profit, 0);
    const prevExpensesTotal = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      revenue: prevRevenue,
      profit: prevProfit,
      expenses: prevExpensesTotal,
      netProfit: prevProfit - prevExpensesTotal,
    };
  }, [sales, expenses, dateFilter]);

  // Calculate growth percentages
  const growth = useMemo(() => {
    if (!previousPeriodStats) return null;
    return {
      revenue: previousPeriodStats.revenue > 0
        ? ((statistics.totalRevenue - previousPeriodStats.revenue) / previousPeriodStats.revenue) * 100
        : 0,
      profit: previousPeriodStats.profit > 0
        ? ((statistics.totalProfit - previousPeriodStats.profit) / previousPeriodStats.profit) * 100
        : 0,
      netProfit: previousPeriodStats.netProfit !== 0
        ? ((statistics.netProfit - previousPeriodStats.netProfit) / Math.abs(previousPeriodStats.netProfit)) * 100
        : 0,
    };
  }, [statistics, previousPeriodStats]);

  // Sales by category for charts
  const salesByCategory = useMemo(() => {
    const categoryMap: Record<string, { revenue: number; profit: number; count: number }> = {};
    filteredData.sales.forEach((sale) => {
      const category = sale.shoe?.category || 'unknown';
      if (!categoryMap[category]) {
        categoryMap[category] = { revenue: 0, profit: 0, count: 0 };
      }
      categoryMap[category].revenue += sale.totalPrice;
      categoryMap[category].profit += sale.profit;
      categoryMap[category].count += sale.quantity;
    });

    return Object.entries(categoryMap).map(([name, data]) => ({
      name: t(`shoes.${name}`) || name,
      revenue: data.revenue,
      profit: data.profit,
      count: data.count,
    }));
  }, [filteredData.sales, t]);

  // Sales by brand
  const salesByBrand = useMemo(() => {
    const brandMap: Record<string, { revenue: number; profit: number; count: number }> = {};
    filteredData.sales.forEach((sale) => {
      const brand = sale.shoe?.brand || 'unknown';
      if (!brandMap[brand]) {
        brandMap[brand] = { revenue: 0, profit: 0, count: 0 };
      }
      brandMap[brand].revenue += sale.totalPrice;
      brandMap[brand].profit += sale.profit;
      brandMap[brand].count += sale.quantity;
    });

    return Object.entries(brandMap)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        profit: data.profit,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData.sales]);

  // Online vs Offline sales
  const onlineOfflineSales = useMemo(() => {
    const online = filteredData.sales.filter((s) => s.isOnline);
    const offline = filteredData.sales.filter((s) => !s.isOnline);

    return [
      {
        name: t('reports.online'),
        revenue: online.reduce((sum, s) => sum + s.totalPrice, 0),
        profit: online.reduce((sum, s) => sum + s.profit, 0),
        count: online.length,
      },
      {
        name: t('reports.offline'),
        revenue: offline.reduce((sum, s) => sum + s.totalPrice, 0),
        profit: offline.reduce((sum, s) => sum + s.profit, 0),
        count: offline.length,
      },
    ];
  }, [filteredData.sales, t]);

  // Monthly data for line chart
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: Record<string, { revenue: number; profit: number; expenses: number }> = {};

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months[monthKey] = { revenue: 0, profit: 0, expenses: 0 };
    }

    filteredData.sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      const monthKey = saleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].revenue += sale.totalPrice;
        months[monthKey].profit += sale.profit;
      }
    });

    filteredData.expenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      const monthKey = expDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].expenses += exp.amount;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      profit: data.profit,
      expenses: data.expenses,
      net: data.profit - data.expenses,
    }));
  }, [filteredData]);

  // Top selling shoes
  const topSellingShoes = useMemo(() => {
    const shoeMap: Record<string, { name: string; count: number; revenue: number; profit: number }> = {};
    filteredData.sales.forEach((sale) => {
      const shoeName = sale.shoe?.name || 'Unknown';
      if (!shoeMap[shoeName]) {
        shoeMap[shoeName] = { name: shoeName, count: 0, revenue: 0, profit: 0 };
      }
      shoeMap[shoeName].count += sale.quantity;
      shoeMap[shoeName].revenue += sale.totalPrice;
      shoeMap[shoeName].profit += sale.profit;
    });

    return Object.values(shoeMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData.sales]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    filteredData.expenses.forEach((exp) => {
      const category = exp.category;
      categoryMap[category] = (categoryMap[category] || 0) + exp.amount;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
      name: t(`expenses.${name}`) || name,
      value,
    }));
  }, [filteredData.expenses, t]);

  // Export to Excel
  const handleExport = () => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      [t('reports.totalRevenue'), statistics.totalRevenue],
      [t('reports.totalProfit'), statistics.totalProfit],
      [t('reports.totalExpenses'), statistics.totalExpenses],
      [t('reports.netProfit'), statistics.netProfit],
      [t('reports.profitMargin'), `${statistics.profitMargin.toFixed(2)}%`],
      [t('reports.averageSale'), statistics.averageSale.toFixed(0)],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet([['Metric', 'Value'], ...summaryData]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sales by category
    const categoryData = salesByCategory.map((cat) => [
      cat.name,
      cat.revenue,
      cat.profit,
      cat.count,
    ]);
    const categorySheet = XLSX.utils.aoa_to_sheet([
      [t('reports.category'), t('reports.revenue'), t('reports.profit'), t('reports.items')],
      ...categoryData,
    ]);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Sales by Category');

    // Top selling shoes
    const topShoesData = topSellingShoes.map((shoe) => [
      shoe.name,
      shoe.count,
      shoe.revenue,
      shoe.profit,
    ]);
    const topShoesSheet = XLSX.utils.aoa_to_sheet([
      [t('reports.shoeName'), t('reports.itemsSold'), t('reports.revenue'), t('reports.profit')],
      ...topShoesData,
    ]);
    XLSX.utils.book_append_sheet(workbook, topShoesSheet, 'Top Selling Shoes');

    XLSX.writeFile(workbook, `reports-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print PDF
  const handlePrintPDF = async () => {
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
      title.textContent = t('reports.title');
      title.style.margin = '0 0 10px 0';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.color = '#000';

      const date = document.createElement('div');
      date.textContent = `${t('reports.dateRange')}: ${t(`reports.${dateFilter}`)} - ${new Date().toLocaleDateString()}`;
      date.style.fontSize = '12px';
      date.style.color = '#666';
      date.style.textAlign = isRTL ? 'left' : 'right';

      header.appendChild(title);
      header.appendChild(date);

      // Statistics
      const statsSection = document.createElement('div');
      statsSection.style.display = 'grid';
      statsSection.style.gridTemplateColumns = 'repeat(4, 1fr)';
      statsSection.style.gap = '15px';
      statsSection.style.marginBottom = '20px';

      const stats = [
        { label: t('reports.totalRevenue'), value: statistics.totalRevenue.toLocaleString() + ' IQD' },
        { label: t('reports.totalProfit'), value: statistics.totalProfit.toLocaleString() + ' IQD' },
        { label: t('reports.totalExpenses'), value: statistics.totalExpenses.toLocaleString() + ' IQD' },
        { label: t('reports.netProfit'), value: statistics.netProfit.toLocaleString() + ' IQD' },
      ];

      stats.forEach((stat) => {
        const statBox = document.createElement('div');
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
        value.textContent = stat.value;
        value.style.fontSize = '18px';
        value.style.fontWeight = 'bold';
        value.style.color = '#000';

        statBox.appendChild(label);
        statBox.appendChild(value);
        statsSection.appendChild(statBox);
      });

      printContainer.appendChild(header);
      printContainer.appendChild(statsSection);
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
      pdf.save(`reports-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('reports.pdfGenerationError') || 'Failed to generate PDF');
    }
  };

  const handleRefresh = () => {
    refetchSales();
    refetchExpenses();
  };

  if (salesLoading || expensesLoading) {
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
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('reports.refresh')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('reports.export')}
          </Button>
          <Button variant="outline" onClick={handlePrintPDF}>
            <FileText className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('reports.printPDF')}
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t('reports.selectDateRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('reports.all')}</SelectItem>
                <SelectItem value="today">{t('dashboard.today')}</SelectItem>
                <SelectItem value="week">{t('reports.lastWeek')}</SelectItem>
                <SelectItem value="month">{t('reports.lastMonth')}</SelectItem>
                <SelectItem value="3months">{t('reports.last3Months')}</SelectItem>
                <SelectItem value="6months">{t('reports.last6Months')}</SelectItem>
                <SelectItem value="year">{t('reports.lastYear')}</SelectItem>
              </SelectContent>
            </Select>
            {growth && (
              <div className="text-sm text-muted-foreground">
                {t('reports.comparedToPreviousPeriod')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRevenue.toLocaleString()} IQD</div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalSales} {t('reports.sales')}
              {growth && (
                <span className={`ml-2 ${growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growth.revenue >= 0 ? '+' : ''}{growth.revenue.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.totalProfit.toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {t('reports.grossProfit')} ({statistics.profitMargin.toFixed(1)}%)
              {growth && (
                <span className={`ml-2 ${growth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growth.profit >= 0 ? '+' : ''}{growth.profit.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalExpenses')}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalExpenses.toLocaleString()} IQD</div>
            <p className="text-xs text-muted-foreground">
              {filteredData.expenses.length} {t('reports.expenses')} ({statistics.expenseRatio.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.netProfit')}</CardTitle>
            {statistics.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statistics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statistics.netProfit.toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {t('reports.profitAfterExpenses')}
              {growth && (
                <span className={`ml-2 ${growth.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growth.netProfit >= 0 ? '+' : ''}{growth.netProfit.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('reports.averageSale')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 })} IQD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('reports.profitMargin')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.profitMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('reports.expenseRatio')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.expenseRatio.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('reports.overview')}</TabsTrigger>
          <TabsTrigger value="sales">{t('reports.salesAnalysis')}</TabsTrigger>
          <TabsTrigger value="expenses">{t('reports.expenseAnalysis')}</TabsTrigger>
          <TabsTrigger value="performance">{t('reports.performance')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.revenueTrend')}</CardTitle>
              <CardDescription>{t('reports.revenueTrendDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#0088FE" name={t('reports.revenue')} />
                  <Line type="monotone" dataKey="profit" stroke="#00C49F" name={t('reports.profit')} />
                  <Line type="monotone" dataKey="expenses" stroke="#FF8042" name={t('reports.expenses')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales by Category Pie Chart */}
          {salesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.salesByCategory')}</CardTitle>
                <CardDescription>{t('reports.salesByCategoryDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Profit vs Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.profitVsExpenses')}</CardTitle>
              <CardDescription>{t('reports.profitVsExpensesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="profit" fill="#00C49F" name={t('reports.profit')} />
                  <Bar dataKey="expenses" fill="#FF8042" name={t('reports.expenses')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Analysis Tab */}
        <TabsContent value="sales" className="space-y-6">
          {/* Sales by Brand */}
          {salesByBrand.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.salesByBrand')}</CardTitle>
                <CardDescription>{t('reports.salesByBrandDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByBrand}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0088FE" name={t('reports.revenue')} />
                    <Bar dataKey="profit" fill="#00C49F" name={t('reports.profit')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Online vs Offline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.onlineVsOffline')}</CardTitle>
              <CardDescription>{t('reports.onlineVsOfflineDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={onlineOfflineSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0088FE" name={t('reports.revenue')} />
                  <Bar dataKey="profit" fill="#00C49F" name={t('reports.profit')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Selling Shoes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.topSellingShoes')}</CardTitle>
              <CardDescription>{t('reports.topSellingShoesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSellingShoes.length > 0 ? (
                  topSellingShoes.map((shoe, index) => (
                    <div key={shoe.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{shoe.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {shoe.count} {t('reports.itemsSold')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{shoe.revenue.toLocaleString()} IQD</p>
                        <p className="text-sm text-green-600">{shoe.profit.toLocaleString()} IQD {t('reports.profit')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">{t('reports.noData')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Analysis Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {/* Expenses by Category */}
          {expensesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.expensesByCategory')}</CardTitle>
                <CardDescription>{t('reports.expensesByCategoryDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Expense Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.expenseTrend')}</CardTitle>
              <CardDescription>{t('reports.expenseTrendDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="expenses" stroke="#FF8042" name={t('reports.expenses')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Profit Margin Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.profitMarginTrend')}</CardTitle>
              <CardDescription>{t('reports.profitMarginTrendDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData.map((d) => ({
                  month: d.month,
                  margin: d.revenue > 0 ? ((d.profit / d.revenue) * 100) : 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="margin" stroke="#00C49F" name={t('reports.profitMargin') + ' (%)'} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Net Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.netProfitTrend')}</CardTitle>
              <CardDescription>{t('reports.netProfitTrendDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="net" stroke="#8884d8" name={t('reports.netProfit')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}








