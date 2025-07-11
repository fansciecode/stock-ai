import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Button,
    Alert,
    Paper
} from '@mui/material';
import {
    PeopleAlt as PeopleIcon,
    EventNote as EventIcon,
    ShoppingCart as OrderIcon,
    Business as BusinessIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        users: { totalUsers: 0, newUsers: 0 },
        events: { totalEvents: 0, activeEvents: 0 },
        orders: { totalOrders: 0, totalRevenue: 0 },
        businesses: { totalBusinesses: 0, pendingVerification: 0 }
    });
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/dashboard');
            setStats(response.data.stats);
            setError(null);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchDashboardData();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Admin Dashboard</Typography>
                <Button variant="contained" onClick={handleRefresh}>
                    Refresh Data
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Welcome, {user?.name || 'Admin'}
                </Typography>
                <Typography variant="body1">
                    Here's an overview of your platform's current status
                </Typography>
            </Paper>

            <Grid container spacing={3}>
                {/* User Stats */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Users
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.users.totalUsers}
                                    </Typography>
                                </Box>
                                <PeopleIcon fontSize="large" color="primary" />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                {stats.users.newUsers} new in the last 30 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Event Stats */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Events
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.events.totalEvents}
                                    </Typography>
                                </Box>
                                <EventIcon fontSize="large" color="primary" />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                {stats.events.activeEvents} currently active
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Stats */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Orders
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.orders.totalOrders}
                                    </Typography>
                                </Box>
                                <OrderIcon fontSize="large" color="primary" />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                ${stats.orders.totalRevenue.toFixed(2)} total revenue
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Business Stats */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Businesses
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.businesses.totalBusinesses}
                                    </Typography>
                                </Box>
                                <BusinessIcon fontSize="large" color="primary" />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                {stats.businesses.pendingVerification} pending verification
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Growth Trends */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Platform Growth
                                </Typography>
                            </Box>
                            <Typography variant="body2">
                                The platform is showing healthy growth with increasing user registrations and event creations.
                                For detailed analytics, visit the AI Insights Dashboard.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 