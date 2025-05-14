import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext();

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem('selectedCompany');
    if (stored) setCompany(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (company) {
      localStorage.setItem('selectedCompany', JSON.stringify(company));
    }
  }, [company]);

  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
} 