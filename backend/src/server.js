const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fullstack_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
  try {
    const [services] = await pool.execute(`
      SELECT s.*, c.cust_name 
      FROM services s
      LEFT JOIN customers c ON s.cust_id = c.cust_id
      ORDER BY s.start_date DESC
    `);
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// Create service endpoint
app.post('/api/services', async (req, res) => {
  try {
    const { service_type, service_name, nrc, mrc, start_date, end_date, cust_id } = req.body;
    
    if (!cust_id) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO services (service_type, service_name, nrc, mrc, start_date, end_date, cust_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [service_type, service_name, nrc, mrc, start_date, end_date, cust_id]
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

// Get all invoices endpoint
app.get('/api/invoices', async (req, res) => {
  try {
    console.log('Fetching invoices...');
    
    // Get invoices with their descriptions
    const [invoices] = await pool.execute(`
      SELECT 
        i.*,
        COALESCE(
          GROUP_CONCAT(
            JSON_OBJECT(
              'id', d.id,
              'accountNumber', d.account_number,
              'description', d.description,
              'amount', d.amount,
              'tax', d.tax
            ) SEPARATOR ','
          ),
          '[]'
        ) as descriptions
      FROM invoices i
      LEFT JOIN invoice_descriptions d ON i.id = d.invoice_id
      GROUP BY i.id
      ORDER BY i.date DESC
    `);

    console.log('Raw invoices data:', JSON.stringify(invoices, null, 2));

    // Parse the descriptions JSON strings
    const formattedInvoices = invoices.map(invoice => {
      let descriptions = [];
      try {
        if (!invoice.descriptions || invoice.descriptions === '[]') {
          descriptions = [];
        } else if (invoice.descriptions.startsWith('[')) {
          descriptions = JSON.parse(invoice.descriptions);
        } else {
          // Handle comma-separated JSON objects
          descriptions = JSON.parse(`[${invoice.descriptions}]`);
        }
      } catch (error) {
        console.error('Error parsing descriptions for invoice', invoice.id, error);
        descriptions = [];
      }

      const result = {
        ...invoice,
        descriptions: descriptions.filter(desc => desc && desc.id !== null) // Filter out null descriptions
      };
      console.log('Formatted invoice', invoice.id, 'descriptions:', JSON.stringify(result.descriptions, null, 2));
      return result;
    });

    console.log('Formatted invoices:', JSON.stringify(formattedInvoices, null, 2));
    res.json(formattedInvoices);
  } catch (error) {
    console.error('Detailed error in /api/invoices:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Error fetching invoices',
      error: error.message 
    });
  }
});

// Create invoice endpoint
app.post('/api/invoices', async (req, res) => {
  try {
    const { invoiceNumber, customer, date, customerPo, descriptions } = req.body;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert invoice
      const [invoiceResult] = await connection.execute(
        'INSERT INTO invoices (invoice_number, customer, date, customer_po, due_date, amount) VALUES (?, ?, ?, ?, NULL, NULL)',
        [invoiceNumber, customer, date, customerPo]
      );

      const invoiceId = invoiceResult.insertId;

      // Insert descriptions
      for (const desc of descriptions) {
        await connection.execute(
          'INSERT INTO invoice_descriptions (invoice_id, account_number, description, amount, tax) VALUES (?, ?, ?, ?, ?)',
          [invoiceId, desc.accountNumber, desc.description, desc.amount, desc.tax]
        );
      }

      await connection.commit();
      res.status(201).json({
        message: 'Invoice created successfully',
        invoiceId: invoiceId
      });
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
  try {
    const [customers] = await pool.execute('SELECT * FROM customers ORDER BY cust_id DESC');
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Create customer endpoint
app.post('/api/customers', async (req, res) => {
  try {
    const { cust_name, cust_address } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO customers (cust_name, cust_address) VALUES (?, ?)',
      [cust_name, cust_address]
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

// Get all banks endpoint
app.get('/api/banks', async (req, res) => {
  try {
    const [banks] = await pool.execute('SELECT * FROM banks ORDER BY bank_id DESC');
    res.json(banks);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ message: 'Error fetching banks' });
  }
});

// Create bank endpoint
app.post('/api/banks', async (req, res) => {
  try {
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
      'INSERT INTO banks (bank_name, bank_address, bank_code, swift_code, iban_code, currency, acc_number, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [bank_name, bank_address, bank_code, swift_code, iban_code, currency, acc_number, type]
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 