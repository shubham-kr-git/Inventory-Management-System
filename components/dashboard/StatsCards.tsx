import React from 'react'
import { FiPackage, FiTrendingUp, FiDollarSign, FiAlertTriangle } from 'react-icons/fi'

// Mock data - will be replaced with real data later
const stats = [
  {
    id: 1,
    name: 'Total Products',
    value: '156',
    change: '+12%',
    changeType: 'increase',
    icon: FiPackage,
    color: 'bg-blue-500',
  },
  {
    id: 2,
    name: 'Low Stock Items',
    value: '23',
    change: '+5%',
    changeType: 'increase',
    icon: FiAlertTriangle,
    color: 'bg-orange-500',
  },
  {
    id: 3,
    name: 'Total Value',
    value: '$45,231',
    change: '+8%',
    changeType: 'increase',
    icon: FiDollarSign,
    color: 'bg-green-500',
  },
  {
    id: 4,
    name: 'Monthly Sales',
    value: '$12,405',
    change: '+15%',
    changeType: 'increase',
    icon: FiTrendingUp,
    color: 'bg-purple-500',
  },
]

export default function StatsCards() {
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
                    item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
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