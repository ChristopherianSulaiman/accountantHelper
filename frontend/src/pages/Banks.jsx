import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Collapse,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  AccountBalance as BankIcon,
  Euro as CurrencyIcon,
  BusinessCenter as BusinessIcon,
  CreditCard as CardIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useCompany } from '../components/CompanyContext';

// Bank row component for expandable rows
const BankRow = ({ bank, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  const getTypeColor = (type) => {
    return type === 'company' ? '#4285F4' : '#34A853';
  };

  return (
    <>
      <TableRow sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BankIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="medium">{bank.bank_name}</Typography>
          </Box>
        </TableCell>
        <TableCell>{bank.acc_number}</TableCell>
        <TableCell>{bank.currency}</TableCell>
        <TableCell>
          <Chip
            label={bank.type.charAt(0).toUpperCase() + bank.type.slice(1)}
            size="small"
            sx={{
              bgcolor: getTypeColor(bank.type),
              color: 'white',
              fontWeight: 500
            }}
          />
        </TableCell>
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
            <Box sx={{ margin: 1, py: 2 }}>
              <Typography variant="h6" gutterBottom component="div" color="primary">
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <strong>Bank Address:</strong> {bank.bank_address}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardIcon fontSize="small" color="action" />
                    <strong>Bank Code:</strong> {bank.bank_code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CurrencyIcon fontSize="small" color="action" />
                    <strong>SWIFT Code:</strong> {bank.swift_code}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CurrencyIcon fontSize="small" color="action" />
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
  const { company } = useCompany();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (!company) return;
    fetchBanks();
  }, [company]);

  const fetchBanks = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/banks?company_id=${company.company_id}`);
      setBanks(response.data);
    } catch (error) {
      setError('Failed to load banks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    try {
      if (editingBank) {
        // Update existing bank
        await axios.put(`${API_BASE_URL}/api/banks/${editingBank.bank_id}`, {
          ...formData,
          company_id: company.company_id
        });
      } else {
        // Create new bank
        await axios.post(`${API_BASE_URL}/api/banks`, {
          ...formData,
          company_id: company.company_id
        });
      }
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
      setEditingBank(null);
      fetchBanks();
    } catch (error) {
      setError('Failed to ' + (editingBank ? 'update' : 'create') + ' bank. Please try again.');
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
      await axios.delete(`${API_BASE_URL}/api/banks/${bankToDelete.bank_id}`);
      setDeleteDialogOpen(false);
      setBankToDelete(null);
      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
      setError('Failed to delete bank. Please try again.');
      setDeleteDialogOpen(false);
      setBankToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setBankToDelete(null);
  };

  const filteredBanks = banks.filter(bank => {
    const nameMatch = bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = typeFilter ? bank.type === typeFilter : true;
    return nameMatch && typeMatch;
  });

  if (!company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Please select a company to view banks.</Typography>
      </Box>
    );
  }

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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BankIcon sx={{ color: 'primary.main' }} />
          Banks
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => { setShowForm(!showForm); setEditingBank(null); }}
          sx={{ borderRadius: '8px' }}
        >
          New Bank
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              placeholder="Search by bank name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={typeFilter}
                label="Account Type"
                onChange={e => setTypeFilter(e.target.value)}
                startAdornment={<BusinessIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Card sx={{ p: 3, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingBank ? <EditIcon /> : <AddIcon />}
            {editingBank ? 'Edit Bank' : 'Add New Bank'}
          </Typography>
          <Divider sx={{ mb: 2 }} />
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BankIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Code"
                  name="bank_code"
                  value={formData.bank_code}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SWIFT Code"
                  name="swift_code"
                  value={formData.swift_code}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IBAN Code"
                  name="iban_code"
                  value={formData.iban_code}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
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
                    startAdornment={<BusinessIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
                  >
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="company">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                sx={{ borderRadius: '8px' }}
              >
                {editingBank ? 'Update Bank' : 'Create Bank'}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCancel}
                sx={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Card>
      )}

      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ fontWeight: 'bold' }}>Bank Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Account Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Currency</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBanks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <BankIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">No banks found</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBanks.map((bank) => (
                    <BankRow key={bank.bank_id} bank={bank} onEdit={handleEdit} onDelete={handleDelete} />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={cancelDelete}
        PaperProps={{
          sx: { borderRadius: '8px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          Delete Bank
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the bank "{bankToDelete?.bank_name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={cancelDelete} color="secondary" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Banks; 