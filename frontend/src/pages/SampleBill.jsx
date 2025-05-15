import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon, PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SampleBill = () => {
  const handlePrint = () => {
    window.print();
  };

  const generateExcel = () => {
    // Data structure matching the image
    const wsData = [
      // Header rows
      [null, null, null, null, null, null, null, null, 'Invoice'],
      [null, null, null, null, null, null, null, null, ''],
      ['Billed To :', null, null, null, null, null, null, null, 'Invoice No. : DWI-20250074'],
      ['PT. HARMONI NETWORKS INDONESIA', null, null, null, null, null, null, null, 'Date : 4/7/25'],
      ['Taman Palem Lestari, Ruko Galaxy L No.39 RT.013 RW.008', null, null, null, null, null, null, null, 'Due Date : 30 days'],
      ['Cengkareng Jakarta Barat 11730', null, null, null, null, null, null, null, ''],
      ['Phone : -', null, null, null, null, null, null, null, ''],
      [],
      // Table header
      [
        'Description',
        'Period',
        'Unit Price',
        'Qty',
        'Amount',
        null, null, null, null
      ],
      // Table rows (sample, with grouping)
      ['PO # PO-HM-000011', null, null, null, null, null, null, null, null],
      ['Colocation Full Rack with Power @4 KW at Neucentrix Medan', '01/04/2025 - 30/04/2025', 'Rp 28,000,000', '5', 'Rp 140,000,000', null, null, null, null],
      ['PO # PO-HM-000017', null, null, null, null, null, null, null, null],
      ['Cross Connect 2 Pairs FO SMF LC-LC @Neucentrix Medan', '01/04/2025 - 30/04/2025', 'Rp 5,800,000', '1', 'Rp 5,800,000', null, null, null, null],
      // ... more rows as needed for the sample ...
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merged cells for header and section titles
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Company info left
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } },
      { s: { r: 9, c: 0 }, e: { r: 9, c: 4 } }, // Table header
    ];

    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, // Description
      { wch: 25 }, // Period
      { wch: 18 }, // Unit Price
      { wch: 8 },  // Qty
      { wch: 20 }, // Amount
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 30 }, // Invoice details
    ];

    // Style table header (yellow background, bold, centered, with borders)
    const tableHeaderRow = 8;
    const highlightCols = [0, 1, 2, 3, 4]; // Description, Period, Unit Price, Qty, Amount
    for (let c of highlightCols) {
      const cell = ws[XLSX.utils.encode_cell({ r: tableHeaderRow, c })];
      if (cell) {
        cell.s = {
          fill: { fgColor: { rgb: 'FFF200' } },
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
    }

    // Style PO rows (bold)
    [9, 11, 13].forEach((rowIdx) => {
      const cell = ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })];
      if (cell) {
        cell.s = { font: { bold: true } };
      }
    });

    // Style company name (bold)
    const companyCell = ws[XLSX.utils.encode_cell({ r: 3, c: 0 })];
    if (companyCell) companyCell.s = { font: { bold: true } };

    // Style "Invoice" title (large, bold)
    const invoiceTitleCell = ws[XLSX.utils.encode_cell({ r: 0, c: 8 })];
    if (invoiceTitleCell) invoiceTitleCell.s = { font: { bold: true, sz: 24 } };

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, 'sample_invoice.xlsx');
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Add 40mm (4cm) vertical offset to shift everything down
    const verticalOffset = 40;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. HARMONI NETWORKS INDONESIA', 14, 18 + verticalOffset);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Taman Palem Lestari, Ruko Galaxy L No.39 RT.013 RW.008', 14, 25 + verticalOffset);
    doc.text('Cengkareng Jakarta Barat 11730', 14, 31 + verticalOffset);
    doc.text('Phone : -', 14, 37 + verticalOffset);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 160, 18 + verticalOffset);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice No. : DWI-20250074', 160, 25 + verticalOffset);
    doc.text('Date : 4/7/25', 160, 31 + verticalOffset);
    doc.text('Due Date : 30 days', 160, 37 + verticalOffset);
    // Billed To
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To :', 14, 50 + verticalOffset);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. HARMONI NETWORKS INDONESIA', 14, 57 + verticalOffset);
    doc.setFont('helvetica', 'normal');
    doc.text('Taman Palem Lestari, Ruko Galaxy L No.39 RT.013 RW.008', 14, 63 + verticalOffset);
    doc.text('Cengkareng Jakarta Barat 11730', 14, 69 + verticalOffset);
    doc.text('Phone : -', 14, 75 + verticalOffset);
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
        { content: 'PO # PO-HM-000011', colSpan: 5, styles: { fontStyle: 'bold' } },
      ],
      [
        'Colocation Full Rack with Power @4 KW at Neucentrix Medan',
        '01/04/2025 - 30/04/2025',
        'Rp 28,000,000',
        '5',
        'Rp 140,000,000',
      ],
      [
        { content: 'PO # PO-HM-000017', colSpan: 5, styles: { fontStyle: 'bold' } },
      ],
      [
        'Cross Connect 2 Pairs FO SMF LC-LC @Neucentrix Medan',
        '01/04/2025 - 30/04/2025',
        'Rp 5,800,000',
        '1',
        'Rp 5,800,000',
      ],
    ];
    autoTable(doc, {
      startY: 85 + verticalOffset,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 242, 0], // Yellow
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        halign: 'left',
        valign: 'middle',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      styles: {
        cellPadding: 2,
        font: 'helvetica',
      },
      didParseCell: function (data) {
        if (data.row.raw && data.row.raw[0] && data.row.raw[0].colSpan) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    doc.save('sample_invoice.pdf');
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Sample Bill Format</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Sample
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={generateExcel}
          >
            Download Excel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PictureAsPdfIcon />}
            onClick={generatePDF}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      <Card className="invoice-print">
        <CardContent>
          {/* Company Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Company Name
            </Typography>
            <Typography variant="subtitle1">Company Address</Typography>
            <Typography variant="subtitle1">Phone: (123) 456-7890</Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Invoice Details */}
          <Grid container spacing={4}>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom>
                Bill To:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Customer Company Name
              </Typography>
              <Typography variant="body1">
                Customer Company Address
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" gutterBottom>
                  Invoice Details
                </Typography>
                <Typography variant="body1">
                  Invoice #: INV-2024-001
                </Typography>
                <Typography variant="body1">
                  PO #: PO-2024-001
                </Typography>
                <Typography variant="body1">
                  Date: January 1, 2024
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ my: 4 }}>
            <Typography variant="h6" gutterBottom>
              Service Period
            </Typography>
            <Typography variant="body1">
              From: January 1, 2024 to January 31, 2024
            </Typography>
          </Box>

          {/* Service Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Service Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  backgroundColor: '#f5f5f5'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Service Description
                  </Typography>
                  <Typography variant="body1">
                    Quantity: 1
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Charges */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Charges
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <Typography variant="body1">NRC (One-time Setup)</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1" align="right">
                  $1,000.00
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body1">MRC (Monthly Recurring)</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1" align="right">
                  $500.00
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Total */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Total Amount: $1,500.00
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-print, .invoice-print * {
              visibility: visible;
            }
            .invoice-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .MuiButton-root {
              display: none;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default SampleBill; 