const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'SKU cannot exceed 20 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['Electronics', 'Furniture', 'Stationery', 'Clothing', 'Books', 'Sports', 'Home & Garden', 'Automotive', 'Health & Beauty', 'Other'],
      message: 'Please select a valid category'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Price must be a positive number'
    }
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Cost price must be a positive number'
    }
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Current stock cannot be negative'],
    default: 0
  },
  minStockThreshold: {
    type: Number,
    required: [true, 'Minimum stock threshold is required'],
    min: [0, 'Minimum stock threshold cannot be negative'],
    default: 10
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    weight: { type: Number, min: 0 }
  },
  location: {
    warehouse: { type: String, trim: true },
    shelf: { type: String, trim: true },
    bin: { type: String, trim: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice > 0) {
    return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return this.price * this.currentStock;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'out_of_stock';
  if (this.currentStock <= this.minStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Index for better query performance
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ currentStock: 1 });

// Pre-save middleware to ensure SKU is uppercase
productSchema.pre('save', function(next) {
  if (this.sku) {
    this.sku = this.sku.toUpperCase();
  }
  next();
});

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    $expr: {
      $lte: ['$currentStock', '$minStockThreshold']
    },
    isActive: true
  }).populate('supplier', 'name');
};

// Static method to find out of stock products
productSchema.statics.findOutOfStock = function() {
  return this.find({
    currentStock: 0,
    isActive: true
  }).populate('supplier', 'name');
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, type = 'add') {
  if (type === 'add') {
    this.currentStock += quantity;
  } else if (type === 'subtract') {
    if (this.currentStock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.currentStock -= quantity;
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema); 