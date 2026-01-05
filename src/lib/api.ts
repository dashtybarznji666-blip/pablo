import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate axios instance for file uploads (multipart/form-data)
const uploadApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export interface Shoe {
  id: string;
  name: string;
  brand: string;
  category: 'men' | 'women' | 'kids';
  sizes: string;
  price: number;
  costPrice: number;
  sku: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  stock?: Stock[];
}

export interface Stock {
  id: string;
  shoeId: string;
  size: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  shoe?: Shoe;
}

export interface Sale {
  id: string;
  shoeId: string;
  userId?: string | null; // Optional to handle existing sales
  size: string;
  quantity: number;
  unitPrice: number; // Price in IQD
  totalPrice: number; // Total in IQD
  profit: number; // Profit in IQD
  exchangeRate?: number; // USD to IQD rate at time of sale
  isOnline: boolean; // Whether sale was made online
  createdAt: string;
  shoe?: Shoe;
  user?: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
}

export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  todaySales: number;
  todayRevenue: number;
  todayProfit: number;
}

export interface CreateShoeInput {
  name: string;
  brand: string;
  category: 'men' | 'women' | 'kids';
  sizes: string[];
  price: number;
  costPrice: number;
  sku: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateShoeInput extends Partial<CreateShoeInput> {}

export interface AddStockInput {
  shoeId: string;
  size: string;
  quantity: number;
}

export interface BulkAddStockInput {
  shoeId: string;
  stockEntries: Array<{ size: string; quantity: number }>;
}

export interface CreateSaleInput {
  shoeId: string;
  size: string;
  quantity: number;
  unitPrice?: number; // Price in IQD (optional)
  isOnline?: boolean; // Whether sale was made online
}

export interface ExchangeRate {
  id: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number; // Amount in IQD
  category: 'salary' | 'rent' | 'utilities' | 'supplies' | 'other';
  type: 'daily' | 'monthly';
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  count: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}

export interface CreateExpenseInput {
  title: string;
  description?: string;
  amount: number;
  category: string;
  type: 'daily' | 'monthly';
  date: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  purchases?: Purchase[];
  payments?: SupplierPayment[];
  balance?: SupplierBalance;
}

export interface SupplierBalance {
  totalCredit: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  shoeId: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  isCredit: boolean;
  paidAmount: number;
  isTodo: boolean;
  notes?: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  shoe?: Shoe;
  payments?: SupplierPayment[];
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  purchaseId?: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  createdAt: string;
  supplier?: Supplier;
  purchase?: Purchase;
}

export interface CreateSupplierInput {
  name: string;
  contact?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export interface CreatePurchaseInput {
  supplierId: string;
  shoeId: string;
  size: string;
  quantity: number;
  unitCost: number;
  isCredit: boolean;
  paidAmount?: number;
  notes?: string;
  purchaseDate?: string;
  addToStock?: boolean;
  isTodo?: boolean;
}

export interface UpdatePurchaseInput extends Partial<CreatePurchaseInput> {}

export interface CreateSupplierPaymentInput {
  supplierId: string;
  purchaseId?: string;
  amount: number;
  paymentDate?: string;
  notes?: string;
}

export interface UpdateSupplierPaymentInput extends Partial<CreateSupplierPaymentInput> {}

export interface SupplierTodoGroup {
  supplier: {
    id: string;
    name: string;
    contact?: string;
    address?: string;
    notes?: string;
  };
  purchases: Array<{
    id: string;
    shoeId: string;
    size: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    isCredit: boolean;
    paidAmount: number;
    notes?: string;
    purchaseDate: string;
    createdAt: string;
    updatedAt: string;
    shoe: {
      id: string;
      name: string;
      brand: string;
      sku: string;
    };
  }>;
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  salesStats?: UserSalesStats;
}

export interface UserSalesStats {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageSaleAmount: number;
  averageProfit: number;
  todaySales: number;
  todayRevenue: number;
  todayProfit: number;
  weekSales: number;
  weekRevenue: number;
  weekProfit: number;
  monthSales: number;
  monthRevenue: number;
  monthProfit: number;
  bestSellingProducts?: Array<{
    shoe: {
      id: string;
      name: string;
      brand: string;
      sku: string;
    } | null;
    quantity: number;
    revenue: number;
    profit: number;
    salesCount: number;
  }>;
}

export interface CreateUserInput {
  name: string;
  phoneNumber: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserInput {
  name?: string;
  phoneNumber?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

export interface LoginInput {
  phoneNumber: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  phoneNumber: string;
  password: string;
  registrationPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Shoe APIs
export const shoeApi = {
  getAll: (skip?: number, take?: number) => api.get<Shoe[]>('/shoes', { params: { skip, take } }),
  getById: (id: string) => api.get<Shoe>(`/shoes/${id}`),
  create: (data: CreateShoeInput) => api.post<Shoe>('/shoes', data),
  update: (id: string, data: UpdateShoeInput) => api.put<Shoe>(`/shoes/${id}`, data),
  delete: (id: string) => api.delete(`/shoes/${id}`),
};

// Stock APIs
export const stockApi = {
  getAll: (skip?: number, take?: number) => api.get<Stock[]>('/stock', { params: { skip, take } }),
  getByShoeId: (shoeId: string) => api.get<Stock[]>(`/stock/shoe/${shoeId}`),
  getLowStock: (threshold?: number) => api.get<Stock[]>('/stock/low', { params: { threshold } }),
  add: (data: AddStockInput) => api.post<Stock>('/stock', data),
  bulkAdd: (data: BulkAddStockInput) => api.post<Stock[]>('/stock/bulk', data),
  update: (id: string, quantity: number) => api.put<Stock>(`/stock/${id}`, { quantity }),
  delete: (id: string) => api.delete<Stock>(`/stock/${id}`),
};

// Sale APIs
export const saleApi = {
  getAll: (skip?: number, take?: number) => api.get<Sale[]>('/sales', { params: { skip, take } }),
  getToday: (skip?: number, take?: number) => api.get<Sale[]>('/sales/today', { params: { skip, take } }),
  getOnline: (skip?: number, take?: number) => api.get<Sale[]>('/sales/online', { params: { skip, take } }),
  getStats: () => api.get<SalesStats>('/sales/stats'),
  getOnlineStats: () => api.get<SalesStats>('/sales/stats/online'),
  getSalesByUser: (userId: string, skip?: number, take?: number) =>
    api.get<Sale[]>(`/sales/user/${userId}`, { params: { skip, take } }),
  getUserSalesStats: (userId: string) => api.get<UserSalesStats>(`/sales/user/${userId}/stats`),
  create: (data: CreateSaleInput) => api.post<Sale>('/sales', data),
  delete: (id: string) => api.delete<{ message: string; sale: Sale }>(`/sales/${id}`),
  deleteAll: () => api.delete<{ message: string; deletedCount: number }>('/sales/all'),
  deleteAllShipping: () => api.delete<{ message: string; deletedCount: number }>('/sales/shipping/all'),
};

// Exchange Rate APIs
export const exchangeRateApi = {
  getCurrent: () => api.get<{ rate: number }>('/exchange-rate'),
  setRate: (rate: number) => api.post<ExchangeRate>('/exchange-rate', { rate }),
  getHistory: () => api.get<ExchangeRate[]>('/exchange-rate/history'),
};

// Expense APIs
export const expenseApi = {
  getAll: () => api.get<Expense[]>('/expenses'),
  getById: (id: string) => api.get<Expense>(`/expenses/${id}`),
  getDaily: (date?: string) => api.get<Expense[]>('/expenses/daily', { params: date ? { date } : {} }),
  getMonthly: (year?: number, month?: number) => api.get<Expense[]>('/expenses/monthly', { params: { year, month } }),
  getStats: (startDate?: string, endDate?: string) =>
    api.get<ExpenseStats>('/expenses/stats', { params: startDate && endDate ? { startDate, endDate } : {} }),
  getToday: () => api.get<ExpenseStats>('/expenses/today'),
  getMonth: () => api.get<ExpenseStats>('/expenses/month'),
  create: (data: CreateExpenseInput) => api.post<Expense>('/expenses', data),
  update: (id: string, data: UpdateExpenseInput) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// Upload APIs
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return uploadApiInstance.post<{ imageUrl: string }>('/upload', formData);
  },
};

// Supplier APIs
export const supplierApi = {
  getAll: () => api.get<Supplier[]>('/suppliers'),
  getById: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  getWithBalance: (id: string) => api.get<Supplier>(`/suppliers/${id}/with-balance`),
  getBalance: (id: string) => api.get<SupplierBalance>(`/suppliers/${id}/balance`),
  create: (data: CreateSupplierInput) => api.post<Supplier>('/suppliers', data),
  update: (id: string, data: UpdateSupplierInput) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Purchase APIs
export const purchaseApi = {
  getAll: () => api.get<Purchase[]>('/purchases'),
  getById: (id: string) => api.get<Purchase>(`/purchases/${id}`),
  getBySupplier: (supplierId: string) => api.get<Purchase[]>(`/purchases/supplier/${supplierId}`),
  getCreditPurchases: (supplierId: string) => api.get<Purchase[]>(`/purchases/supplier/${supplierId}/credit`),
  getBalance: (id: string) => api.get<{ totalCost: number; paidAmount: number; remainingBalance: number }>(`/purchases/${id}/balance`),
  getTodosGroupedBySupplier: () => api.get<SupplierTodoGroup[]>('/purchases/todos'),
  create: (data: CreatePurchaseInput) => api.post<Purchase>('/purchases', data),
  update: (id: string, data: UpdatePurchaseInput) => api.put<Purchase>(`/purchases/${id}`, data),
  markAsTodo: (id: string) => api.patch<Purchase>(`/purchases/${id}/todo`),
  markAsDone: (id: string) => api.patch<Purchase>(`/purchases/${id}/done`),
  delete: (id: string) => api.delete(`/purchases/${id}`),
};

// Supplier Payment APIs
export const supplierPaymentApi = {
  getAll: () => api.get<SupplierPayment[]>('/supplier-payments'),
  getById: (id: string) => api.get<SupplierPayment>(`/supplier-payments/${id}`),
  getBySupplier: (supplierId: string) => api.get<SupplierPayment[]>(`/supplier-payments/supplier/${supplierId}`),
  create: (data: CreateSupplierPaymentInput) => api.post<SupplierPayment>('/supplier-payments', data),
  update: (id: string, data: UpdateSupplierPaymentInput) => api.put<SupplierPayment>(`/supplier-payments/${id}`, data),
  delete: (id: string) => api.delete(`/supplier-payments/${id}`),
};

// Auth APIs
export const authApi = {
  register: (data: RegisterInput) => api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginInput) => api.post<AuthResponse>('/auth/login', data),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
  verifyResetToken: (token: string) => api.post<{ valid: boolean }>('/auth/verify-reset-token', { token }),
  refreshToken: (refreshToken: string) => api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
};

// User APIs
export const userApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getAllWithSalesStats: () => api.get<User[]>('/users/sales-stats'),
  getUserWithSalesStats: (id: string) => api.get<User>(`/users/${id}/sales-stats`),
  update: (id: string, data: UpdateUserInput) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  activate: (id: string) => api.put<User>(`/users/${id}/activate`),
  deactivate: (id: string) => api.put<User>(`/users/${id}/deactivate`),
  updateRole: (id: string, role: 'admin' | 'user') => api.put<User>(`/users/${id}/role`, { role }),
  resetUserPassword: (id: string, newPassword: string) => api.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword }),
};

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (CORS, connection refused, etc.)
    if (!error.response) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3693c205-79b7-4af2-973a-8240320ddf31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'frontend/src/lib/api.ts:475',message:'Network error detected (no response)',data:{url:error.config?.url,baseURL:error.config?.baseURL,message:error.message,code:error.code,apiBaseUrl:API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Network error - silently handle (backend might not be running)
      // Only log in development mode to reduce console noise
      if (import.meta.env.DEV && !error.config?.__suppressError) {
        // Suppress repeated errors for the same request
        error.config.__suppressError = true;
      }
      return Promise.reject(error);
    }

    // If error is 401 and we haven't already retried
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't redirect if we're already on the login page
      if (window.location.pathname === '/login') {
        return Promise.reject(error);
      }

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Skip auth header for refresh request to avoid infinite loop
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens in localStorage
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update default header
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { api };


