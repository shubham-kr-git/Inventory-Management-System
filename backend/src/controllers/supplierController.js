const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// Get all suppliers with pagination and filtering
const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.category) {
      filter.categories = req.query.category;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { contactPerson: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      const order = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[req.query.sortBy] = order;
    } else {
      sort.name = 1;
    }

    const suppliers = await Supplier.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Supplier.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: suppliers,
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
      error: 'Error fetching suppliers',
      details: error.message
    });
  }
};

// Get single supplier by ID
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching supplier',
      details: error.message
    });
  }
};

// Create new supplier
const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating supplier',
      details: error.message
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSupplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error updating supplier',
      details: error.message
    });
  }
};

// Delete supplier (soft delete)
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    // Check if supplier has associated products
    const productCount = await Product.countDocuments({ 
      supplier: req.params.id, 
      isActive: true 
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete supplier. ${productCount} active products are associated with this supplier.`
      });
    }

    // Soft delete by setting isActive to false
    supplier.isActive = false;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting supplier',
      details: error.message
    });
  }
};

// Get suppliers by category
const getSuppliersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const suppliers = await Supplier.findByCategory(category);
    
    res.status(200).json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching suppliers by category',
      details: error.message
    });
  }
};

// Get suppliers with low credit
const getLowCreditSuppliers = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.8;
    
    const suppliers = await Supplier.findLowCredit(threshold);
    
    res.status(200).json({
      success: true,
      data: suppliers,
      count: suppliers.length,
      threshold
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching low credit suppliers',
      details: error.message
    });
  }
};

// Update supplier balance
const updateBalance = async (req, res) => {
  try {
    const { amount, type } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'Amount and type are required'
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    await supplier.updateBalance(amount, type);

    res.status(200).json({
      success: true,
      data: supplier,
      message: `Balance ${type === 'add' ? 'added' : 'subtracted'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating balance',
      details: error.message
    });
  }
};

// Get products by supplier
const getProductsBySupplier = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ 
      supplier: req.params.id, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ 
      supplier: req.params.id, 
      isActive: true 
    });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: products,
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
      error: 'Error fetching products by supplier',
      details: error.message
    });
  }
};

// Get supplier statistics
const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments({ isActive: true });
    const activeSuppliers = await Supplier.findActive();
    
    // Calculate total credit limit and current balance
    const totalCreditLimit = activeSuppliers.reduce((sum, supplier) => {
      return sum + supplier.creditLimit;
    }, 0);
    
    const totalCurrentBalance = activeSuppliers.reduce((sum, supplier) => {
      return sum + supplier.currentBalance;
    }, 0);

    // Get suppliers by category
    const categoryStats = await Supplier.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        totalCreditLimit,
        totalCurrentBalance,
        averageCreditUtilization: totalCreditLimit > 0 ? 
          ((totalCurrentBalance / totalCreditLimit) * 100).toFixed(2) : 0,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching supplier statistics',
      details: error.message
    });
  }
};

module.exports = {
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
}; 