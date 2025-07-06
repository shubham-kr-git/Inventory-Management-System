const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Transaction = require('../models/Transaction');

// Get dashboard overview statistics
const getDashboardStats = async (req, res) => { 
  try {
    // Get basic counts
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalSuppliers = await Supplier.countDocuments({ isActive: true });
    const totalTransactions = await Transaction.countDocuments();
    
    // Get stock alerts
    const lowStockProducts = await Product.findLowStock();
    const outOfStockProducts = await Product.findOutOfStock();
    
    // Calculate inventory value
    const products = await Product.find({ isActive: true });
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.price * product.currentStock);
    }, 0);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('product', 'name sku')
      .populate('supplier', 'name')
      .sort({ date: -1 })
      .limit(5);
    
    // Get monthly sales data for chart
    const currentYear = new Date().getFullYear();
    const monthlySales = await Transaction.aggregate([
      {
        $match: {
          type: 'sale',
          date: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get monthly purchases data for chart
    const monthlyPurchases = await Transaction.aggregate([
      {
        $match: {
          type: 'purchase',
          date: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get top selling products
    const topProducts = await Transaction.aggregate([
      {
        $match: { type: 'sale' }
      },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          totalQuantity: 1,
          totalAmount: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    // Get supplier statistics
    const supplierStats = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCreditLimit: { $sum: '$creditLimit' },
          totalCurrentBalance: { $sum: '$currentBalance' },
          averageCreditUtilization: {
            $avg: {
              $cond: [
                { $gt: ['$creditLimit', 0] },
                { $divide: ['$currentBalance', '$creditLimit'] },
                0
              ]
            }
          }
        }
      }
    ]);
    
    const supplierData = supplierStats[0] || {
      totalCreditLimit: 0,
      totalCurrentBalance: 0,
      averageCreditUtilization: 0
    };

    // Get top suppliers by transaction value
    const topSuppliers = await Transaction.aggregate([
      {
        $match: { 
          type: 'purchase',
          supplier: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$supplier',
          totalAmount: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $unwind: '$supplier'
      },
      {
        $project: {
          name: '$supplier.name',
          totalAmount: 1,
          totalQuantity: 1,
          orderCount: 1
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProducts,
          totalSuppliers,
          totalTransactions,
          totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length
        },
        alerts: {
          lowStockProducts: lowStockProducts.slice(0, 5),
          outOfStockProducts: outOfStockProducts.slice(0, 5)
        },
        recentTransactions,
        monthlySales,
        monthlyPurchases,
        topProducts,
        topSuppliers,
        supplierStats: {
          totalCreditLimit: supplierData.totalCreditLimit,
          totalCurrentBalance: supplierData.totalCurrentBalance,
          averageCreditUtilization: parseFloat((supplierData.averageCreditUtilization * 100).toFixed(2))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching dashboard statistics',
      details: error.message
    });
  }
};

// Get inventory analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get stock movement
    const stockMovement = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Get category distribution
    const categoryDistribution = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$currentStock'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get stock levels by category
    const stockLevels = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalStock: { $sum: '$currentStock' },
          averageStock: { $avg: '$currentStock' },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lt: ['$currentStock', '$reorderPoint'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { totalStock: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          days,
          startDate,
          endDate: new Date()
        },
        stockMovement,
        categoryDistribution,
        stockLevels
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching inventory analytics',
      details: error.message
    });
  }
};

// Get financial analytics
const getFinancialAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get revenue and cost data
    const financialData = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          totalAmount: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          averagePrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Calculate profit margins
    const profitAnalysis = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate },
          type: 'sale'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: { $multiply: ['$quantity', '$product.costPrice'] } },
          profit: {
            $sum: {
              $subtract: [
                '$totalAmount',
                { $multiply: ['$quantity', '$product.costPrice'] }
              ]
            }
          }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ['$revenue', 0] },
              { $multiply: [{ $divide: ['$profit', '$revenue'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          days,
          startDate,
          endDate: new Date()
        },
        financialData,
        profitAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching financial analytics',
      details: error.message
    });
  }
};

// Get supplier analytics
const getSupplierAnalytics = async (req, res) => {
  try {
    // Get supplier performance
    const supplierPerformance = await Transaction.aggregate([
      {
        $match: { type: 'purchase' }
      },
      {
        $group: {
          _id: '$supplier',
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $unwind: '$supplier'
      },
      {
        $project: {
          name: '$supplier.name',
          email: '$supplier.email',
          totalPurchases: 1,
          totalAmount: 1,
          totalQuantity: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Get credit utilization
    const creditUtilization = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $addFields: {
          creditUtilization: {
            $cond: [
              { $gt: ['$creditLimit', 0] },
              { $multiply: [{ $divide: ['$currentBalance', '$creditLimit'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          creditLimit: 1,
          currentBalance: 1,
          creditUtilization: 1
        }
      },
      { $sort: { creditUtilization: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        supplierPerformance,
        creditUtilization
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching supplier analytics',
      details: error.message
    });
  }
};

// Get quick actions data
const getQuickActionsData = async (req, res) => {
  try {
    // Get low stock products for restock action
    const lowStockProducts = await Product.findLowStock();
    
    // Get suppliers for new purchase action
    const suppliers = await Supplier.find({ isActive: true })
      .select('name email')
      .limit(10);
    
    // Get recent products for quick sale action
    const recentProducts = await Product.find({ isActive: true })
      .select('name sku currentStock price')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        lowStockProducts: lowStockProducts.slice(0, 5),
        suppliers,
        recentProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching quick actions data',
      details: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getInventoryAnalytics,
  getFinancialAnalytics,
  getSupplierAnalytics,
  getQuickActionsData
}; 