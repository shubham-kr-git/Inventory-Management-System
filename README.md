# Inventory Management System

A comprehensive full-stack inventory management application designed for businesses to efficiently track products, manage suppliers, monitor stock levels, and receive AI-powered reorder suggestions.

## Overview

This inventory management system provides a complete solution for businesses to:
- Track product inventory in real-time
- Manage supplier relationships and contacts
- Monitor stock levels with automated alerts
- Generate reports and analytics
- Receive AI-powered reorder recommendations
- Record and track all inventory transactions

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and enhanced development experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Icons** - Icon library for UI elements

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - MongoDB object modeling library
- **Google GenAI** - AI integration for intelligent reorder suggestions

### Additional Tools
- **Railway** - Cloud deployment platform
- **CORS** - Cross-origin resource sharing middleware

## Features

### Dashboard
- Real-time inventory statistics
- Low stock alerts and notifications
- Recent transaction history
- Quick action buttons for common tasks
- AI-powered reorder suggestions with clickable actions

### Product Management
- Add, edit, and delete products
- Comprehensive product information (SKU, category, pricing, stock levels)
- Stock adjustment functionality with transaction tracking
- Automatic opening balance transactions for new products
- Product search and filtering capabilities
- Stock status indicators (in stock, low stock, out of stock)

### Supplier Management
- Complete supplier database with contact information
- Address management and payment terms
- Credit limit tracking and utilization monitoring
- Supplier rating system
- Category-based supplier organization
- Lead time tracking

### Stock Management
- Real-time stock level monitoring
- Manual stock adjustments with audit trail
- Multiple adjustment types (add, subtract, set)
- Transaction history for all stock movements
- Minimum stock threshold alerts
- AI-recommended reorder quantities

### AI-Powered Features
- Intelligent reorder suggestions based on historical data
- Demand pattern analysis
- Automated stock level optimization
- Performance caching for faster AI responses

### Reports and Analytics
- Inventory valuation reports
- Stock movement history
- Supplier performance metrics
- Low stock and out-of-stock reports

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- MongoDB (local installation or cloud instance)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory_management
NODE_ENV=development
GEMINI_API_KEY=your_google_genai_api_key_here
```

4. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the project root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Database Seeding (Optional)

To populate the database with sample data:

```bash
cd backend
node seedDatabase.js
```

This will create sample products, suppliers, and transactions for testing purposes.

## Configuration

### MongoDB Setup
- **Local MongoDB**: Ensure MongoDB is running on your system
- **MongoDB Atlas**: Use a cloud MongoDB instance by updating the `MONGODB_URI` in your environment variables

### Google GenAI Setup
1. Obtain an API key from Google AI Studio
2. Add the key to your backend `.env` file as `GEMINI_API_KEY`
3. The AI features will be enabled automatically with a valid API key

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
GEMINI_API_KEY=your_google_genai_api_key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Usage Guide

### Getting Started

1. **Initial Setup**: After installation, access the application at `http://localhost:3000`
2. **Add Suppliers**: Start by adding suppliers through the Suppliers page
3. **Add Products**: Create products and associate them with suppliers
4. **Stock Management**: Use the stock adjustment features to maintain accurate inventory levels

### Managing Products

#### Adding a New Product
1. Navigate to the Products page
2. Click "Add Product" button
3. Fill in the required information:
   - Product name and SKU
   - Category selection
   - Pricing (cost price and selling price)
   - Initial stock quantity (must be greater than 0)
   - Minimum stock threshold
   - Supplier selection
4. Submit the form to create the product and automatic opening balance transaction

#### Adjusting Stock Levels
1. Find the product in the Products table
2. Click the stock adjustment button
3. Choose adjustment type:
   - **Add to Stock**: Increase inventory levels
   - **Subtract from Stock**: Decrease inventory levels
   - **Set Stock Level**: Set exact quantity
4. Enter the quantity and submit

### Managing Suppliers

#### Adding a Supplier
1. Go to the Suppliers page
2. Click "Add Supplier"
3. Complete the supplier information:
   - Company name and contact person
   - Email and phone number
   - Complete address information
   - Business terms (payment terms, credit limit)
   - Rating and lead time
   - Applicable categories

### Using AI Reorder Suggestions

1. **Access Suggestions**: View AI recommendations on the dashboard
2. **Review Recommendations**: Each suggestion shows:
   - Product name and current stock
   - Recommended reorder quantity
   - Reasoning based on historical data
3. **Take Action**: Click on product names to automatically:
   - Navigate to the Products page
   - Open the stock adjustment modal
   - Pre-fill with recommended quantities
4. **Customize**: Adjust recommended quantities if needed before confirming

### Reports and Analytics

#### Dashboard Metrics
- Total products in inventory
- Current inventory valuation
- Low stock alerts count
- Recent transaction summary

#### Stock Reports
- View products by stock status
- Identify items requiring attention
- Monitor inventory turnover

## API Documentation

### Products Endpoints
- `GET /api/products` - Retrieve all products with pagination
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update product information
- `DELETE /api/products/:id` - Delete a product
- `POST /api/products/:id/stock` - Adjust product stock levels
- `GET /api/products/reorder-suggestions` - Get AI-powered reorder suggestions

### Suppliers Endpoints
- `GET /api/suppliers` - Retrieve all suppliers
- `POST /api/suppliers` - Create a new supplier
- `PUT /api/suppliers/:id` - Update supplier information
- `DELETE /api/suppliers/:id` - Delete a supplier

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-transactions` - Get recent transactions

## Deployment

### Railway Deployment

1. **Backend Deployment**:
   - Connect your repository to Railway
   - Set environment variables in Railway dashboard
   - Deploy the backend service

2. **Frontend Deployment**:
   - Update `NEXT_PUBLIC_API_URL` to point to your deployed backend
   - Deploy the frontend to your preferred platform (Vercel, Netlify, etc.)

### Production Considerations

- Use a production MongoDB instance (MongoDB Atlas recommended)
- Enable MongoDB authentication and SSL
- Set up proper CORS origins for production domains
- Configure rate limiting and request validation
- Set up monitoring and logging
- Enable HTTPS for all connections

## Development

### Project Structure
```
inventory-management/
├── app/                    # Next.js app directory
│   ├── products/          # Products page
│   ├── suppliers/         # Suppliers page
│   ├── transactions/      # Transactions page
│   ├── reports/          # Reports page
│   └── settings/         # Settings page
├── components/           # Reusable React components
│   ├── dashboard/       # Dashboard-specific components
│   ├── Header.tsx       # Main header component
│   └── Sidebar.tsx      # Navigation sidebar
├── backend/             # Express.js backend
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/     # Mongoose models
│   │   ├── routes/     # API routes
│   │   └── middleware/ # Custom middleware
│   └── server.js       # Server entry point
├── lib/                # Utility libraries
└── public/            # Static assets
```

### Running Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Mongoose schema validation
- Input sanitization and validation

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure database permissions are correct

2. **AI Features Not Working**
   - Verify Google GenAI API key is valid
   - Check API quota and billing status
   - Review server logs for AI-related errors

3. **Frontend Not Loading**
   - Ensure backend server is running
   - Check API URL configuration
   - Verify CORS settings

4. **Stock Adjustments Failing**
   - Check product exists and is active
   - Verify sufficient stock for subtraction operations
   - Review transaction history for conflicts

### Performance Optimization

- AI suggestions are cached for 1 hour to improve response times
- Database queries use proper indexing
- Frontend implements lazy loading for large datasets
- API responses include pagination for better performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper testing
4. Submit a pull request with detailed description

## Support

For technical support or feature requests:
- Review the troubleshooting section
- Check existing GitHub issues
- Create a new issue with detailed information about your problem

## License

This project is licensed under the MIT License. See the LICENSE file for details.