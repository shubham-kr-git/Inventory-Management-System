const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getInventoryAnalytics,
  getFinancialAnalytics,
  getSupplierAnalytics,
  getQuickActionsData
} = require('../controllers/dashboardController');

// GET /api/dashboard - Get dashboard overview statistics
router.get('/', getDashboardStats);

// GET /api/dashboard/inventory - Get inventory analytics
router.get('/inventory', getInventoryAnalytics);

// GET /api/dashboard/financial - Get financial analytics
router.get('/financial', getFinancialAnalytics);

// GET /api/dashboard/suppliers - Get supplier analytics
router.get('/suppliers', getSupplierAnalytics);

// GET /api/dashboard/quick-actions - Get quick actions data
router.get('/quick-actions', getQuickActionsData);

module.exports = router; 