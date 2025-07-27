const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Data storage functions
const dataFile = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      return {
        orders: data.orders || [],
        customers: data.customers || []
      };
    }
  } catch (error) {
    console.log('Error loading data:', error.message);
  }
  
  // Default data if file doesn't exist
  return {
    orders: [
      {
        id: 1,
        basketNo: "B001",
        deliveryNo: "D001",
        postalCode: "BH15 1AA",
        address: "123 High Street",
        city: "Poole",
        customer: "John Smith",
        location: "Poole, UK"
      }
    ],
    customers: [
      {
        id: 1,
        name: "John Smith",
        shopName: "Smith Electronics",
        phone: "+44 123 456 7890",
        address: "123 High Street",
        postcode: "BH15 1AA"
      },
      {
        id: 2,
        name: "Mike Wilson",
        shopName: "Wilson Tech",
        phone: "+44 987 654 3210",
        address: "456 Main Road",
        postcode: "BH1 1AA"
      }
    ]
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error saving data:', error.message);
  }
}

// Load initial data
let { orders, customers } = loadData();

// Postcode to coordinates function
async function getPostcodeCoordinates(postcode) {
  // Mock coordinates for testing
  const mockCoordinates = {
    'BH13 7EX': { lat: 50.7128, lng: -1.9876 }, // Poole Depot
    'BH2 5SE': { lat: 50.7200, lng: -1.8800 },  // Bournemouth
    'S014 7FN': { lat: 50.9000, lng: -1.4000 }, // Southampton
    'BH23 3TQ': { lat: 50.7300, lng: -1.7800 }, // Christchurch
    'BH22 9HT': { lat: 50.8000, lng: -1.9000 }, // Ferndown
    'W1W 7LT': { lat: 51.5200, lng: -0.1400 }   // London
  };
  
  if (mockCoordinates[postcode]) {
    return mockCoordinates[postcode];
  }
  
  // Fallback to API if not in mock data
  try {
    const response = await axios.get(`https://api.postcodes.io/postcodes/${postcode}`);
    if (response.data.result) {
      return {
        lat: response.data.result.latitude,
        lng: response.data.result.longitude
      };
    }
  } catch (error) {
    console.log(`Error getting coordinates for ${postcode}:`, error.message);
  }
  return null;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Mock data storage
// let orders = [
//   {
//     id: 1,
//     basketNo: "B001",
//     deliveryNo: "D001",
//     postalCode: "BH15 1AA",
//     address: "123 High Street",
//     city: "Poole",
//     customer: "John Smith",
//     location: "Poole, UK"
//   }
// ];

// let customers = [
//   {
//     id: 1,
//     name: "John Smith",
//     shopName: "Smith Electronics",
//     email: "john@smith.com",
//     phone: "+44 123 456 7890",
//     address: "123 High Street",
//     city: "Poole",
//     postalCode: "BH15 1AA"
//   },
//   {
//     id: 2,
//     name: "Mike Wilson",
//     shopName: "Wilson Tech",
//     email: "mike@wilson.com",
//     phone: "+44 987 654 3210",
//     address: "456 Main Road",
//     city: "Bournemouth",
//     postalCode: "BH1 1AA"
//   }
// ];

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MagicSell Backend API' });
});

// Orders API
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    ...req.body,
    basketNo: orders.length + 1, // Simple sequential number
    deliveryNo: `D${String(orders.length + 1).padStart(3, '0')}`
  };
  orders.push(newOrder);
  saveData({ orders, customers }); // Save data after each operation
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const orderIndex = orders.findIndex(order => order.id === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  orders[orderIndex] = { ...orders[orderIndex], ...req.body };
  saveData({ orders, customers }); // Save data after each operation
  res.json(orders[orderIndex]);
});

app.delete('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const orderIndex = orders.findIndex(order => order.id === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  const deletedOrder = orders.splice(orderIndex, 1)[0];
  saveData({ orders, customers }); // Save data after each operation
  res.json({ message: 'Order deleted successfully', order: deletedOrder });
});

// Route optimization API
app.post('/api/optimize-route', async (req, res) => {
  try {
    const { startPostcode = "BH13 7EX" } = req.body; // Default start point - Poole Depot
    
    console.log('Route optimization started');
    console.log('Orders:', JSON.stringify(orders, null, 2));
    console.log('Orders length:', orders.length);
    
    // Get start coordinates
    const startCoords = await getPostcodeCoordinates(startPostcode);
    if (!startCoords) {
      return res.status(400).json({ message: 'Invalid start postcode' });
    }
    
    console.log('Start coordinates:', startCoords);
    
    // Calculate distances for all orders
    const ordersWithDistance = [];
    for (const order of orders) {
      console.log('Processing order:', order.id);
      console.log('Order object:', JSON.stringify(order, null, 2));
      console.log('Order customerPostcode:', order.customerPostcode);
      
      if (!order.customerPostcode) {
        console.log('WARNING: customerPostcode is undefined for order', order.id);
        continue;
      }
      
      const orderCoords = await getPostcodeCoordinates(order.customerPostcode);
      if (orderCoords) {
        const distance = calculateDistance(
          startCoords.lat, startCoords.lng,
          orderCoords.lat, orderCoords.lng
        );
        console.log('Order', order.id, 'Distance:', distance);
        ordersWithDistance.push({
          ...order,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          coordinates: orderCoords
        });
      } else {
        console.log('No coordinates found for order', order.id);
      }
    }
    
    console.log('Orders with distance:', ordersWithDistance);
    
    // Sort by distance (nearest first)
    const optimizedRoute = ordersWithDistance.sort((a, b) => a.distance - b.distance);
    
    console.log('Optimized route:', optimizedRoute);
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      const current = optimizedRoute[i];
      const next = optimizedRoute[i + 1];
      totalDistance += calculateDistance(
        current.coordinates.lat, current.coordinates.lng,
        next.coordinates.lat, next.coordinates.lng
      );
    }
    
    console.log('Total distance:', totalDistance);
    
    res.json({
      route: optimizedRoute,
      totalDistance: Math.round(totalDistance * 10) / 10,
      startPoint: startPostcode
    });
    
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ message: 'Error optimizing route' });
  }
});

// Customers API
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const newCustomer = {
    id: customers.length + 1,
    ...req.body
  };
  customers.push(newCustomer);
  saveData({ orders, customers }); // Save data after each operation
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customerIndex = customers.findIndex(customer => customer.id === id);
  
  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  customers[customerIndex] = { ...customers[customerIndex], ...req.body };
  saveData({ orders, customers }); // Save data after each operation
  res.json(customers[customerIndex]);
});

app.delete('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customerIndex = customers.findIndex(customer => customer.id === id);
  
  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  const deletedCustomer = customers.splice(customerIndex, 1)[0];
  saveData({ orders, customers }); // Save data after each operation
  res.json({ message: 'Customer deleted successfully', customer: deletedCustomer });
});

// Route planning endpoint (for map functionality)
app.post('/api/plan-route', (req, res) => {
  const { startPoint, endPoint, waypoints } = req.body;
  
  const mockRoute = {
    distance: '15.2 km',
    duration: '25 min',
    path: [
      { lat: startPoint.lat, lng: startPoint.lng },
      ...waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
      { lat: endPoint.lat, lng: endPoint.lng }
    ]
  };
  
  res.json(mockRoute);
});

// Print route endpoint
app.post('/api/print-route', async (req, res) => {
  try {
    const { startPostcode = "BH13 7EX" } = req.body;
    
    // Get optimized route
    const startCoords = await getPostcodeCoordinates(startPostcode);
    if (!startCoords) {
      return res.status(400).json({ message: 'Invalid start postcode' });
    }
    
    const ordersWithDistance = [];
    for (const order of orders) {
      if (!order.customerPostcode) continue;
      
      const orderCoords = await getPostcodeCoordinates(order.customerPostcode);
      if (orderCoords) {
        const distance = calculateDistance(
          startCoords.lat, startCoords.lng,
          orderCoords.lat, orderCoords.lng
        );
        ordersWithDistance.push({
          ...order,
          distance: Math.round(distance * 10) / 10,
          coordinates: orderCoords
        });
      }
    }
    
    const optimizedRoute = ordersWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Create PDF
    const doc = new PDFDocument();
    const filename = `route-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // PDF Content - Header
    doc.fontSize(24).text('MagicSell - Delivery Route', { align: 'center' });
    doc.moveDown(0.5);
    
    // Header info
    doc.fontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
    doc.text(`Start Point: ${startPostcode} (Poole Depot)`, { align: 'left' });
    doc.text(`Total Orders: ${optimizedRoute.length}`, { align: 'left' });
    doc.moveDown();
    
    // Route table with better spacing
    doc.fontSize(16).text('Optimized Delivery Route:', { underline: true });
    doc.moveDown();
    
    let yPosition = doc.y;
    const startX = 30;
    const colWidths = [40, 80, 120, 80, 60, 60]; // No, Basket, Customer, Address, Postcode, Distance, Price
    
    // Headers
    doc.fontSize(10);
    doc.text('No.', startX, yPosition);
    doc.text('Basket', startX + colWidths[0], yPosition);
    doc.text('Customer', startX + colWidths[0] + colWidths[1], yPosition);
    doc.text('Address', startX + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
    doc.text('Postcode', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPosition);
    doc.text('Distance', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], yPosition);
    doc.text('Price', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], yPosition);
    
    yPosition += 20;
    
    // Route items
    optimizedRoute.forEach((order, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fontSize(10);
      doc.text(`${index + 1}`, startX, yPosition);
      doc.text(order.basketNo || `B${order.id}`, startX + colWidths[0], yPosition);
      doc.text(order.customerName, startX + colWidths[0] + colWidths[1], yPosition);
      doc.text(order.customerAddress, startX + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
      doc.text(order.customerPostcode, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPosition);
      doc.text(`${order.distance} km`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], yPosition);
      doc.text(`£${order.totalAmount || '0'}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], yPosition);
      
      yPosition += 25; // More spacing between rows
    });
    
    // Summary page
    doc.addPage();
    doc.fontSize(20).text('Route Summary', { align: 'center' });
    doc.moveDown();
    
    const totalDistance = optimizedRoute.reduce((sum, order, index) => {
      if (index === 0) return order.distance;
      return sum + calculateDistance(
        optimizedRoute[index - 1].coordinates.lat,
        optimizedRoute[index - 1].coordinates.lng,
        order.coordinates.lat,
        order.coordinates.lng
      );
    }, 0);
    
    const totalRevenue = optimizedRoute.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount || 0);
    }, 0);
    
    // Summary box
    doc.fontSize(14);
    doc.text('Route Statistics:', 60, doc.y + 20);
    doc.fontSize(12);
    doc.text(`• Total Distance: ${Math.round(totalDistance * 10) / 10} km`, 70, doc.y + 40);
    doc.text(`• Estimated Time: ${Math.round(totalDistance * 2)} minutes`, 70, doc.y + 55);
    doc.text(`• Total Orders: ${optimizedRoute.length}`, 70, doc.y + 70);
    doc.text(`• Total Revenue: £${totalRevenue.toFixed(2)}`, 70, doc.y + 85);
    doc.text(`• Average Order Value: £${(totalRevenue / optimizedRoute.length).toFixed(2)}`, 70, doc.y + 100);
    
    doc.moveDown(2);
    
    // Delivery notes
    doc.fontSize(14).text('Delivery Notes:', { underline: true });
    doc.fontSize(10);
    doc.text('• Start from Poole Depot (BH13 7EX)');
    doc.text('• Follow the optimized route order for efficiency');
    doc.text('• Collect payments at each delivery point');
    doc.text('• Update order status after each delivery');
    
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('order-updated', (data) => {
    socket.broadcast.emit('order-changed', data);
  });
  
  socket.on('customer-updated', (data) => {
    socket.broadcast.emit('customer-changed', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`MagicSell Server running on port ${PORT}`);
}); 