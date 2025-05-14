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
  Collapse,
  Grid,
  FormHelperText,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Print as PrintIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
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
  const [nrcIncluded, setNrcIncluded] = useState({});
  const [serviceDates, setServiceDates] = useState({});
  const [dueDate, setDueDate] = useState('');
  const [dateBilled, setDateBilled] = useState('');
  const [nrcQty, setNrcQty] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    // Initialize NRC inclusion and NRC qty for each service (default: true, qty: 1)
    if (invoice.services) {
      const nrcMap = {};
      const nrcQtyMap = {};
      const dateMap = {};
      invoice.services.forEach(s => {
        nrcMap[s.service_id] = true;
        nrcQtyMap[s.service_id] = 1;
        dateMap[s.service_id] = {
          start_date: s.start_date ? s.start_date.slice(0, 10) : '',
          end_date: s.end_date ? s.end_date.slice(0, 10) : '',
        };
      });
      setNrcIncluded(nrcMap);
      setNrcQty(nrcQtyMap);
      setServiceDates(dateMap);
    } else {
      setNrcIncluded({});
      setNrcQty({});
      setServiceDates({});
    }
    setDueDate('');
    setDateBilled('');
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

  const handleServiceDateChange = (service_id, field, value) => {
    setServiceDates(prev => ({
      ...prev,
      [service_id]: {
        ...prev[service_id],
        [field]: value
      }
    }));
  };

  const handleNrcCheckbox = (service_id) => {
    setNrcIncluded(prev => ({ ...prev, [service_id]: !prev[service_id] }));
  };

  const handleNrcQtyChange = (service_id, value) => {
    setNrcQty(prev => ({ ...prev, [service_id]: value }));
  };

  const handlePrintPDF = () => {
    if (!selectedInvoice || !selectedInvoice.services || !customer) return;
    if (!dueDate || !dateBilled) {
      setError('Please enter both Due Date and Date Billed.');
      return;
    }
    if (!selectedBanks || selectedBanks.length === 0) {
      setError('Please select at least one bank before downloading.');
      return;
    }
    const doc = new jsPDF('p', 'mm', 'a4');

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Billed To :', 14, 18);
    doc.setFontSize(13);
    doc.text((customer.cust_name || '').toUpperCase(), 14, 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let y = 31;
    if (customer.cust_address) {
      const addressLines = doc.splitTextToSize(customer.cust_address, 80);
      doc.text(addressLines, 14, y);
      y += addressLines.length * 6;
    }
    doc.text('Phone :  -', 14, y + 2);

    // Invoice info box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.text('Invoice', 150, 22);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No. : ${selectedInvoice.invoice_number}`, 150, 32);
    doc.text(`Date      : ${dateBilled.split('-').reverse().join('/')}`, 150, 38);
    doc.text(`Due Date  : ${dueDate ? dueDate.split('-').reverse().join('/') : ''}`, 150, 44);

    // --- TABLE ---
    y += 12;
    let tableY = Math.max(y, 55);
    // Group services by PO
    const poGroups = {};
    selectedInvoice.services.forEach(service => {
      if (!service) return;
      const po = service.customer_po || 'NO PO';
      if (!poGroups[po]) poGroups[po] = [];
      poGroups[po].push(service);
    });
    // Build table rows
    let tableRows = [];
    let subTotal = 0;
    Object.entries(poGroups).forEach(([po, services]) => {
      // PO row (bold)
      tableRows.push([
        { content: `PO # ${po}`, styles: { fontStyle: 'bold', colSpan: 5, halign: 'left' } }, '', '', '', ''
      ]);
      services.forEach(service => {
        const dates = serviceDates[service.service_id] || {};
        const period = dates.start_date && dates.end_date ? `${dates.start_date.split('-').reverse().join('/')} - ${dates.end_date.split('-').reverse().join('/')}` : '';
        // Service row: name, period, unit price, qty, amount
        const mrcAmount = service.mrc ? parseFloat(service.mrc) * service.qty : 0;
        subTotal += mrcAmount;
        tableRows.push([
          { content: service.service_name, styles: { halign: 'left' } },
          period,
          `Rp ${service.mrc ? parseFloat(service.mrc).toLocaleString() : ''}`,
          service.qty || '',
          `Rp ${mrcAmount ? mrcAmount.toLocaleString() : ''}`
        ]);
        // NRC row (if included)
        if (nrcIncluded[service.service_id] && service.nrc) {
          const qty = Number(nrcQty[service.service_id]) || 1;
          const nrcAmount = parseFloat(service.nrc) * qty;
          subTotal += nrcAmount;
          tableRows.push([
            'Activation Fee', 'One Time', `Rp ${parseFloat(service.nrc).toLocaleString()}`, String(qty), `Rp ${nrcAmount.toLocaleString()}`
          ]);
        }
      });
    });

    // --- TABLE HEADER ---
    const tableHead = [[
      { content: 'Description', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'left' } },
      { content: 'Period', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'left' } },
      { content: 'Unit Price', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'left' } },
      { content: 'Qty', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'left' } },
      { content: 'Amount', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'left' } },
    ]];

    autoTable(doc, {
      startY: tableY,
      head: tableHead,
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 11, halign: 'left', valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      styles: { cellPadding: 2, font: 'helvetica' },
      didDrawPage: (data) => {
        // nothing
      },
    });

    // --- SUBTOTAL, VAT, TOTAL ---
    let yAfterTable = doc.lastAutoTable.finalY + 10;
    const vat = Math.round(subTotal * 0.11);
    const total = subTotal + vat;
    const labelX = 150;
    const valueX = 200; // Move this further right to avoid overlap
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Sub Total', labelX, yAfterTable);
    doc.text('VAT/PPN', labelX, yAfterTable + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', labelX, yAfterTable + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rp ${subTotal.toLocaleString()}`, valueX, yAfterTable, { align: 'right' });
    doc.text(`Rp ${vat.toLocaleString()}`, valueX, yAfterTable + 7, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${total.toLocaleString()}`, valueX, yAfterTable + 14, { align: 'right' });

    // --- FOOTER ---
    let yFooter = yAfterTable + 30;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('All payment should be made in full Amount', 14, yFooter);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Make all checks payable to :', 14, yFooter + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Digital Wireless Indonesia', 14, yFooter + 14);
    doc.setFont('helvetica', 'normal');
    let yBank = yFooter + 21;
    banks.filter(b => selectedBanks.includes(b.bank_id)).forEach((bank) => {
      doc.text(`Bank ${bank.bank_name} - ${bank.bank_address}`, 14, yBank);
      yBank += 6;
      doc.text(`A/C # ${bank.acc_number} (${bank.currency})`, 14, yBank);
      yBank += 7;
    });

    doc.save('invoice.pdf');
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const customerMatch = customerFilter
      ? String(inv.cust_id) === String(customerFilter)
      : true;
    const statusMatch = statusFilter ? inv.status === statusFilter : true;
    const searchMatch = searchQuery
      ? inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return customerMatch && statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  function InvoiceRow({ invoice, onPrint }) {
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
          <TableCell>{invoice.invoice_number}</TableCell>
          <TableCell>{invoice.cust_name}</TableCell>
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
              onClick={() => onPrint(invoice)}
            >
              <PrintIcon />
            </IconButton>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Services
                </Typography>
                <Table size="small" aria-label="services">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Customer PO</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.services && invoice.services.map((service) => (
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
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Print Invoices</Typography>
      </Box>
      {/* Filter controls */}
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
                  <TableCell />
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No invoices available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <InvoiceRow key={invoice.invoice_id} invoice={invoice} onPrint={handlePrint} />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Print Dialog/Modal */}
      <Dialog open={showDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div">
            Print Invoice
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {selectedInvoice?.invoice_number}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Error message inside dialog */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            {/* Invoice Dates Section */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Invoice Dates
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    autoComplete="off"
                    helperText="When the payment is due"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date Billed"
                    type="date"
                    value={dateBilled}
                    onChange={e => setDateBilled(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    autoComplete="off"
                    helperText="When the invoice was issued"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Bank Selection Section */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="bank-select-label">Select Bank(s) for Payment</InputLabel>
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
                      <ListItemText 
                        primary={bank.bank_name}
                        secondary={`${bank.acc_number} (${bank.currency})`}
                      />
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select one or more banks where payment can be made
                </FormHelperText>
              </FormControl>
            </Paper>

            {/* Service Periods Section */}
            {selectedInvoice && selectedInvoice.services && selectedInvoice.services.length > 0 && (
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  Service Periods
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set the billing period for each service
                </Typography>
                {selectedInvoice.services.map(service => (
                  <Box 
                    key={service.service_id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      mb: 2,
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2">{service.service_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        PO: {service.customer_po}
                      </Typography>
                    </Box>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={serviceDates[service.service_id]?.start_date || ''}
                      onChange={e => handleServiceDateChange(service.service_id, 'start_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={serviceDates[service.service_id]?.end_date || ''}
                      onChange={e => handleServiceDateChange(service.service_id, 'end_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                ))}
              </Paper>
            )}

            {/* NRC Section */}
            {selectedInvoice && selectedInvoice.services && selectedInvoice.services.length > 0 && (
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  One-time Setup Fees (NRC)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select which services should include their one-time setup fee
                </Typography>
                {selectedInvoice.services.map(service => (
                  <Box 
                    key={service.service_id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      mb: 2,
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!nrcIncluded[service.service_id]}
                          onChange={() => handleNrcCheckbox(service.service_id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">{service.service_name}</Typography>
                          {service.nrc && (
                            <Typography variant="caption" color="text.secondary">
                              NRC: Rp {parseFloat(service.nrc).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    {nrcIncluded[service.service_id] && service.nrc && (
                      <TextField
                        label="Quantity"
                        type="number"
                        size="small"
                        value={nrcQty[service.service_id] || 1}
                        onChange={e => handleNrcQtyChange(service.service_id, e.target.value)}
                        inputProps={{ min: 1, step: 1 }}
                        sx={{ width: 100 }}
                      />
                    )}
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handlePrintPDF}
            disabled={!dueDate || !dateBilled || selectedBanks.length === 0}
          >
            Print / Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Print; 