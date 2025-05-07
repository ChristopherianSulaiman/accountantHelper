-- Add customer_po column to invoices table
ALTER TABLE invoices ADD COLUMN customer_po VARCHAR(255);

-- Make due_date nullable
ALTER TABLE invoices MODIFY COLUMN due_date DATE NULL;

-- Make amount nullable
ALTER TABLE invoices MODIFY COLUMN amount DECIMAL(15,2) NULL; 