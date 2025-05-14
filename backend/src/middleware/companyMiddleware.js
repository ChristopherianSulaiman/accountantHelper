const pool = require('../config/database');

const companyMiddleware = async (req, res, next) => {
  const companyCode = req.headers['x-company-code'];
  
  if (!companyCode) {
    return res.status(400).json({ message: 'Company code is required' });
  }

  try {
    // Get company ID from code
    const [companies] = await pool.execute(
      'SELECT company_id FROM companies WHERE company_code = ?',
      [companyCode]
    );

    if (companies.length === 0) {
      return res.status(400).json({ message: 'Invalid company code' });
    }

    // Add company ID to request object
    req.companyId = companies[0].company_id;
    next();
  } catch (error) {
    console.error('Error in company middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = companyMiddleware; 