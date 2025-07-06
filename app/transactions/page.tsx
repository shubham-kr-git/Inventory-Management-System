'use client'

import React, { useState, useEffect } from 'react'
import { 
  FiTrendingUp, 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiAlertCircle,
  FiX,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi'
import { transactionsApi, productsApi, suppliersApi, Transaction, Product, Supplier, CreateTransactionData } from '../../lib/api'

// Use the CreateTransactionData interface from api.ts
type TransactionFormData = CreateTransactionData;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Modal states - only keep add modal
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'purchase',
    product: '',
    quantity: 1,
    unitPrice: 0,
    customer: { name: '', email: '', phone: '' },
    supplier: '',
    status: 'completed',
    paymentStatus: 'paid'
  })

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
        limit: itemsPerPage,
        type: selectedType || undefined,
        status: selectedStatus || undefined,
        product: selectedProduct || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
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
  }, [currentPage, selectedType, selectedStatus, selectedProduct, startDate, endDate])

  useEffect(() => {
    fetchProducts()
    fetchSuppliers()
  }, [])

  // Handle form submission - only for creating new transactions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Clean up customer data if it's a sale transaction
      const submitData = { ...formData }
      
      // Calculate total amount
      submitData.totalAmount = formData.quantity * formData.unitPrice
      
      if (submitData.type === 'sale') {
        if (!submitData.customer?.name) {
          submitData.customer = undefined
        }
      } else {
        submitData.customer = undefined
      }
      
      // Remove supplier for sales and adjustments
      if (submitData.type === 'sale' || submitData.type === 'adjustment') {
        submitData.supplier = undefined
      }

      await transactionsApi.create(submitData)
      await fetchTransactions()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    }
  }

  // Modal handlers - simplified
  const handleAddTransaction = () => {
    setFormData({
      type: 'purchase',
      product: '',
      quantity: 1,
      unitPrice: 0,
      customer: { name: '', email: '', phone: '' },
      supplier: '',
      status: 'completed',
      paymentStatus: 'paid'
    })
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setError(null)
  }

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

  const clearFilters = () => {
    setSelectedType('')
    setSelectedStatus('')
    setSelectedProduct('')
    setStartDate('')
    setEndDate('')
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

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              {transactionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="input"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center justify-center space-x-2 w-full"
            >
              <FiX className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
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

      {/* Add Transaction Modal - Edit and Delete modals removed */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Record New Transaction
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type and Product */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="input"
                  >
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    required
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="input"
                  >
                    <option value="">Select product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} (SKU: {product.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity and Unit Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="input"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Total Amount Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="text"
                  value={`$${(formData.quantity * formData.unitPrice).toFixed(2)}`}
                  disabled
                  className="input bg-gray-100"
                />
              </div>

              {/* Conditional Fields Based on Transaction Type */}
              {(formData.type === 'purchase' || formData.type === 'return') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="input"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === 'sale' && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={formData.customer?.name || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          customer: { ...formData.customer!, name: e.target.value }
                        })}
                        className="input"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.customer?.email || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          customer: { ...formData.customer!, email: e.target.value }
                        })}
                        className="input"
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.customer?.phone || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          customer: { ...formData.customer!, phone: e.target.value }
                        })}
                        className="input"
                        placeholder="Enter phone"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 