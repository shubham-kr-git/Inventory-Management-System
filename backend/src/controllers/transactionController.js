const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// Get all transactions with pagination and filtering
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.product) {
      filter.product = req.query.product;
    }
    
    if (req.query.supplier) {
      filter.supplier = req.query.supplier;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      const order = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[req.query.sortBy] = order;
    } else {
      sort.date = -1;
    }

    const transactions = await Transaction.find(filter)
      .populate('product', 'name sku')
      .populate('supplier', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching transactions',
      details: error.message
    });
  }
};

// Get single transaction by ID
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('product', 'name sku price costPrice')
      .populate('supplier', 'name email phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching transaction',
      details: error.message
    });
  }
};

// Create new transaction
const createTransaction = async (req, res) => {
  try {
    // Validate product exists
    const product = await Product.findById(req.body.product);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Validate supplier for purchase transactions
    if (req.body.type === 'purchase') {
      const supplier = await Supplier.findById(req.body.supplier);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          error: 'Supplier not found'
        });
      }
    }

    // Validate transaction data
    const validationErrors = [];
    if (req.body.type === 'purchase' && !req.body.supplier) {
      validationErrors.push('Supplier is required for purchase transactions');
    }
    
    if (req.body.type === 'sale' && !req.body.customer?.name) {
      validationErrors.push('Customer name is required for sale transactions');
    }
    
    if (req.body.quantity <= 0) {
      validationErrors.push('Quantity must be greater than 0');
    }
    
    if (req.body.unitPrice < 0) {
      validationErrors.push('Unit price cannot be negative');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check stock availability for sales
    if (req.body.type === 'sale') {
      if (product.currentStock < req.body.quantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          details: `Available stock: ${product.currentStock}, Requested: ${req.body.quantity}`
        });
      }
    }

    const transaction = await Transaction.create(req.body);
    
    // Update product stock
    if (req.body.type === 'purchase') {
      await product.updateStock(req.body.quantity, 'add');
      
      // Update supplier balance for purchase transactions
      const supplier = await Supplier.findById(req.body.supplier);
      if (supplier) {
        await supplier.updateBalance(transaction.totalAmount, 'add');
      }
    } else if (req.body.type === 'sale') {
      await product.updateStock(req.body.quantity, 'subtract');
    }
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('supplier', 'name');

    res.status(201).json({
      success: true,
      data: populatedTransaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating transaction',
      details: error.message
    });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Don't allow updating completed transactions
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update completed transactions'
      });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('product', 'name sku')
      .populate('supplier', 'name');

    res.status(200).json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating transaction',
      details: error.message
    });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Don't allow deleting completed transactions
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete completed transactions'
      });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting transaction',
      details: error.message
    });
  }
};

// Get sales transactions
const getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.findSales()
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ type: 'sale' });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching sales',
      details: error.message
    });
  }
};

// Get purchase transactions
const getPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.findPurchases()
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ type: 'purchase' });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching purchases',
      details: error.message
    });
  }
};

// Get transactions by product
const getTransactionsByProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.findByProduct(req.params.productId)
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ product: req.params.productId });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching transactions by product',
      details: error.message
    });
  }
};

// Get transactions by supplier
const getTransactionsBySupplier = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.findBySupplier(req.params.supplierId)
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ supplier: req.params.supplierId });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching transactions by supplier',
      details: error.message
    });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const stats = await Transaction.getStats(startDate, endDate);
    
    // Calculate totals
    const totalSales = stats.find(s => s._id === 'sale') || { count: 0, totalAmount: 0, totalQuantity: 0 };
    const totalPurchases = stats.find(s => s._id === 'purchase') || { count: 0, totalAmount: 0, totalQuantity: 0 };
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('product', 'name sku')
      .populate('supplier', 'name')
      .sort({ date: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate
        },
        sales: {
          count: totalSales.count,
          totalAmount: totalSales.totalAmount,
          totalQuantity: totalSales.totalQuantity
        },
        purchases: {
          count: totalPurchases.count,
          totalAmount: totalPurchases.totalAmount,
          totalQuantity: totalPurchases.totalQuantity
        },
        netAmount: totalSales.totalAmount - totalPurchases.totalAmount,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching transaction statistics',
      details: error.message
    });
  }
};

module.exports = {
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
}; 