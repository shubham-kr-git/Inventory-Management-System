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

// AI reorder suggestions controller
const getReorderSuggestions = async (req, res) => {
  try {
    // ... (Steps 1-3 are unchanged)
    // 1. Fetch all products
    const products = await Product.find({ isActive: true })
      .select('_id name sku currentStock minStockThreshold')
      .lean();

    // 2. Fetch recent transactions
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 60);
    const transactions = await Transaction.find({
      date: { $gte: sinceDate },
      product: { $in: products.map((p) => p._id) },
    })
      .select('product type quantity date')
      .lean();

    // 3. Prepare productData
    const productData = products.map((prod) => {
      const txs = transactions.filter(
        (t) => String(t.product) === String(prod._id)
      );
      return {
        sku: prod.sku,
        name: prod.name,
        currentStock: prod.currentStock,
        minStockThreshold: prod.minStockThreshold,
        transactions: txs.map((t) => ({
          type: t.type,
          quantity: t.quantity,
          date: t.date,
        })),
      };
    });

    // Debug: Log the data being sent to AI
    console.log('Products count:', products.length);
    console.log('Transactions count:', transactions.length);

    // 4. Build prompt
    const promptText =
      `You are an inventory management AI. Analyze each product and suggest reorder quantities based on:
      - Current stock level
      - Minimum stock threshold  
      - Recent transaction patterns (last 60 days)
      
      Rules:
      - If current stock is below minimum threshold, suggest reordering
      - Consider transaction velocity to determine reorder quantity
      - Always provide at least one suggestion for testing purposes
      - If no products actually need reordering, suggest a small quantity for the product with lowest stock ratio
      
      Respond as a JSON array: [{ "sku": "", "name": "", "suggestedReorderQty": 0, "reason": "" }]`;

    // 5. Call GenAI client
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: promptText }, { text: JSON.stringify(productData) }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sku: {
                type: Type.STRING,
              },
              name: {
                type: Type.STRING,
              },
              suggestedReorderQty: {
                type: Type.NUMBER,
              },
              reason: {
                type: Type.STRING,
              },
            },
            required: ['sku', 'name', 'suggestedReorderQty', 'reason'],
            propertyOrdering: ['sku', 'name', 'suggestedReorderQty', 'reason'],
          },
        },
      },
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.0,
      },
    });
    console.log('Gemini response:', result);

    // 6. Parse structured JSON response
    let suggestions;
    try {
      // Check if we have candidates in the response
      if (!result.candidates || result.candidates.length === 0) {
        console.error('AI response was blocked or empty.');
        return res.status(502).json({
          success: false,
          error: 'AI response was blocked or empty.',
        });
      }

      // Extract text from the first candidate
      const candidate = result.candidates[0];
      const jsonString = candidate.content.parts[0].text;
      console.log('Raw AI response text:', jsonString);
      
      suggestions = JSON.parse(jsonString);
    } catch (err) {
      console.error('Failed to parse AI output as JSON:', err);
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text available';
      return res.status(502).json({
        success: false,
        error: 'Invalid or malformed JSON from AI',
        raw: rawText,
      });
    }

    // 7. Return
    return res.status(200).json({ success: true, data: suggestions });
  } catch (err) {
    console.error('Error in getReorderSuggestions:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to get reorder suggestions',
      error: err.message,
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
  adjustStockWithTransaction,
  getProductStats,
  getReorderSuggestions
}; 