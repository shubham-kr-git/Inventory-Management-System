'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data for inventory chart
const data = [
  {
    name: 'Electronics',
    value: 45,
    lowStock: 8,
  },
  {
    name: 'Furniture',
    value: 32,
    lowStock: 5,
  },
  {
    name: 'Stationery',
    value: 28,
    lowStock: 3,
  },
  {
    name: 'Clothing',
    value: 51,
    lowStock: 7,
  },
  {
    name: 'Books',
    value: 19,
    lowStock: 2,
  },
  {
    name: 'Sports',
    value: 23,
    lowStock: 4,
  },
]

export default function InventoryChart() {
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
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
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
      </div>
    </div>
  )
} 