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
    // Get invoices with their descriptions and related information
    const [invoices] = await pool.execute(`
      SELECT 
        i.invoice_id,
        i.invoice_number,
        i.customer_po,
        c.cust_name,
        s.service_name,
        s.service_type,
        i.qty,
        i.status,
        COALESCE(
          GROUP_CONCAT(
            JSON_OBJECT(
              'service_id', d.service_id,
              'service_name', ds.service_name,
              'service_type', ds.service_type,
              'qty', d.qty,
              'status', d.status
            ) SEPARATOR ','
          ),
          '[]'
        ) as additional_descriptions
      FROM invoices i
      LEFT JOIN customers c ON i.cust_id = c.cust_id
      LEFT JOIN services s ON i.service_id = s.service_id
      LEFT JOIN invoice_descriptions d ON i.invoice_id = d.invoice_id
      LEFT JOIN services ds ON d.service_id = ds.service_id
      GROUP BY i.invoice_id
      ORDER BY i.invoice_id DESC
    `);

    // Parse the additional descriptions JSON strings
    const formattedInvoices = invoices.map(invoice => {
      let additionalDescriptions = [];
      try {
        if (invoice.additional_descriptions && invoice.additional_descriptions !== '[]') {
          additionalDescriptions = JSON.parse(`[${invoice.additional_descriptions}]`);
        }
      } catch (error) {
        console.error('Error parsing descriptions for invoice', invoice.invoice_id, error);
        additionalDescriptions = [];
      }

      // Combine main service and additional descriptions
      const allDescriptions = [
        {
          service_id: invoice.service_id,
          service_name: invoice.service_name,
          service_type: invoice.service_type,
          qty: invoice.qty,
          status: invoice.status
        },
        ...additionalDescriptions
      ];

      return {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        customer: invoice.cust_name,
        customer_po: invoice.customer_po,
        descriptions: allDescriptions
      };
    });

    res.json(formattedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Create invoice endpoint
app.post('/api/invoices', async (req, res) => {
  try {
    const { invoice_number, cust_id, customer_po, date, descriptions } = req.body;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert invoice
      const [invoiceResult] = await connection.execute(
        'INSERT INTO invoices (invoice_number, cust_id, customer_po, service_id, qty, status) VALUES (?, ?, ?, ?, ?, ?)',
        [invoice_number, cust_id, customer_po, descriptions[0].service_id, descriptions[0].qty, descriptions[0].status]
      );

      const invoiceId = invoiceResult.insertId;

      // Insert additional descriptions if any
      for (let i = 1; i < descriptions.length; i++) {
        const desc = descriptions[i];
        await connection.execute(
          'INSERT INTO invoice_descriptions (invoice_id, service_id, qty, status) VALUES (?, ?, ?, ?)',
          [invoiceId, desc.service_id, desc.qty, desc.status]
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