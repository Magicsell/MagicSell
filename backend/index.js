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
    orders: [],
    customers: []
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
    basketNo: orders.length + 1,
    deliveryNo: `D${String(orders.length + 1).padStart(3, '0')}`,
    status: 'Pending',
    deliveryNotes: '',
    deliveredAt: null
  };
  orders.push(newOrder);
  saveData({ orders, customers });
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const orderIndex = orders.findIndex(order => order.id === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  // Update order with new fields
  const updatedOrder = { 
    ...orders[orderIndex], 
    ...req.body,
    // Add delivery notes and delivered time if status is Delivered
    ...(req.body.status === 'Delivered' && {
      deliveryNotes: req.body.deliveryNotes || '',
      deliveredAt: req.body.deliveredAt || new Date().toISOString()
    })
  };
  
  orders[orderIndex] = updatedOrder;
  saveData({ orders, customers });
  res.json(updatedOrder);
});

app.delete('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const orderIndex = orders.findIndex(order => order.id === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  orders.splice(orderIndex, 1);
  saveData({ orders, customers });
  res.json({ message: 'Order deleted' });
});

// Mapbox Route Optimization API
app.post('/api/optimize-route', async (req, res) => {
  try {
    const { startPostcode = "BH13 7EX" } = req.body;
    
    console.log('Mapbox route optimization started');
    console.log('Orders:', orders.length);
    
    // Get Mapbox token from environment
    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || 'pk.eyJ1IjoibWFnaWNzZWxsIiwiYSI6ImNtZGxoeWVlcjA1aTkybHIwaGRsb2VjbnUifQ.NWaZFfNKBs0C3IC0BtRtww';
    
    if (!MAPBOX_TOKEN) {
      return res.json({
        route: orders,
        totalDistance: 0,
        startPoint: startPostcode,
        message: 'Mapbox token required for full optimization'
      });
    }
    
    // Geocode all postcodes to get coordinates
    const ordersWithCoordinates = [];
    let totalDistance = 0;
    
    for (const order of orders) {
      if (!order.customerPostcode) {
        console.log(`Order ${order.id} (Basket ${order.basketNo}) skipped - no postcode`);
        continue;
      }
      
      try {
        console.log(`Geocoding order ${order.id} (Basket ${order.basketNo}) with postcode: ${order.customerPostcode}`);
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(order.customerPostcode)}.json?access_token=${MAPBOX_TOKEN}&country=GB`;
        const response = await axios.get(geocodingUrl);
        
        if (response.data.features && response.data.features.length > 0) {
          const [lng, lat] = response.data.features[0].center;
          console.log(`Order ${order.id} (Basket ${order.basketNo}) geocoded successfully: [${lng}, ${lat}]`);
          ordersWithCoordinates.push({
            ...order,
            coordinates: { lng, lat }
          });
        } else {
          console.log(`Order ${order.id} (Basket ${order.basketNo}) - no geocoding results for postcode: ${order.customerPostcode}`);
          ordersWithCoordinates.push({
            ...order,
            coordinates: null
          });
        }
      } catch (err) {
        console.error('Geocoding error for order:', order.id, err);
        ordersWithCoordinates.push({
          ...order,
          coordinates: null
        });
      }
    }
    
    // Simple distance calculation (Haversine formula) for now
    const depotCoords = { lng: -1.9876, lat: 50.7128 }; // Poole Depot
    
    ordersWithCoordinates.forEach(order => {
      if (order.coordinates) {
        const distance = calculateHaversineDistance(
          depotCoords.lat, depotCoords.lng,
          order.coordinates.lat, order.coordinates.lng
        );
        order.distance = distance;
        totalDistance += distance;
      }
    });
    
    // Advanced nearest neighbor algorithm with depot as starting point
    const optimizedRoute = [];
    const unvisited = [...ordersWithCoordinates.filter(order => order.coordinates)];
    
    // Start from depot
    let currentLocation = depotCoords;
    
    while (unvisited.length > 0) {
      // Find nearest unvisited order
      let nearestIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const distance = calculateHaversineDistance(
          currentLocation.lat, currentLocation.lng,
          unvisited[i].coordinates.lat, unvisited[i].coordinates.lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      // Add nearest order to route
      const nearestOrder = unvisited[nearestIndex];
      nearestOrder.routeDistance = minDistance;
      optimizedRoute.push(nearestOrder);
      
      // Update current location and remove visited order
      currentLocation = nearestOrder.coordinates;
      unvisited.splice(nearestIndex, 1);
    }
    
    // Add orders without coordinates at the end
    const ordersWithoutCoordinates = ordersWithCoordinates.filter(order => !order.coordinates);
    optimizedRoute.push(...ordersWithoutCoordinates);
    
    // Calculate total route distance
    const totalRouteDistance = optimizedRoute.reduce((sum, order) => {
      return sum + (order.routeDistance || 0);
    }, 0);
    
    res.json({
      route: optimizedRoute,
      totalDistance: Math.round(totalRouteDistance * 100) / 100,
      startPoint: startPostcode,
      message: 'Route optimized successfully with nearest neighbor algorithm'
    });
    
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ message: 'Error optimizing route' });
  }
});

// Haversine distance calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
  saveData({ orders, customers });
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customerIndex = customers.findIndex(customer => customer.id === id);
  
  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  customers[customerIndex] = { ...customers[customerIndex], ...req.body };
  saveData({ orders, customers });
  res.json(customers[customerIndex]);
});

app.delete('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customerIndex = customers.findIndex(customer => customer.id === id);
  
  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  
  customers.splice(customerIndex, 1);
  saveData({ orders, customers });
  res.json({ message: 'Customer deleted' });
});

// Print route endpoint
app.post('/api/print-route', async (req, res) => {
  try {
    const { startPostcode = "BH13 7EX" } = req.body;

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
    doc.text(`Total Orders: ${orders.length}`, { align: 'left' });
    doc.moveDown();

    // Route table
    doc.fontSize(16).text('Delivery Route:', { underline: true });
    doc.moveDown();

    let yPosition = doc.y;
    const startX = 30;
    const colWidths = [40, 80, 120, 80, 60, 60];

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
    orders.forEach((order, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.rect(startX - 5, yPosition - 5, 500, 20);

      doc.fontSize(10);
      doc.text(`${index + 1}`, startX, yPosition);
      doc.text(order.basketNo || `B${order.id}`, startX + colWidths[0], yPosition);
      doc.text(order.customerName, startX + colWidths[0] + colWidths[1], yPosition);
      doc.text(order.customerAddress, startX + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
      doc.text(order.customerPostcode, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPosition);
      doc.text('TBD km', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], yPosition);
      doc.text(`£${order.totalAmount || '0'}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], yPosition);

      yPosition += 25;
    });

    // Summary page
    doc.addPage();
    doc.fontSize(20).text('Route Summary', { align: 'center' });
    doc.moveDown();

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount || 0);
    }, 0);

    // Summary box
    doc.rect(50, doc.y, 500, 120);
    doc.fontSize(14);
    doc.text('Route Statistics:', 60, doc.y + 20);
    doc.fontSize(12);
    doc.text(`• Total Distance: TBD km`, 70, doc.y + 40);
    doc.text(`• Estimated Time: TBD minutes`, 70, doc.y + 55);
    doc.text(`• Total Orders: ${orders.length}`, 70, doc.y + 70);
    doc.text(`• Total Revenue: £${totalRevenue.toFixed(2)}`, 70, doc.y + 85);
    doc.text(`• Average Order Value: £${(totalRevenue / orders.length).toFixed(2)}`, 70, doc.y + 100);

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
  
  // Send initial data to client
  socket.emit('data-update', { orders, customers });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast data updates to all connected clients
function broadcastUpdate() {
  io.emit('data-update', { orders, customers });
}

// Update broadcast function after data changes
const originalSaveData = saveData;
saveData = function(data) {
  originalSaveData(data);
  broadcastUpdate();
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://10.228.172.50:${PORT}`);
}); 