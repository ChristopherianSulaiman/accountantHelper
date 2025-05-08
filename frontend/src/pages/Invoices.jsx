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
  Divider,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { format, parse } from 'date-fns';

const InvoiceRow = ({ invoice, onEdit }) => {
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

  return (
    <TableRow>
      <TableCell>{invoice.invoice_number}</TableCell>
      <TableCell>{invoice.cust_name}</TableCell>
      <TableCell>{invoice.customer_po}</TableCell>
      <TableCell>{invoice.service_name}</TableCell>
      <TableCell align="right">{invoice.qty}</TableCell>
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
        <IconButton size="small" color="primary" onClick={onEdit}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" color="error">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    cust_id: '',
    customer_po: '',
    service_id: '',
    qty: 1,
    status: 'pending'
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (formData.cust_id) {
      fetchCustomerServices(formData.cust_id);
    }
  }, [formData.cust_id]);

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

  const fetchCustomerServices = async (custId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/services`);
      const customerServices = response.data.filter(service => service.cust_id === parseInt(custId));
      setServices(customerServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = async (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      cust_id: invoice.cust_id,
      customer_po: invoice.customer_po,
      service_id: invoice.service_id,
      qty: invoice.qty,
      status: invoice.status
    });
    // Fetch services for the customer
    try {
      const response = await axios.get(`http://localhost:3000/api/services`);
      const customerServices = response.data.filter(service => service.cust_id === parseInt(invoice.cust_id));
      setServices(customerServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
    }
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingInvoice(null);
    setFormData({
      invoice_number: '',
      cust_id: '',
      customer_po: '',
      service_id: '',
      qty: 1,
      status: 'pending'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await axios.put(`http://localhost:3000/api/invoices/${editingInvoice.invoice_id}`, formData);
      } else {
        await axios.post('http://localhost:3000/api/invoices', formData);
      }
      handleCancel();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
    }
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
              customer_po: '',
              service_id: '',
              qty: 1,
              status: 'pending'
            });
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'New Invoice'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="cust_id"
                    value={formData.cust_id}
                    onChange={handleInputChange}
                    label="Customer"
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.cust_id} value={customer.cust_id}>
                        {customer.cust_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer PO"
                  name="customer_po"
                  value={formData.customer_po}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Service</InputLabel>
                  <Select
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleInputChange}
                    label="Service"
                  >
                    {services.map((service) => (
                      <MenuItem key={service.service_id} value={service.service_id}>
                        {service.service_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="qty"
                  type="number"
                  value={formData.qty}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
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
                  <TableCell align="right">Quantity</TableCell>
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
                      onEdit={() => handleEdit(invoice)}
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