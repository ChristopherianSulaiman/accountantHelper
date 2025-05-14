-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    company_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert the 4 companies
INSERT INTO companies (company_name, company_code) VALUES
('DKLS', 'DKLS'),
('TAS', 'TAS'),
('DigiSAT', 'DIGISAT'),
('DigiNet', 'DIGINET');

-- Modify existing tables to include company_id
ALTER TABLE customers ADD COLUMN company_id INT NOT NULL AFTER cust_id;
ALTER TABLE customers ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

ALTER TABLE services ADD COLUMN company_id INT NOT NULL AFTER service_id;
ALTER TABLE services ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

ALTER TABLE invoices ADD COLUMN company_id INT NOT NULL AFTER invoice_id;
ALTER TABLE invoices ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

ALTER TABLE invoice_services ADD COLUMN company_id INT NOT NULL AFTER invoice_service_id;
ALTER TABLE invoice_services ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

ALTER TABLE banks ADD COLUMN company_id INT NOT NULL AFTER bank_id;
ALTER TABLE banks ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

-- Add indexes for better performance
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_services_company ON services(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoice_services_company ON invoice_services(company_id);
CREATE INDEX idx_banks_company ON banks(company_id); 