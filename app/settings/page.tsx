import React from 'react'
import { FiSettings } from 'react-icons/fi'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure your application preferences and settings
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="card p-12 text-center">
        <div className="mx-auto h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <FiSettings className="h-12 w-12 text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Application Settings
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          This page will contain application settings, user preferences, notification settings, and system configuration options.
        </p>
        <div className="text-sm text-gray-400">
          Coming in Phase 4 - Advanced Features
        </div>
      </div>
    </div>
  )
} 