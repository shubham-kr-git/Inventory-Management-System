import React from 'react'
import { FiPlus, FiShoppingCart, FiUsers } from 'react-icons/fi'

export default function QuickActions() {
  const actions = [
    {
      name: 'Add Product',
      icon: FiPlus,
      href: '/products?action=add',
      color: 'btn-primary',
    },
    {
      name: 'Record Sale',
      icon: FiShoppingCart,
      href: '/transactions?action=sale',
      color: 'btn-secondary',
    },
    {
      name: 'Add Supplier',
      icon: FiUsers,
      href: '/suppliers?action=add',
      color: 'btn-secondary',
    },
  ]

  return (
    <div className="flex space-x-3">
      {actions.map((action) => (
        <button
          key={action.name}
          className={`${action.color} flex items-center space-x-2`}
        >
          <action.icon className="h-4 w-4" />
          <span>{action.name}</span>
        </button>
      ))}
    </div>
  )
} 