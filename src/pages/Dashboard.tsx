import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSales, useSalesStats, useTodaySales } from '@/hooks/use-sales';
import { useStock, useLowStock } from '@/hooks/use-stock';
import { useExchangeRate } from '@/hooks/use-exchange-rate';
import { useTodayExpenses, useMonthExpenses } from '@/hooks/use-expenses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Settings,
  Receipt,
  AlertTriangle,
  Plus,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import ExchangeRateDialog from '@/components/ExchangeRateDialog';
import AddSaleDialog from '@/components/AddSaleDialog';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import { useShoes } from '@/hooks/use-shoes';
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

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useSalesStats();
  const { data: stock, isLoading: stockLoading } = useStock();
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: todaySales } = useTodaySales();
  const { data: exchangeRate } = useExchangeRate();
  const { data: todayExpenses } = useTodayExpenses();
  const { data: monthExpenses } = useMonthExpenses();
  const { data: lowStock } = useLowStock(3);
  const { data: shoes } = useShoes();
  const [exchangeRateDialogOpen, setExchangeRateDialogOpen] = useState(false);
  const [addSaleDialogOpen, setAddSaleDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  const totalStock = stock?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const netProfitToday = (stats?.todayProfit || 0) - (todayExpenses?.totalExpenses || 0);
  const netProfitMonth = (stats?.totalProfit || 0) - (monthExpenses?.totalExpenses || 0);

  // Calculate profit margin
  const profitMargin = stats?.totalRevenue
    ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
    : '0';

  // Recent sales (last 5)
  const recentSales = useMemo(() => {
    if (!sales) return [];
    return [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [sales]);

  // Sales by category for pie chart
  const salesByCategory = useMemo(() => {
    if (!sales) return [];
    const categoryMap: Record<string, { revenue: number; profit: number; count: number }> = {};
    
    sales.forEach((sale) => {
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
      value: data.revenue,
      profit: data.profit,
      count: data.count,
    }));
  }, [sales, t]);

  // Revenue trend (last 7 days)
  const revenueTrend = useMemo(() => {
    if (!sales) return [];
    const days = 7;
    const data: { date: string; revenue: number; profit: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = sales.filter(
        (sale) =>
          new Date(sale.createdAt) >= date && new Date(sale.createdAt) < nextDate
      );

      const revenue = daySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const profit = daySales.reduce((sum, sale) => sum + sale.profit, 0);

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        profit,
      });
    }

    return data;
  }, [sales]);

  // Top selling products
  const topProducts = useMemo(() => {
    if (!sales) return [];
    const productMap: Record<string, { name: string; count: number; revenue: number }> = {};

    sales.forEach((sale) => {
      const shoeId = sale.shoeId;
      const shoeName = sale.shoe?.name || 'Unknown';
      if (!productMap[shoeId]) {
        productMap[shoeId] = { name: shoeName, count: 0, revenue: 0 };
      }
      productMap[shoeId].count += sale.quantity;
      productMap[shoeId].revenue += sale.totalPrice;
    });

    return Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sales]);

  // Calculate trends (comparing today with yesterday)
  const calculateTrend = (todayValue: number, previousValue: number) => {
    if (previousValue === 0) return { value: 0, isPositive: todayValue > 0 };
    const change = ((todayValue - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  // Get yesterday's stats (simplified - would need backend support for accurate data)
  const yesterdayRevenue = 0; // Placeholder
  const yesterdayProfit = 0; // Placeholder
  const revenueTrendData = calculateTrend(stats?.todayRevenue || 0, yesterdayRevenue);
  const profitTrendData = calculateTrend(stats?.todayProfit || 0, yesterdayProfit);

  if (statsLoading || stockLoading || salesLoading) {
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
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExchangeRateDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t('dashboard.exchangeRate')}
            {exchangeRate && typeof exchangeRate === 'number' && (
              <span className="ml-2 text-xs rtl:mr-2 rtl:ml-0">
                (1 USD = {exchangeRate.toLocaleString()} IQD)
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setAddSaleDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
          <span>{t('sales.addSale')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate('/stock')}
        >
          <Package className="h-6 w-6" />
          <span>{t('stock.addStock')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setAddExpenseDialogOpen(true)}
        >
          <Receipt className="h-6 w-6" />
          <span>{t('expenses.addExpense')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate('/reports')}
        >
          <BarChart3 className="h-6 w-6" />
          <span>{t('nav.reports')}</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalStock')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.itemsInInventory')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalSales')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.todaySales || 0} {t('dashboard.today')}
              {revenueTrendData.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalRevenue || 0).toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {(stats?.todayRevenue || 0).toLocaleString()} IQD {t('dashboard.today')}
              {revenueTrendData.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalProfit || 0).toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {(stats?.todayProfit || 0).toLocaleString()} IQD {t('dashboard.today')}
              {profitTrendData.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.profitMargin')}: {profitMargin}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.netProfit')}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {netProfitMonth.toLocaleString()} IQD
            </div>
            <p className="text-xs text-muted-foreground">
              {netProfitToday.toLocaleString()} IQD {t('dashboard.today')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.profitMinusExpenses')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data Visualization */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenueTrend')}</CardTitle>
            <CardDescription>{t('dashboard.revenueTrendDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} IQD`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name={t('dashboard.revenue')}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#00C49F"
                  strokeWidth={2}
                  name={t('dashboard.profit')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.salesByCategory')}</CardTitle>
            <CardDescription>{t('dashboard.salesByCategoryDescription')}</CardDescription>
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
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} IQD`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Sales, Low Stock, Top Products */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('dashboard.recentSales')}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sales')}
                className="h-auto p-1"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>{t('dashboard.recentSalesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {sale.shoe?.name || t('sales.unknownShoe')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sale.quantity} × {sale.unitPrice.toLocaleString()} IQD
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {sale.totalPrice.toLocaleString()} IQD
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('dashboard.noRecentSales')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {t('dashboard.lowStock')}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/stock')}
                className="h-auto p-1"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>{t('dashboard.lowStockDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock && lowStock.length > 0 ? (
                lowStock.slice(0, 5).map((item) => (
                  <div
                    key={item.shoeId}
                    className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.shoe?.name}</div>
                    </div>
                    <div className="text-sm font-bold text-destructive">
                      {item.quantity} {t('stock.units')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('dashboard.noLowStock')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.topProducts')}</CardTitle>
            <CardDescription>{t('dashboard.topProductsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.count} {t('dashboard.itemsSold')}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {product.revenue.toLocaleString()} IQD
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('dashboard.noTopProducts')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ExchangeRateDialog
        open={exchangeRateDialogOpen}
        onOpenChange={setExchangeRateDialogOpen}
      />
      <AddSaleDialog
        open={addSaleDialogOpen}
        onOpenChange={setAddSaleDialogOpen}
        shoes={shoes || []}
      />
      <AddExpenseDialog
        open={addExpenseDialogOpen}
        onOpenChange={setAddExpenseDialogOpen}
      />
    </div>
  );
}
