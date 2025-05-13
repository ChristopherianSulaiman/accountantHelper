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
  FormControlLabel,
} from '@mui/material';
import {
  Print as PrintIcon,
} from '@mui/icons-material';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '@mui/material/styles';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Print = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [banks, setBanks] = useState([]);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [service, setService] = useState(null);
  const [includeNRC, setIncludeNRC] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const theme = useTheme();

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
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

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchCustomerAndService = async (invoice) => {
    try {
      let customerData = null;
      let serviceData = null;
      // Try to fetch by ID first
      if (invoice.cust_id) {
        try {
          const customerRes = await axios.get(`http://localhost:3000/api/customers/${invoice.cust_id}`);
          customerData = customerRes.data;
        } catch (err) {
          console.warn('Customer by ID not found, will try by name.');
        }
      }
      if (!customerData && invoice.cust_name) {
        // Fallback: fetch all and find by name
        const allCustomers = await axios.get('http://localhost:3000/api/customers');
        customerData = allCustomers.data.find(c => c.cust_name === invoice.cust_name);
      }
      setCustomer(customerData);

      if (invoice.service_id) {
        try {
          const serviceRes = await axios.get(`http://localhost:3000/api/services/${invoice.service_id}`);
          serviceData = serviceRes.data;
        } catch (err) {
          console.warn('Service by ID not found, will try by name.');
        }
      }
      if (!serviceData && invoice.service_name) {
        // Fallback: fetch all and find by name
        const allServices = await axios.get('http://localhost:3000/api/services');
        serviceData = allServices.data.find(s => s.service_name === invoice.service_name);
      }
      setService(serviceData);
    } catch (err) {
      console.error('Error fetching customer/service:', err);
      setCustomer(null);
      setService(null);
    }
  };

  const handlePrint = async (invoice) => {
    setSelectedInvoice(invoice);
    await fetchBanks();
    await fetchCustomerAndService(invoice);
    setShowDialog(true);
  };

  const handleBankChange = (event) => {
    const { value } = event.target;
    setSelectedBanks(typeof value === 'string' ? value.split(',') : value);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setSelectedInvoice(null);
    setSelectedBanks([]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // If already a Date object, convert to string
    if (dateStr instanceof Date) {
      return dateStr.toISOString().slice(0, 10);
    }
    // If string, split at 'T' if present
    return dateStr.split('T')[0];
  };

  const handlePrintPDF = () => {
    if (!selectedInvoice || !customer || !service) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 14, 18);
    doc.setFontSize(12);
    doc.text(customer.cust_name || '', 14, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.cust_address || '', 14, 32);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 160, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No. : ${selectedInvoice.invoice_number}`, 160, 25);
    doc.text(`PO #: ${selectedInvoice.customer_po}`, 160, 31);
    doc.text(`Period: ${formatDate(service.start_date)} - ${formatDate(service.end_date)}`, 14, 45);
    // Table
    const tableColumn = [
      'Description',
      'Period',
      'Unit Price',
      'Qty',
      'Amount',
    ];
    const tableRows = [
      [
        service.service_name || '',
        `${formatDate(service.start_date)} - ${formatDate(service.end_date)}`,
        service.mrc ? `Rp ${parseFloat(service.mrc).toLocaleString()}` : '',
        selectedInvoice.qty || '',
        service.mrc ? `Rp ${(parseFloat(service.mrc) * selectedInvoice.qty).toLocaleString()}` : '',
      ],
    ];
    if (includeNRC && service.nrc) {
      tableRows.push([
        'Activation Fee',
        `${formatDate(service.start_date)} - ${formatDate(service.end_date)}`,
        service.nrc ? `Rp ${parseFloat(service.nrc).toLocaleString()}` : '',
        '1',
        service.nrc ? `Rp ${parseFloat(service.nrc).toLocaleString()}` : '',
      ]);
    }
    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 242, 0],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        halign: 'left',
        valign: 'middle',
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      styles: {
        cellPadding: 2,
        font: 'helvetica',
      },
    });
    // Add payment instructions and bank details
    let y = doc.lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('All payment should be made in full Amount to PT. Digital Wireless Indonesia:', 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    banks.filter(b => selectedBanks.includes(b.bank_id)).forEach((bank) => {
      doc.text(`Bank Name: ${bank.bank_name}`, 14, y);
      y += 6;
      doc.text(`Account Number: ${bank.acc_number}`, 14, y);
      y += 6;
      doc.text(`Bank Address: ${bank.bank_address}`, 14, y);
      y += 6;
      doc.text(`SWIFT: ${bank.swift_code || ''}  IBAN: ${bank.iban_code || ''}`, 14, y);
      y += 8;
    });
    doc.save('invoice.pdf');
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const customerMatch = customerFilter
      ? String(inv.cust_id) === String(customerFilter)
      : true;
    const statusMatch = statusFilter ? inv.status === statusFilter : true;
    return customerMatch && statusMatch;
  });

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
      {/* Filter controls */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
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
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No invoices available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.invoice_id}>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.cust_name}</TableCell>
                      <TableCell>{invoice.customer_po}</TableCell>
                      <TableCell colSpan={2}>
                        {invoice.services && invoice.services.length > 0
                          ? invoice.services.map(s => (
                              <div key={s.service_id}>
                                {s.service_name} (Qty: {s.qty})
                              </div>
                            ))
                          : '-'}
                      </TableCell>
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

      {/* Print Dialog/Modal */}
      <Dialog open={showDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Print Invoice</DialogTitle>
        <DialogContent>
          {/* Bank Multi-Select */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="bank-select-label">Select Bank(s)</InputLabel>
            <Select
              labelId="bank-select-label"
              multiple
              value={selectedBanks}
              onChange={handleBankChange}
              renderValue={(selected) =>
                banks
                  .filter((bank) => selected.includes(bank.bank_id))
                  .map((bank) => bank.bank_name)
                  .join(', ')
              }
            >
              {banks.map((bank) => (
                <MenuItem key={bank.bank_id} value={bank.bank_id}>
                  <Checkbox checked={selectedBanks.indexOf(bank.bank_id) > -1} />
                  <ListItemText primary={bank.bank_name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Invoice Preview */}
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fafafa', mb: 2 }}>
            <Typography variant="h6">Invoice Preview</Typography>
            {selectedInvoice && customer && service ? (
              <Box>
                <Typography variant="subtitle1"><b>Customer:</b> {customer.cust_name}</Typography>
                <Typography variant="subtitle1"><b>Address:</b> {customer.cust_address}</Typography>
                <Typography variant="subtitle1"><b>Invoice #:</b> {selectedInvoice.invoice_number}</Typography>
                <Typography variant="subtitle1"><b>PO #:</b> {selectedInvoice.customer_po}</Typography>
                <Typography variant="subtitle1"><b>Service:</b> {service.service_name}</Typography>
                <Typography variant="subtitle1"><b>Period:</b> {service.start_date} - {service.end_date}</Typography>
                <Typography variant="subtitle1"><b>Quantity:</b> {selectedInvoice.qty}</Typography>
                <Typography variant="subtitle1"><b>NRC:</b> {service.nrc}</Typography>
                <Typography variant="subtitle1"><b>MRC:</b> {service.mrc}</Typography>
                <Typography variant="subtitle1"><b>Banks:</b> {banks.filter(b => selectedBanks.includes(b.bank_id)).map(b => b.bank_name).join(', ')}</Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Loading preview...</Typography>
            )}
          </Box>

          <FormControlLabel
            control={<Checkbox checked={includeNRC} onChange={e => setIncludeNRC(e.target.checked)} />}
            label="Include NRC (One-time Setup)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">Cancel</Button>
          <Button variant="contained" color="primary" onClick={handlePrintPDF}>Print / Download PDF</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Print; 