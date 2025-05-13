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
} from '@mui/material';
import {
  Print as PrintIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
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
import TextField from '@mui/material/TextField';

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
  const [dateBilled, setDateBilled] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
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
    // Initialize NRC inclusion for each service (default: true)
    if (invoice.services) {
      const nrcMap = {};
      const dateMap = {};
      invoice.services.forEach(s => {
        nrcMap[s.service_id] = true;
        dateMap[s.service_id] = {
          start_date: s.start_date ? s.start_date.slice(0, 10) : '',
          end_date: s.end_date ? s.end_date.slice(0, 10) : '',
        };
      });
      setNrcIncluded(nrcMap);
      setServiceDates(dateMap);
    } else {
      setNrcIncluded({});
      setServiceDates({});
    }
    setDueDate('');
    setDateBilled(() => {
      const today = new Date();
      return today.toISOString().slice(0, 10);
    });
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

  const handlePrintPDF = () => {
    if (!selectedInvoice || !selectedInvoice.services || !customer) return;
    if (!dueDate || !dateBilled) {
      setError('Please enter both Due Date and Date Billed.');
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
        // Service description row (indented)
        tableRows.push([
          { content: `  ${service.service_name}`, styles: { colSpan: 5, halign: 'left' } }, '', '', '', ''
        ]);
        // MRC row
        const mrcAmount = service.mrc ? parseFloat(service.mrc) * service.qty : 0;
        subTotal += mrcAmount;
        tableRows.push([
          '', period, `Rp ${service.mrc ? parseFloat(service.mrc).toLocaleString() : ''}`, service.qty || '', `Rp ${mrcAmount ? mrcAmount.toLocaleString() : ''}`
        ]);
        // NRC row (if included)
        if (nrcIncluded[service.service_id] && service.nrc) {
          const nrcAmount = parseFloat(service.nrc) * 1;
          subTotal += nrcAmount;
          tableRows.push([
            'Activation Fee', 'One Time', `Rp ${parseFloat(service.nrc).toLocaleString()}`, '1', `Rp ${parseFloat(service.nrc).toLocaleString()}`
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
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Sub Total', 150, yAfterTable);
    doc.text('VAT/PPN', 150, yAfterTable + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 150, yAfterTable + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rp ${subTotal.toLocaleString()}`, 185, yAfterTable, { align: 'right' });
    doc.text(`Rp ${vat.toLocaleString()}`, 185, yAfterTable + 7, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${total.toLocaleString()}`, 185, yAfterTable + 14, { align: 'right' });

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
    return customerMatch && statusMatch;
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

          {/* Invoice Due Date and Date Billed */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Date Billed"
              type="date"
              value={dateBilled}
              onChange={e => setDateBilled(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
          {/* Per-service date pickers */}
          {selectedInvoice && selectedInvoice.services && selectedInvoice.services.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Set Period for Each Service:</Typography>
              {selectedInvoice.services.map(service => (
                <Box key={service.service_id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography sx={{ minWidth: 120 }}>{service.service_name}</Typography>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={serviceDates[service.service_id]?.start_date || ''}
                    onChange={e => handleServiceDateChange(service.service_id, 'start_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={serviceDates[service.service_id]?.end_date || ''}
                    onChange={e => handleServiceDateChange(service.service_id, 'end_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          )}
          {/* Per-service NRC checkboxes */}
          {selectedInvoice && selectedInvoice.services && selectedInvoice.services.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Include NRC (One-time Setup) for:</Typography>
              {selectedInvoice.services.map(service => (
                <FormControlLabel
                  key={service.service_id}
                  control={
                    <Checkbox
                      checked={!!nrcIncluded[service.service_id]}
                      onChange={() => handleNrcCheckbox(service.service_id)}
                    />
                  }
                  label={service.service_name}
                />
              ))}
            </Box>
          )}
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