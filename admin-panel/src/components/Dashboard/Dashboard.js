import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { statsAPI } from '../../services/api';

const StatCard = ({ title, value, icon, loading }) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      height: 140,
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" component="div" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
    </Box>
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      )}
    </Box>
  </Paper>
);

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalDeliveries: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard stats...');
      const response = await statsAPI.getDashboardStats();
      console.log('Dashboard stats received:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchStats} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          Error loading dashboard: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchStats}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<PeopleIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Businesses"
            value={stats.totalBusinesses.toLocaleString()}
            icon={<BusinessIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Deliveries"
            value={stats.totalDeliveries.toLocaleString()}
            icon={<LocalShippingIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<AttachMoneyIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 