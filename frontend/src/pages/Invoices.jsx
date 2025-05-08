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

const InvoiceRow = ({ invoice }) => {
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
    <>
      <TableRow>
        <TableCell>{invoice.invoice_number}</TableCell>
        <TableCell>{invoice.cust_name}</TableCell>
        <TableCell>{invoice.customer_po}</TableCell>
        <TableCell align="right">${parseFloat(invoice.nrc).toFixed(2)}</TableCell>
        <TableCell align="right">${parseFloat(invoice.mrc).toFixed(2)}</TableCell>
        <TableCell>{formatDate(invoice.date)}</TableCell>
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
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="center">
          <IconButton size="small" color="primary">
            <ViewIcon />
          </IconButton>
          <IconButton size="small" color="primary">
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Invoice Descriptions
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Service Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.descriptions.map((desc, index) => (
                    <TableRow key={index}>
                      <TableCell>{desc.service_type.charAt(0).toUpperCase() + desc.service_type.slice(1)}</TableCell>
                      <TableCell>{desc.service_name}</TableCell>
                      <TableCell align="right">{desc.qty}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: 
                              desc.status === 'paid' ? 'success.main' :
                              desc.status === 'pending' ? 'warning.main' :
                              desc.status === 'overdue' ? 'error.main' :
                              'text.secondary',
                            textTransform: 'capitalize'
                          }}
                        >
                          {desc.status}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    cust_id: '',
    customer_po: '',
    date: new Date().toISOString().split('T')[0],
    descriptions: [{ service_id: '', qty: 1, status: 'pending' }]
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
      // Filter services by customer ID
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

  const handleDescriptionChange = (index, field, value) => {
    const newDescriptions = [...formData.descriptions];
    newDescriptions[index] = {
      ...newDescriptions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      descriptions: newDescriptions
    }));
  };

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      descriptions: [...prev.descriptions, { service_id: '', qty: 1, status: 'pending' }]
    }));
  };

  const removeDescription = (index) => {
    setFormData(prev => ({
      ...prev,
      descriptions: prev.descriptions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format the data to ensure no undefined values
      const formattedData = {
        invoice_number: formData.invoice_number,
        cust_id: parseInt(formData.cust_id),
        customer_po: formData.customer_po,
        date: formData.date,
        descriptions: formData.descriptions.map(desc => ({
          service_id: parseInt(desc.service_id),
          qty: parseInt(desc.qty),
          status: desc.status
        }))
      };

      // Validate that all required fields are present
      if (!formattedData.invoice_number || !formattedData.cust_id || !formattedData.customer_po || !formattedData.date) {
        throw new Error('Please fill in all required fields');
      }

      // Validate that all descriptions have required fields
      if (formattedData.descriptions.some(desc => !desc.service_id || !desc.qty || !desc.status)) {
        throw new Error('Please fill in all required fields in descriptions');
      }

      await axios.post('http://localhost:3000/api/invoices', formattedData);
      setShowForm(false);
      setFormData({
        invoice_number: '',
        cust_id: '',
        customer_po: '',
        date: new Date().toISOString().split('T')[0],
        descriptions: [{ service_id: '', qty: 1, status: 'pending' }]
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create invoice. Please try again.');
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
          onClick={() => setShowForm(!showForm)}
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
            Add New Invoice
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
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Descriptions</Typography>
                  <Button
                    startIcon={<AddCircleIcon />}
                    onClick={addDescription}
                    color="primary"
                  >
                    Add Description
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {formData.descriptions.map((desc, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Service</InputLabel>
                      <Select
                        value={desc.service_id}
                        onChange={(e) => handleDescriptionChange(index, 'service_id', e.target.value)}
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
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={desc.qty}
                      onChange={(e) => handleDescriptionChange(index, 'qty', e.target.value)}
                      required
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={desc.status}
                        onChange={(e) => handleDescriptionChange(index, 'status', e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="overdue">Overdue</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => removeDescription(index)}
                      disabled={formData.descriptions.length === 1}
                    >
                      <RemoveCircleIcon />
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}

              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Create Invoice
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
                  <TableCell align="right">NRC</TableCell>
                  <TableCell align="right">MRC</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Details</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No invoices available
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <InvoiceRow key={invoice.invoice_id} invoice={invoice} />
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