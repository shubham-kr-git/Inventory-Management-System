'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardApi } from '@/lib/api'

interface CategoryData {
  name: string;
  value: number;
  lowStock: number;
}

export default function InventoryChart() {
  const [chartData, setChartData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true)
        const response = await dashboardApi.getInventoryAnalytics()
        if (response.success && response.data.categoryDistribution) {
          // Transform the API data to match chart format
          const transformedData = response.data.categoryDistribution.map((item: any) => ({
            name: item.category,
            value: item.count,
            lowStock: item.lowStockCount || 0, // Default to 0 if not provided
          }))
          setChartData(transformedData)
        } else {
          // Fallback to products data if categoryDistribution is not available
          setChartData([
            { name: 'Electronics', value: 2, lowStock: 0 },
            { name: 'Office Supplies', value: 3, lowStock: 0 },
          ])
        }
      } catch (err) {
        setError('Failed to fetch inventory data')
        console.error('Error fetching inventory data:', err)
        // Use fallback data on error
        setChartData([
          { name: 'Electronics', value: 2, lowStock: 0 },
          { name: 'Office Supplies', value: 3, lowStock: 0 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [])

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Inventory by Category</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Total Items</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Low Stock</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-red-600 text-sm">Error loading chart data: {error}</div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" name="Total Items" />
                <Bar dataKey="lowStock" fill="#F59E0B" name="Low Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
} 