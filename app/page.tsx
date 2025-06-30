import React from 'react'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import LowStockAlerts from '@/components/dashboard/LowStockAlerts'
import InventoryChart from '@/components/dashboard/InventoryChart'
import QuickActions from '@/components/dashboard/QuickActions'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome back! 👋
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your inventory today.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <QuickActions />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart and Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Chart */}
          <InventoryChart />
          
          {/* Recent Transactions */}
          <RecentTransactions />
        </div>

        {/* Right Column - Alerts */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <LowStockAlerts />
        </div>
      </div>
    </div>
  )
} 