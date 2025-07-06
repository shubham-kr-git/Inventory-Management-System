'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  FiPackage, 
  FiPlus, 
  FiTrash2, 
  FiUpload,
  FiAlertCircle,
  FiCheck,
  FiX
} from 'react-icons/fi'
import { productsApi, suppliersApi, Product, Supplier, CreateProductData } from '../../lib/api'

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  costPrice: number;
  currentStock: number;
  minStockThreshold: number;
  supplier: string;
}

interface StockAdjustment {
  productId: string;
  productName: string;
  currentStock: number;
  adjustment: number;
  type: 'add' | 'subtract' | 'set';
}

interface ProductsContentProps {
  onReorderAction: (sku: string, qty: string, productName: string) => void;
  reorderData?: {
    sku: string;
    qty: string;
    productName: string;
  } | null;
  onReorderComplete?: () => void;
}

// Component that handles search params
function ReorderHandler({ onReorderAction }: { onReorderAction: (sku: string, qty: string, productName: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const isReorder = searchParams.get('reorder')
    const sku = searchParams.get('sku')
    const qty = searchParams.get('qty')
    const productName = searchParams.get('productName')

    if (isReorder === 'true' && sku && qty && productName) {
      onReorderAction(sku, qty, productName)
    }
  }, [searchParams, onReorderAction])

  return null
}

function ProductsContent({ onReorderAction, reorderData, onReorderComplete }: ProductsContentProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    costPrice: 0,
    currentStock: 0,
    minStockThreshold: 0,
    supplier: ''
  })
  
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustment>({
    productId: '',
    productName: '',
    currentStock: 0,
    adjustment: 0,
    type: 'add'
  })

  const [isReorderAction, setIsReorderAction] = useState(false)

  // Fetch data
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productsApi.getAll({
        page: currentPage,
        limit: itemsPerPage
      })
      setProducts(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
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
    fetchProducts()
  }, [currentPage])

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Search for product and open stock modal
  const searchAndOpenStockModal = async (sku: string, qty: string, productName: string) => {
    try {
      setLoading(true)
      const response = await productsApi.getAll({
        search: sku,
        limit: 100 // Search through more products
      })
      
      const product = response.data.find(p => p.sku === sku)
      
      if (product) {
        // Update current products with search results
        setProducts(response.data)
        
        // Set up stock adjustment with reorder suggestion
        setStockAdjustment({
          productId: product._id,
          productName: product.name,
          currentStock: product.currentStock,
          adjustment: parseInt(qty),
          type: 'add'
        })
        setShowStockModal(true)
        setIsReorderAction(true)
        
        // Clean up URL parameters
        window.history.replaceState({}, '', '/products')
      } else {
        setError(`Product with SKU "${sku}" not found. Please verify the SKU and try again.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search for product')
    } finally {
      setLoading(false)
    }
  }

  // Handle reorder data from parent component
  useEffect(() => {
    if (reorderData && products.length > 0) {
      const { sku, qty, productName } = reorderData
      // Find the product by SKU
      const product = products.find(p => p.sku === sku)
      
      if (product) {
        // Set up stock adjustment with reorder suggestion
        setStockAdjustment({
          productId: product._id,
          productName: product.name,
          currentStock: product.currentStock,
          adjustment: parseInt(qty),
          type: 'add'
        })
        setShowStockModal(true)
        setIsReorderAction(true)
        
        // Clean up URL parameters
        window.history.replaceState({}, '', '/products')
      } else {
        // Product not found on current page - search for it
        searchAndOpenStockModal(sku, qty, productName)
      }
      onReorderComplete?.()
    }
  }, [reorderData, products])

  // Handle reorder action from ReorderHandler (keeping for backward compatibility)
  const handleReorderAction = (sku: string, qty: string, productName: string) => {
    // This is now handled by the useEffect above when reorderData changes
    // But we keep this function for any direct calls
  }


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation: Initial stock must be greater than 0 for new products
    if (formData.currentStock <= 0) {
      setError('Initial stock must be greater than 0 when creating a new product. An opening balance transaction will be automatically created to track this inventory.')
      return
    }
    
    try {
      // Send supplier ID directly, backend will populate the supplier object
      const productData = {
        ...formData,
        supplier: formData.supplier // Send just the supplier ID string
      }

      // For creates, use the proper CreateProductData interface
      // This will create both the product and an opening balance transaction
      const response = await productsApi.create(productData as CreateProductData) as any
      console.log('Product created successfully:', response.data)
      if (response.transaction) {
        console.log('Opening balance transaction created:', response.transaction)
      }
      await fetchProducts()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedProduct) return
    try {
      await productsApi.delete(selectedProduct._id)
      await fetchProducts()
      setShowDeleteModal(false)
      setSelectedProduct(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  // Handle stock adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await productsApi.updateStock(
        stockAdjustment.productId, 
        stockAdjustment.adjustment, 
        stockAdjustment.type,
        `Manual adjustment via dashboard` // reason for transaction
      )
      console.log('Stock adjusted successfully. Transaction created:', response.data.transaction)
      await fetchProducts()
      setShowStockModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock')
    }
  }

  // Modal handlers
  const handleAddProduct = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      description: '',
      price: 0,
      costPrice: 0,
      currentStock: 1, // Default to 1 since initial stock must be > 0
      minStockThreshold: 0,
      supplier: ''
    })
    setShowAddModal(true)
  }



  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const handleAdjustStock = (product: Product) => {
    setStockAdjustment({
      productId: product._id,
      productName: product.name,
      currentStock: product.currentStock,
      adjustment: 0,
      type: 'add'
    })
    setIsReorderAction(false)
    setShowStockModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setShowDeleteModal(false)
    setShowStockModal(false)
    setSelectedProduct(null)
    setIsReorderAction(false)
    setError(null)
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-yellow-600 bg-yellow-100'
      case 'out': return 'text-red-600 bg-red-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Products
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product inventory and stock levels
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button 
            onClick={handleAddProduct}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
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

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {product.currentStock}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stockStatus)}`}>
                          {product.stockStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleAdjustStock(product)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Adjust Stock"
                        >
                          <FiUpload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Product"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Product
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be greater than 0. This will create an opening balance transaction.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={formData.minStockThreshold}
                      onChange={(e) => setFormData({ ...formData, minStockThreshold: parseInt(e.target.value) || 0 })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <FiAlertCircle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Delete Product
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isReorderAction ? '🤖 AI Reorder Suggestion' : 'Adjust Stock'} - {stockAdjustment.productName}
              </h3>
              {isReorderAction && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>AI Recommendation:</strong> Add {stockAdjustment.adjustment} units to restock this item.
                        You can adjust the quantity below if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock: {stockAdjustment.currentStock}
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={stockAdjustment.type}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, type: e.target.value as 'add' | 'subtract' | 'set' })}
                    className="input"
                  >
                    <option value="add">Add to Stock</option>
                    <option value="subtract">Subtract from Stock</option>
                    <option value="set">Set Stock Level</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {stockAdjustment.type === 'set' ? 'New Stock Level' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    value={stockAdjustment.adjustment}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, adjustment: parseInt(e.target.value) || 0 })}
                    className="input"
                    required
                  />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    New stock level will be: {
                      stockAdjustment.type === 'add' 
                        ? stockAdjustment.currentStock + stockAdjustment.adjustment
                        : stockAdjustment.type === 'subtract'
                        ? Math.max(0, stockAdjustment.currentStock - stockAdjustment.adjustment)
                        : stockAdjustment.adjustment
                    }
                  </p>
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {isReorderAction ? 'Reorder Stock' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function ProductsPage() {
  const [reorderData, setReorderData] = useState<{
    sku: string;
    qty: string;
    productName: string;
  } | null>(null)

  const handleReorderAction = (sku: string, qty: string, productName: string) => {
    setReorderData({ sku, qty, productName })
  }

  return (
    <div>
      <Suspense fallback={<div className="space-y-6"><div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div><div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div></div>}>
        <ReorderHandler onReorderAction={handleReorderAction} />
      </Suspense>
      <ProductsContent 
        onReorderAction={handleReorderAction}
        reorderData={reorderData}
        onReorderComplete={() => setReorderData(null)}
      />
    </div>
  )
} 