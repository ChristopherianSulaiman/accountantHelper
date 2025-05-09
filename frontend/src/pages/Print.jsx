import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Print as PrintIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Print = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    // TODO: Implement print functionality
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
        <Typography variant="h4">Print Invoices</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
                    <TableRow key={invoice.invoice_id}>
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
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePrint(invoice)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
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

export default Print; 