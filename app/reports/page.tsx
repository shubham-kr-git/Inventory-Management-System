'use client'

import React, { useState, useEffect } from 'react'
import { 
  FiBarChart2, 
  FiDownload, 
  FiFilter,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPackage,
  FiUsers,
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
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState('overview')

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const end = new Date()
      const start = new Date()
      
      if (startDate && endDate) {
        start.setTime(new Date(startDate).getTime())
        end.setTime(new Date(endDate).getTime())
      } else {
        start.setDate(end.getDate() - parseInt(selectedPeriod))
      }

      const [dashboardStats, transactionStats, products] = await Promise.all([
        dashboardApi.getStats(),
        transactionsApi.getStats(start.toISOString(), end.toISOString()),
        productsApi.getLowStock()
      ])

      // Mock report data (in real app, this would come from API)
      const mockReportData: ReportData = {
        totalSales: dashboardStats.data.monthlySales || 45000,
        totalPurchases: dashboardStats.data.monthlyPurchases || 32000,
        profitMargin: 28.9,
        inventoryValue: dashboardStats.data.totalInventoryValue || 125000,
        topProducts: [
          { name: 'Wireless Headphones', sales: 150, revenue: 22500 },
          { name: 'Smartphone Case', sales: 230, revenue: 11500 },
          { name: 'USB Cable', sales: 180, revenue: 3600 },
          { name: 'Power Bank', sales: 95, revenue: 9500 },
          { name: 'Bluetooth Speaker', sales: 75, revenue: 7500 }
        ],
        topSuppliers: [
          { name: 'TechCorp Ltd', orders: 25, totalValue: 15000 },
          { name: 'Electronics Plus', orders: 18, totalValue: 12000 },
          { name: 'Supply Chain Co', orders: 22, totalValue: 10500 },
          { name: 'Global Parts', orders: 15, totalValue: 8000 }
        ],
        monthlySales: [
          { month: 'Jan', sales: 38000, purchases: 28000, profit: 10000 },
          { month: 'Feb', sales: 42000, purchases: 30000, profit: 12000 },
          { month: 'Mar', sales: 45000, purchases: 32000, profit: 13000 },
          { month: 'Apr', sales: 41000, purchases: 29000, profit: 12000 },
          { month: 'May', sales: 47000, purchases: 33000, profit: 14000 },
          { month: 'Jun', sales: 50000, purchases: 35000, profit: 15000 }
        ],
        lowStockItems: dashboardStats.data.lowStockCount || 12,
        outOfStockItems: 3
      }

      setReportData(mockReportData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod, startDate, endDate])

  const reportTypes = [
    { value: 'overview', label: 'Overview', icon: FiBarChart2 },
    { value: 'sales', label: 'Sales Report', icon: FiTrendingUp },
    { value: 'inventory', label: 'Inventory Report', icon: FiPackage },
    { value: 'suppliers', label: 'Supplier Report', icon: FiUsers }
  ]

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
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button className="btn-secondary flex items-center space-x-2">
            <FiDownload className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
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
              change="8.5% from last period"
              changeType="increase"
              icon={FiDollarSign}
              color="text-green-600"
            />
            <StatCard
              title="Total Purchases"
              value={`$${reportData.totalPurchases.toLocaleString()}`}
              change="5.2% from last period"
              changeType="increase"
              icon={FiTrendingDown}
              color="text-blue-600"
            />
            <StatCard
              title="Profit Margin"
              value={`${reportData.profitMargin}%`}
              change="2.1% from last period"
              changeType="increase"
              icon={FiActivity}
              color="text-purple-600"
            />
            <StatCard
              title="Inventory Value"
              value={`$${reportData.inventoryValue.toLocaleString()}`}
              change="3.8% from last period"
              changeType="increase"
              icon={FiPackage}
              color="text-indigo-600"
            />
          </div>

          {/* Charts and Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sales & Purchase Trend
              </h3>
              <div className="space-y-4">
                {reportData.monthlySales.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{month.month}</span>
                        <span className="text-sm text-gray-500">
                          ${month.sales.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(month.sales / 50000) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
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

          {/* Detailed Reports Table */}
          {reportType === 'sales' && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detailed Sales Report
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchases
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlySales.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${month.sales.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${month.purchases.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${month.profit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {((month.profit / month.sales) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 