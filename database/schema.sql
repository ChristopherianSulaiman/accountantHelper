-- Drop database if exists and create new one
DROP DATABASE IF EXISTS fullstack_app;
CREATE DATABASE fullstack_app;
USE fullstack_app;

-- Company Table
CREATE TABLE IF NOT EXISTS companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    phone_number VARCHAR(20),
    fax_number VARCHAR(20)
);

-- Insert DIGISAT as the default company
INSERT INTO companies (company_name, company_address, phone_number, fax_number)
VALUES ('DIGISAT', 'Cyber building 7th Floor Jl. Kuningan Barat No. 8 Mampang Prapatan, Jkarta - INDONESIA 12710', '+62 21 5221908', '+62 21 5260617');

-- Customer Table
CREATE TABLE IF NOT EXISTS customers (
    cust_id INT PRIMARY KEY AUTO_INCREMENT,
    cust_name VARCHAR(255) NOT NULL,
    cust_address TEXT NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Bank Table
CREATE TABLE banks (
    bank_id INT PRIMARY KEY AUTO_INCREMENT,
    bank_name VARCHAR(255) NOT NULL,
    bank_address TEXT NOT NULL,
    bank_code VARCHAR(50),
    swift_code VARCHAR(11),
    iban_code VARCHAR(34),
    currency VARCHAR(3) NOT NULL,
    acc_number VARCHAR(50) NOT NULL,
    type ENUM('customer', 'company') NOT NULL,
    company_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Service Table
CREATE TABLE services (
    service_id INT PRIMARY KEY AUTO_INCREMENT,
    service_type ENUM('internet', 'connectivity', 'hosting', 'cloud', 'security', 'maintenance') NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    nrc DECIMAL(20,2) NOT NULL,
    mrc DECIMAL(20,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cust_id INT NOT NULL,
    company_id INT NOT NULL,
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Invoice Table
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    cust_id INT NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
    company_id INT NOT NULL,
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Invoice Services Table
CREATE TABLE IF NOT EXISTS invoice_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    service_id INT NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    customer_po VARCHAR(50) NOT NULL UNIQUE,
    company_id INT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);