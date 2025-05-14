import React, { createContext, useState, useContext, useEffect } from 'react';

const CompanyContext = createContext();

export const companies = [
  { id: 1, code: 'DKLS', name: 'DKLS' },
  { id: 2, code: 'TAS', name: 'TAS' },
  { id: 3, code: 'DIGISAT', name: 'DigiSAT' },
  { id: 4, code: 'DIGINET', name: 'DigiNet' }
];

export const CompanyProvider = ({ children }) => {
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    return savedCompany ? companies.find(c => c.code === savedCompany) : companies[0];
  });

  useEffect(() => {
    localStorage.setItem('selectedCompany', selectedCompany.code);
  }, [selectedCompany]);

  const switchCompany = (company) => {
    setSelectedCompany(company);
  };

  return (
    <CompanyContext.Provider value={{ selectedCompany, switchCompany, companies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}; 