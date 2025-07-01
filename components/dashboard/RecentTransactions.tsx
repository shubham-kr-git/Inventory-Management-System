'use client'

import React, { useState, useEffect } from 'react'
import { FiArrowUpRight, FiArrowDownLeft, FiCalendar } from 'react-icons/fi'
import { transactionsApi, Transaction } from '@/lib/api'

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await transactionsApi.getAll({ limit: 5 })
        if (response.success) {
          setTransactions(response.data)
        } else {
          setError('Failed to fetch transactions')
        }
      } catch (err) {
        setError('Failed to fetch transactions')
        console.error('Error fetching transactions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-6">
          <div className="text-red-600 text-sm">Error loading transactions: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
            View all
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'sale' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {transaction.type === 'sale' ? (
                        <FiArrowUpRight className="h-5 w-5" />
                      ) : (
                        <FiArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.type === 'sale' ? 'Sold to' : 'Purchased from'}{' '}
                      {transaction.type === 'sale' 
                        ? transaction.customer?.name || 'Customer' 
                        : transaction.supplier?.name || 'Supplier'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.type === 'sale' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'sale' ? '+' : '-'}${transaction.totalAmount.toFixed(2)}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <FiCalendar className="h-3 w-3 mr-1" />
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 