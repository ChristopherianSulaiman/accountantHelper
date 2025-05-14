-- Drop database if exists and create new one
DROP DATABASE IF EXISTS fullstack_app;
CREATE DATABASE fullstack_app;
USE fullstack_app;

-- Companies Table
CREATE TABLE companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    company_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert the four companies
INSERT INTO companies (company_name, company_code) VALUES
    ('DIGISAT', 'DIGISAT'),
    ('DIGINET', 'DIGINET'),
    ('DKLS', 'DKLS'),
    ('TAS', 'TAS');

-- Customer Table
CREATE TABLE customers (
    cust_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    cust_name VARCHAR(255) NOT NULL,
    cust_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Bank Table
CREATE TABLE banks (
    bank_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_address TEXT NOT NULL,
    bank_code VARCHAR(50),
    swift_code VARCHAR(11),
    iban_code VARCHAR(34),
    currency VARCHAR(3) NOT NULL,
    acc_number VARCHAR(50) NOT NULL,
    type ENUM('customer', 'company') NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Service Table
CREATE TABLE services (
    service_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    service_type ENUM('internet', 'connectivity', 'hosting', 'cloud', 'security', 'maintenance') NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    nrc DECIMAL(10,2) NOT NULL,
    mrc DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cust_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id)
);

-- Invoice Table
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    cust_id INT NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
    customer_po VARCHAR(255),
    due_date DATE NULL,
    amount DECIMAL(15,2) NULL,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id)
);

-- Invoice Services Table
CREATE TABLE invoice_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    invoice_id INT NOT NULL,
    service_id INT NOT NULL,
    qty INT NOT NULL,
    customer_po VARCHAR(50) NOT NULL UNIQUE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_services_company ON services(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoice_services_company ON invoice_services(company_id);
CREATE INDEX idx_banks_company ON banks(company_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 