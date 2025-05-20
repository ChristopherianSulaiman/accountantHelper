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
  Snackbar,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../components/CompanyContext';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Invoices = () => {
  const { company } = useCompany();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!company) return;
    fetchInvoices();
    fetchCustomers();
    fetchAllServices();
  }, [company]);

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
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/invoices?company_id=${company.company_id}`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers?company_id=${company.company_id}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again.');
    }
  };

  const fetchAllServices = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/services?company_id=${company.company_id}`);
      setAllServices(response.data);
    } catch (error) {
      console.error('Error fetching all services:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/invoices/${invoiceToDelete.invoice_id}?company_id=${company.company_id}`);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError('Failed to delete invoice. Please try again.');
    }
  };

  // Filter and prioritize invoices
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredInvoices = invoices.filter(inv => {
    const customerMatch = customerFilter ? String(inv.cust_id) === String(customerFilter) : true;
    const statusMatch = statusFilter ? inv.status === statusFilter : true;
    const searchMatch = normalizedQuery ? inv.invoice_number.toLowerCase().includes(normalizedQuery) : true;
    return customerMatch && statusMatch && searchMatch;
  });
  const prioritizedInvoices = filteredInvoices.sort((a, b) => {
    const aStarts = a.invoice_number.toLowerCase().startsWith(normalizedQuery);
    const bStarts = b.invoice_number.toLowerCase().startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.invoice_number.localeCompare(b.invoice_number);
  });

  if (!company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Please select a company to view invoices.</Typography>
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
        <Typography variant="h4">Invoices</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/invoices/new')}
        >
          New Invoice
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
          onClose={() => setShowError(false)}
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
              onClick={() => setShowError(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Snackbar>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search by invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={customerFilter}
                label="Customer"
                onChange={e => setCustomerFilter(e.target.value)}
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map(c => (
                  <MenuItem key={c.cust_id} value={String(c.cust_id)}>{c.cust_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={e => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {prioritizedInvoices.length === 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography align="center">
                  {searchQuery ? 'No invoices found matching your search' : 'No invoices found'}
                </Typography>
              </CardContent>
            </Card>
          )}
          {prioritizedInvoices.map((invoice) => (
            <Card key={invoice.invoice_id} sx={{ mb: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>Invoice Details</Typography>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{invoice.invoice_number}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Customer</Typography>
                    <Typography variant="subtitle1">{invoice.cust_name}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip
                        label={invoice.status}
                        color={
                          invoice.status === 'paid'
                            ? 'success'
                            : invoice.status === 'pending'
                            ? 'warning'
                            : invoice.status === 'overdue'
                            ? 'error'
                            : 'default'
                        }
                        sx={{ fontWeight: 600, fontSize: '1rem', height: 28, mt: 0.5 }}
                      />
                    </Box>
                    <IconButton size="small" color="primary" onClick={() => navigate(`/invoices/edit/${invoice.invoice_id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => {
                      setInvoiceToDelete(invoice);
                      setDeleteDialogOpen(true);
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
                {/* Services Table */}
                {invoice.services && invoice.services.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Services</Typography>
                    <Table size="small" sx={{ background: '#fafbfc', borderRadius: 1 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Service Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Customer PO</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.services.map((service) => (
                          <TableRow key={service.service_id}>
                            <TableCell>{service.service_name}</TableCell>
                            <TableCell>{service.service_type}</TableCell>
                            <TableCell>{service.qty}</TableCell>
                            <TableCell>{service.customer_po}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

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
    </Box>
  );
};

export default Invoices; 