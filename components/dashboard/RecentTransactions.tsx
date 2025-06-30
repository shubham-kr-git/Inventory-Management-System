import React from 'react'
import { FiArrowUpRight, FiArrowDownLeft, FiCalendar } from 'react-icons/fi'

// Mock data for recent transactions
const recentTransactions = [
  {
    id: 1,
    type: 'sale',
    product: 'Wireless Headphones',
    quantity: 2,
    amount: 299.98,
    date: '2024-01-15T10:30:00Z',
    customer: 'John Doe',
  },
  {
    id: 2,
    type: 'purchase',
    product: 'Office Chair',
    quantity: 5,
    amount: 999.95,
    date: '2024-01-15T09:15:00Z',
    supplier: 'Office Supplies Co.',
  },
  {
    id: 3,
    type: 'sale',
    product: 'Notebook Set',
    quantity: 1,
    amount: 24.99,
    date: '2024-01-14T16:45:00Z',
    customer: 'Jane Smith',
  },
  {
    id: 4,
    type: 'sale',
    product: 'USB Cable',
    quantity: 3,
    amount: 45.97,
    date: '2024-01-14T14:20:00Z',
    customer: 'Mike Johnson',
  },
  {
    id: 5,
    type: 'purchase',
    product: 'Wireless Mouse',
    quantity: 10,
    amount: 399.90,
    date: '2024-01-14T11:00:00Z',
    supplier: 'Tech Distributors',
  },
]

export default function RecentTransactions() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
        {recentTransactions.map((transaction) => (
          <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
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
                    {transaction.product}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.type === 'sale' ? 'Sold to' : 'Purchased from'}{' '}
                    {transaction.type === 'sale' ? transaction.customer : transaction.supplier}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'sale' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'sale' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <FiCalendar className="h-3 w-3 mr-1" />
                  {formatDate(transaction.date)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 