const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  updateStock,
  adjustStockWithTransaction,
  getProductStats,
  getReorderSuggestions,
  clearSuggestionsCache
} = require('../controllers/productController');

// GET /api/products - Get all products with pagination and filtering
router.get('/', getProducts);

// GET /api/products/stats - Get product statistics
router.get('/stats', getProductStats);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', getLowStockProducts);

// GET /api/products/out-of-stock - Get out of stock products
router.get('/out-of-stock', getOutOfStockProducts);

// Add AI reorder suggestions endpoint
router.get('/reorder-suggestions', getReorderSuggestions);

// Add cache management endpoints
router.delete('/reorder-suggestions/cache', (req, res) => {
  try {
    clearSuggestionsCache();
    res.status(200).json({ 
      success: true, 
      message: 'AI suggestions cache cleared successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear cache' 
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', getProduct);

// POST /api/products - Create new product
router.post('/', createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', updateProduct);

// PATCH /api/products/:id/stock - Update product stock
router.patch('/:id/stock', updateStock);

// PATCH /api/products/:id/adjust-stock - Adjust product stock with transaction
router.patch('/:id/adjust-stock', adjustStockWithTransaction);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', deleteProduct);

module.exports = router; 