'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiHome, 
  FiPackage, 
  FiUsers, 
  FiTrendingUp,
  FiSettings,
  FiBarChart2
} from 'react-icons/fi'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'Products', href: '/products', icon: FiPackage },
  { name: 'Suppliers', href: '/suppliers', icon: FiUsers },
  { name: 'Transactions', href: '/transactions', icon: FiTrendingUp },
  { name: 'Reports', href: '/reports', icon: FiBarChart2 },
  // { name: 'Settings', href: '/settings', icon: FiSettings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FiPackage className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  InventoryPro
                </h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'nav-item',
                    isActive ? 'nav-item-active' : 'nav-item-inactive'
                  )}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
} 