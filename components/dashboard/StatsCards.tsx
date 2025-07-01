'use client'

import React, { useState, useEffect } from 'react'
import { FiPackage, FiTrendingUp, FiDollarSign, FiAlertTriangle } from 'react-icons/fi'
import { dashboardApi } from '@/lib/api'

interface StatsData {
  totalProducts: number;
  totalSuppliers: number;
  totalTransactions: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function StatsCards() {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await dashboardApi.getStats()
        if (response.success) {
          setStatsData(response.data.overview)
        } else {
          setError('Failed to fetch stats')
        }
      } catch (err) {
        setError('Failed to fetch stats')
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Prepare stats for display
  const stats = statsData ? [
    {
      id: 1,
      name: 'Total Products',
      value: statsData.totalProducts.toString(),
      change: '+0%', // You can calculate this from historical data
      changeType: 'neutral',
      icon: FiPackage,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      name: 'Low Stock Items',
      value: statsData.lowStockCount.toString(),
      change: statsData.lowStockCount > 0 ? '+' + statsData.lowStockCount : '0',
      changeType: statsData.lowStockCount > 0 ? 'increase' : 'neutral',
      icon: FiAlertTriangle,
      color: 'bg-orange-500',
    },
    {
      id: 3,
      name: 'Total Value',
      value: formatCurrency(statsData.totalInventoryValue),
      change: '+0%', // You can calculate this from historical data
      changeType: 'increase',
      icon: FiDollarSign,
      color: 'bg-green-500',
    },
    {
      id: 4,
      name: 'Total Suppliers',
      value: statsData.totalSuppliers.toString(),
      change: '+0%', // You can calculate this from historical data
      changeType: 'neutral',
      icon: FiTrendingUp,
      color: 'bg-purple-500',
    },
  ] : []

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-300 rounded-md"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 border-red-200 bg-red-50">
          <div className="text-red-800 text-sm">Error loading stats: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div key={item.id} className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`inline-flex items-center justify-center p-3 rounded-md ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {item.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'increase' ? 'text-green-600' : 
                    item.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.change}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 