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
  Collapse,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useCompany } from '../components/CompanyContext';

// Customer row component for expandable rows
const CustomerRow = ({ customer, onEdit, onDelete }) => {
  return (
    <TableRow sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight="medium">{customer.cust_name}</Typography>
        </Box>
      </TableCell>
      <TableCell>{customer.cust_address}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {customer.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2">{customer.email}</Typography>
            </Box>
          )}
          {customer.phone_number && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">{customer.phone_number}</Typography>
            </Box>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <IconButton color="primary" size="small" onClick={() => onEdit(customer)}>
          <EditIcon />
        </IconButton>
        <IconButton color="error" size="small" onClick={() => onDelete(customer)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
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
    customer_address: '',
    email: '',
    phone_number: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!company) return;
    fetchCustomers();
  }, [company]);

  const fetchCustomers = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers?company_id=${company.company_id}`);
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
        await axios.put(`${API_BASE_URL}/api/customers/${editingCustomer.cust_id}`, {
          cust_name: formData.customer_name,
          cust_address: formData.customer_address,
          email: formData.email,
          phone_number: formData.phone_number,
          company_id: company.company_id
        });
      } else {
        // Create new customer
        await axios.post(`${API_BASE_URL}/api/customers`, {
          cust_name: formData.customer_name,
          cust_address: formData.customer_address,
          email: formData.email,
          phone_number: formData.phone_number,
          company_id: company.company_id
        });
      }
      setShowForm(false);
      setFormData({
        customer_name: '',
        customer_address: '',
        email: '',
        phone_number: ''
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
      customer_address: customer.cust_address,
      email: customer.email || '',
      phone_number: customer.phone_number || ''
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
      await axios.delete(`${API_BASE_URL}/api/customers/${customerToDelete.cust_id}`);
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
      customer_address: '',
      email: '',
      phone_number: ''
    });
  };

  const filteredCustomers = customers.filter(customer => 
    customer.cust_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.cust_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Please select a company to view customers.</Typography>
      </Box>
    );
  }

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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ color: 'primary.main' }} />
          Customers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingCustomer(null);
            setFormData({
              customer_name: '',
              customer_address: '',
              email: '',
              phone_number: ''
            });
            setShowForm(!showForm);
          }}
          sx={{ borderRadius: '8px' }}
        >
          New Customer
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <TextField
              placeholder="Search customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Card sx={{ p: 3, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingCustomer ? <EditIcon /> : <AddIcon />}
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
          <Divider sx={{ mb: 2 }} />
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    sx={{ borderRadius: '8px' }}
                  >
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    sx={{ borderRadius: '8px' }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: '8px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          Delete Customer
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {customerToDelete?.cust_name}? This will also delete all related services. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" sx={{ borderRadius: '8px' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0} sx={{ minWidth: 600 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">No customers found</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default Customers; 