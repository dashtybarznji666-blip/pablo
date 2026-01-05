import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUsersWithSalesStats } from '@/hooks/use-users';
import { useSalesStats } from '@/hooks/use-sales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users as UsersIcon,
  Shield,
  UserCheck,
  UserX,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Settings,
  ArrowRight,
  Activity,
  Clock,
} from 'lucide-react';

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: users, isLoading: usersLoading } = useUsersWithSalesStats();
  const { data: salesStats, isLoading: salesLoading } = useSalesStats();

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!users) return { totalUsers: 0, activeUsers: 0, admins: 0, inactiveUsers: 0 };
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === 'admin').length,
      inactiveUsers: users.filter((u) => !u.isActive).length,
    };
  }, [users]);

  // Recent users (last 5 registered)
  const recentUsers = useMemo(() => {
    if (!users) return [];
    return [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [users]);

  // Top performing users
  const topUsers = useMemo(() => {
    if (!users) return [];
    return [...users]
      .filter((u) => (u.salesStats?.totalSales || 0) > 0)
      .sort((a, b) => (b.salesStats?.totalRevenue || 0) - (a.salesStats?.totalRevenue || 0))
      .slice(0, 5);
  }, [users]);

  const isLoading = usersLoading || salesLoading;

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
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.totalUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.activeUsers} {t('admin.active')}, {statistics.admins} {t('admin.admins')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.activeUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.inactiveUsers} {t('admin.inactive')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.totalSales')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {salesStats?.todaySales || 0} {t('admin.today')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.totalRevenue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US').format(salesStats?.totalRevenue || 0)} IQD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Intl.NumberFormat('en-US').format(salesStats?.totalProfit || 0)} IQD {t('admin.profit')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('admin.quickActions')}
          </CardTitle>
          <CardDescription>{t('admin.quickActionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center gap-2 w-full">
                <UsersIcon className="h-5 w-5" />
                <span className="font-semibold">{t('admin.manageUsers')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                {t('admin.manageUsersDescription')}
              </p>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center gap-2 w-full">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">{t('admin.viewReports')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                {t('admin.viewReportsDescription')}
              </p>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => navigate('/sales')}
            >
              <div className="flex items-center gap-2 w-full">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">{t('admin.manageSales')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                {t('admin.manageSalesDescription')}
              </p>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('admin.recentUsers')}
            </CardTitle>
            <CardDescription>{t('admin.recentUsersDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('admin.noRecentUsers')}
              </p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {user.role === 'admin' && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                        {!user.isActive && (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        )}
                        {user.isActive && user.role !== 'admin' && (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('admin.joined')}: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/users')}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/users')}
            >
              {t('admin.viewAllUsers')}
            </Button>
          </CardContent>
        </Card>

        {/* Top Performing Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('admin.topPerformers')}
            </CardTitle>
            <CardDescription>{t('admin.topPerformersDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('admin.noTopPerformers')}
              </p>
            ) : (
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          {user.role === 'admin' && (
                            <Shield className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {new Intl.NumberFormat('en-US').format(user.salesStats?.totalRevenue || 0)} IQD
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.salesStats?.totalSales || 0} {t('admin.sales')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/users')}
            >
              {t('admin.viewAllUsers')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('admin.systemHealth')}
          </CardTitle>
          <CardDescription>{t('admin.systemHealthDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{t('admin.userActivity')}</p>
                <p className="text-xs text-muted-foreground">
                  {statistics.activeUsers} / {statistics.totalUsers} {t('admin.active')}
                </p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {statistics.totalUsers > 0
                  ? Math.round((statistics.activeUsers / statistics.totalUsers) * 100)
                  : 0}%
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{t('admin.totalRevenue')}</p>
                <p className="text-xs text-muted-foreground">
                  {salesStats?.totalSales || 0} {t('admin.totalSales')}
                </p>
              </div>
              <div className="text-2xl font-bold">
                {salesStats?.totalRevenue
                  ? new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(salesStats.totalRevenue)
                  : '0'}{' '}
                IQD
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{t('admin.totalProfit')}</p>
                <p className="text-xs text-muted-foreground">
                  {salesStats?.totalRevenue
                    ? Math.round((salesStats.totalProfit / salesStats.totalRevenue) * 100)
                    : 0}% {t('admin.margin')}
                </p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {salesStats?.totalProfit
                  ? new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(salesStats.totalProfit)
                  : '0'}{' '}
                IQD
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

