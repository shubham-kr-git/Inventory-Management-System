const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Transaction = require('../models/Transaction');
const {
  GoogleGenAI,
  Type,
} = require("@google/genai");

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
    // Find the supplier first
    const supplier = await Supplier.findById(req.body.supplier);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    // Create the product
    const product = new Product({
      ...req.body,
      supplier: supplier._id
    });

    const savedProduct = await product.save();

    // Populate the supplier information before sending response
    await savedProduct.populate('supplier', 'name email');

    // Create opening balance transaction for initial stock
    const unitPrice = req.body.costPrice || req.body.price || 0;
    const totalAmount = req.body.currentStock * unitPrice;

    const openingBalanceTransaction = new Transaction({
      type: 'adjustment',
      product: savedProduct._id,
      quantity: req.body.currentStock,
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      status: 'completed',
      paymentStatus: 'n/a',
      referenceNumber: `OB-${savedProduct.sku}-${Date.now()}`,
      reason: 'Opening balance - Initial stock entry'
    });

    await openingBalanceTransaction.save();
    await openingBalanceTransaction.populate('product', 'name sku');

    res.status(201).json({
      success: true,
      data: savedProduct,
      transaction: openingBalanceTransaction,
      message: 'Product created successfully with opening balance transaction'
    });

  } catch (error) {
    console.error('Error creating product:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists',
        details: 'A product with this SKU already exists in the system'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors.join(', ')
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

// Adjust product stock with transaction record
const adjustStockWithTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason } = req.body;

    // Validate required fields
    if (!quantity || !type) {
      return res.status(400).json({
        success: false,
        error: 'Quantity and type are required'
      });
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0'
      });
    }

    // Validate reasonable quantity limits (max 10,000 units per adjustment)
    if (quantity > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot exceed 10,000 units per adjustment'
      });
    }

    // Validate type
    if (!['add', 'subtract', 'set'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be one of: add, subtract, set'
      });
    }

    // Get product with supplier info
    const product = await Product.findById(id).populate('supplier', 'name email');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const currentStock = product.currentStock;
    let newStock;
    let actualQuantityChange;

    // Additional validation for subtract operation
    if (type === 'subtract' && quantity > currentStock) {
      return res.status(400).json({
        success: false,
        error: `Cannot subtract ${quantity} units. Only ${currentStock} units available in stock.`
      });
    }

    // Calculate new stock based on operation type
    switch (type) {
      case 'add':
        newStock = currentStock + quantity;
        actualQuantityChange = quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - quantity);
        actualQuantityChange = -(Math.min(quantity, currentStock));
        break;
      case 'set':
        newStock = Math.max(0, quantity);
        actualQuantityChange = newStock - currentStock;
        break;
    }

    // Determine transaction type based on whether we're adding or removing stock
    let transactionType;
    if (actualQuantityChange > 0) {
      transactionType = 'adjustment'; // Stock increase (could be purchase, return, etc.)
    } else if (actualQuantityChange < 0) {
      transactionType = 'adjustment'; // Stock decrease (could be sale, loss, etc.)
    } else {
      // No actual change
      return res.status(200).json({
        success: true,
        data: { product, transaction: null },
        message: 'No stock change required'
      });
    }

    // Calculate pricing (use cost price for valuation)
    const unitPrice = product.costPrice || product.price || 0;
    const totalAmount = Math.abs(actualQuantityChange) * unitPrice;

    // Create transaction record
    const transactionData = {
      type: transactionType,
      product: id,
      quantity: Math.abs(actualQuantityChange),
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      status: 'completed',
      paymentStatus: 'n/a',
      referenceNumber: `ADJ-${product.sku}-${Date.now()}`,
      reason: reason || `Stock ${type} via dashboard`
    };

    const transaction = await Transaction.create(transactionData);

    // Update product stock
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { currentStock: newStock },
      { new: true, runValidators: true }
    ).populate('supplier', 'name email');

    res.status(200).json({
      success: true,
      data: {
        product: updatedProduct,
        transaction: transaction
      },
      message: `Stock ${type === 'add' ? 'increased' : type === 'subtract' ? 'decreased' : 'adjusted'} successfully`
    });
  } catch (error) {
    console.error('Stock adjustment error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Error adjusting stock',
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

// Cache for AI suggestions (simple in-memory cache)
let suggestionsCache = {
  data: null,
  timestamp: null,
  ttl: 60 * 60 * 1000 // 1 hour TTL
};

// AI reorder suggestions controller
const getReorderSuggestions = async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (suggestionsCache.data && 
        suggestionsCache.timestamp && 
        (now - suggestionsCache.timestamp) < suggestionsCache.ttl) {
      return res.status(200).json({ 
        success: true, 
        data: suggestionsCache.data,
        cached: true 
      });
    }

    const startTime = Date.now();

    // 1. Only fetch products that might need reordering (more efficient)
    const products = await Product.find({ 
      isActive: true,
      $expr: { 
        $lte: ['$currentStock', { $multiply: ['$minStockThreshold', 2] }] // Only products at or below 2x threshold
      }
    })
      .select('_id name sku currentStock minStockThreshold')
      .limit(20) // Limit to top 20 products to avoid overwhelming AI
      .lean();

    if (products.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No products currently need reordering' 
      });
    }

    // 2. Fetch recent transactions more efficiently using aggregation
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30); // Reduced to 30 days for performance

    const transactionSummary = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: sinceDate },
          product: { $in: products.map(p => p._id) },
          type: { $in: ['sale', 'purchase', 'adjustment'] }
        }
      },
      {
        $group: {
          _id: '$product',
          totalSales: {
            $sum: { $cond: [{ $eq: ['$type', 'sale'] }, '$quantity', 0] }
          },
          totalPurchases: {
            $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$quantity', 0] }
          },
          totalAdjustments: {
            $sum: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$quantity', 0] }
          },
          recentTransactionCount: { $sum: 1 },
          lastTransactionDate: { $max: '$date' }
        }
      }
    ]);

    // 3. Prepare simplified data for AI (much smaller payload)
    const productData = products.map((prod) => {
      const txSummary = transactionSummary.find(
        (t) => String(t._id) === String(prod._id)
      ) || {
        totalSales: 0,
        totalPurchases: 0,
        totalAdjustments: 0,
        recentTransactionCount: 0,
        lastTransactionDate: null
      };

      const stockRatio = prod.currentStock / (prod.minStockThreshold || 1);
      const dailyUsage = txSummary.totalSales / 30; // Average daily sales

      return {
        sku: prod.sku,
        name: prod.name,
        currentStock: prod.currentStock,
        minThreshold: prod.minStockThreshold,
        stockRatio: Math.round(stockRatio * 100) / 100,
        dailyUsage: Math.round(dailyUsage * 100) / 100,
        totalSales30Days: txSummary.totalSales,
        recentActivity: txSummary.recentTransactionCount > 0
      };
    });

    const dbQueryTime = Date.now() - startTime;

    // 4. Simplified AI prompt for faster processing
    const promptText = `Analyze these products and suggest reorder quantities. Focus ONLY on products that need immediate attention.

Rules:
- Suggest reorder if currentStock < minThreshold OR stockRatio < 1.5
- Calculate reorder quantity based on: minThreshold * 2 + (dailyUsage * 14)
- Skip products with stockRatio > 1.5 unless they have high daily usage
- Maximum 10 suggestions
- Be concise

Respond as JSON array: [{"sku":"", "name":"", "suggestedReorderQty":0, "reason":""}]`;

    // 5. Call GenAI with timeout
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const aiStartTime = Date.now();
    const result = await Promise.race([
      genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ 
          role: 'user', 
          parts: [
            { text: promptText }, 
            { text: `Products to analyze:\n${JSON.stringify(productData, null, 2)}` }
          ] 
        }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                name: { type: Type.STRING },
                suggestedReorderQty: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ['sku', 'name', 'suggestedReorderQty', 'reason']
            }
          }
        },
        generationConfig: {
          maxOutputTokens: 2048, // Reduced for faster response
          temperature: 0.1
        }
      }),
      // 15 second timeout
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 25000)
      )
    ]);

    const aiTime = Date.now() - aiStartTime;

    // 6. Parse response
    let suggestions = [];
    try {
      if (!result.candidates || result.candidates.length === 0) {
        console.error('AI response was blocked or empty.');
        return res.status(502).json({
          success: false,
          error: 'AI response was blocked or empty.'
        });
      }

      const candidate = result.candidates[0];
      const jsonString = candidate.content.parts[0].text;
      suggestions = JSON.parse(jsonString);
      
      // Limit suggestions and ensure quality
      suggestions = suggestions
        .filter(s => s.suggestedReorderQty > 0)
        .slice(0, 10);
      
    } catch (err) {
      console.error('Failed to parse AI output:', err);
      return res.status(502).json({
        success: false,
        error: 'Invalid AI response format'
      });
    }

    // 7. Cache the results
    suggestionsCache = {
      data: suggestions,
      timestamp: now,
      ttl: 60 * 60 * 1000 // 1 hour
    };

    const totalTime = Date.now() - startTime;

    return res.status(200).json({ 
      success: true, 
      data: suggestions,
      meta: {
        processingTime: totalTime,
        productCount: products.length,
        cached: false
      }
    });

  } catch (err) {
    console.error('Error in getReorderSuggestions:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to get reorder suggestions',
      error: err.message
    });
  }
};

// Function to clear suggestions cache
const clearSuggestionsCache = () => {
  suggestionsCache = {
    data: null,
    timestamp: null,
    ttl: 60 * 60 * 1000
  };
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
  adjustStockWithTransaction,
  getProductStats,
  getReorderSuggestions,
  clearSuggestionsCache
}; 
