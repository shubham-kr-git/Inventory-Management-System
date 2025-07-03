'use client'

import React, { useState } from 'react'
import { 
  FiSettings, 
  FiUser,
  FiBell,
  FiShield,
  FiDatabase,
  FiMail,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiUpload,
  FiRefreshCw
} from 'react-icons/fi'

interface SettingsState {
  general: {
    companyName: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    lowStockThreshold: number;
    autoReorderEnabled: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    lowStockAlerts: boolean;
    transactionAlerts: boolean;
    supplierReminders: boolean;
    emailFrequency: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginAttempts: number;
  };
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: string;
    retentionPeriod: number;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  const [settings, setSettings] = useState<SettingsState>({
    general: {
      companyName: 'Inventory Management Co.',
      currency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      lowStockThreshold: 10,
      autoReorderEnabled: false
    },
    notifications: {
      emailNotifications: true,
      lowStockAlerts: true,
      transactionAlerts: false,
      supplierReminders: true,
      emailFrequency: 'daily'
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    },
    backup: {
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      retentionPeriod: 30
    }
  })

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'backup', label: 'Backup & Data', icon: FiDatabase }
  ]

  const handleSave = async () => {
    setSaveStatus('saving')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  const handleReset = () => {
    // Reset to default values
    setSettings({
      general: {
        companyName: 'Inventory Management Co.',
        currency: 'USD',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        lowStockThreshold: 10,
        autoReorderEnabled: false
      },
      notifications: {
        emailNotifications: true,
        lowStockAlerts: true,
        transactionAlerts: false,
        supplierReminders: true,
        emailFrequency: 'daily'
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        loginAttempts: 5
      },
      backup: {
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        retentionPeriod: 30
      }
    })
  }

  const updateSettings = (section: keyof SettingsState, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure your inventory management system preferences
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="btn-primary flex items-center space-x-2"
          >
            {saveStatus === 'saving' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : saveStatus === 'saved' ? (
              <FiCheck className="h-4 w-4" />
            ) : (
              <FiSave className="h-4 w-4" />
            )}
            <span>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.companyName}
                        onChange={(e) => updateSettings('general', 'companyName', e.target.value)}
                        className="input"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => updateSettings('general', 'currency', e.target.value)}
                        className="input"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                        className="input"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        value={settings.general.dateFormat}
                        onChange={(e) => updateSettings('general', 'dateFormat', e.target.value)}
                        className="input"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.general.lowStockThreshold}
                        onChange={(e) => updateSettings('general', 'lowStockThreshold', parseInt(e.target.value))}
                        className="input"
                        placeholder="10"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.general.autoReorderEnabled}
                          onChange={(e) => updateSettings('general', 'autoReorderEnabled', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Enable automatic reordering when stock falls below threshold
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.notifications.lowStockAlerts}
                        onChange={(e) => updateSettings('notifications', 'lowStockAlerts', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Low Stock Alerts</span>
                        <p className="text-sm text-gray-500">Get notified when products are running low</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.notifications.transactionAlerts}
                        onChange={(e) => updateSettings('notifications', 'transactionAlerts', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Transaction Alerts</span>
                        <p className="text-sm text-gray-500">Notifications for new transactions</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.notifications.supplierReminders}
                        onChange={(e) => updateSettings('notifications', 'supplierReminders', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Supplier Reminders</span>
                        <p className="text-sm text-gray-500">Reminders for supplier payments and orders</p>
                      </div>
                    </label>

                    <div className="pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Frequency
                      </label>
                      <select
                        value={settings.notifications.emailFrequency}
                        onChange={(e) => updateSettings('notifications', 'emailFrequency', e.target.value)}
                        className="input max-w-xs"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily Summary</option>
                        <option value="weekly">Weekly Summary</option>
                        <option value="monthly">Monthly Summary</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorEnabled}
                          onChange={(e) => updateSettings('security', 'twoFactorEnabled', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="240"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Expiry (days)
                        </label>
                        <input
                          type="number"
                          min="30"
                          max="365"
                          value={settings.security.passwordExpiry}
                          onChange={(e) => updateSettings('security', 'passwordExpiry', parseInt(e.target.value))}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="10"
                          value={settings.security.loginAttempts}
                          onChange={(e) => updateSettings('security', 'loginAttempts', parseInt(e.target.value))}
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="input pr-10"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? (
                                <FiEyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <FiEye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="input"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      
                      <button className="btn-secondary mt-4">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Data Management</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          checked={settings.backup.autoBackupEnabled}
                          onChange={(e) => updateSettings('backup', 'autoBackupEnabled', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Automatic Backups</span>
                          <p className="text-sm text-gray-500">Automatically backup your data</p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Backup Frequency
                        </label>
                        <select
                          value={settings.backup.backupFrequency}
                          onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
                          className="input"
                          disabled={!settings.backup.autoBackupEnabled}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Retention Period (days)
                        </label>
                        <input
                          type="number"
                          min="7"
                          max="365"
                          value={settings.backup.retentionPeriod}
                          onChange={(e) => updateSettings('backup', 'retentionPeriod', parseInt(e.target.value))}
                          className="input"
                          disabled={!settings.backup.autoBackupEnabled}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Manual Backup & Restore</h4>
                      <div className="flex flex-wrap gap-4">
                        <button className="btn-secondary flex items-center space-x-2">
                          <FiDownload className="h-4 w-4" />
                          <span>Download Backup</span>
                        </button>
                        
                        <button className="btn-secondary flex items-center space-x-2">
                          <FiUpload className="h-4 w-4" />
                          <span>Restore from Backup</span>
                        </button>
                      </div>
                      
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex">
                          <FiAlertCircle className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                              <strong>Warning:</strong> Restoring from backup will overwrite all current data. 
                              Make sure to create a backup of your current data before proceeding.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Data Export</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Export your data in various formats for external use or analysis.
                      </p>
                      
                      <div className="flex flex-wrap gap-4">
                        <button className="btn-secondary">Export Products (CSV)</button>
                        <button className="btn-secondary">Export Suppliers (CSV)</button>
                        <button className="btn-secondary">Export Transactions (CSV)</button>
                        <button className="btn-secondary">Export Reports (PDF)</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 