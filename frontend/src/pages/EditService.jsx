import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../components/CompanyContext';
import axios from 'axios';

const serviceTypes = [
  'internet',
  'connectivity',
  'hosting',
  'cloud',
  'security',
  'maintenance'
];

const EditService = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { company } = useCompany();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    service_type: '',
    service_name: '',
    nrc: '',
    mrc: '',
    start_date: '',
    end_date: '',
    cust_id: ''
  });

  useEffect(() => {
    if (!company) return;
    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/customers?company_id=${company.company_id}`);
        setCustomers(response.data);
      } catch (error) {
        setError('Failed to load customers. Please try again.');
      }
    };
    fetchCustomers();

    // Fetch service data
    const fetchService = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/services/${id}`);
        const data = response.data;
        setFormData({
          service_type: data.service_type,
          service_name: data.service_name,
          nrc: data.nrc,
          mrc: data.mrc,
          start_date: data.start_date.split('T')[0], // Convert to YYYY-MM-DD format
          end_date: data.end_date.split('T')[0], // Convert to YYYY-MM-DD format
          cust_id: data.cust_id
        });
      } catch (error) {
        setError('Failed to load service. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, company]);

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
      await axios.put(`http://localhost:3000/api/services/${id}`, {
        ...formData,
        company_id: company.company_id
      });
      navigate('/services');
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service. Please try again.');
    }
  };

  if (!company) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Please select a company to edit services.</Typography>
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
        <Typography variant="h4">Edit Service</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/services')}
        >
          Back to Services
        </Button>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Service Type</InputLabel>
                  <Select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    label="Service Type"
                  >
                    {serviceTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
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
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="cust_id"
                    value={formData.cust_id}
                    onChange={handleInputChange}
                    label="Customer"
                  >
                    {customers.map(customer => (
                      <MenuItem key={customer.cust_id} value={customer.cust_id}>
                        {customer.cust_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Update Service
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default EditService; 