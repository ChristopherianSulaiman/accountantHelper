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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { useCompany } from '../components/CompanyContext';

// Customer row component for expandable rows
const CustomerRow = ({ customer, onEdit, onDelete }) => {
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
          <IconButton color="primary" size="small" onClick={() => onEdit(customer)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small" onClick={() => onDelete(customer)}>
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
  const { company } = useCompany();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: ''
  });

  useEffect(() => {
    if (!company) return;
    fetchCustomers();
  }, [company]);

  const fetchCustomers = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/customers?company_id=${company.company_id}`);
      setCustomers(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    try {
      if (editingCustomer) {
        // Update existing customer
        await axios.put(`http://localhost:3000/api/customers/${editingCustomer.cust_id}`, {
          cust_name: formData.customer_name,
          cust_address: formData.customer_address,
          company_id: company.company_id
        });
      } else {
        // Create new customer
        await axios.post('http://localhost:3000/api/customers', {
          cust_name: formData.customer_name,
          cust_address: formData.customer_address,
          company_id: company.company_id
        });
      }
      setShowForm(false);
      setFormData({
        customer_name: '',
        customer_address: ''
      });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      setError('Failed to ' + (editingCustomer ? 'update' : 'create') + ' customer. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.cust_name,
      customer_address: customer.cust_address
    });
    setShowForm(true);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`http://localhost:3000/api/customers/${customerToDelete.cust_id}`);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer. Please try again.');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      customer_address: ''
    });
  };

  if (!company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Please select a company to view customers.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 900, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingCustomer(null);
              setFormData({
                customer_name: '',
                customer_address: ''
              });
              setShowForm(!showForm);
            }}
            sx={{ minWidth: 180, fontSize: '1.1rem', py: 1 }}
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
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
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
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Customer</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete {customerToDelete?.cust_name}? This will also delete all related services. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Card sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
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
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No customers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <CustomerRow 
                      key={customer.cust_id} 
                      customer={customer}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
};

export default Customers; 