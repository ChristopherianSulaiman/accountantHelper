-- Add customer_po column to invoices table
ALTER TABLE invoices ADD COLUMN customer_po VARCHAR(255);

-- Make due_date nullable
ALTER TABLE invoices MODIFY COLUMN due_date DATE NULL;
 
-- Make amount nullable
ALTER TABLE invoices MODIFY COLUMN amount DECIMAL(15,2) NULL;

-- Create invoice_services table for multi-service invoices
CREATE TABLE IF NOT EXISTS invoice_services (
  invoice_service_id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(invoice_id),
  service_id INTEGER REFERENCES services(service_id),
  qty INTEGER NOT NULL,
  customer_po VARCHAR(255)
);

-- Remove service_id and qty from invoices table (if they exist)
ALTER TABLE invoices DROP COLUMN IF EXISTS service_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS qty;

-- Remove customer_po column from invoices table (if it exists)
ALTER TABLE invoices DROP COLUMN IF EXISTS customer_po; 