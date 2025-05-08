import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
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
  Collapse,
  TextField,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

// Customer row component for expandable rows
const CustomerRow = ({ customer }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{customer.cust_name}</TableCell>
        <TableCell>{customer.cust_address}</TableCell>
        <TableCell>
          <IconButton color="primary" size="small">
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Created:</strong> {new Date(customer.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Last Updated:</strong> {new Date(customer.updated_at).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/customers');
      setCustomers(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/customers', {
        cust_name: formData.customer_name,
        cust_address: formData.customer_address
      });
      setShowForm(false);
      setFormData({
        customer_name: '',
        customer_address: ''
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to create customer. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          New Customer
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
            Add New Customer
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Address"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleChange}
                  required
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Create Customer
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Customer Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Customers; 