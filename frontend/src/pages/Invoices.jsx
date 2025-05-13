import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, parse } from 'date-fns';

const InvoiceRow = ({ invoice, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  const formatDate = (dateString) => {
    try {
      const dateOnly = dateString.split('T')[0];
      return format(parse(dateOnly, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleEdit = () => {
    console.log('Invoice data in row:', invoice); // Debug log
    onEdit(invoice);
  };

  return (
    <TableRow>
      <TableCell>{invoice.invoice_number}</TableCell>
      <TableCell>{invoice.cust_name}</TableCell>
      <TableCell>{invoice.customer_po}</TableCell>
      <TableCell>
        {invoice.services && invoice.services.length > 0
          ? invoice.services.map(s => (
              <div key={s.service_id}>
                {s.service_name} (Qty: {s.qty}, PO: {s.customer_po || '-'})
              </div>
            ))
          : '-'}
      </TableCell>
      <TableCell align="right">
        {invoice.services && invoice.services.length > 0
          ? invoice.services.map(s => s.qty).join(', ')
          : '-'}
      </TableCell>
      <TableCell>
        <Typography
          sx={{
            color: 
              invoice.status === 'paid' ? 'success.main' :
              invoice.status === 'pending' ? 'warning.main' :
              invoice.status === 'overdue' ? 'error.main' :
              'text.secondary',
            textTransform: 'capitalize'
          }}
        >
          {invoice.status}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <IconButton size="small" color="primary" onClick={handleEdit}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    cust_id: '',
    services: [], // Array of {service_id, qty, customer_po}
    status: 'pending'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchAllServices();
  }, []);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setTimeout(() => setError(''), 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again.');
    }
  };

  const fetchAllServices = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/services');
      setAllServices(response.data);
    } catch (error) {
      console.error('Error fetching all services:', error);
    }
  };

  // Filter services for selected customer
  useEffect(() => {
    if (formData.cust_id) {
      const filtered = allServices.filter(service => 
        String(service.cust_id).trim() === String(formData.cust_id).trim()
      );
      console.log('Filtering services for customer:', formData.cust_id, filtered);
      setServices(filtered);
      // Do not set service_id here
    } else {
      setServices([]);
      setFormData(prev => {
        if (prev.services.length > 0) {
          return { ...prev, services: [] };
        }
        return prev;
      });
    }
  }, [formData.cust_id, allServices]);

  // New effect: set service_id after services are filtered and available
  useEffect(() => {
    if (editingInvoice && services.length > 0) {
      // Only set if not already set and the service exists in the filtered list
      const exists = services.some(s => String(s.service_id) === String(editingInvoice.service_id));
      setFormData(prev => {
        if (exists && prev.services.length === 0) {
          return { ...prev, services: [{ service_id: editingInvoice.service_id, qty: editingInvoice.qty || 1, customer_po: editingInvoice.customer_po || '' }] };
        }
        return prev;
      });
    }
  }, [editingInvoice, services]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle multi-select service change
  const handleServiceChange = (event) => {
    const value = event.target.value;
    // Keep existing qty and customer_po for already selected services, default to 1 and empty for new
    setFormData(prev => ({
      ...prev,
      services: value.map(service_id => {
        const existing = prev.services.find(s => s.service_id === service_id);
        return existing ? existing : { service_id, qty: 1, customer_po: '' };
      })
    }));
  };

  // Handle quantity change for a service
  const handleServiceQtyChange = (service_id, qty) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s =>
        s.service_id === service_id ? { ...s, qty: qty < 1 ? 1 : qty } : s
      )
    }));
  };

  // Handle PO number change for a service
  const handleServicePOChange = (service_id, customer_po) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s =>
        s.service_id === service_id ? { ...s, customer_po } : s
      )
    }));
  };

  const handleEdit = async (invoice) => {
    try {
      console.log('Editing invoice:', invoice); // Debug log

      // Fetch all customers and services
      const [customersResponse, servicesResponse] = await Promise.all([
        axios.get('http://localhost:3000/api/customers'),
        axios.get('http://localhost:3000/api/services')
      ]);

      // Find the customer ID based on the customer name
      const customer = customersResponse.data.find(c => c.cust_name === invoice.cust_name);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Filter services for this customer
      const customerServices = servicesResponse.data.filter(service => 
        service.cust_id === customer.cust_id
      );
      console.log('Filtered services for customer:', customerServices);
      setServices(customerServices);

      // Find the service ID based on the service name
      const service = customerServices.find(s => s.service_name === invoice.service_name);
      // Don't throw if not found, just set to ''
      // if (!service) {
      //   throw new Error('Service not found');
      // }

      // Set the editing invoice
      setEditingInvoice(invoice);

      // Set pending form data, to be set after services are loaded
      setPendingFormData({
        invoice_number: invoice.invoice_number || '',
        cust_id: customer.cust_id.toString(),
        services: invoice.services || [],
        status: invoice.status || 'pending'
      });

      // Show the form after all data is set
      setShowForm(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      setError('Failed to load invoice data. Please try again.');
    }
  };

  // When services or pendingFormData changes, set formData if pendingFormData exists
  useEffect(() => {
    if (pendingFormData && services.length > 0) {
      // Only set service_id if it exists in the new services list, else set to ''
      const validServices = services.filter(s => pendingFormData.services.some(ps => ps.service_id === s.service_id));
      setFormData({
        ...pendingFormData,
        services: validServices.map(s => ({
          service_id: s.service_id,
          qty: pendingFormData.services.find(ps => ps.service_id === s.service_id)?.qty || 1,
          customer_po: pendingFormData.services.find(ps => ps.service_id === s.service_id)?.customer_po || ''
        }))
      });
      setPendingFormData(null);
    }
  }, [services, pendingFormData]);

  const handleCancel = () => {
    setShowForm(false);
    setEditingInvoice(null);
    setFormData({
      invoice_number: '',
      cust_id: '',
      services: [],
      status: 'pending'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload for backend
      const payload = {
        invoice_number: formData.invoice_number,
        cust_id: formData.cust_id,
        status: formData.status,
        services: formData.services.map(s => ({ service_id: s.service_id, qty: s.qty, customer_po: s.customer_po }))
      };
      if (editingInvoice) {
        // TODO: Update logic for editing multi-service invoices
        // For now, just show error
        setError('Editing multi-service invoices is not yet implemented.');
        return;
      } else {
        await axios.post('http://localhost:3000/api/invoices', payload);
      }
      setShowForm(false);
      setEditingInvoice(null);
      setFormData({
        invoice_number: '',
        cust_id: '',
        services: [],
        status: 'pending'
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError(`Failed to ${editingInvoice ? 'update' : 'create'} invoice. Please try again.`);
      }
    }
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/invoices/${invoiceToDelete.invoice_id}`);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError('Failed to delete invoice. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handleCloseError = () => {
    setShowError(false);
    setTimeout(() => setError(''), 300);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Invoices</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingInvoice(null);
            setFormData({
              invoice_number: '',
              cust_id: '',
              services: [],
              status: 'pending'
            });
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'New Invoice'}
        </Button>
      </Box>

      <Snackbar
        open={showError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={handleCloseError}
          sx={{
            width: '100%',
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500
            },
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseError}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Snackbar>

      {showForm && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth required>
                  <InputLabel id="customer-label">Customer</InputLabel>
                  <Select
                    labelId="customer-label"
                    name="cust_id"
                    value={formData.cust_id}
                    onChange={handleInputChange}
                    label="Customer"
                    sx={{ minWidth: '300px' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                          width: 'auto',
                          minWidth: '300px'
                        }
                      }
                    }}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.cust_id} value={customer.cust_id}>
                        {customer.cust_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth required disabled={!formData.cust_id}>
                  <InputLabel id="service-label">Service(s)</InputLabel>
                  <Select
                    labelId="service-label"
                    multiple
                    name="services"
                    value={formData.services.map(s => s.service_id)}
                    onChange={handleServiceChange}
                    label="Service(s)"
                    sx={{ minWidth: '300px' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                          width: 'auto',
                          minWidth: '300px'
                        }
                      }
                    }}
                  >
                    {services.map((service) => (
                      <MenuItem key={service.service_id} value={service.service_id}>
                        {service.service_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* Per-service quantity and PO inputs */}
              {formData.services.map((s, idx) => {
                const service = services.find(serv => serv.service_id === s.service_id);
                return (
                  <Grid item xs={12} md={12} key={s.service_id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ minWidth: 120 }}>
                        {service ? service.service_name : 'Service'}
                      </Typography>
                      <TextField
                        label="Quantity"
                        type="number"
                        value={s.qty}
                        onChange={e => handleServiceQtyChange(s.service_id, parseInt(e.target.value, 10))}
                        inputProps={{ min: 1 }}
                        sx={{ width: 120 }}
                        required
                      />
                      <TextField
                        label="PO Number"
                        value={s.customer_po || ''}
                        onChange={e => handleServicePOChange(s.service_id, e.target.value)}
                        sx={{ width: 180 }}
                        required
                      />
                    </Box>
                  </Grid>
                );
              })}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                  sx={{ ml: 2 }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice {invoiceToDelete?.invoice_number}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Customer PO</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No invoices available
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <InvoiceRow 
                      key={invoice.invoice_id} 
                      invoice={invoice} 
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Invoices; 