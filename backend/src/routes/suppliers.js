const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersByCategory,
  getLowCreditSuppliers,
  updateBalance,
  getProductsBySupplier,
  getSupplierStats
} = require('../controllers/supplierController');

// GET /api/suppliers - Get all suppliers with pagination and filtering
router.get('/', getSuppliers);

// GET /api/suppliers/stats - Get supplier statistics
router.get('/stats', getSupplierStats);

// GET /api/suppliers/category/:category - Get suppliers by category
router.get('/category/:category', getSuppliersByCategory);

// GET /api/suppliers/low-credit - Get suppliers with low credit
router.get('/low-credit', getLowCreditSuppliers);

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', getSupplier);

// GET /api/suppliers/:id/products - Get products by supplier
router.get('/:id/products', getProductsBySupplier);

// POST /api/suppliers - Create new supplier
router.post('/', createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', updateSupplier);

// PATCH /api/suppliers/:id/balance - Update supplier balance
router.patch('/:id/balance', updateBalance);

// DELETE /api/suppliers/:id - Delete supplier (soft delete)
router.delete('/:id', deleteSupplier);

module.exports = router; 