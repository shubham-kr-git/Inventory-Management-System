import React from 'react'
import { FiTrendingUp, FiPlus } from 'react-icons/fi'

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Transactions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Record and track all inventory movements
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="btn-primary flex items-center space-x-2">
            <FiPlus className="h-4 w-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="card p-12 text-center">
        <div className="mx-auto h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <FiTrendingUp className="h-12 w-12 text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Transaction Management
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          This page will contain transaction recording system for sales and purchases, with detailed history and filtering capabilities.
        </p>
        <div className="text-sm text-gray-400">
          Coming in Phase 2 - Backend Integration
        </div>
      </div>
    </div>
  )
} 