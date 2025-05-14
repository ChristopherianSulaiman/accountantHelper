import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/api/companies');
        setCompanies(response.data);
        // Set the first company as default if none is selected
        if (!selectedCompany && response.data.length > 0) {
          setSelectedCompany(response.data[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const switchCompany = (company) => {
    setSelectedCompany(company);
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        switchCompany,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}; 