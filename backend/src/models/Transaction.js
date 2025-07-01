const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['purchase', 'sale', 'adjustment', 'return'],
      message: 'Transaction type must be purchase, sale, adjustment, or return'
    }
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Quantity must be a positive number'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Unit price must be a positive number'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Total amount must be a positive number'
    }
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [50, 'Reference cannot exceed 50 characters'],
    description: 'Invoice number, order number, or other reference'
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: function() {
      return this.type === 'purchase';
    }
  },
  customer: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
      required: function() {
        return this.type === 'sale';
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'overdue'],
    default: 'paid'
  },
  date: {
    type: Date,
    default: Date.now,
    required: [true, 'Transaction date is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User who created the transaction'
  },
  location: {
    warehouse: { type: String, trim: true },
    section: { type: String, trim: true }
  },
  adjustments: [{
    reason: {
      type: String,
      required: true,
      enum: ['damage', 'expiry', 'theft', 'count_error', 'other']
    },
    quantity: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Adjustment notes cannot exceed 200 characters']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit/loss calculation
transactionSchema.virtual('profitLoss').get(function() {
  if (this.type === 'sale') {
    // This would need product cost price from the product document
    // For now, we'll calculate based on the transaction data
    return this.totalAmount; // Simplified calculation
  }
  return 0;
});

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
  return `${this.type.toUpperCase()}: ${this.quantity} units of product at $${this.unitPrice} each`;
});

// Index for better query performance
transactionSchema.index({ type: 1 });
transactionSchema.index({ product: 1 });
transactionSchema.index({ supplier: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ 'customer.name': 1 });

// Pre-save middleware to calculate total amount
transactionSchema.pre('save', function(next) {
  if (this.quantity && this.unitPrice) {
    this.totalAmount = this.quantity * this.unitPrice;
  }
  next();
});

// Static method to find transactions by date range
transactionSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('product', 'name sku').populate('supplier', 'name');
};

// Static method to find sales transactions
transactionSchema.statics.findSales = function() {
  return this.find({ type: 'sale' })
    .populate('product', 'name sku')
    .sort({ date: -1 });
};

// Static method to find purchase transactions
transactionSchema.statics.findPurchases = function() {
  return this.find({ type: 'purchase' })
    .populate('product', 'name sku')
    .populate('supplier', 'name')
    .sort({ date: -1 });
};

// Static method to find transactions by product
transactionSchema.statics.findByProduct = function(productId) {
  return this.find({ product: productId })
    .populate('supplier', 'name')
    .sort({ date: -1 });
};

// Static method to find transactions by supplier
transactionSchema.statics.findBySupplier = function(supplierId) {
  return this.find({ supplier: supplierId })
    .populate('product', 'name sku')
    .sort({ date: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

// Instance method to validate transaction
transactionSchema.methods.validateTransaction = function() {
  const errors = [];
  
  if (this.type === 'purchase' && !this.supplier) {
    errors.push('Supplier is required for purchase transactions');
  }
  
  if (this.type === 'sale' && !this.customer.name) {
    errors.push('Customer name is required for sale transactions');
  }
  
  if (this.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (this.unitPrice < 0) {
    errors.push('Unit price cannot be negative');
  }
  
  return errors;
};

module.exports = mongoose.model('Transaction', transactionSchema); 