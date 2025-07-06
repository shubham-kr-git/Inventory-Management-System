'use client'

import React, { useState, useEffect } from 'react'
import { 
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPackage,
  FiArrowUp,
  FiArrowDown,
  FiActivity
} from 'react-icons/fi'
import { transactionsApi, productsApi, suppliersApi, dashboardApi } from '../../lib/api'

interface ReportData {
  totalSales: number;
  totalPurchases: number;
  profitMargin: number;
  inventoryValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  topSuppliers: Array<{
    name: string;
    orders: number;
    totalValue: number;
  }>;
  monthlySales: Array<{
    month: string;
    sales: number;
    purchases: number;
    profit: number;
  }>;
  lowStockItems: number;
  outOfStockItems: number;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  


  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Use default date range (last 30 days)
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 30)

      const [dashboardStats, transactionStats, products] = await Promise.all([
        dashboardApi.getStats(),
        transactionsApi.getStats(start.toISOString(), end.toISOString()),
        productsApi.getLowStock()
      ])

      // Calculate total sales from monthly sales data
      const totalSales = Array.isArray(dashboardStats.data.monthlySales) 
        ? dashboardStats.data.monthlySales.reduce((sum: number, month: any) => sum + (month.totalAmount || 0), 0)
        : dashboardStats.data.monthlySales || 0;
      
      // Get real purchase data from transaction stats
      const totalPurchases = transactionStats.data?.purchases?.totalAmount || 0;

      // Transform real API data into report format
      const realTopProducts = dashboardStats.data.topProducts || [];
      const topProducts = realTopProducts.map((product: any) => ({
        name: product.name || 'Unknown Product',
        sales: product.totalQuantity || 0,
        revenue: product.totalAmount || 0
      }));

      // Get real supplier data from API
      const realTopSuppliers = dashboardStats.data.topSuppliers || [];
      const topSuppliers = realTopSuppliers.map((supplier: any) => ({
        name: supplier.name || 'Unknown Supplier',
        orders: supplier.orderCount || 0,
        totalValue: supplier.totalAmount || 0
      }));

      // If no real suppliers found, show fallback message
      const suppliersToShow = topSuppliers.length > 0 ? topSuppliers : [
        { name: 'No supplier data available', orders: 0, totalValue: 0 }
      ];

      // Transform monthly sales and purchases data
      const realMonthlySales = dashboardStats.data.monthlySales || [];
      const realMonthlyPurchases = dashboardStats.data.monthlyPurchases || [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Create a complete monthly data set with real sales and purchases
      const completeMonthlySales = monthNames.map((month, index) => {
        const monthIndex = index + 1;
        const salesData = realMonthlySales.find((m: any) => m._id === monthIndex);
        const purchasesData = realMonthlyPurchases.find((m: any) => m._id === monthIndex);
        
        const salesAmount = salesData?.totalAmount || 0;
        const purchasesAmount = purchasesData?.totalAmount || 0;
        const profit = salesAmount - purchasesAmount;
        
        return {
          month,
          sales: salesAmount,
          purchases: purchasesAmount,
          profit: profit
        };
      });

      // Calculate profit margin from financial data
      const profitMargin = totalSales > 0 ? ((totalSales - totalPurchases) / totalSales * 100) : 0;

      // Real report data using actual API responses
      const reportData: ReportData = {
        totalSales: totalSales,
        totalPurchases: totalPurchases,
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        inventoryValue: dashboardStats.data.overview?.totalInventoryValue || dashboardStats.data.totalInventoryValue || 0,
        topProducts: topProducts.length > 0 ? topProducts.slice(0, 5) : [
          { name: 'No sales data available', sales: 0, revenue: 0 }
        ],
        topSuppliers: suppliersToShow,
        monthlySales: completeMonthlySales.slice(0, 6), // Show last 6 months
        lowStockItems: dashboardStats.data.overview?.lowStockCount || dashboardStats.data.lowStockCount || 0,
        outOfStockItems: dashboardStats.data.overview?.outOfStockCount || 0
      }

      setReportData(reportData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon,
    color = 'text-primary-600'
  }: {
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: any;
    color?: string;
  }) => (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? (
                <FiArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <FiArrowDown className="h-4 w-4 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gray-100 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Reports & Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track performance and analyze business metrics
          </p>
        </div>

      </div>



      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {reportData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sales"
              value={`$${reportData.totalSales.toLocaleString()}`}
              icon={FiDollarSign}
              color="text-green-600"
            />
            <StatCard
              title="Total Purchases"
              value={`$${reportData.totalPurchases.toLocaleString()}`}
              icon={FiTrendingDown}
              color="text-blue-600"
            />
            <StatCard
              title="Profit Margin"
              value={`${reportData.profitMargin}%`}
              icon={FiActivity}
              color="text-purple-600"
            />
            <StatCard
              title="Inventory Value"
              value={`$${reportData.inventoryValue.toLocaleString()}`}
              icon={FiPackage}
              color="text-indigo-600"
            />
          </div>

          {/* Charts and Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales & Purchase Trend Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sales & Purchase Trend
              </h3>
              <div className="space-y-4">
                {reportData.monthlySales.map((month, index) => {
                  const maxValue = Math.max(...reportData.monthlySales.map(m => Math.max(m.sales, m.purchases)));
                  const salesPercentage = maxValue > 0 ? (month.sales / maxValue) * 100 : 0;
                  const purchasesPercentage = maxValue > 0 ? (month.purchases / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{month.month}</span>
                        <div className="text-sm text-gray-500">
                          Sales: ${month.sales.toLocaleString()} | Purchases: ${month.purchases.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${salesPercentage}%` }}
                          ></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${purchasesPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Products */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Selling Products
              </h3>
              <div className="space-y-4">
                {reportData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.sales} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${product.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Suppliers */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Suppliers
              </h3>
              <div className="space-y-4">
                {reportData.topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.orders} orders
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${supplier.totalValue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Alerts */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Inventory Alerts
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <FiPackage className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Low Stock Items
                      </div>
                      <div className="text-sm text-gray-500">
                        Items below minimum threshold
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {reportData.lowStockItems}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <FiPackage className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Out of Stock
                      </div>
                      <div className="text-sm text-gray-500">
                        Items with zero inventory
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-red-600">
                    {reportData.outOfStockItems}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <FiTrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Profit This Month
                      </div>
                      <div className="text-sm text-gray-500">
                        Net profit from sales
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ${(reportData.totalSales - reportData.totalPurchases).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>


        </>
      )}
    </div>
  )
} 