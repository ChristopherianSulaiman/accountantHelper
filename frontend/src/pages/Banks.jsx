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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// Bank row component for expandable rows
const BankRow = ({ bank, onEdit, onDelete }) => {
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
          <IconButton color="primary" size="small" onClick={() => onEdit(bank)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small" onClick={() => onDelete(bank)}>
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
  const [editingBank, setEditingBank] = useState(null);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);

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
      if (editingBank) {
        // Edit mode
        await axios.put(`http://localhost:3000/api/banks/${editingBank.bank_id}`, formData);
      } else {
        // Create mode
        await axios.post('http://localhost:3000/api/banks', formData);
      }
      setShowForm(false);
      setEditingBank(null);
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
      console.error('Error saving bank:', error);
      setError('Failed to save bank. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name || '',
      bank_address: bank.bank_address || '',
      bank_code: bank.bank_code || '',
      swift_code: bank.swift_code || '',
      iban_code: bank.iban_code || '',
      currency: bank.currency || '',
      acc_number: bank.acc_number || '',
      type: bank.type || ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBank(null);
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
  };

  const handleDelete = (bank) => {
    setBankToDelete(bank);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bankToDelete) return;
    try {
      await axios.delete(`http://localhost:3000/api/banks/${bankToDelete.bank_id}`);
      console.log("here");
      setDeleteDialogOpen(false);
      setBankToDelete(null);
      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
      setError('Failed to delete bank. Please try again.');
      console.log(error);
      setDeleteDialogOpen(false);
      setBankToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setBankToDelete(null);
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
          onClick={() => { setShowForm(!showForm); setEditingBank(null); }}
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
            {editingBank ? 'Edit Bank' : 'Add New Bank'}
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
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" color="primary">
                {editingBank ? 'Update Bank' : 'Create Bank'}
              </Button>
              {editingBank && (
                <Button variant="outlined" color="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </form>
        </Card>
      )}

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
            {banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No banks found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              banks.map((bank) => (
                <BankRow key={bank.bank_id} bank={bank} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Bank</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the bank "{bankToDelete?.bank_name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="secondary">Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Banks; 