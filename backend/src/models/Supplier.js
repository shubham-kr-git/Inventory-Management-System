const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [50, 'Contact person name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
      maxlength: [10, 'ZIP code cannot exceed 10 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [50, 'Country name cannot exceed 50 characters']
    }
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid HTTP/HTTPS URL'
    }
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: [20, 'Tax ID cannot exceed 20 characters']
  },
  paymentTerms: {
    type: String,
    enum: ['Net 30', 'Net 60', 'Net 90', 'Immediate', 'Other'],
    default: 'Net 30'
  },
  creditLimit: {
    type: Number,
    min: [0, 'Credit limit cannot be negative'],
    default: 0
  },
  currentBalance: {
    type: Number,
    min: [0, 'Current balance cannot be negative'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  categories: [{
    type: String,
    trim: true,
    enum: ['Electronics', 'Furniture', 'Stationery', 'Clothing', 'Books', 'Sports', 'Home & Garden', 'Automotive', 'Health & Beauty', 'Other']
  }],
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 3
  },
  leadTime: {
    type: Number,
    min: [0, 'Lead time cannot be negative'],
    default: 7,
    description: 'Average lead time in days'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for available credit
supplierSchema.virtual('availableCredit').get(function() {
  return Math.max(0, this.creditLimit - this.currentBalance);
});

// Virtual for credit utilization percentage
supplierSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return ((this.currentBalance / this.creditLimit) * 100).toFixed(2);
});

// Index for better query performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ categories: 1 });

// Pre-save middleware to ensure email is lowercase
supplierSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Static method to find active suppliers
supplierSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find suppliers by category
supplierSchema.statics.findByCategory = function(category) {
  return this.find({
    categories: category,
    isActive: true
  }).sort({ name: 1 });
};

// Static method to find suppliers with low credit
supplierSchema.statics.findLowCredit = function(threshold = 0.8) {
  return this.find({
    $expr: {
      $gte: [
        { $divide: ['$currentBalance', '$creditLimit'] },
        threshold
      ]
    },
    isActive: true
  });
};

// Instance method to update balance
supplierSchema.methods.updateBalance = function(amount, type = 'add') {
  if (type === 'add') {
    this.currentBalance += amount;
  } else if (type === 'subtract') {
    this.currentBalance = Math.max(0, this.currentBalance - amount);
  }
  return this.save();
};

// Instance method to check if credit limit exceeded
supplierSchema.methods.isCreditLimitExceeded = function(amount = 0) {
  return (this.currentBalance + amount) > this.creditLimit;
};

module.exports = mongoose.model('Supplier', supplierSchema); 