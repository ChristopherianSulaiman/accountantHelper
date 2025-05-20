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
  Collapse,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import axios from 'axios';
import InputAdornment from '@mui/material/InputAdornment';
import { useCompany } from '../components/CompanyContext';

const ServiceRow = ({ service, onDelete }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    try {
      const dateOnly = dateString.split('T')[0];
      return format(parse(dateOnly, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      internet: '#4285F4',
      connectivity: '#34A853',
      hosting: '#FBBC05',
      cloud: '#7986CB',
      security: '#EA4335',
      maintenance: '#9C27B0'
    };
    return colors[type] || '#757575';
  };

  return (
    <>
      <TableRow sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
        <TableCell>
          <Chip 
            label={service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1)}
            sx={{ 
              bgcolor: getServiceTypeColor(service.service_type),
              color: 'white',
              fontWeight: 500
            }}
            size="small"
          />
        </TableCell>
        <TableCell>{service.service_name}</TableCell>
        <TableCell>{service.cust_name}</TableCell>
        <TableCell align="right">Rp{parseFloat(service.nrc).toFixed(2)}</TableCell>
        <TableCell align="right">Rp{parseFloat(service.mrc).toFixed(2)}</TableCell>
        <TableCell>{formatDate(service.start_date)}</TableCell>
        <TableCell>{formatDate(service.end_date)}</TableCell>
        <TableCell>
          <IconButton
            color="primary"
            onClick={() => navigate(`/services/edit/${service.service_id}`)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => onDelete(service.service_id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Service Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Service Name</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">NRC</TableCell>
                    <TableCell align="right">MRC</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1)}</TableCell>
                    <TableCell>{service.service_name}</TableCell>
                    <TableCell>{service.cust_name}</TableCell>
                    <TableCell align="right">Rp{parseFloat(service.nrc).toFixed(2)}</TableCell>
                    <TableCell align="right">Rp{parseFloat(service.mrc).toFixed(2)}</TableCell>
                    <TableCell>{formatDate(service.start_date)}</TableCell>
                    <TableCell>{formatDate(service.end_date)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Services = () => {
  const { company } = useCompany();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    service_type: '',
    service_name: '',
    nrc: '',
    mrc: '',
    start_date: '',
    end_date: '',
    cust_id: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('earliest');

  const serviceTypes = [
    'internet',
    'connectivity',
    'hosting',
    'cloud',
    'security',
    'maintenance'
  ];

  useEffect(() => {
    if (!company) return;
    fetchServices();
    fetchCustomers();
  }, [company]);

  const fetchServices = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/services?company_id=${company.company_id}`);
      setServices(response.data);
    } catch (error) {
      setError('Failed to load services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!company) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers?company_id=${company.company_id}`);
      setCustomers(response.data);
    } catch (error) {
      setError('Failed to load customers. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/services`, { ...formData, company_id: company.company_id });
      setShowForm(false);
      setFormData({
        service_type: '',
        service_name: '',
        nrc: '',
        mrc: '',
        start_date: '',
        end_date: '',
        cust_id: ''
      });
      fetchServices();
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Failed to create service. Please try again.');
    }
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service? This will also delete all related invoices.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/services/${serviceId}`, { data: { company_id: company.company_id } });
        fetchServices(); // Refresh the services list
      } catch (error) {
        console.error('Error deleting service:', error);
        setError('Failed to delete service. Please try again.');
      }
    }
  };

  const filteredServices = services.filter(service => {
    const nameMatch = service.service_name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const customerMatch = customerFilter ? String(service.cust_id) === String(customerFilter) : true;
    const typeMatch = serviceTypeFilter ? service.service_type === serviceTypeFilter : true;
    return nameMatch && customerMatch && typeMatch;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    const dateA = new Date(a.end_date);
    const dateB = new Date(b.end_date);
    if (sortOrder === 'earliest') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  if (!company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Please select a company to view services.</Typography>
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
          <BuildIcon sx={{ color: 'primary.main' }} />
          Services
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormData({
              service_type: '',
              service_name: '',
              nrc: '',
              mrc: '',
              start_date: '',
              end_date: '',
              cust_id: ''
            });
            setShowForm(!showForm);
          }}
          sx={{ borderRadius: '8px' }}
        >
          {showForm ? 'Cancel' : 'New Service'}
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              placeholder="Search by service name..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={customerFilter}
                label="Customer"
                onChange={e => setCustomerFilter(e.target.value)}
                startAdornment={<BusinessIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map(c => (
                  <MenuItem key={c.cust_id} value={String(c.cust_id)}>{c.cust_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Service Type</InputLabel>
              <Select
                value={serviceTypeFilter}
                label="Service Type"
                onChange={e => setServiceTypeFilter(e.target.value)}
                startAdornment={<FilterIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
              >
                <MenuItem value="">All Types</MenuItem>
                {serviceTypes.map(type => (
                  <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort by End Date</InputLabel>
              <Select
                value={sortOrder}
                label="Sort by End Date"
                onChange={e => setSortOrder(e.target.value)}
                startAdornment={<CalendarIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
              >
                <MenuItem value="earliest">Earliest to Latest</MenuItem>
                <MenuItem value="latest">Latest to Earliest</MenuItem>
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
            <AddIcon />
            Add New Service
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="service-type-label">Service Type</InputLabel>
                  <Select
                    labelId="service-type-label"
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    label="Service Type"
                    startAdornment={<BuildIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
                  >
                    <MenuItem value="internet">Internet</MenuItem>
                    <MenuItem value="connectivity">Connectivity</MenuItem>
                    <MenuItem value="hosting">Hosting</MenuItem>
                    <MenuItem value="cloud">Cloud</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Service Name"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="NRC"
                  name="nrc"
                  type="number"
                  value={formData.nrc}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MRC"
                  name="mrc"
                  type="number"
                  value={formData.mrc}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="customer-label">Customer</InputLabel>
                  <Select
                    labelId="customer-label"
                    name="cust_id"
                    value={formData.cust_id}
                    onChange={handleInputChange}
                    label="Customer"
                    startAdornment={<BusinessIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} fontSize="small" />}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300
                        }
                      }
                    }}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.cust_id} value={customer.cust_id}>
                        {customer.cust_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button type="submit" variant="contained" color="primary" sx={{ mr: 2, borderRadius: '8px' }}>
                  Create Service
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setShowForm(false)}
                  sx={{ borderRadius: '8px' }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Service Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Service Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>NRC</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>MRC</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <BuildIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">No services available</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedServices.map((service) => (
                    <ServiceRow 
                      key={service.service_id} 
                      service={service}
                      onDelete={handleDelete}
                    />
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

export default Services; 