import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Notifications as NotificationsIcon, AccountCircle } from '@mui/icons-material';
import Sidebar from './Sidebar';
import CompanySelector from '../CompanySelector';

const MainLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - 240px)`,
          ml: '240px',
          backgroundColor: 'white',
          color: 'black',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Box sx={{ minWidth: 200, mr: 2 }}>
            <CompanySelector />
          </Box>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - 240px)`,
          ml: '240px',
          mt: '64px',
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 