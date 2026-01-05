import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Receipt, LogOut, BarChart3, Truck, Building2, Users as UsersIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Lazy load page components
const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Shoes = lazy(() => import('@/pages/Shoes'));
const Stock = lazy(() => import('@/pages/Stock'));
const Sales = lazy(() => import('@/pages/Sales'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const Reports = lazy(() => import('@/pages/Reports'));
const Shipping = lazy(() => import('@/pages/Shipping'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));
const Users = lazy(() => import('@/pages/Users'));
const Admin = lazy(() => import('@/pages/Admin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 min (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true,
      retry: 1, // Only retry once on failure
    },
  },
});

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/shoes', label: t('nav.shoes'), icon: Package },
    { path: '/stock', label: t('nav.stock'), icon: ShoppingCart },
    { path: '/sales', label: t('nav.sales'), icon: DollarSign },
    { path: '/shipping', label: t('nav.shipping'), icon: Truck },
    { path: '/suppliers', label: t('nav.suppliers'), icon: Building2 },
    { path: '/expenses', label: t('nav.expenses'), icon: Receipt },
    { path: '/reports', label: t('nav.reports'), icon: BarChart3 },
    ...(user?.role === 'admin' ? [
      { path: '/admin', label: t('nav.admin'), icon: Shield },
      { path: '/users', label: t('nav.users'), icon: UsersIcon }
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="text-xl font-bold">Shoe Store</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.name}
                </span>
              )}
              <LanguageSwitcher />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('auth.signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shoes" element={<Shoes />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-muted-foreground">Loading...</div></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;


