'use client'

import React, { useState, useEffect } from 'react'
import { 
  FiTrendingUp, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiAlertCircle,
  FiX,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi'
import { transactionsApi, productsApi, suppliersApi, Transaction, Product, Supplier } from '../../lib/api'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  


  // Transaction types
  const transactionTypes = [
    { value: 'purchase', label: 'Purchase', icon: FiArrowDown, color: 'text-green-600' },
    { value: 'sale', label: 'Sale', icon: FiArrowUp, color: 'text-blue-600' },
    { value: 'adjustment', label: 'Adjustment', icon: FiTrendingUp, color: 'text-yellow-600' },
    { value: 'return', label: 'Return', icon: FiX, color: 'text-red-600' }
  ]

  // Fetch data
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await transactionsApi.getAll({
        page: currentPage,
        limit: itemsPerPage
      })
      setTransactions(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll()
      setProducts(response.data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll()
      setSuppliers(response.data)
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentPage])

  useEffect(() => {
    fetchProducts()
    fetchSuppliers()
  }, [])



  const getTransactionTypeConfig = (type: string) => {
    return transactionTypes.find(t => t.value === type) || transactionTypes[0]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'n/a': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }



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

      </div>



      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const typeConfig = getTransactionTypeConfig(transaction.type)
                  const Icon = typeConfig.icon
                  return (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full bg-gray-100 ${typeConfig.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {typeConfig.label} #{transaction.referenceNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.supplier?.name || transaction.customer?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {transaction.product.sku}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.totalAmount?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                            {transaction.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  )
} 