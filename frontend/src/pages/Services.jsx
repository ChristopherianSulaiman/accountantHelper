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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import axios from 'axios';

const ServiceRow = ({ service }) => {
  const [open, setOpen] = useState(false);

  const formatDate = (dateString) => {
    try {
      const dateOnly = dateString.split('T')[0];
      return format(parse(dateOnly, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <>
      <TableRow>
        <TableCell>
          {/* <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton> */}
        </TableCell>
        <TableCell>{service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1)}</TableCell>
        <TableCell>{service.service_name}</TableCell>
        <TableCell align="right">${parseFloat(service.nrc).toFixed(2)}</TableCell>
        <TableCell align="right">${parseFloat(service.mrc).toFixed(2)}</TableCell>
        <TableCell>{formatDate(service.start_date)}</TableCell>
        <TableCell>{formatDate(service.end_date)}</TableCell>
        <TableCell align="center">
          <IconButton size="small" color="primary">
            <ViewIcon />
          </IconButton>
          <IconButton size="small" color="primary">
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      {/* <TableRow>
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
                    <TableCell align="right">${parseFloat(service.nrc).toFixed(2)}</TableCell>
                    <TableCell align="right">${parseFloat(service.mrc).toFixed(2)}</TableCell>
                    <TableCell>{formatDate(service.start_date)}</TableCell>
                    <TableCell>{formatDate(service.end_date)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow> */}
    </>
  );
};

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    service_type: '',
    service_name: '',
    nrc: '',
    mrc: '',
    start_date: '',
    end_date: ''
  });

  const serviceTypes = [
    'internet',
    'connectivity',
    'hosting',
    'cloud',
    'security',
    'maintenance'
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again later.');
    } finally {
      setLoading(false);
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
      await axios.post('http://localhost:3000/api/services', formData);
      setShowForm(false);
      setFormData({
        service_type: '',
        service_name: '',
        nrc: '',
        mrc: '',
        start_date: '',
        end_date: ''
      });
      fetchServices();
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Failed to create service. Please try again.');
    }
  };

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
        <Typography variant="h4">Services</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'New Service'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Service Type
                  </Typography>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  >
                    <option value="">Select Type</option>
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Service Name
                  </Typography>
                  <input
                    type="text"
                    name="service_name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    NRC
                  </Typography>
                  <input
                    type="number"
                    step="0.01"
                    name="nrc"
                    value={formData.nrc}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    MRC
                  </Typography>
                  <input
                    type="number"
                    step="0.01"
                    name="mrc"
                    value={formData.mrc}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Start Date
                  </Typography>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    End Date
                  </Typography>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                    required
                  />
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Create Service
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Service Type</TableCell>
                  <TableCell>Service Name</TableCell>
                  <TableCell align="right">NRC</TableCell>
                  <TableCell align="right">MRC</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No services available
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <ServiceRow key={service.service_id} service={service} />
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