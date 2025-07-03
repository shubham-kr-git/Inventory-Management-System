const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// Get all products with pagination and filtering
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.supplier) {
      filter.supplier = req.query.supplier;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      const order = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[req.query.sortBy] = order;
    } else {
      sort.createdAt = -1;
    }

    const products = await Product.find(filter)
      .populate('supplier', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);
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
      error: 'Error fetching products',
      details: error.message
    });
  }
};

// Get single product by ID
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name email phone address');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching product',
      details: error.message
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate supplier exists
    console.log('Looking for supplier with ID:', req.body.supplier);
    const supplier = await Supplier.findById(req.body.supplier);
    if (!supplier) {
      console.log('Supplier not found!');
      return res.status(400).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    console.log('Supplier found:', supplier.name);

    console.log('Creating product with data:', req.body);
    const product = await Product.create(req.body);
    console.log('Product created successfully:', product._id);
    
    const populatedProduct = await Product.findById(product._id)
      .populate('supplier', 'name email');

    console.log('=== CREATE PRODUCT SUCCESS ===');
    res.status(201).json({
      success: true,
      data: populatedProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.log('=== CREATE PRODUCT ERROR ===');
    console.log('Error type:', error.constructor.name);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Full error:', error);
    
    if (error.code === 11000) {
      console.log('Duplicate key error - SKU already exists');
      return res.status(400).json({
        success: false,
        error: 'SKU already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      console.log('Validation error details:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        validationErrors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating product',
      details: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Validate supplier if being updated
    if (req.body.supplier) {
      const supplier = await Supplier.findById(req.body.supplier);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          error: 'Supplier not found'
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error updating product',
      details: error.message
    });
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting product',
      details: error.message
    });
  }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.findLowStock();
    
    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching low stock products',
      details: error.message
    });
  }
};

// Get out of stock products
const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.findOutOfStock();
    
    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching out of stock products',
      details: error.message
    });
  }
};

// Update product stock
const updateStock = async (req, res) => {
  try {
    const { quantity, type } = req.body;
    
    if (!quantity || !type) {
      return res.status(400).json({
        success: false,
        error: 'Quantity and type are required'
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.updateStock(quantity, type);
    
    const updatedProduct = await Product.findById(req.params.id)
      .populate('supplier', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: `Stock ${type === 'add' ? 'added' : 'subtracted'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating stock',
      details: error.message
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.findLowStock();
    const outOfStockProducts = await Product.findOutOfStock();
    
    // Calculate total inventory value
    const products = await Product.find({ isActive: true });
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * product.currentStock);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalValue: parseFloat(totalValue.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching product statistics',
      details: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  updateStock,
  getProductStats
}; 