const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://magicsell.vercel.app', 'https://magicsell-git-main.vercel.app']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Data storage functions
const dataFile = path.join(__dirname, '../data.json');

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
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const updatedOrder = { ...orders[orderIndex], ...req.body };
  
  // Handle delivery status update
  if (req.body.status === 'Delivered' && !updatedOrder.deliveredAt) {
    updatedOrder.deliveredAt = new Date().toISOString();
  }
  
  orders[orderIndex] = updatedOrder;
  saveData({ orders, customers });
  res.json(updatedOrder);
});

app.delete('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const orderIndex = orders.findIndex(order => order.id === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  orders.splice(orderIndex, 1);
  saveData({ orders, customers });
  res.status(204).send();
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
  saveData({ orders, customers });
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customerIndex = customers.findIndex(customer => customer.id === id);
  
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  customers[customerIndex] = { ...customers[customerIndex], ...req.body };
  saveData({ orders, customers });
  res.json(customers[customerIndex]);
});

app.delete('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customerIndex = customers.findIndex(customer => customer.id === id);
  
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  customers.splice(customerIndex, 1);
  saveData({ orders, customers });
  res.status(204).send();
});

// Route optimization
app.post('/api/optimize-route', async (req, res) => {
  try {
    const pendingOrders = orders.filter(order => order.status === 'Pending');
    
    if (pendingOrders.length === 0) {
      return res.json({ optimizedRoute: [], message: 'No pending orders to optimize' });
    }

    // Depot coordinates (Bournemouth)
    const depotLat = 50.7192;
    const depotLng = -1.8808;

    // Geocode addresses and calculate distances
    const ordersWithCoordinates = [];
    
    for (const order of pendingOrders) {
      try {
        const postcode = order.customerPostcode;
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?access_token=${process.env.MAPBOX_TOKEN || 'pk.eyJ1IjoibWFnaWNzZWxsIiwiYSI6ImNtZGxoeWVlcjA1aTkybHIwaGRsb2VjbnUifQ.NWaZFfNKBs0C3IC0BtRtww'}&country=GB`;
        
        console.log(`Geocoding postcode: ${postcode}`);
        const response = await axios.get(geocodeUrl);
        
        if (response.data.features && response.data.features.length > 0) {
          const [lng, lat] = response.data.features[0].center;
          const distance = calculateHaversineDistance(depotLat, depotLng, lat, lng);
          
          ordersWithCoordinates.push({
            ...order,
            coordinates: { lat, lng },
            distance
          });
          
          console.log(`Order ${order.basketNo}: ${postcode} -> ${lat}, ${lng} (${distance.toFixed(2)}km)`);
        } else {
          console.log(`No coordinates found for postcode: ${postcode}`);
        }
      } catch (error) {
        console.log(`Error geocoding ${order.customerPostcode}:`, error.message);
      }
    }

    if (ordersWithCoordinates.length === 0) {
      return res.json({ optimizedRoute: [], message: 'Could not geocode any addresses' });
    }

    // Nearest Neighbor algorithm
    const optimizedRoute = [];
    const unvisited = [...ordersWithCoordinates];
    let currentLat = depotLat;
    let currentLng = depotLng;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const distance = calculateHaversineDistance(
          currentLat, currentLng,
          unvisited[i].coordinates.lat, unvisited[i].coordinates.lng
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nextOrder = unvisited[nearestIndex];
      optimizedRoute.push(nextOrder);
      
      currentLat = nextOrder.coordinates.lat;
      currentLng = nextOrder.coordinates.lng;
      unvisited.splice(nearestIndex, 1);
    }

    console.log('Optimized route:', optimizedRoute.map(o => o.basketNo));
    res.json({ optimizedRoute, message: 'Route optimized successfully' });

  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: 'Route optimization failed' });
  }
});

// PDF generation
app.post('/api/print-route', async (req, res) => {
  try {
    const { optimizedRoute } = req.body;
    
    if (!optimizedRoute || optimizedRoute.length === 0) {
      return res.status(400).json({ error: 'No route data provided' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=delivery-route.pdf');
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('MagicSell Delivery Route', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Route details
    doc.fontSize(16).text('Optimized Delivery Sequence:', { underline: true });
    doc.moveDown();

    let totalDistance = 0;
    let totalValue = 0;

    optimizedRoute.forEach((order, index) => {
      const orderNumber = index + 1;
      const distance = order.distance || 0;
      const value = parseFloat(order.totalAmount) || 0;
      
      totalDistance += distance;
      totalValue += value;

      doc.fontSize(14).text(`Stop ${orderNumber}: Basket ${order.basketNo}`, { underline: true });
      doc.fontSize(12).text(`Customer: ${order.customerName}`);
      doc.fontSize(12).text(`Address: ${order.customerAddress}`);
      doc.fontSize(12).text(`Postcode: ${order.customerPostcode}`);
      doc.fontSize(12).text(`Phone: ${order.customerPhone}`);
      doc.fontSize(12).text(`Order Value: £${value.toFixed(2)}`);
      doc.fontSize(12).text(`Distance from Depot: ${distance.toFixed(2)} km`);
      doc.moveDown();
    });

    // Summary
    doc.moveDown();
    doc.fontSize(16).text('Route Summary:', { underline: true });
    doc.fontSize(12).text(`Total Stops: ${optimizedRoute.length}`);
    doc.fontSize(12).text(`Total Distance: ${totalDistance.toFixed(2)} km`);
    doc.fontSize(12).text(`Total Order Value: £${totalValue.toFixed(2)}`);
    doc.fontSize(12).text(`Average Distance per Stop: ${(totalDistance / optimizedRoute.length).toFixed(2)} km`);

    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF generation failed' });
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

// Export for Vercel
module.exports = app; 