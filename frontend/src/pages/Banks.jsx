import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
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
  Collapse,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

// Bank row component for expandable rows
const BankRow = ({ bank }) => {
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
        <TableCell>{bank.bank_name}</TableCell>
        <TableCell>{bank.acc_number}</TableCell>
        <TableCell>{bank.currency}</TableCell>
        <TableCell>{bank.type}</TableCell>
        <TableCell>
          <IconButton color="primary" size="small">
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Bank Address:</strong> {bank.bank_address}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Bank Code:</strong> {bank.bank_code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>SWIFT Code:</strong> {bank.swift_code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>IBAN Code:</strong> {bank.iban_code}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Banks = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_address: '',
    bank_code: '',
    swift_code: '',
    iban_code: '',
    currency: '',
    acc_number: '',
    type: ''
  });

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/banks');
      setBanks(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching banks:', error);
      setError('Failed to load banks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/banks', formData);
      setShowForm(false);
      setFormData({
        bank_name: '',
        bank_address: '',
        bank_code: '',
        swift_code: '',
        iban_code: '',
        currency: '',
        acc_number: '',
        type: ''
      });
      fetchBanks();
    } catch (error) {
      console.error('Error creating bank:', error);
      setError('Failed to create bank. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Banks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          New Bank
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Bank
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Address"
                  name="bank_address"
                  value={formData.bank_address}
                  onChange={handleChange}
                  required
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Code"
                  name="bank_code"
                  value={formData.bank_code}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SWIFT Code"
                  name="swift_code"
                  value={formData.swift_code}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IBAN Code"
                  name="iban_code"
                  value={formData.iban_code}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  name="acc_number"
                  value={formData.acc_number}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Type"
                  >
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="company">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Create Bank
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Bank Name</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : banks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No banks found
                  </TableCell>
                </TableRow>
              ) : (
                banks.map((bank) => (
                  <BankRow key={bank.bank_id} bank={bank} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Banks; 