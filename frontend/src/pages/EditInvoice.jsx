import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EditInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]); // array of service_id
  const [serviceDetails, setServiceDetails] = useState({}); // { service_id: { qty, customer_po } }
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [invoiceLoaded, setInvoiceLoaded] = useState(false);

  useEffect(() => {
    // Fetch customers
    fetch('http://localhost:3000/api/customers')
      .then(res => res.json())
      .then(setCustomers);
  }, []);

  // Fetch invoice data on mount
  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/invoices/${id}`);
        if (!res.ok) throw new Error('Invoice not found');
        const data = await res.json();
        console.log('Fetched invoice data:', data); // Debug log
        setInvoiceNumber(data.invoice_number);
        setSelectedCustomer(data.cust_id);
        setStatus(data.status);
        setSelectedServiceIds(data.services.map(s => s.service_id));
        // Build serviceDetails
        const details = {};
        data.services.forEach(s => {
          details[s.service_id] = { qty: s.qty, customer_po: s.customer_po };
        });
        console.log('Setting service details:', details); // Debug log
        setServiceDetails(details);
        setInvoiceLoaded(true);
      } catch (err) {
        setError('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);

  // Fetch services for selected customer
  useEffect(() => {
    if (selectedCustomer) {
      setServicesLoaded(false);
      fetch('http://localhost:3000/api/services')
        .then(res => res.json())
        .then(data => {
          console.log('Fetched services for customer:', data); // Debug log
          setServices(data.filter(s => String(s.cust_id) === String(selectedCustomer)));
          setServicesLoaded(true);
        });
    } else {
      setServices([]);
      setServicesLoaded(true);
    }
  }, [selectedCustomer]);

  // When services change, remove details for unselected services (but do not clear on customer change)
  useEffect(() => {
    console.log('Selected service IDs changed:', selectedServiceIds); // Debug log
    console.log('Current service details:', serviceDetails); // Debug log
    setServiceDetails(prev => {
      const newDetails = { ...prev };
      // Only remove details for services that are no longer selected
      Object.keys(newDetails).forEach(id => {
        if (!selectedServiceIds.includes(Number(id))) {
          delete newDetails[id];
        }
      });
      console.log('Updated service details:', newDetails); // Debug log
      return newDetails;
    });
  }, [selectedServiceIds]);

  // After both invoice and services are loaded, ensure all fields are pre-filled with invoice values
  useEffect(() => {
    if (invoiceLoaded && servicesLoaded) {
      console.log('Invoice and services loaded, current service details:', serviceDetails); // Debug log
      setServiceDetails(prevDetails => {
        const newDetails = { ...prevDetails };
        selectedServiceIds.forEach(id => {
          // If already set from invoice fetch, keep it
          if (newDetails[id] && newDetails[id].qty && newDetails[id].customer_po) {
            console.log('Keeping existing details for service:', id, newDetails[id]); // Debug log
            return;
          }
          // Try to find from services (which may have been set from invoice fetch)
          const invoiceService = services.find(s => s.service_id === id);
          if (invoiceService) {
            console.log('Found service details from services:', id, invoiceService); // Debug log
            newDetails[id] = { 
              qty: invoiceService.qty || newDetails[id]?.qty || '', 
              customer_po: invoiceService.customer_po || newDetails[id]?.customer_po || '' 
            };
          } else {
            console.log('No details found for service:', id); // Debug log
            newDetails[id] = { 
              qty: newDetails[id]?.qty || '', 
              customer_po: newDetails[id]?.customer_po || '' 
            };
          }
        });
        console.log('Final service details:', newDetails); // Debug log
        return newDetails;
      });
    }
  }, [invoiceLoaded, servicesLoaded, selectedServiceIds, services]);

  const handleServiceSelect = (event) => {
    const value = event.target.value;
    setSelectedServiceIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleServiceDetailChange = (service_id, field, value) => {
    setServiceDetails(prev => ({
      ...prev,
      [service_id]: {
        ...prev[service_id],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!invoiceNumber || !selectedCustomer || selectedServiceIds.length === 0) {
      setError('Please fill all required fields and select at least one service.');
      return;
    }
    // Validate each selected service
    for (const service_id of selectedServiceIds) {
      const details = serviceDetails[service_id] || {};
      if (!details.qty || !details.customer_po) {
        setError('Each selected service must have a quantity and customer PO.');
        return;
      }
    }
    try {
      const response = await fetch(`http://localhost:3000/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          cust_id: selectedCustomer,
          status,
          services: selectedServiceIds.map(service_id => ({
            service_id,
            qty: serviceDetails[service_id].qty,
            customer_po: serviceDetails[service_id].customer_po
          }))
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update invoice');
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/invoices');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update invoice. Please try again.');
    }
  };

  if (loading || !servicesLoaded || !invoiceLoaded) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Edit Invoice</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
        >
          Back to Invoices
        </Button>
      </Box>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  required
                  placeholder="e.g., INV-001"
                  helperText="Up to 8 characters, alphanumeric with hyphens"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={selectedCustomer}
                    label="Customer"
                    onChange={e => {
                      const newCustomerId = e.target.value;
                      // Only reset services if this is a new customer selection
                      if (newCustomerId !== selectedCustomer) {
                        setSelectedCustomer(newCustomerId);
                        // Don't reset service details when editing an existing invoice
                        if (!id) {
                          setSelectedServiceIds([]);
                          setServiceDetails({});
                        }
                      }
                    }}
                  >
                    <MenuItem value="">Select Customer</MenuItem>
                    {customers.map(c => (
                      <MenuItem key={c.cust_id} value={c.cust_id}>{c.cust_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={e => setStatus(e.target.value)}
                  >
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ mr: 2 }}>Services</Typography>
                  <FormControl sx={{ minWidth: 300 }}>
                    <InputLabel>Select Services</InputLabel>
                    <Select
                      multiple
                      value={selectedServiceIds}
                      onChange={handleServiceSelect}
                      input={<OutlinedInput label="Select Services" />}
                      renderValue={selected =>
                        services
                          .filter(s => selected.includes(s.service_id))
                          .map(s => s.service_name)
                          .join(', ')
                      }
                    >
                      {services.map(s => (
                        <MenuItem key={s.service_id} value={s.service_id}>
                          <Checkbox checked={selectedServiceIds.includes(s.service_id)} />
                          <ListItemText primary={s.service_name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              {selectedServiceIds.map(service_id => (
                <Grid item xs={12} key={service_id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <Typography><strong>Service:</strong> {services.find(s => s.service_id === service_id)?.service_name}</Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={serviceDetails[service_id]?.qty || ''}
                            onChange={e => handleServiceDetailChange(service_id, 'qty', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Customer PO"
                            value={serviceDetails[service_id]?.customer_po || ''}
                            onChange={e => handleServiceDetailChange(service_id, 'customer_po', e.target.value)}
                            required
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Update Invoice
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Invoice updated successfully!
        </Alert>
      </Snackbar>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Box>
  );
};

export default EditInvoice; 