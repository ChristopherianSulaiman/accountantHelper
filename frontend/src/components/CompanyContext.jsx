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
    if (stored) {
      const parsed = JSON.parse(stored);
      // If missing phone/fax, fetch from backend
      if (!parsed.phone_number || !parsed.fax_number) {
        // fetch(`http://localhost:3000/api/companies`)
          fetch(`${API_BASE_URL}/api/companies`)
          .then(res => res.json())
          .then(companies => {
            const found = companies.find(c => c.company_id === parsed.company_id);
            if (found) setCompany(found);
            else setCompany(parsed);
          })
          .catch(() => setCompany(parsed));
      } else {
        setCompany(parsed);
      }
    }
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