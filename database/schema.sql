-- Drop database if exists and create new one
DROP DATABASE IF EXISTS fullstack_app;
CREATE DATABASE fullstack_app;
USE fullstack_app;

-- Company Table
-- CREATE TABLE companies (
--     company_id INT PRIMARY KEY AUTO_INCREMENT,
--     company_name VARCHAR(255) NOT NULL,
--     company_address TEXT NOT NULL
-- );

-- Customer Table
CREATE TABLE IF NOT EXISTS customers (
    cust_id INT PRIMARY KEY AUTO_INCREMENT,
    cust_name VARCHAR(255) NOT NULL,
    cust_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    type ENUM('customer', 'company') NOT NULL
);

-- Service Table
CREATE TABLE services (
    service_id INT PRIMARY KEY AUTO_INCREMENT,
    service_type ENUM('internet', 'connectivity', 'hosting', 'cloud', 'security', 'maintenance') NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    nrc DECIMAL(10,2) NOT NULL,
    mrc DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cust_id INT NOT NULL,
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id)
);

-- Invoice Table
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    cust_id INT NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (cust_id) REFERENCES customers(cust_id)
);

CREATE TABLE IF NOT EXISTS invoice_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    service_id INT NOT NULL,
    qty INT NOT NULL,
    customer_po VARCHAR(50) NOT NULL UNIQUE,
    -- status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);
