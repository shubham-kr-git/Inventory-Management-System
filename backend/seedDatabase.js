const mongoose = require('mongoose');
const seedData = require('./src/utils/seedData');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB successfully!');
    
    // Clear existing data
    console.log('Clearing existing data...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`Dropped collection: ${collection.name}`);
    }
    
    // Seed the database
    console.log('Seeding database with sample data...');
    await seedData();
    
    console.log('Database seeded successfully!');
    console.log('\nSample data created:');
    console.log('- 5 Suppliers');
    console.log('- 15 Products');
    console.log('- 20 Transactions');
    console.log('- 1 Admin User');
    
    console.log('\nYou can now test the API endpoints:');
    console.log('- GET http://localhost:5000/api/dashboard');
    console.log('- GET http://localhost:5000/api/products');
    console.log('- GET http://localhost:5000/api/suppliers');
    console.log('- GET http://localhost:5000/api/transactions');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 