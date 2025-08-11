const { MongoClient } = require('mongodb');
const DatabaseService = require('./databaseService');

let client;
let dbService;
let isConnected = false;

<<<<<<< HEAD
// Initialize database connection
async function initDB() {
  if (!client && process.env.MONGODB_URI) {
    try {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db(process.env.DB_NAME || 'magicsell');
      dbService = new DatabaseService();
      dbService.client = client;
      dbService.db = db;
      isConnected = true;
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      isConnected = false;
    }
=======
// Global connection cache for serverless
let globalClient = null;
let globalDb = null;

// Initialize database connection with global cache
async function initDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI environment variable is missing');
      return false;
    }

    // Use global cache if available
    if (globalClient && globalDb) {
      client = globalClient;
      dbService = new DatabaseService();
      dbService.client = client;
      dbService.db = globalDb;
      isConnected = true;
      return true;
    }

    // Create new connection if global cache is empty
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 60000,
      maxPoolSize: 1, // Important for serverless
      minPoolSize: 0
    });

    await client.connect();
    const db = client.db(process.env.DB_NAME || 'magicsell');
    
    // Cache globally
    globalClient = client;
    globalDb = db;
    
    dbService = new DatabaseService();
    dbService.client = client;
    dbService.db = db;
    isConnected = true;
    
    console.log('✅ Connected to MongoDB:', db.databaseName);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;
    return false;
>>>>>>> 4f701d2f37654b61bfe35a7b7a0bd4884c14ac08
  }
}

// Health check endpoint
async function handleHealth(req, res) {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: !!process.env.MONGODB_URI,
    hasDbName: !!process.env.DB_NAME,
    mongoConnected: isConnected
  });
}

// Database check endpoint
async function handleDbCheck(req, res) {
  try {
    if (isConnected) {
      const orders = await dbService.getOrders();
      const customers = await dbService.getCustomers();
      res.json({ 
        ok: true, 
        mongoConnected: true,
        ordersCount: orders.length,
        customersCount: customers.length
      });
    } else {
      res.json({ 
        ok: false, 
        mongoConnected: false,
        error: 'MongoDB not connected'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      mongoConnected: isConnected
    });
  }
}

// Orders endpoint
async function handleOrders(req, res) {
  try {
    if (!isConnected) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const orders = await dbService.getOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Customers endpoint
async function handleCustomers(req, res) {
  try {
    if (!isConnected) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const customers = await dbService.getCustomers();
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Analytics endpoint
async function handleAnalytics(req, res) {
  try {
    if (!isConnected) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const orders = await dbService.getOrders();
    const customers = await dbService.getCustomers();
    
    // Calculate basic analytics
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const analytics = {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      averageOrderValue: averageOrderValue.toFixed(2),
      customersCount: customers.length
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Main handler function
export default async function handler(req, res) {
  // Initialize database connection
  await initDB();
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://www.magicsell.io' 
    : 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get the path from the request
  const path = (req.url?.split('?')[0] || '').replace(/^\/api\/?/, '');
  
  try {
    switch (path) {
      case '':
      case 'health':
        return await handleHealth(req, res);
      
      case 'db-check':
        return await handleDbCheck(req, res);
      
      case 'orders':
        return await handleOrders(req, res);
      
      case 'customers':
        return await handleCustomers(req, res);
      
      case 'analytics':
        return await handleAnalytics(req, res);
      
      default:
        return res.status(404).json({ 
          ok: false, 
          error: 'Endpoint not found',
          availableEndpoints: ['health', 'db-check', 'orders', 'customers', 'analytics']
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Internal server error',
      message: error.message
    });
  }
} 