import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
} from '@mui/icons-material';

const SummaryCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            ${value.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ color: color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const recentTransactions = [
    { id: 1, date: '2024-03-20', description: 'Invoice #1001', amount: 1500, type: 'income' },
    { id: 2, date: '2024-03-19', description: 'Office Supplies', amount: 250, type: 'expense' },
    { id: 3, date: '2024-03-18', description: 'Invoice #1000', amount: 2000, type: 'income' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Financial Overview</Typography>
        <Button variant="contained" color="primary">
          New Transaction
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Revenue"
            value={25000}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Expenses"
            value={15000}
            icon={<TrendingDown sx={{ fontSize: 40 }} />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Bank Balance"
            value={100000}
            icon={<AccountBalance sx={{ fontSize: 40 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Outstanding Invoices"
            value={5000}
            icon={<Receipt sx={{ fontSize: 40 }} />}
            color="#ff9800"
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Transactions
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: transaction.type === 'income' ? '#4caf50' : '#f44336',
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard; 