import React from 'react'
import { FiAlertTriangle, FiPackage } from 'react-icons/fi'

// Mock data for low stock products
const lowStockProducts = [
  {
    id: 1,
    name: 'Wireless Headphones',
    sku: 'WH-001',
    currentStock: 5,
    minStock: 10,
    category: 'Electronics',
  },
  {
    id: 2,
    name: 'Office Chair',
    sku: 'OC-045',
    currentStock: 2,
    minStock: 5,
    category: 'Furniture',
  },
  {
    id: 3,
    name: 'Notebook Set',
    sku: 'NB-234',
    currentStock: 8,
    minStock: 15,
    category: 'Stationery',
  },
  {
    id: 4,
    name: 'USB Cable',
    sku: 'UC-567',
    currentStock: 12,
    minStock: 25,
    category: 'Electronics',
  },
]

export default function LowStockAlerts() {
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
        {lowStockProducts.map((product) => (
          <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
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
                  Min: {product.minStock}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
          View all alerts →
        </button>
      </div>
    </div>
  )
} 