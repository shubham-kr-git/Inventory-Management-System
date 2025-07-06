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
    
    // Create opening balance transaction if initial stock > 0
    let openingBalanceTransaction = null;
    if (req.body.currentStock && req.body.currentStock > 0) {
      console.log('Creating opening balance transaction for initial stock:', req.body.currentStock);
      console.log('Using cost price for opening balance:', req.body.costPrice);
      
      const unitPrice = req.body.costPrice || 0;
      const totalAmount = req.body.currentStock * unitPrice;
      
      const transactionData = {
        type: 'adjustment',
        product: product._id,
        quantity: req.body.currentStock,
        unitPrice: unitPrice, // Use cost price for opening balance valuation
        totalAmount: totalAmount, // Calculate total value of opening inventory
        notes: 'Opening balance - Initial inventory',
        status: 'completed',
        paymentStatus: 'n/a',
        reference: `OPENING-${product.sku}`,
        date: new Date()
      };
      
      openingBalanceTransaction = await Transaction.create(transactionData);
      console.log('Opening balance transaction created:', openingBalanceTransaction._id);
      console.log('Transaction value:', `${req.body.currentStock} units @ $${unitPrice} = $${totalAmount}`);
    }
    
    const populatedProduct = await Product.findById(product._id)
      .populate('supplier', 'name email');

    console.log('=== CREATE PRODUCT SUCCESS ===');
    res.status(201).json({
      success: true,
      data: populatedProduct,
      transaction: openingBalanceTransaction,
      message: `Product created successfully${openingBalanceTransaction ? ' with opening balance transaction' : ''}`
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

// Adjust product stock with transaction record
const adjustStockWithTransaction = async (req, res) => {
  try {
    console.log('=== STOCK ADJUSTMENT WITH TRANSACTION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { quantity, type, reason } = req.body;
    
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

    // Calculate actual quantity change for transaction
    let actualQuantityChange;
    const currentStock = product.currentStock;
    
    switch (type) {
      case 'add':
        actualQuantityChange = quantity;
        break;
      case 'subtract':
        actualQuantityChange = -quantity;
        break;
      case 'set':
        actualQuantityChange = quantity - currentStock;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid adjustment type'
        });
    }

    // Generate reference number
    const timestamp = Date.now();
    const referenceNumber = `ADJ-${timestamp}`;

    // Get product with supplier information
    const productWithSupplier = await Product.findById(req.params.id).populate('supplier', '_id name');
    
    // Create transaction record first
    const Transaction = require('../models/Transaction');
    
    // Use cost price for adjustments to track financial impact
    const unitPrice = product.costPrice || 0;
    const totalAmount = Math.abs(actualQuantityChange) * unitPrice;
    
    console.log(`Transaction pricing: ${Math.abs(actualQuantityChange)} units @ $${unitPrice} = $${totalAmount}`);
    
    const transactionData = {
      type: 'adjustment',
      product: product._id,
      quantity: actualQuantityChange, // Positive for additions, negative for subtractions
      unitPrice: unitPrice, // Use product cost price for proper valuation
      totalAmount: totalAmount, // Calculate total value impact
      supplier: productWithSupplier.supplier._id, // Include supplier from product
      reference: referenceNumber,
      notes: `Stock adjustment: ${type} ${Math.abs(quantity)} units${reason ? ` (${reason})` : ''}`,
      status: 'completed',
      paymentStatus: 'n/a'
    };

    console.log('Creating transaction:', transactionData);
    const transaction = new Transaction(transactionData);
    await transaction.save();
    console.log('Transaction created:', transaction._id);

    // Update product stock
    console.log(`Updating stock: ${currentStock} → ${type} ${quantity}`);
    await product.updateStock(quantity, type);
    console.log('Stock updated successfully');
    
    // Get updated product with populated supplier
    const updatedProduct = await Product.findById(req.params.id)
      .populate('supplier', 'name email');

    console.log('Stock adjustment completed successfully');
    
    res.status(200).json({
      success: true,
      data: {
        product: updatedProduct,
        transaction: transaction
      },
      message: `Stock ${type === 'add' ? 'increased' : type === 'subtract' ? 'decreased' : 'adjusted'} successfully`
    });
  } catch (error) {
    console.log('=== STOCK ADJUSTMENT ERROR ===');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    if (error.errors) {
      console.log('Validation errors:', error.errors);
    }
    
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
      console.log('Returning cached AI suggestions');
      return res.status(200).json({ 
        success: true, 
        data: suggestionsCache.data,
        cached: true 
      });
    }

    console.log('Fetching fresh AI suggestions...');
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

    console.log(`Found ${products.length} products potentially needing reorder`);

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

    console.log(`Processed ${transactionSummary.length} transaction summaries`);

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
    console.log(`Database queries completed in ${dbQueryTime}ms`);

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
        setTimeout(() => reject(new Error('AI request timeout')), 15000)
      )
    ]);

    const aiTime = Date.now() - aiStartTime;
    console.log(`AI processing completed in ${aiTime}ms`);

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
    console.log(`Total processing time: ${totalTime}ms (DB: ${dbQueryTime}ms, AI: ${aiTime}ms)`);

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
  console.log('AI suggestions cache cleared');
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