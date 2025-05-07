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
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const NewInvoice = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [descriptions, setDescriptions] = useState([{ accountNumber: '', description: '', amount: '', tax: '' }]);

  const handleAddDescription = () => {
    setDescriptions([...descriptions, { accountNumber: '', description: '', amount: '', tax: '' }]);
  };

  const handleRemoveDescription = (index) => {
    setDescriptions(descriptions.filter((_, i) => i !== index));
  };

  const handleDescriptionChange = (index, field, value) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index][field] = value;
    setDescriptions(newDescriptions);
  };

  const validateInvoiceNumber = (number) => {
    // 8 digits alphanumeric with optional hyphens
    return /^[A-Za-z0-9-]{1,8}$/.test(number);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const invoiceNumber = formData.get('invoiceNumber');
    if (!validateInvoiceNumber(invoiceNumber)) {
      setError('Invoice number must be up to 8 characters and can only contain letters, numbers, and hyphens');
      return;
    }

    const data = {
      invoiceNumber,
      customer: formData.get('customer'),
      date: formData.get('date'),
      customerPo: formData.get('customerPo'),
      descriptions: descriptions.map(desc => ({
        accountNumber: desc.accountNumber,
        description: desc.description,
        amount: parseFloat(desc.amount),
        tax: desc.tax
      }))
    };

    try {
      const response = await fetch('http://localhost:3000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      console.error('Error details:', err);
      setError(err.message || 'Failed to create invoice. Please try again.');
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

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoiceNumber"
                  required
                  placeholder="e.g., INV-001"
                  helperText="Up to 8 characters, alphanumeric with hyphens"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer"
                  name="customer"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: new Date().toISOString().split('T')[0]
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer PO"
                  name="customerPo"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Descriptions</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddDescription}
                    variant="outlined"
                  >
                    Add Description
                  </Button>
                </Box>
              </Grid>

              {descriptions.map((desc, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            label="Account #"
                            value={desc.accountNumber}
                            onChange={(e) => handleDescriptionChange(index, 'accountNumber', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={desc.description}
                            onChange={(e) => handleDescriptionChange(index, 'description', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            label="Amount"
                            type="number"
                            value={desc.amount}
                            onChange={(e) => handleDescriptionChange(index, 'amount', e.target.value)}
                            required
                            InputProps={{
                              startAdornment: '$',
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <TextField
                            fullWidth
                            label="Tax"
                            value={desc.tax}
                            onChange={(e) => handleDescriptionChange(index, 'tax', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          {descriptions.length > 1 && (
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveDescription(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/invoices')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    Create Invoice
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={success} 
        autoHideDuration={2000} 
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success">
          Invoice created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewInvoice; 