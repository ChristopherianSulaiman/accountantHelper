import axios from 'axios';

// Create axios instance
const instance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000, // 5 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add company code to all requests
instance.interceptors.request.use((config) => {
  // Skip adding company code for the company selection endpoint
  if (config.url === '/api/company') {
    return config;
  }

  const companyCode = localStorage.getItem('companyCode');
  console.log('Making request with company code:', companyCode);
  
  if (companyCode) {
    config.headers['x-company-code'] = companyCode;
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Handle 401 errors (invalid company code)
instance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing company code and redirecting');
      localStorage.removeItem('companyCode');
      window.location.href = '/select-company';
    }
    return Promise.reject(error);
  }
);

export default instance; 