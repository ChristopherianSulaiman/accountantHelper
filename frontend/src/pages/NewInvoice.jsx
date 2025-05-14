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
  Container,
  useTheme,
  alpha,
  StepConnector,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  ArrowBack as ArrowBackIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Info as InfoIcon,
  ReceiptLong as ReceiptIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import { useCompany } from '../components/CompanyContext';

// Custom styled components
const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderTopWidth: 3,
    borderRadius: 1,
  },
  '&.Mui-active': {
    '& .MuiStepConnector-line': {
      borderColor: theme.palette.primary.main,
    },
  },
  '&.Mui-completed': {
    '& .MuiStepConnector-line': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundColor: theme.palette.primary.main,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundColor: theme.palette.primary.main,
  }),
}));

// Custom step icons
function StepIcon(props) {
  const { active, completed, className } = props;
  const icons = {
    1: <ReceiptIcon />,
    2: <SettingsIcon />,
    3: <CheckCircleIcon />,
  };

  return (
    <StepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </StepIconRoot>
  );
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const steps = ['Basic Information', 'Select Services', 'Review & Submit'];

const NewInvoice = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const theme = useTheme();
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
    if (!company) return;
    fetch(`http://localhost:3000/api/customers?company_id=${company.company_id}`)
      .then(res => res.json())
      .then(setCustomers);
  }, [company]);

  useEffect(() => {
    // Fetch services for selected customer
    if (!company || !selectedCustomer) {
      setServices([]);
      return;
    }
    fetch(`http://localhost:3000/api/services?company_id=${company.company_id}`)
      .then(res => res.json())
      .then(data => setServices(data.filter(s => String(s.cust_id) === String(selectedCustomer))));
  }, [company, selectedCustomer]);

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
          company_id: company.company_id,
          services: selectedServiceIds.map(service_id => ({
            service_id,
            qty: serviceDetails[service_id].qty,
            customer_po: serviceDetails[service_id].customer_po,
            company_id: company.company_id
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
                elevation={3}
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  backgroundColor: alpha(theme.palette.primary.light, 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.primary.dark,
                        mb: 1 
                      }}
                    >
                      {services.find(s => s.service_id === service_id)?.service_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure details for this service
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
                      variant="filled"
                      InputProps={{
                        inputProps: { min: 1 },
                        sx: { borderRadius: 1 }
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
                      variant="filled"
                      InputProps={{
                        sx: { borderRadius: 1 }
                      }}
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
            <Paper elevation={3} sx={{ 
              p: 4, 
              mb: 4,
              borderRadius: 2,
              backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.95)}), 
                               url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='${encodeURIComponent(alpha(theme.palette.primary.main, 0.05))}' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '300px 300px',
              boxShadow: `0 10px 30px -5px ${alpha(theme.palette.primary.main, 0.15)}`
            }}>
              <Box sx={{ 
                position: 'relative', 
                borderBottom: `1px solid ${theme.palette.divider}`,
                mb: 3,
                pb: 2
              }}>
                <Typography variant="h5" fontWeight="medium" gutterBottom color="primary.main">
                  Invoice Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please review the information below before finalizing
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    bgcolor: alpha(theme.palette.primary.light, 0.05),
                    height: '100%'
                  }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Invoice Number
                    </Typography>
                    <Typography variant="h6" fontWeight="500">
                      {invoiceNumber}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    bgcolor: alpha(theme.palette.primary.light, 0.05),
                    height: '100%'
                  }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Customer
                    </Typography>
                    <Typography variant="h6" fontWeight="500">
                      {customers.find(c => c.cust_id === selectedCustomer)?.cust_name || ''}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    bgcolor: alpha(theme.palette.primary.light, 0.05),
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          mr: 1,
                          bgcolor: 
                            status === 'paid' ? 'success.main' :
                            status === 'pending' ? 'warning.main' :
                            status === 'overdue' ? 'error.main' : 'text.disabled'
                        }}
                      />
                      <Typography variant="h6" fontWeight="500">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Typography>
                    </Box>
                  </Box>
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

  // Add company check before rendering the form
  if (!company) {
    return (
      <Container maxWidth="lg" sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh' 
      }}>
        <Card 
          elevation={4} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            maxWidth: 500,
            width: '100%',
            bgcolor: alpha(theme.palette.background.paper, 0.9)
          }}
        >
          <ReceiptIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Company Selection Required</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please select a company from the header dropdown to create a new invoice.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            fullWidth
            size="large"
            sx={{ mt: 2 }}
          >
            Return to Dashboard
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ReceiptIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="medium">New Invoice</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Back to Invoices
        </Button>
      </Box>

      <Stepper 
        activeStep={activeStep} 
        sx={{ mb: 5 }}
        alternativeLabel
        connector={<StyledStepConnector />}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={StepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card 
        elevation={3} 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
        }}
      >
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            py: 2, 
            px: 3, 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6">
            {activeStep === 0 && 'Enter Invoice Details'}
            {activeStep === 1 && 'Select and Configure Services'}
            {activeStep === 2 && 'Review and Finalize Invoice'}
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          {activeStep === steps.length - 1 ? (
            <form onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${theme.palette.divider}`
              }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!!invoiceNumberError}
                  size="large"
                  sx={{ 
                    borderRadius: 2, 
                    px: 4,
                    boxShadow: '0 4px 10px 0 rgba(0,0,0,0.2)'
                  }}
                >
                  Create Invoice
                </Button>
              </Box>
            </form>
          ) : (
            <>
              {renderStepContent(activeStep)}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${theme.palette.divider}`
              }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={!!invoiceNumberError}
                  type="button"
                  size="large"
                  sx={{ 
                    borderRadius: 2, 
                    px: 4,
                    boxShadow: '0 4px 10px 0 rgba(0,0,0,0.2)'
                  }}
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
        <Alert 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
        >
          Invoice created successfully!
        </Alert>
      </Snackbar>
      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            mt: 2,
            boxShadow: 3 
          }}
        >
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default NewInvoice;