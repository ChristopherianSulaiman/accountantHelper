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
  Tooltip,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

const steps = ['Basic Information', 'Select Services', 'Review & Submit'];

const NewInvoice = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [serviceDetails, setServiceDetails] = useState({});
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('pending');
  const [activeStep, setActiveStep] = useState(0);
  const [invoiceNumberError, setInvoiceNumberError] = useState('');

  useEffect(() => {
    // Fetch customers
    fetch('http://localhost:3000/api/customers')
      .then(res => res.json())
      .then(setCustomers);
  }, []);

  useEffect(() => {
    // Fetch services for selected customer
    if (selectedCustomer) {
      fetch('http://localhost:3000/api/services')
        .then(res => res.json())
        .then(data => setServices(data.filter(s => String(s.cust_id) === String(selectedCustomer))));
    } else {
      setServices([]);
    }
  }, [selectedCustomer]);

  // When services change, remove details for unselected services
  useEffect(() => {
    setServiceDetails(prev => {
      const newDetails = { ...prev };
      Object.keys(newDetails).forEach(id => {
        if (!selectedServiceIds.includes(id)) delete newDetails[id];
      });
      return newDetails;
    });
  }, [selectedServiceIds]);

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

  const validateInvoiceNumber = (value) => {
    if (!value || value.length > 15) {
      setInvoiceNumberError('Invoice number must be between 1 and 15 characters.');
      return false;
    } else {
      setInvoiceNumberError('');
      return true;
    }
  };

  const handleInvoiceNumberChange = (e) => {
    setInvoiceNumber(e.target.value);
    validateInvoiceNumber(e.target.value);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!invoiceNumber || !selectedCustomer) {
        setError('Please fill in all required fields before proceeding.');
        return;
      }
      if (!validateInvoiceNumber(invoiceNumber)) {
        setError('Please enter a valid invoice number.');
        return;
      }
    } else if (activeStep === 1) {
      if (selectedServiceIds.length === 0) {
        setError('Please select at least one service before proceeding.');
        return;
      }
    }
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!invoiceNumber || !selectedCustomer || selectedServiceIds.length === 0) {
      setError('Please fill all required fields and select at least one service.');
      return;
    }
    if (!validateInvoiceNumber(invoiceNumber)) {
      setError('Please enter a valid invoice number.');
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
      const response = await fetch('http://localhost:3000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          cust_id: selectedCustomer,
          status,
          services: selectedServiceIds.map(service_id => ({
            service_id,
            qty: serviceDetails[service_id].qty,
            customer_po: serviceDetails[service_id].customer_po,
            status
          }))
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create invoice');
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/invoices');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create invoice. Please try again.');
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={invoiceNumber}
                onChange={handleInvoiceNumberChange}
                required
                placeholder="Enter invoice number"
                helperText={invoiceNumberError || "Up to 15 characters"}
                error={!!invoiceNumberError}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Invoice number can be any text up to 15 characters">
                      <InfoIcon color="action" />
                    </Tooltip>
                  ),
                }}
              />
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
            <Grid item xs={12} sx={{ mt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="customer-select" sx={{ background: '#fff', px: 0.5 }}>Customer</InputLabel>
                <Select
                  fullWidth
                  labelId="customer-select-label"
                  id="customer-select"
                  value={selectedCustomer}
                  label="Customer"
                  onChange={e => {
                    setSelectedCustomer(e.target.value);
                    setSelectedServiceIds([]);
                    setServiceDetails({});
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        minWidth: 350,
                      },
                    },
                  }}
                  input={<OutlinedInput label="Customer" />}
                  sx={{ minWidth: 350 }}
                >
                  <MenuItem value="">Select Customer</MenuItem>
                  {customers.map(c => (
                    <MenuItem 
                      key={c.cust_id} 
                      value={c.cust_id}
                      sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        minHeight: '48px',
                        padding: '8px 16px'
                      }}
                    >
                      {c.cust_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Services
                <Tooltip title="Select one or more services to include in this invoice">
                  <InfoIcon sx={{ ml: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
                </Tooltip>
              </Typography>
              <FormControl fullWidth>
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
            {selectedServiceIds.map(service_id => (
              <Paper
                key={service_id}
                elevation={2}
                sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {services.find(s => s.service_id === service_id)?.service_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={serviceDetails[service_id]?.qty || ''}
                      onChange={e => handleServiceDetailChange(service_id, 'qty', e.target.value)}
                      required
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Customer PO"
                      value={serviceDetails[service_id]?.customer_po || ''}
                      onChange={e => handleServiceDetailChange(service_id, 'customer_po', e.target.value)}
                      required
                      placeholder="Enter PO number"
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Invoice Details</Typography>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">Invoice Number</Typography>
                  <Typography variant="body1">{invoiceNumber}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">Customer</Typography>
                  <Typography variant="body1">
                    {customers.find(c => c.cust_id === selectedCustomer)?.cust_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{status}</Typography>
                </Grid>
              </Grid>
            </Paper>
            <Typography variant="h6" gutterBottom>Selected Services</Typography>
            {selectedServiceIds.map(service_id => (
              <Paper key={service_id} elevation={2} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="text.secondary">Service</Typography>
                    <Typography variant="body1">
                      {services.find(s => s.service_id === service_id)?.service_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="text.secondary">Quantity</Typography>
                    <Typography variant="body1">{serviceDetails[service_id]?.qty}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="text.secondary">Customer PO</Typography>
                    <Typography variant="body1">{serviceDetails[service_id]?.customer_po}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">New Invoice</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
        >
          Back to Invoices
        </Button>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {activeStep === steps.length - 1 ? (
            <form onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!!invoiceNumberError}
                >
                  Create Invoice
                </Button>
              </Box>
            </form>
          ) : (
            <>
              {renderStepContent(activeStep)}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={!!invoiceNumberError}
                  type="button"
                >
                  Next
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Invoice created successfully!
        </Alert>
      </Snackbar>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Box>
  );
};

export default NewInvoice;