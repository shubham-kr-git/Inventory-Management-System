# 🚀 Inventory Management Backend API

Backend API server for the Inventory Management System built with Express.js and MongoDB Atlas.

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- MongoDB Atlas account and cluster

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend folder:

```env
# Database (Replace with your MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://inventory_admin:YOUR_PASSWORD@inventory-management.abc123.mongodb.net/inventory_db?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## 🌐 API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /api` - API information
- `GET /api/test-db` - Database connection test

### Products (Coming Soon)
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Suppliers (Coming Soon)
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get single supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Transactions (Coming Soon)
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get single transaction

### Dashboard (Coming Soon)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/alerts` - Low stock alerts

## 🧪 Testing the Setup

1. **Start the server**: `npm run dev`
2. **Check health**: Visit `http://localhost:5000/health`
3. **Test database**: Visit `http://localhost:5000/api/test-db`
4. **API info**: Visit `http://localhost:5000/api`

Expected responses:
```json
// Health check
{
  "success": true,
  "message": "Server is running!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}

// Database test
{
  "success": true,
  "database": {
    "status": "connected",
    "host": "inventory-management-abc123.mongodb.net",
    "name": "inventory_db"
  }
}
```

## 🔧 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB Atlas connection
│   ├── middleware/
│   │   └── errorHandler.js      # Error handling middleware
│   └── app.js                   # Express app setup
├── server.js                    # Server entry point
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (create this)
├── .gitignore                   # Git ignore file
└── README.md                    # This file
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Data sanitization
- **Environment Variables**: Secure configuration
- **Error Handling**: Graceful error responses

## 📝 Development Scripts

```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start production server
npm test        # Run tests (coming soon)
```

## 🔍 Troubleshooting

### Database Connection Issues
1. **Check MongoDB Atlas**:
   - Cluster is running
   - IP address is whitelisted
   - Username/password are correct

2. **Check environment variables**:
   - `.env` file exists
   - `MONGODB_URI` is correct
   - No extra spaces in connection string

3. **Test connection**:
   ```bash
   curl http://localhost:5000/api/test-db
   ```

### Server Issues
1. **Port already in use**:
   ```bash
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **Module not found**:
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🚧 Coming Next

- [ ] Product management endpoints
- [ ] Supplier management endpoints  
- [ ] Transaction recording endpoints
- [ ] Dashboard statistics endpoints
- [ ] JWT authentication
- [ ] Data validation
- [ ] Unit tests

## 📞 Support

- Check console logs for detailed error messages
- Verify MongoDB Atlas connection string
- Ensure all environment variables are set correctly

---

**Backend API is ready for development!** 🎉 