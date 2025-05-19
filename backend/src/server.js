const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app', 'http://localhost:3000']
    : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fullstack_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// // Run migrations
// async function runMigrations() {
//   try {
//     const migrationPath = path.join(__dirname, 'config', 'migrations.sql');
//     const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
//     // Split the SQL file into individual statements
//     const statements = migrationSQL
//       .split(';')
//       .map(statement => statement.trim())
//       .filter(statement => statement.length > 0);
    
//     const connection = await pool.getConnection();
//     try {
//       // Execute each statement separately
//       for (const statement of statements) {
//         try {
//           await connection.query(statement);
//           console.log('Executed migration:', statement);
//         } catch (error) {
//           // If the error is about duplicate column, we can ignore it
//           if (error.code === 'ER_DUP_FIELDNAME') {
//             console.log('Column already exists, skipping migration');
//           } else {
//             throw error; // Re-throw other errors
//           }
//         }
//       }
//       console.log('All migrations completed successfully');
//     } finally {
//       connection.release();
//     }
//   } catch (error) {
//     console.error('Error running migrations:', error);
//   }
// }

// // Run migrations when server starts
// runMigrations();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Get all services endpoint
app.get('/api/services', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    const [services] = await pool.execute(
      `SELECT s.*, c.cust_name 
       FROM services s
       LEFT JOIN customers c ON s.cust_id = c.cust_id
       WHERE s.company_id = ?
       ORDER BY s.start_date DESC`,
      [company_id]
    );
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// Create service endpoint
app.post('/api/services', async (req, res) => {
  const { service_type, service_name, nrc, mrc, start_date, end_date, cust_id, company_id } = req.body;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO services (service_type, service_name, nrc, mrc, start_date, end_date, cust_id, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [service_type, service_name, nrc, mrc, start_date, end_date, cust_id, company_id]
    );
    res.status(201).json({
      message: 'Service created successfully',
      serviceId: result.insertId
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Error creating service' });
  }
});

// Update service endpoint
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { service_type, service_name, nrc, mrc, start_date, end_date, cust_id, company_id } = req.body;
    
    if (!company_id) {
      return res.status(400).json({ message: 'company_id is required' });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get the current service details to check for changes
      const [currentService] = await connection.execute(
        'SELECT cust_id, service_name FROM services WHERE service_id = ? AND company_id = ?',
        [id, company_id]
      );

      if (currentService.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Service not found' });
      }

      const oldCustomerId = currentService[0].cust_id;
      const oldServiceName = currentService[0].service_name;

      // If customer has changed, remove service from old customer's invoices
      if (oldCustomerId !== cust_id) {
        // Get all invoices for the old customer that have this service
        const [oldCustomerInvoices] = await connection.execute(
          'SELECT DISTINCT i.invoice_id FROM invoices i ' +
          'INNER JOIN invoice_services isv ON i.invoice_id = isv.invoice_id ' +
          'WHERE i.cust_id = ? AND isv.service_id = ? AND i.company_id = ?',
          [oldCustomerId, id, company_id]
        );

        // For each invoice, check if it will become empty after removing this service
        for (const invoice of oldCustomerInvoices) {
          // Count remaining services in this invoice
          const [remainingServices] = await connection.execute(
            'SELECT COUNT(*) as count FROM invoice_services WHERE invoice_id = ? AND service_id != ?',
            [invoice.invoice_id, id]
          );

          if (remainingServices[0].count === 0) {
            // If this is the only service, delete the entire invoice
            await connection.execute(
              'DELETE FROM invoices WHERE invoice_id = ?',
              [invoice.invoice_id]
            );
          } else {
            // Otherwise just remove this service from the invoice
            await connection.execute(
              'DELETE FROM invoice_services WHERE invoice_id = ? AND service_id = ?',
              [invoice.invoice_id, id]
            );
          }
        }
      }

      // Update the service
      const [result] = await connection.execute(
        'UPDATE services SET service_type = ?, service_name = ?, nrc = ?, mrc = ?, start_date = ?, end_date = ?, cust_id = ? WHERE service_id = ? AND company_id = ?',
        [service_type, service_name, nrc, mrc, start_date, end_date, cust_id, id, company_id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Service not found' });
      }

      // If service name has changed, update it in all related invoices
      if (oldServiceName !== service_name) {
        // The service name will automatically reflect in invoices since we're using JOINs
        // No need for additional updates as the service name is referenced from the services table
      }

      await connection.commit();
      res.json({
        message: 'Service updated successfully. Related invoices have been updated accordingly.',
        serviceId: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Error updating service' });
  }
});

// Delete service endpoint
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get all invoices that have this service
      const [invoicesWithService] = await connection.execute(
        'SELECT DISTINCT invoice_id FROM invoice_services WHERE service_id = ?',
        [id]
      );

      // For each invoice, check if it will become empty after removing this service
      for (const invoice of invoicesWithService) {
        // Count remaining services in this invoice
        const [remainingServices] = await connection.execute(
          'SELECT COUNT(*) as count FROM invoice_services WHERE invoice_id = ? AND service_id != ?',
          [invoice.invoice_id, id]
        );

        if (remainingServices[0].count === 0) {
          // If this is the only service, delete the entire invoice
          await connection.execute(
            'DELETE FROM invoices WHERE invoice_id = ?',
            [invoice.invoice_id]
          );
        }
      }

      // Remove the service from all invoice_services
      await connection.execute(
        'DELETE FROM invoice_services WHERE service_id = ?',
        [id]
      );

      // Finally delete the service
      const [result] = await connection.execute(
        'DELETE FROM services WHERE service_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Service not found' });
      }

      await connection.commit();
      res.json({
        message: 'Service deleted successfully. Related invoices have been updated accordingly.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error deleting service' });
  }
});

// Get all invoices endpoint
app.get('/api/invoices', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    // Get all invoices for the company
    const [invoices] = await pool.execute(
      `SELECT 
        i.invoice_id,
        i.invoice_number,
        i.cust_id,
        c.cust_name,
        i.status
      FROM invoices i
      LEFT JOIN customers c ON i.cust_id = c.cust_id
      WHERE i.company_id = ?
      ORDER BY i.invoice_id DESC`,
      [company_id]
    );
    // For each invoice, get its services
    for (const invoice of invoices) {
      const [services] = await pool.execute(
        `SELECT s.service_id, s.service_name, s.service_type, s.nrc, s.mrc, s.start_date, s.end_date, isv.qty, isv.customer_po
         FROM invoice_services isv
         LEFT JOIN services s ON isv.service_id = s.service_id
         WHERE isv.invoice_id = ?`,
        [invoice.invoice_id]
      );
      invoice.services = services;
    }
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get single invoice by ID
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get the invoice
    const [invoices] = await pool.execute(`
      SELECT i.invoice_id, i.invoice_number, i.cust_id, c.cust_name, i.status
      FROM invoices i
      LEFT JOIN customers c ON i.cust_id = c.cust_id
      WHERE i.invoice_id = ?
    `, [id]);
    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const invoice = invoices[0];
    // Get the services for this invoice
    const [services] = await pool.execute(`
      SELECT s.service_id, s.service_name, s.service_type, s.nrc, s.mrc, s.start_date, s.end_date, isv.qty, isv.customer_po
      FROM invoice_services isv
      LEFT JOIN services s ON isv.service_id = s.service_id
      WHERE isv.invoice_id = ?
    `, [id]);
    invoice.services = services;
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

// Update invoice endpoint (multi-service)
app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { invoice_number, cust_id, status, services } = req.body;
    // Check for duplicate invoice number, excluding current invoice
    const [existingInvoice] = await pool.execute(
      'SELECT * FROM invoices WHERE invoice_number = ? AND invoice_id != ?',
      [invoice_number, id]
    );
    if (existingInvoice.length > 0) {
      return res.status(400).json({ 
        message: 'Invoice update failed',
        error: 'An invoice with this invoice number already exists'
      });
    }
    // Check for duplicate customer PO in any of the services (excluding this invoice)
    for (const service of services) {
      const [existingPO] = await pool.execute(
        'SELECT * FROM invoice_services WHERE customer_po = ? AND invoice_id != ?',
        [service.customer_po, id]
      );
      if (existingPO.length > 0) {
        return res.status(400).json({ 
          message: 'Invoice update failed',
          error: `An invoice with customer PO ${service.customer_po} already exists`
        });
      }
    }
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      // Update invoice
      await connection.execute(
        'UPDATE invoices SET invoice_number = ?, cust_id = ?, status = ? WHERE invoice_id = ?',
        [invoice_number, cust_id, status, id]
      );
      // Delete old invoice_services
      await connection.execute(
        'DELETE FROM invoice_services WHERE invoice_id = ?',
        [id]
      );
      // Insert new invoice_services
      for (const service of services) {
        await connection.execute(
          'INSERT INTO invoice_services (invoice_id, service_id, qty, customer_po, company_id) VALUES (?, ?, ?, ?, ?)',
          [id, service.service_id, service.qty, service.customer_po, service.company_id]
        );
      }
      await connection.commit();
      res.json({ message: 'Invoice updated successfully', invoiceId: id });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ 
      message: 'Invoice update failed',
      error: 'An unexpected error occurred while updating the invoice'
    });
  }
});

// Delete invoice endpoint
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM invoices WHERE invoice_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice' });
  }
});

// Create invoice endpoint (multi-service)
app.post('/api/invoices', async (req, res) => {
  const { invoice_number, cust_id, status, services, company_id } = req.body;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    // Relaxed validation: just require a non-empty string
    if (!invoice_number || typeof invoice_number !== 'string') {
      return res.status(400).json({ message: 'Invoice number is required.' });
    }

    // Check for duplicate invoice number
    const [existingInvoice] = await pool.execute(
      'SELECT * FROM invoices WHERE invoice_number = ?',
      [invoice_number]
    );
    if (existingInvoice.length > 0) {
      return res.status(400).json({ message: 'An invoice with this invoice number already exists' });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      // Insert invoice
      const [result] = await connection.execute(
        'INSERT INTO invoices (invoice_number, cust_id, status, company_id) VALUES (?, ?, ?, ?)',
        [invoice_number, cust_id, status, company_id]
      );
      const invoiceId = result.insertId;

      // Insert invoice_services
      for (const service of services) {
        await connection.execute(
          'INSERT INTO invoice_services (invoice_id, service_id, qty, customer_po, company_id) VALUES (?, ?, ?, ?, ?)',
          [invoiceId, service.service_id, service.qty, service.customer_po, service.company_id]
        );
      }

      await connection.commit();
      res.status(201).json({ message: 'Invoice created successfully', invoiceId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

// Get all customers endpoint
app.get('/api/customers', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    const [customers] = await pool.execute('SELECT * FROM customers WHERE company_id = ? ORDER BY cust_id DESC', [company_id]);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Create customer endpoint
app.post('/api/customers', async (req, res) => {
  const { cust_name, cust_address, email, phone_number, company_id } = req.body;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO customers (cust_name, cust_address, email, phone_number, company_id) VALUES (?, ?, ?, ?, ?)',
      [cust_name, cust_address, email, phone_number, company_id]
    );
    res.status(201).json({
      message: 'Customer created successfully',
      customerId: result.insertId
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer' });
  }
});

// Update customer endpoint
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cust_name, cust_address, email, phone_number } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE customers SET cust_name = ?, cust_address = ?, email = ?, phone_number = ? WHERE cust_id = ?',
      [cust_name, cust_address, email, phone_number, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({
      message: 'Customer updated successfully',
      customerId: id
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer' });
  }
});

// Delete customer endpoint
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First delete related invoice_services
      await connection.execute(
        'DELETE isv FROM invoice_services isv ' +
        'INNER JOIN invoices i ON isv.invoice_id = i.invoice_id ' +
        'WHERE i.cust_id = ?',
        [id]
      );

      // Then delete related invoices
      await connection.execute(
        'DELETE FROM invoices WHERE cust_id = ?',
        [id]
      );

      // Then delete related services
      await connection.execute(
        'DELETE FROM services WHERE cust_id = ?',
        [id]
      );

      // Finally delete the customer
      const [result] = await connection.execute(
        'DELETE FROM customers WHERE cust_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Customer not found' });
      }

      await connection.commit();
      res.json({
        message: 'Customer and all related records deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

// Get all banks endpoint
app.get('/api/banks', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    const [banks] = await pool.execute('SELECT * FROM banks WHERE company_id = ? ORDER BY bank_id DESC', [company_id]);
    res.json(banks);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ message: 'Error fetching banks' });
  }
});

// Create bank endpoint
app.post('/api/banks', async (req, res) => {
  const { bank_name, bank_address, bank_code, swift_code, iban_code, currency, acc_number, type, company_id } = req.body;
  if (!company_id) return res.status(400).json({ message: 'company_id is required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO banks (bank_name, bank_address, bank_code, swift_code, iban_code, currency, acc_number, type, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bank_name, bank_address, bank_code, swift_code, iban_code, currency, acc_number, type, company_id]
    );
    res.status(201).json({
      message: 'Bank created successfully',
      bankId: result.insertId
    });
  } catch (error) {
    console.error('Error creating bank:', error);
    res.status(500).json({ message: 'Error creating bank' });
  }
});

// Update bank endpoint
app.put('/api/banks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bank_name,
      bank_address,
      bank_code,
      swift_code,
      iban_code,
      currency,
      acc_number,
      type
    } = req.body;

    const [result] = await pool.execute(
      'UPDATE banks SET bank_name = ?, bank_address = ?, bank_code = ?, swift_code = ?, iban_code = ?, currency = ?, acc_number = ?, type = ? WHERE bank_id = ?',
      [bank_name, bank_address, bank_code, swift_code, iban_code, currency, acc_number, type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bank not found' });
    }

    res.json({
      message: 'Bank updated successfully',
      bankId: id
    });
  } catch (error) {
    console.error('Error updating bank:', error);
    res.status(500).json({ message: 'Error updating bank' });
  }
});

app.delete('/api/banks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM banks WHERE bank_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({ message: 'Error deleting bank' });
  }
});

// Get a single service by ID
app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [services] = await pool.execute(
      `SELECT * FROM services WHERE service_id = ?`,
      [id]
    );
    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(services[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Error fetching service' });
  }
});

// 1. Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const [companies] = await pool.execute('SELECT * FROM companies ORDER BY company_id');
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

// POST /api/companies - create a new company
app.post('/api/companies', async (req, res) => {
  const { company_name, company_address, phone_number, fax_number } = req.body;
  if (!company_name) return res.status(400).json({ message: 'company_name is required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO companies (company_name, company_address, phone_number, fax_number) VALUES (?, ?, ?, ?)',
      [company_name, company_address || '', phone_number || '', fax_number || '']
    );
    res.status(201).json({
      company_id: result.insertId,
      company: {
        company_id: result.insertId,
        company_name,
        company_address: company_address || '',
        phone_number: phone_number || '',
        fax_number: fax_number || ''
      }
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Error creating company' });
  }
});

// PUT /api/companies/:id - update a company
app.put('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  const { company_name, company_address, phone_number, fax_number } = req.body;
  if (!company_name) return res.status(400).json({ message: 'company_name is required' });
  try {
    const [result] = await pool.execute(
      'UPDATE companies SET company_name = ?, company_address = ?, phone_number = ?, fax_number = ? WHERE company_id = ?',
      [company_name, company_address || '', phone_number || '', fax_number || '', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({
      message: 'Company updated successfully',
      company: { 
        company_id: id, 
        company_name, 
        company_address: company_address || '',
        phone_number: phone_number || '',
        fax_number: fax_number || ''
      }
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Error updating company' });
  }
});

// DELETE /api/companies/:id - delete a company
app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM companies WHERE company_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Error deleting company' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 