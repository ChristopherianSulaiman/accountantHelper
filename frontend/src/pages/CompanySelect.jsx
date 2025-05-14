import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CompanyContext } from '../App';
import axios from '../utils/axios';

const companies = [
  { code: 'DKLS', name: 'DKLS' },
  { code: 'TAS', name: 'TAS' },
  { code: 'DIGISAT', name: 'DigiSAT' },
  { code: 'DIGINET', name: 'DigiNet' },
];

const CompanySelect = () => {
  const navigate = useNavigate();
  const { setCompanyCode } = useContext(CompanyContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompanySelect = async (code) => {
    console.log('Selecting company:', code);
    setLoading(true);
    setError('');
    try {
      // Create a new axios instance for this request to avoid interceptor issues
      const response = await axios({
        method: 'get',
        url: '/api/company',
        headers: {
          'x-company-code': code,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Company info response:', response.data);
      
      // Set the company code in context and localStorage
      setCompanyCode(code);
      localStorage.setItem('companyCode', code);
      
      // Navigate to dashboard
      console.log('Navigating to dashboard...');
      navigate('/');
    } catch (err) {
      console.error('Company selection error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to select company. Please try again.');
      // Clear any existing company code on error
      localStorage.removeItem('companyCode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Select Your Company
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Please select your company to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {companies.map((company) => (
              <Grid item xs={12} sm={6} key={company.code}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => handleCompanySelect(company.code)}
                  disabled={loading}
                  sx={{
                    height: 100,
                    fontSize: '1.2rem',
                    textTransform: 'none',
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : company.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanySelect; 