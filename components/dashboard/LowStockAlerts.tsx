'use client'

import React, { useState, useEffect } from 'react'
import { FiAlertTriangle, FiPackage } from 'react-icons/fi'
import { productsApi, Product } from '@/lib/api'

export default function LowStockAlerts() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        setLoading(true)
        const response = await productsApi.getLowStock()
        if (response.success) {
          setLowStockProducts(response.data)
        } else {
          setError('Failed to fetch low stock products')
        }
      } catch (err) {
        setError('Failed to fetch low stock products')
        console.error('Error fetching low stock products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStockProducts()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <FiAlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <FiAlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-red-600 text-sm">Error loading alerts: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <FiAlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
          <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {lowStockProducts.length}
          </span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {lowStockProducts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <FiPackage className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No low stock products</p>
          </div>
        ) : (
          lowStockProducts.map((product) => (
            <div key={product._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FiPackage className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600 font-medium">
                    {product.currentStock} left
                  </p>
                  <p className="text-xs text-gray-500">
                    Min: {product.minStockThreshold}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
          View all alerts →
        </button>
      </div>
    </div>
  )
} 