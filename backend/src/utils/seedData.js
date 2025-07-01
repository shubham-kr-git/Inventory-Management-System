const { Product, Supplier, Transaction, User } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await Transaction.deleteMany({});
    await User.deleteMany({});

    console.log('Cleared existing data');

    // Create sample suppliers
    const suppliers = await Supplier.create([
      {
        name: 'Tech Solutions Inc.',
        contactPerson: 'John Smith',
        email: 'john@techsolutions.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        website: 'https://techsolutions.com',
        paymentTerms: 'Net 30',
        creditLimit: 50000,
        categories: ['Electronics', 'Computers'],
        rating: 4.5,
        leadTime: 7
      },
      {
        name: 'Office Supplies Co.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@officesupplies.com',
        phone: '+1-555-0456',
        address: {
          street: '456 Office Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        website: 'https://officesupplies.com',
        paymentTerms: 'Net 60',
        creditLimit: 25000,
        categories: ['Stationery', 'Furniture'],
        rating: 4.2,
        leadTime: 5
      },
      {
        name: 'Furniture World',
        contactPerson: 'Mike Davis',
        email: 'mike@furnitureworld.com',
        phone: '+1-555-0789',
        address: {
          street: '789 Furniture Blvd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        website: 'https://furnitureworld.com',
        paymentTerms: 'Net 30',
        creditLimit: 75000,
        categories: ['Furniture', 'Home & Garden'],
        rating: 4.8,
        leadTime: 14
      }
    ]);

    console.log(`Created ${suppliers.length} suppliers`);

    // Create sample products
    const products = await Product.create([
      {
        name: 'Wireless Headphones',
        sku: 'WH-001',
        category: 'Electronics',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 149.99,
        costPrice: 89.99,
        currentStock: 25,
        minStockThreshold: 10,
        supplier: suppliers[0]._id,
        imageUrl: 'https://example.com/headphones.jpg',
        tags: ['wireless', 'audio', 'bluetooth'],
        dimensions: {
          length: 20,
          width: 15,
          height: 8,
          weight: 0.3
        },
        location: {
          warehouse: 'Main',
          shelf: 'A1',
          bin: 'B3'
        }
      },
      {
        name: 'Office Chair',
        sku: 'OC-045',
        category: 'Furniture',
        description: 'Ergonomic office chair with adjustable features',
        price: 299.99,
        costPrice: 199.99,
        currentStock: 8,
        minStockThreshold: 5,
        supplier: suppliers[2]._id,
        imageUrl: 'https://example.com/chair.jpg',
        tags: ['ergonomic', 'adjustable', 'office'],
        dimensions: {
          length: 60,
          width: 60,
          height: 120,
          weight: 15
        },
        location: {
          warehouse: 'Main',
          shelf: 'B2',
          bin: 'A1'
        }
      },
      {
        name: 'Notebook Set',
        sku: 'NB-234',
        category: 'Stationery',
        description: 'Premium notebook set with 5 notebooks',
        price: 24.99,
        costPrice: 14.99,
        currentStock: 50,
        minStockThreshold: 15,
        supplier: suppliers[1]._id,
        imageUrl: 'https://example.com/notebooks.jpg',
        tags: ['paper', 'writing', 'premium'],
        dimensions: {
          length: 25,
          width: 18,
          height: 3,
          weight: 0.5
        },
        location: {
          warehouse: 'Main',
          shelf: 'C3',
          bin: 'D2'
        }
      },
      {
        name: 'USB Cable',
        sku: 'UC-567',
        category: 'Electronics',
        description: 'High-speed USB-C cable for charging and data transfer',
        price: 15.99,
        costPrice: 8.99,
        currentStock: 100,
        minStockThreshold: 25,
        supplier: suppliers[0]._id,
        imageUrl: 'https://example.com/usb-cable.jpg',
        tags: ['cable', 'usb', 'charging'],
        dimensions: {
          length: 100,
          width: 0.5,
          height: 0.5,
          weight: 0.1
        },
        location: {
          warehouse: 'Main',
          shelf: 'A2',
          bin: 'C1'
        }
      },
      {
        name: 'Wireless Mouse',
        sku: 'WM-890',
        category: 'Electronics',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 39.99,
        costPrice: 24.99,
        currentStock: 35,
        minStockThreshold: 12,
        supplier: suppliers[0]._id,
        imageUrl: 'https://example.com/mouse.jpg',
        tags: ['wireless', 'ergonomic', 'precision'],
        dimensions: {
          length: 12,
          width: 6,
          height: 4,
          weight: 0.2
        },
        location: {
          warehouse: 'Main',
          shelf: 'A1',
          bin: 'B2'
        }
      }
    ]);

    console.log(`Created ${products.length} products`);

    // Create sample transactions
    const transactions = await Transaction.create([
      {
        type: 'purchase',
        product: products[0]._id,
        quantity: 20,
        unitPrice: 89.99,
        totalAmount: 1799.80,
        reference: 'PO-2024-001',
        supplier: suppliers[0]._id,
        notes: 'Initial stock order',
        status: 'completed',
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        date: new Date('2024-01-10')
      },
      {
        type: 'sale',
        product: products[0]._id,
        quantity: 2,
        unitPrice: 149.99,
        totalAmount: 299.98,
        reference: 'INV-2024-001',
        customer: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+1-555-0123'
        },
        notes: 'Customer purchase',
        status: 'completed',
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        date: new Date('2024-01-15')
      },
      {
        type: 'purchase',
        product: products[1]._id,
        quantity: 10,
        unitPrice: 199.99,
        totalAmount: 1999.90,
        reference: 'PO-2024-002',
        supplier: suppliers[2]._id,
        notes: 'Office furniture order',
        status: 'completed',
        paymentMethod: 'check',
        paymentStatus: 'paid',
        date: new Date('2024-01-12')
      },
      {
        type: 'sale',
        product: products[2]._id,
        quantity: 1,
        unitPrice: 24.99,
        totalAmount: 24.99,
        reference: 'INV-2024-002',
        customer: {
          name: 'Jane Smith',
          email: 'jane.smith@email.com',
          phone: '+1-555-0456'
        },
        notes: 'Retail sale',
        status: 'completed',
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        date: new Date('2024-01-14')
      }
    ]);

    console.log(`Created ${transactions.length} transactions`);

    // Create sample admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@inventory.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      profile: {
        department: 'IT',
        position: 'System Administrator'
      },
      permissions: [
        'products:read', 'products:write', 'products:delete',
        'suppliers:read', 'suppliers:write', 'suppliers:delete',
        'transactions:read', 'transactions:write', 'transactions:delete',
        'reports:read', 'users:read', 'users:write', 'users:delete',
        'settings:read', 'settings:write'
      ]
    });

    console.log(`Created admin user: ${adminUser.username}`);

    console.log('Database seeding completed successfully!');
    console.log(`Summary:`);
    console.log(`- ${suppliers.length} suppliers created`);
    console.log(`- ${products.length} products created`);
    console.log(`- ${transactions.length} transactions created`);
    console.log(`- 1 admin user created`);

    return {
      suppliers,
      products,
      transactions,
      adminUser
    };

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedData; 