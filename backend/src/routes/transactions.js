const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSales,
  getPurchases,
  getTransactionsByProduct,
  getTransactionsBySupplier,
  getTransactionStats
} = require('../controllers/transactionController');

// GET /api/transactions - Get all transactions with pagination and filtering
router.get('/', getTransactions);

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', getTransactionStats);

// GET /api/transactions/sales - Get sales transactions
router.get('/sales', getSales);

// GET /api/transactions/purchases - Get purchase transactions
router.get('/purchases', getPurchases);

// GET /api/transactions/product/:productId - Get transactions by product
router.get('/product/:productId', getTransactionsByProduct);

// GET /api/transactions/supplier/:supplierId - Get transactions by supplier
router.get('/supplier/:supplierId', getTransactionsBySupplier);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getTransaction);

// POST /api/transactions - Create new transaction
router.post('/', createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

module.exports = router; 