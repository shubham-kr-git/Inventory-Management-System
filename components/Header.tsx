'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { FiMenu } from 'react-icons/fi'

export default function Header() {
  const pathname = usePathname()
  
  // Get page title from pathname
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard'
      case '/products':
        return 'Products'
      case '/suppliers':
        return 'Suppliers'
      case '/transactions':
        return 'Transactions'
      case '/reports':
        return 'Reports'
      case '/settings':
        return 'Settings'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Page title and breadcrumb */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden -ml-2 mr-2 h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
              <nav className="flex space-x-2 text-sm text-gray-500 mt-1">
                <span>Home</span>
                <span>/</span>
                <span className="text-gray-900">{getPageTitle()}</span>
              </nav>
            </div>
          </div>

          {/* Right side - User profile */}
          <div className="flex items-center">
            {/* User profile placeholder */}
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 