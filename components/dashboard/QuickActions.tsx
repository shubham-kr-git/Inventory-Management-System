import React from 'react'
import Link from 'next/link'
import { FiPlus, FiShoppingCart, FiUsers } from 'react-icons/fi'

export default function QuickActions() {
  const actions = [
    {
      name: 'Add Product',
      icon: FiPlus,
      href: '/products',
      color: 'btn-primary',
    },
    {
      name: 'Record Sale',
      icon: FiShoppingCart,
      href: '/transactions',
      color: 'btn-secondary',
    },
    {
      name: 'Add Supplier',
      icon: FiUsers,
      href: '/suppliers',
      color: 'btn-secondary',
    },
  ]

  return (
    <div className="flex space-x-3">
      {actions.map((action) => (
        <Link
          key={action.name}
          href={action.href}
          className={`${action.color} flex items-center space-x-2`}
        >
          <action.icon className="h-4 w-4" />
          <span>{action.name}</span>
        </Link>
      ))}
    </div>
  )
} 