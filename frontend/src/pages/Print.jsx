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
import { useCompany } from '../components/CompanyContext';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Print = () => {
  const { company } = useCompany();
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
    if (!company) return;
    fetchInvoices();
    fetchCustomers();
    fetchBanks();
  }, [company]);

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchInvoices = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/invoices?company_id=${company.company_id}`);
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setInvoices([]);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/customers?company_id=${company.company_id}`);
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setCustomers([]);
      setError('Failed to load customers. Please try again.');
    }
  };

  const fetchBanks = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/banks?company_id=${company.company_id}`);
      setBanks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setBanks([]);
      setError('Failed to load banks. Please try again.');
    }
  };

  const fetchCustomerAndService = async (invoice) => {
    try {
      let customerData = null;
      let serviceData = null;

      // Try to fetch customer by ID first
      if (invoice.cust_id) {
        try {
          const customerRes = await axios.get(`http://localhost:3000/api/customers/${invoice.cust_id}?company_id=${company.company_id}`);
          if (customerRes.data) {
            customerData = customerRes.data;
          }
        } catch (err) {
          console.warn('Customer by ID not found, will try by name.');
        }
      }

      // If customer not found by ID, try to find by name
      if (!customerData && invoice.cust_name) {
        try {
          const allCustomersRes = await axios.get(`http://localhost:3000/api/customers?company_id=${company.company_id}`);
          if (Array.isArray(allCustomersRes.data)) {
            customerData = allCustomersRes.data.find(c => c.cust_name === invoice.cust_name);
          }
        } catch (err) {
          console.error('Error fetching customers:', err);
        }
      }

      if (!customerData) {
        setError('Could not find customer information. Please try again.');
        return;
      }

      setCustomer(customerData);

      // Fetch services if needed
      if (invoice.service_id) {
        try {
          const serviceRes = await axios.get(`http://localhost:3000/api/services/${invoice.service_id}?company_id=${company.company_id}`);
          if (serviceRes.data) {
            serviceData = serviceRes.data;
          }
        } catch (err) {
          console.warn('Service by ID not found, will try by name.');
        }
      }

      if (!serviceData && invoice.service_name) {
        try {
          const allServicesRes = await axios.get(`http://localhost:3000/api/services?company_id=${company.company_id}`);
          if (Array.isArray(allServicesRes.data)) {
            serviceData = allServicesRes.data.find(s => s.service_name === invoice.service_name);
          }
        } catch (err) {
          console.error('Error fetching services:', err);
        }
      }

      setService(serviceData);
    } catch (err) {
      console.error('Error in fetchCustomerAndService:', err);
      setError('Failed to load customer and service information. Please try again.');
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
    try {
      if (!selectedInvoice) {
        setError('No invoice selected');
        return;
      }
      if (!selectedInvoice.services || !Array.isArray(selectedInvoice.services) || selectedInvoice.services.length === 0) {
        setError('No services found in the invoice');
        return;
      }
      if (!customer) {
        setError('Customer information not found');
        return;
      }
      if (!dueDate || !dateBilled) {
        setError('Please enter both Due Date and Date Billed.');
        return;
      }
      if (!selectedBanks || selectedBanks.length === 0) {
        setError('Please select at least one bank before downloading.');
        return;
      }

      // DEBUG: Log company object before generating PDF
      console.log('Company object used for PDF:', company);

      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Add 30mm (3cm) vertical offset to shift everything down (reduced from 40mm)
      const verticalOffset = 20;

      // --- COMPANY INFO TRUE TOP RIGHT ---
      doc.setFont('helvetica');
      doc.setFontSize(8.5);
      doc.text(company?.company_name || '', 160, 10, { align: 'left' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      let companyInfoY = 13;
      if (company?.company_address) {
        const addressLines = doc.splitTextToSize(company.company_address, 45);
        doc.text(addressLines, 160, companyInfoY, { align: 'left' });
        companyInfoY += addressLines.length * 3.3;
      }
      doc.text(`Phone: ${company?.phone_number || '-'}`, 160, companyInfoY, { align: 'left' });
      companyInfoY += 3;
      doc.text(`Fax: ${company?.fax_number || '-'}`, 160, companyInfoY, { align: 'left' });

      // --- HEADER ---
      doc.setFont('helvetica', 'bold');
      // doc.setFontSize(12);
      // doc.text('Billed To :', 14, 18 + verticalOffset);
      doc.setFontSize(13);
      doc.text((customer.cust_name || '').toUpperCase(), 14, 25 + verticalOffset);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      let y = 31 + verticalOffset;
      if (customer.cust_address) {
        const addressLines = doc.splitTextToSize(customer.cust_address, 80);
        doc.text(addressLines, 14, y);
        y += addressLines.length * 6;
      }
      doc.text('Phone :  -', 14, y + 2);

      // Invoice info box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(27);
      doc.text('Invoice', 150, 22 + verticalOffset);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No.   : ${selectedInvoice.invoice_number}`, 150, 32 + verticalOffset);
      doc.text(`Date             : ${dateBilled.split('-').reverse().join('/')}`, 150, 38 + verticalOffset);
      doc.text(`Due Date      : ${dueDate ? dueDate.split('-').reverse().join('/') : ''}`, 150, 44 + verticalOffset);

      // --- TABLE ---
      y += 12;
      let tableY = Math.max(y, 55 + verticalOffset);
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
          if (!service) return;
          const dates = serviceDates[service.service_id] || {};
          const period = dates.start_date && dates.end_date ? `${dates.start_date.split('-').reverse().join('/')} - ${dates.end_date.split('-').reverse().join('/')}` : '';
          // Service row: name, period, unit price, qty, amount
          const mrcAmount = service.mrc ? parseFloat(service.mrc) * (service.qty || 0) : 0;
          subTotal += mrcAmount;
          tableRows.push([
            { content: service.service_name || '', styles: { halign: 'left' } },
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
        { content: 'Unit Price', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'center' } },
        { content: 'Qty', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'center' } },
        { content: 'Amount', styles: { fillColor: [255, 242, 0], textColor: [0,0,0], fontStyle: 'bold', halign: 'center' } },
      ]];

      autoTable(doc, {
        startY: tableY,
        head: tableHead,
        body: tableRows,
        theme: 'plain',
        headStyles: { 
          fillColor: [255, 242, 0], 
          textColor: [0,0,0], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 10
        },
        bodyStyles: { 
          fontSize: 9,
          halign: 'left', 
          valign: 'middle' 
        },
        columnStyles: {
          0: { cellWidth: 70, halign: 'left' },
          1: { cellWidth: 40, halign: 'left' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 35, halign: 'center' },
        },
        styles: { 
          cellPadding: 2, 
          font: 'helvetica',
          lineWidth: 0
        },
        didDrawPage: (data) => {
          // nothing
        },
      });

      // --- SUBTOTAL, VAT, TOTAL ---
      // Calculate required space for totals and payment info
      const paymentSectionExtraOffset = 20; // 2cm
      const totalsSectionHeight = 8 * 3 + 22; // 3 rows + lines + spacing
      const paymentSectionHeight = 60; // estimate for payment info and banks
      const requiredSpace = totalsSectionHeight + paymentSectionHeight + paymentSectionExtraOffset + 10;
      let yAfterTable = doc.lastAutoTable.finalY + 10;
      let pageHeight = doc.internal.pageSize.getHeight();
      // If not enough space, add a new page
      if (yAfterTable + requiredSpace > pageHeight) {
        doc.addPage();
        yAfterTable = 20; // top margin for new page
      }
      const vat = Math.round(subTotal * 0.11);
      const total = subTotal + vat;
      const labelX = 120;
      const currencyX = 150;
      const valueX = 200;
      const rowHeight = 8;
      // Draw top line (thinner)
      doc.setLineWidth(0.3);
      doc.line(currencyX - 6, yAfterTable - 4, valueX - 10, yAfterTable - 4);
      // Subtotal row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Sub Total', labelX, yAfterTable);
      doc.text('Rp', currencyX, yAfterTable, { align: 'right' });
      doc.text(subTotal.toLocaleString(), valueX - 20, yAfterTable, { align: 'right' });
      // VAT/PPN row
      doc.text('VAT/PPN', labelX, yAfterTable + rowHeight);
      doc.text('Rp', currencyX, yAfterTable + rowHeight, { align: 'right' });
      doc.text(vat.toLocaleString(), valueX - 20, yAfterTable + rowHeight, { align: 'right' });
      // Draw line below VAT/PPN (thinner)
      doc.setLineWidth(0.3);
      doc.line(currencyX - 6, yAfterTable + rowHeight + 3, valueX - 10, yAfterTable + rowHeight + 3);
      // TOTAL row (bold, but smaller font)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL', labelX, yAfterTable + rowHeight * 2 + 6);
      doc.text('Rp', currencyX, yAfterTable + rowHeight * 2 + 6, { align: 'right' });
      doc.text(total.toLocaleString(), valueX - 20, yAfterTable + rowHeight * 2 + 6, { align: 'right' });
      // Draw double line below TOTAL (thinner)
      doc.setLineWidth(0.3);
      doc.line(currencyX - 6, yAfterTable + rowHeight * 2 + 10, valueX - 10, yAfterTable + rowHeight * 2 + 10);
      doc.setLineWidth(0.3);
      doc.line(currencyX - 6, yAfterTable + rowHeight * 2 + 10.5, valueX - 10, yAfterTable + rowHeight * 2 + 10.5);

      // --- FOOTER ---
      let yFooter = yAfterTable + 25 + paymentSectionExtraOffset;
      // Draw a horizontal line above the payment section
      doc.setLineWidth(0.5);
      doc.line(10, yFooter - 3.5, 200, yFooter - 3.5); // A4 width is 210mm. This is the bottom long line
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('All payment should be made in full Amount', 10, yFooter);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Make all checks payable to :', 10, yFooter + 5);
// Set font to Helvetica Bold
/*added */
doc.setFont('helvetica', 'bold');

// Define company name text and position
const companyNameText = company ? company.company_name : 'Company Name Not Found';
const companyNameXPosition = 22;
const companyNameYPosition = yFooter + 13;

// Draw the company name text
doc.text(companyNameText, companyNameXPosition, companyNameYPosition);

// Calculate text width for underline
const companyNameTextWidth = doc.getTextWidth(companyNameText);
const underlineOffsetFromText = 1.5;
const underlineYPosition = companyNameYPosition + underlineOffsetFromText;

// Draw underline below company name
doc.line(
  companyNameXPosition,
  underlineYPosition - 1,
  companyNameXPosition + companyNameTextWidth,
  underlineYPosition - 1
);

      /*added */
      doc.setFont('helvetica', 'normal');
      let yBank = yFooter + 21;
      if (Array.isArray(banks) && selectedBanks.every(id => banks.some(b => b.bank_id === id))) {
        selectedBanks.forEach((bankId) => {
          const bank = banks.find(b => b.bank_id === bankId);
          if (bank) {
            doc.text(`Bank ${bank.bank_name} - ${bank.bank_address}`, 10, yBank);
            yBank += 6;
            doc.text(`A/C # ${bank.acc_number} (${bank.currency})`, 10, yBank);
            yBank += 7;
          }
        });
      }

      // --- Finance Signature Section ---
      // Place signature block on the right side, aligned with yBank
      const signatureX = 150; // right side
      let signatureY = yFooter + 21; // align with yBank start
      // Company name (a little space above)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      // doc.text(company ? company.company_name : 'Company Name Not Found', signatureX, signatureY);
      // signatureY += 16; // space between company name and signature
      // Nur Liani (underlined)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.7);
      doc.text('Nur Liani', signatureX + 20, signatureY +15, { align: 'left' });
      // Underline Nur Liani
      const nameWidth = doc.getTextWidth('Nur Liani');
      doc.setLineWidth(0.5);
      doc.line(signatureX + 20, signatureY + 15.5, signatureX + nameWidth + 20, signatureY + 15.5);
      // Finance below underline
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Finance', signatureX + 20, signatureY + 19, { align: 'left' });

      doc.save(`invoice_${selectedInvoice.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Add debug logging before filtering
  console.log({ invoices, customerFilter, statusFilter, searchQuery });

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => {
    // If no filters, show all
    if (!customerFilter && !statusFilter && !searchQuery) return true;
    const customerMatch = customerFilter ? String(inv.cust_id) === String(customerFilter) : true;
    const statusMatch = statusFilter ? inv.status === statusFilter : true;
    const searchMatch = searchQuery
      ? inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return customerMatch && statusMatch && searchMatch;
  }) : [];

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
            {Array.isArray(customers) && customers.map(c => (
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
                  {Array.isArray(banks) && banks.map((bank) => (
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