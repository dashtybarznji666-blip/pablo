import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsersWithSalesStats, useDeleteUser, useActivateUser, useDeactivateUser } from '@/hooks/use-users';
import { useAuth } from '@/contexts/AuthContext';
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
import { Edit, Trash2, Search, Users as UsersIcon, Shield, UserCheck, UserX, Key, TrendingUp, DollarSign, ShoppingCart, AlertCircle } from 'lucide-react';
import EditUserDialog from '@/components/EditUserDialog';
import UserRoleDialog from '@/components/UserRoleDialog';
import ResetUserPasswordDialog from '@/components/ResetUserPasswordDialog';
import UserSalesDialog from '@/components/UserSalesDialog';
import { User } from '@/lib/api';

export default function Users() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useUsersWithSalesStats();
  const deleteUser = useDeleteUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [viewSalesUserId, setViewSalesUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSales, setFilterSales] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('date-desc');

  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];

    let filtered = users.filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchLower) ||
        user.phoneNumber.toLowerCase().includes(searchLower);

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive);

      const salesStats = user.salesStats;
      const matchesSales =
        filterSales === 'all' ||
        (filterSales === 'with-sales' && (salesStats?.totalSales || 0) > 0) ||
        (filterSales === 'no-sales' && (salesStats?.totalSales || 0) === 0) ||
        (filterSales === 'top-performers' && (salesStats?.totalRevenue || 0) > 0);

      return matchesSearch && matchesRole && matchesStatus && matchesSales;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aStats = a.salesStats;
      const bStats = b.salesStats;
      
      if (sortOption === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortOption === 'sales-desc') {
        return (bStats?.totalSales || 0) - (aStats?.totalSales || 0);
      } else if (sortOption === 'sales-asc') {
        return (aStats?.totalSales || 0) - (bStats?.totalSales || 0);
      } else if (sortOption === 'revenue-desc') {
        return (bStats?.totalRevenue || 0) - (aStats?.totalRevenue || 0);
      } else if (sortOption === 'revenue-asc') {
        return (aStats?.totalRevenue || 0) - (bStats?.totalRevenue || 0);
      } else if (sortOption === 'profit-desc') {
        return (bStats?.totalProfit || 0) - (aStats?.totalProfit || 0);
      } else if (sortOption === 'profit-asc') {
        return (aStats?.totalProfit || 0) - (bStats?.totalProfit || 0);
      }
      return 0;
    });

    return filtered;
  }, [users, searchQuery, filterRole, filterStatus, filterSales, sortOption]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!users) return { totalUsers: 0, activeUsers: 0, admins: 0 };
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === 'admin').length,
    };
  }, [users]);

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Show permission denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">{t('common.accessDenied')}</h3>
                <p className="text-muted-foreground mt-2">
                  {t('users.adminAccessRequired') || 'Admin access is required to view this page.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error message if API call failed
  if (error) {
    const isForbidden = (error as any)?.response?.status === 403;
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">{t('common.error')}</h3>
                <p className="text-muted-foreground mt-2">
                  {isForbidden 
                    ? (t('users.adminAccessRequired') || 'Admin access is required.')
                    : (t('common.failedToLoad') || 'Failed to load users. Please try again.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('users.totalUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('users.activeUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('users.admins')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.admins}</div>
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
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filterByRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
                <SelectItem value="user">{t('users.roleUser')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('users.statusActive')}</SelectItem>
                <SelectItem value="inactive">{t('users.statusInactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSales} onValueChange={setFilterSales}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.filterBySales')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="with-sales">{t('users.withSales')}</SelectItem>
                <SelectItem value="no-sales">{t('users.noSales')}</SelectItem>
                <SelectItem value="top-performers">{t('users.topPerformers')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t('users.sortByDateDesc')}</SelectItem>
                <SelectItem value="date-asc">{t('users.sortByDateAsc')}</SelectItem>
                <SelectItem value="name-asc">{t('users.sortByNameAsc')}</SelectItem>
                <SelectItem value="name-desc">{t('users.sortByNameDesc')}</SelectItem>
                <SelectItem value="sales-desc">{t('users.sortBySalesDesc')}</SelectItem>
                <SelectItem value="sales-asc">{t('users.sortBySalesAsc')}</SelectItem>
                <SelectItem value="revenue-desc">{t('users.sortByRevenueDesc')}</SelectItem>
                <SelectItem value="revenue-asc">{t('users.sortByRevenueAsc')}</SelectItem>
                <SelectItem value="profit-desc">{t('users.sortByProfitDesc')}</SelectItem>
                <SelectItem value="profit-asc">{t('users.sortByProfitAsc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-2">
        {filteredAndSortedUsers.map((user) => {
          const salesStats = user.salesStats;
          return (
            <Card key={user.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{user.name}</div>
                      {user.role === 'admin' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {t('users.roleAdmin')}
                        </span>
                      )}
                      {user.isActive ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          {t('users.statusActive')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          {t('users.statusInactive')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{user.phoneNumber}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('users.joined')}: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {salesStats && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('users.totalSales')}:</span>
                          <span className="font-semibold">{salesStats.totalSales || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('users.totalRevenue')}:</span>
                          <span className="font-semibold">
                            {new Intl.NumberFormat('en-US').format(salesStats.totalRevenue || 0)} IQD
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('users.totalProfit')}:</span>
                          <span className="font-semibold text-green-600">
                            {new Intl.NumberFormat('en-US').format(salesStats.totalProfit || 0)} IQD
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {salesStats && salesStats.totalSales > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewSalesUserId(user.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {t('users.viewSales')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRoleUser(user)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setResetPasswordUser(user)}>
                      <Key className="h-4 w-4" />
                    </Button>
                    {user.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateUser.mutate(user.id)}
                        disabled={deactivateUser.isPending}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateUser.mutate(user.id)}
                        disabled={activateUser.isPending}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteUserId(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('users.noUsersFound')}</h3>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
        />
      )}
      {roleUser && (
        <UserRoleDialog
          user={roleUser}
          open={!!roleUser}
          onOpenChange={(open) => !open && setRoleUser(null)}
        />
      )}
      {resetPasswordUser && (
        <ResetUserPasswordDialog
          user={resetPasswordUser}
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
        />
      )}
      {viewSalesUserId && (
        <UserSalesDialog
          userId={viewSalesUserId}
          userName={users?.find(u => u.id === viewSalesUserId)?.name || ''}
          open={!!viewSalesUserId}
          onOpenChange={(open) => !open && setViewSalesUserId(null)}
        />
      )}
      <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteUserConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.deleteUserConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUserId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteUserId) {
                  deleteUser.mutate(deleteUserId);
                  setDeleteUserId(null);
                }
              }}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? t('common.loading') : t('users.deleteUserConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

