// lib/api.ts - API utility functions for connecting to backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Type definitions
export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  costPrice: number;
  currentStock: number;
  minStockThreshold: number;
  supplier: {
    _id: string;
    name: string;
  };
  stockStatus: 'low' | 'out' | 'normal';
  totalValue: number;
  profitMargin: number;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating products - supplier is just an ID string
export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  costPrice: number;
  currentStock: number;
  minStockThreshold: number;
  supplier: string; // Just the supplier ID string
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  rating: number;
  leadTime: number;
  category: string[];
  availableCredit: number;
  creditUtilization: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  product: {
    _id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
  };
  supplier?: {
    _id: string;
    name: string;
  };
  referenceNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'n/a';
  createdAt: string;
  updatedAt: string;
}

// Interface for creating transactions - uses string IDs for product and supplier
export interface CreateTransactionData {
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  product: string; // Product ID
  quantity: number;
  unitPrice: number;
  totalAmount?: number;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
  };
  supplier?: string; // Supplier ID
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'n/a';
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalInventoryValue: number;
  monthlySales: number;
  monthlyPurchases: number;
  topSellingProducts: Array<{
    product: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
    purchases: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}

// Dashboard API
export const dashboardApi = {
  getStats: (): Promise<{ success: boolean; data: any }> =>
    apiRequest('/dashboard'),
  
  getInventoryAnalytics: (): Promise<{ success: boolean; data: any }> =>
    apiRequest('/dashboard/inventory'),
  
  getFinancialAnalytics: (): Promise<{ success: boolean; data: any }> =>
    apiRequest('/dashboard/financial'),
  
  getSupplierAnalytics: (): Promise<{ success: boolean; data: any }> =>
    apiRequest('/dashboard/suppliers'),
  
  getQuickActionsData: (): Promise<{ success: boolean; data: any }> =>
    apiRequest('/dashboard/quick-actions'),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    supplier?: string;
  }): Promise<{ success: boolean; data: Product[]; pagination?: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.supplier) queryParams.append('supplier', params.supplier);
    
    const query = queryParams.toString();
    return apiRequest(`/products${query ? `?${query}` : ''}`);
  },

  getById: (id: string): Promise<{ success: boolean; data: Product }> =>
    apiRequest(`/products/${id}`),

  create: (product: CreateProductData): Promise<{ success: boolean; data: Product }> =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  update: (id: string, product: Partial<Product>): Promise<{ success: boolean; data: Product }> =>
    apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
    }),

  updateStock: (id: string, adjustment: number, type: 'add' | 'subtract' | 'set', reason?: string): Promise<{ success: boolean; data: { product: Product; transaction: any } }> =>
    apiRequest(`/products/${id}/adjust-stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: adjustment, type, reason }),
    }),

  getLowStock: (): Promise<{ success: boolean; data: Product[] }> =>
    apiRequest('/products/low-stock'),

  getOutOfStock: (): Promise<{ success: boolean; data: Product[] }> =>
    apiRequest('/products/out-of-stock'),

  getStats: (): Promise<{ success: boolean; data: any }> =>
    apiRequest('/products/stats'),

  getReorderSuggestions: (): Promise<{ success: boolean; data: any[] }> =>
    apiRequest('/products/reorder-suggestions'),

  clearReorderSuggestionsCache: (): Promise<{ success: boolean; message: string }> =>
    apiRequest('/products/reorder-suggestions/cache', {
      method: 'DELETE',
    }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<{ success: boolean; data: Supplier[]; pagination?: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    
    const query = queryParams.toString();
    return apiRequest(`/suppliers${query ? `?${query}` : ''}`);
  },

  getById: (id: string): Promise<{ success: boolean; data: Supplier }> =>
    apiRequest(`/suppliers/${id}`),

  create: (supplier: Omit<Supplier, '_id' | 'createdAt' | 'updatedAt' | 'availableCredit' | 'creditUtilization'>): Promise<{ success: boolean; data: Supplier }> =>
    apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    }),

  update: (id: string, supplier: Partial<Supplier>): Promise<{ success: boolean; data: Supplier }> =>
    apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/suppliers/${id}`, {
      method: 'DELETE',
    }),

  updateBalance: (id: string, amount: number, type: 'add' | 'subtract' | 'set'): Promise<{ success: boolean; data: Supplier }> =>
    apiRequest(`/suppliers/${id}/balance`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, type }),
    }),

  getByCategory: (category: string): Promise<{ success: boolean; data: Supplier[] }> =>
    apiRequest(`/suppliers/category/${category}`),

  getLowCredit: (): Promise<{ success: boolean; data: Supplier[] }> =>
    apiRequest('/suppliers/low-credit'),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    product?: string;
    supplier?: string;
  }): Promise<{ success: boolean; data: Transaction[]; pagination?: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.product) queryParams.append('product', params.product);
    if (params?.supplier) queryParams.append('supplier', params.supplier);
    
    const query = queryParams.toString();
    return apiRequest(`/transactions${query ? `?${query}` : ''}`);
  },

  getById: (id: string): Promise<{ success: boolean; data: Transaction }> =>
    apiRequest(`/transactions/${id}`),

  create: (transaction: CreateTransactionData): Promise<{ success: boolean; data: Transaction }> =>
    apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }),

  update: (id: string, transaction: Partial<Transaction>): Promise<{ success: boolean; data: Transaction }> =>
    apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    }),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  getByDateRange: (startDate: string, endDate: string): Promise<{ success: boolean; data: Transaction[] }> =>
    apiRequest(`/transactions/date-range?startDate=${startDate}&endDate=${endDate}`),

  getStats: (startDate?: string, endDate?: string): Promise<{ success: boolean; data: any }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return apiRequest(`/transactions/stats${query ? `?${query}` : ''}`);
  },
};

// Health check
export const healthCheck = (): Promise<{ success: boolean; message: string }> =>
  apiRequest('/health');