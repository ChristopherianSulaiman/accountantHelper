import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  AttachMoney as AttachMoneyIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices' },
  { text: 'Services', icon: <BuildIcon />, path: '/services' },
  { text: 'Banks', icon: <AccountBalanceIcon />, path: '/banks' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Company Accounting
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 