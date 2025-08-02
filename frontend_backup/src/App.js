import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Autocomplete
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [orderForm, setOrderForm] = useState({
    basketNo: '1',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerPostcode: '',
    totalAmount: '',
    status: 'Pending'
  });
  const [customerForm, setCustomerForm] = useState({
    name: '',
    shopName: '',
    phone: '',
    address: '',
    postcode: ''
  });
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('order-updated', () => {
      fetchOrders();
    });

    newSocket.on('customer-updated', () => {
      fetchCustomers();
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  // Fix aria-hidden accessibility issues
  useEffect(() => {
    const fixAriaHidden = () => {
      // Remove aria-hidden from root element
      const root = document.getElementById('root');
      if (root && root.getAttribute('aria-hidden') === 'true') {
        root.removeAttribute('aria-hidden');
      }

      // Remove aria-hidden from dialog elements when they have focus
      const dialogs = document.querySelectorAll('.MuiDialog-root');
      dialogs.forEach(dialog => {
        if (dialog.querySelector(':focus') || dialog.matches(':focus-within')) {
          dialog.removeAttribute('aria-hidden');
          dialog.querySelectorAll('[aria-hidden="true"]').forEach(el => {
            el.removeAttribute('aria-hidden');
          });
        }
      });
    };

    // Run immediately
    fixAriaHidden();

    // Set up observer to monitor DOM changes
    const observer = new MutationObserver(fixAriaHidden);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
      subtree: true
    });

    // Set up focus event listeners
    document.addEventListener('focusin', fixAriaHidden);
    document.addEventListener('focus', fixAriaHidden);

    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', fixAriaHidden);
      document.removeEventListener('focus', fixAriaHidden);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingOrder 
        ? `/api/orders/${editingOrder.id}` 
        : '/api/orders';
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      });

      if (response.ok) {
        setNotification({
          open: true,
          message: editingOrder ? 'Order updated successfully!' : 'Order added successfully!',
          severity: 'success'
        });
        handleOrderDialogClose();
        fetchOrders();
      } else {
        throw new Error('Failed to save order');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setNotification({
        open: true,
        message: 'Error saving order!',
        severity: 'error'
      });
    }
  };

  const handleOrderEdit = (order) => {
    setEditingOrder(order);
    setOrderForm({
      basketNo: order.basketNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      customerPostcode: order.customerPostcode,
      totalAmount: order.totalAmount,
      status: order.status
    });
    setOrderDialogOpen(true);
  };

  const handleOrderDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setNotification({
            open: true,
            message: 'Order deleted successfully!',
            severity: 'success'
          });
          fetchOrders();
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        setNotification({
          open: true,
          message: 'Error deleting order!',
          severity: 'error'
        });
      }
    }
  };

  const handleOrderDialogClose = () => {
    setOrderDialogOpen(false);
    setEditingOrder(null);
    setOrderForm({
      basketNo: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerPostcode: '',
      totalAmount: '',
      status: 'Pending'
    });
  };

  const handleOrderDialogOpen = () => {
    // Generate simple basket number
    const basketNo = orders.length + 1;
    setOrderForm(prev => ({ ...prev, basketNo }));
    setOrderDialogOpen(true);
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCustomer 
        ? `/api/customers/${editingCustomer.id}` 
        : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });

      if (response.ok) {
        setNotification({
          open: true,
          message: editingCustomer ? 'Customer updated successfully!' : 'Customer added successfully!',
          severity: 'success'
        });
        handleCustomerDialogClose();
        fetchCustomers();
      } else {
        throw new Error('Failed to save customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      setNotification({
        open: true,
        message: 'Error saving customer!',
        severity: 'error'
      });
    }
  };

  const handleCustomerEdit = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      shopName: customer.shopName,
      phone: customer.phone,
      address: customer.address,
      postcode: customer.postcode
    });
    setCustomerDialogOpen(true);
  };

  const handleCustomerDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setNotification({
            open: true,
            message: 'Customer deleted successfully!',
            severity: 'success'
          });
          fetchCustomers();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        setNotification({
          open: true,
          message: 'Error deleting customer!',
          severity: 'error'
        });
      }
    }
  };

  const handleCustomerSelect = (customer) => {
    setOrderForm(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerPostcode: customer.postcode
    }));
  };

  const handleCustomerDialogClose = () => {
    setCustomerDialogOpen(false);
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      shopName: '',
      phone: '',
      address: '',
      postcode: ''
    });
  };

  const optimizeRoute = async () => {
    try {
      console.log('Starting route optimization...');
      
      const response = await fetch('/api/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startPostcode: "BH13 7EX" })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Backend response:', result);
        
        // Safely merge distance information with existing orders
        if (result.route && result.route.length > 0) {
          const updatedOrders = orders.map(order => {
            const optimizedOrder = result.route.find(optOrder => optOrder.id === order.id);
            if (optimizedOrder && optimizedOrder.distance) {
              return { ...order, distance: optimizedOrder.distance };
            }
            return order;
          });
          
          // Sort by distance if available
          const sortedOrders = updatedOrders.sort((a, b) => {
            if (a.distance && b.distance) {
              return a.distance - b.distance;
            }
            return 0;
          });
          
          setOrders(sortedOrders);
          setNotification({
            open: true,
            message: `Route optimized! Total distance: ${result.totalDistance} km`,
            severity: 'success'
          });
        } else {
          console.error('No route data received from backend');
          console.error('Result object:', result);
          setNotification({
            open: true,
            message: 'No route data received from backend',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      setNotification({
        open: true,
        message: 'Error optimizing route!',
        severity: 'error'
      });
    }
  };

  const printRoute = async () => {
    try {
      console.log('Generating route PDF...');
      
      const response = await fetch('/api/print-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startPostcode: "BH13 7EX" })
      });
      
      if (response.ok) {
        // Create blob from response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `route-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setNotification({
          open: true,
          message: 'Route PDF downloaded successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification({
        open: true,
        message: 'Error generating PDF!',
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className="App">
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ color: 'white', mb: 3 }}>
            MagicSell
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip 
              label={isConnected ? "Connected" : "Disconnected"} 
              color={isConnected ? "success" : "error"}
              variant="outlined"
            />
          </Box>

          <Paper sx={{ p: 3, borderRadius: 3, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
              <Tab label="Orders" />
              <Tab label="Customers" />
              <Tab label="Route" />
              <Tab label="Analytics" />
            </Tabs>

            {/* Orders Tab */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5">Orders</Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleOrderDialogOpen}
                    sx={{ 
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': { background: 'linear-gradient(45deg, #5a6fd8 0%, #6a4190 100%)' }
                    }}
                  >
                    Add New Order
                  </Button>
                </Box>
                
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Basket No</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Postcode</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                                      {orders.map((order) => (
                  <TableRow key={`order-${order.basketNo}-${order.id}`}>
                          <TableCell>{order.basketNo}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.customerPhone}</TableCell>
                          <TableCell>{order.customerAddress}</TableCell>
                          <TableCell>{order.customerPostcode}</TableCell>
                          <TableCell>£{order.totalAmount}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              color={order.status === 'Delivered' ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleOrderEdit(order)} size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleOrderDelete(order.id)} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Customers Tab */}
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5">Customers</Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => setCustomerDialogOpen(true)}
                    sx={{ 
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': { background: 'linear-gradient(45deg, #5a6fd8 0%, #6a4190 100%)' }
                    }}
                  >
                    Add Customer
                  </Button>
                </Box>
                
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Shop Name</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Postal Code</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                                      {customers.map((customer) => (
                  <TableRow key={`customer-${customer.id}-${customer.name}`} sx={{ cursor: 'pointer' }} onClick={() => handleCustomerSelect(customer)}>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.shopName}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.address}</TableCell>
                          <TableCell>{customer.postcode}</TableCell>
                          <TableCell>
                            <IconButton onClick={(e) => { e.stopPropagation(); handleCustomerEdit(customer); }} size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={(e) => { e.stopPropagation(); handleCustomerDelete(customer.id); }} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Route Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h5" gutterBottom>Route Optimization</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Optimize delivery route based on postcode proximity to depot (2 Newton Road, BH13 7EX Poole)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={optimizeRoute}
                    disabled={orders.length === 0}
                    sx={{ 
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': { background: 'linear-gradient(45deg, #5a6fd8 0%, #6a4190 100%)' }
                    }}
                  >
                    Optimize Route
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={printRoute}
                    disabled={orders.length === 0}
                    sx={{ 
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      '&:hover': {
                        borderColor: '#45a049',
                        backgroundColor: '#f0f8f0'
                      }
                    }}
                  >
                    Print Route
                  </Button>
                </Box>
                
                {orders.length > 0 && (
                  <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Postcode</TableCell>
                          <TableCell>Distance from Depot</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.map((order, index) => (
                          <TableRow key={`route-${order.basketNo}-${order.id}-${index}`}>
                            <TableCell>{order.basketNo}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.customerPostcode}</TableCell>
                            <TableCell>{order.distance ? `${order.distance.toFixed(2)} km` : 'Calculating...'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Analytics Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h5" gutterBottom>Analytics</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">{orders.length}</Typography>
                      <Typography variant="body1">Total Orders</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">{customers.length}</Typography>
                      <Typography variant="body1">Total Customers</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        £{orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body1">Total Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {orders.filter(order => order.status === 'Pending').length}
                      </Typography>
                      <Typography variant="body1">Pending Orders</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Order Dialog */}
        <Dialog open={orderDialogOpen} onClose={handleOrderDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingOrder ? 'Edit Order' : 'Add New Order'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Basket No"
                  value={orderForm.basketNo}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  fullWidth
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={customers.find(c => c.name === orderForm.customerName) || null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setOrderForm({
                        ...orderForm,
                        customerName: newValue.name,
                        customerPhone: newValue.phone,
                        customerAddress: newValue.address,
                        customerPostcode: newValue.postalCode || newValue.postcode
                      });
                    } else {
                      setOrderForm({
                        ...orderForm,
                        customerName: '',
                        customerPhone: '',
                        customerAddress: '',
                        customerPostcode: ''
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer Name *"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Customer Phone"
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Customer Address"
                  value={orderForm.customerAddress}
                  onChange={(e) => setOrderForm({...orderForm, customerAddress: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Customer Postcode"
                  value={orderForm.customerPostcode}
                  onChange={(e) => setOrderForm({...orderForm, customerPostcode: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  type="number"
                  value={orderForm.totalAmount}
                  onChange={(e) => setOrderForm({...orderForm, totalAmount: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({...orderForm, status: e.target.value})}
                    label="Status"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleOrderDialogClose}>Cancel</Button>
            <Button onClick={handleOrderSubmit} variant="contained">
              {editingOrder ? 'Update' : 'Add'} Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* Customer Dialog */}
        <Dialog open={customerDialogOpen} onClose={handleCustomerDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Shop Name"
                  value={customerForm.shopName}
                  onChange={(e) => setCustomerForm({...customerForm, shopName: e.target.value})}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Postcode"
                  value={customerForm.postcode}
                  onChange={(e) => setCustomerForm({...customerForm, postcode: e.target.value})}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCustomerDialogClose}>Cancel</Button>
            <Button onClick={handleCustomerSubmit} variant="contained">
              {editingCustomer ? 'Update' : 'Add'} Customer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({...notification, open: false})}
        >
          <Alert 
            onClose={() => setNotification({...notification, open: false})} 
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}

export default App;
