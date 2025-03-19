import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const ReportsAnalytics = () => {
    const [tabValue, setTabValue] = useState(0);
    const [timeRange, setTimeRange] = useState('month');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [data, setData] = useState({
        overview: null,
        events: null,
        users: null,
        revenue: null,
        platform: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [overview, events, users, revenue, platform] = await Promise.all([
                fetch(`/api/admin/analytics/overview?timeRange=${timeRange}`).then(res => res.json()),
                fetch(`/api/admin/analytics/events?timeRange=${timeRange}`).then(res => res.json()),
                fetch(`/api/admin/analytics/users?timeRange=${timeRange}`).then(res => res.json()),
                fetch(`/api/admin/analytics/revenue?timeRange=${timeRange}`).then(res => res.json()),
                fetch(`/api/admin/analytics/platform?timeRange=${timeRange}`).then(res => res.json())
            ]);

            setData({
                overview,
                events,
                users,
                revenue,
                platform
            });
        } catch (error) {
            showSnackbar('Error fetching analytics data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleTimeRangeChange = (event) => {
        setTimeRange(event.target.value);
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleExport = async (type) => {
        try {
            const response = await fetch(`/api/admin/reports/export/${type}?timeRange=${timeRange}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${timeRange}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showSnackbar('Error exporting report', 'error');
        }
    };

    const renderOverview = () => {
        if (!data.overview) return null;

        return (
            <Grid container spacing={3}>
                {/* Key Metrics */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Total Revenue</Typography>
                                        <Typography variant="h4">${data.overview.totalRevenue}</Typography>
                                        <Typography variant="caption" color={
                                            data.overview.revenueGrowth >= 0 ? 'success.main' : 'error.main'
                                        }>
                                            {data.overview.revenueGrowth >= 0 ? '+' : ''}{data.overview.revenueGrowth}%
                                        </Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Total Events</Typography>
                                        <Typography variant="h4">{data.overview.totalEvents}</Typography>
                                        <Typography variant="caption" color={
                                            data.overview.eventGrowth >= 0 ? 'success.main' : 'error.main'
                                        }>
                                            {data.overview.eventGrowth >= 0 ? '+' : ''}{data.overview.eventGrowth}%
                                        </Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Active Users</Typography>
                                        <Typography variant="h4">{data.overview.activeUsers}</Typography>
                                        <Typography variant="caption" color={
                                            data.overview.userGrowth >= 0 ? 'success.main' : 'error.main'
                                        }>
                                            {data.overview.userGrowth >= 0 ? '+' : ''}{data.overview.userGrowth}%
                                        </Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Conversion Rate</Typography>
                                        <Typography variant="h4">{data.overview.conversionRate}%</Typography>
                                        <Typography variant="caption" color={
                                            data.overview.conversionGrowth >= 0 ? 'success.main' : 'error.main'
                                        }>
                                            {data.overview.conversionGrowth >= 0 ? '+' : ''}{data.overview.conversionGrowth}%
                                        </Typography>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Charts and Trends */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Revenue Trends</Typography>
                            {/* Add revenue trend chart here */}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Top Categories</Typography>
                            {/* Add categories chart here */}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderEvents = () => {
        if (!data.events) return null;

        return (
            <Grid container spacing={3}>
                {/* Event Metrics */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Event Analytics</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Total Events</Typography>
                                        <Typography variant="h4">{data.events.total}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Active Events</Typography>
                                        <Typography variant="h4">{data.events.active}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Average Attendance</Typography>
                                        <Typography variant="h4">{data.events.avgAttendance}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Success Rate</Typography>
                                        <Typography variant="h4">{data.events.successRate}%</Typography>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Event Performance */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Event Performance</Typography>
                            {/* Add event performance chart here */}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Category Distribution</Typography>
                            {/* Add category distribution chart here */}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderUsers = () => {
        if (!data.users) return null;

        return (
            <Grid container spacing={3}>
                {/* User Metrics */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>User Analytics</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Total Users</Typography>
                                        <Typography variant="h4">{data.users.total}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Active Users</Typography>
                                        <Typography variant="h4">{data.users.active}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">New Users</Typography>
                                        <Typography variant="h4">{data.users.new}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Retention Rate</Typography>
                                        <Typography variant="h4">{data.users.retentionRate}%</Typography>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* User Growth */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>User Growth</Typography>
                            {/* Add user growth chart here */}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>User Demographics</Typography>
                            {/* Add demographics chart here */}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderRevenue = () => {
        if (!data.revenue) return null;

        return (
            <Grid container spacing={3}>
                {/* Revenue Metrics */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Revenue Analytics</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Total Revenue</Typography>
                                        <Typography variant="h4">${data.revenue.total}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Average Order Value</Typography>
                                        <Typography variant="h4">${data.revenue.avgOrderValue}</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Refund Rate</Typography>
                                        <Typography variant="h4">{data.revenue.refundRate}%</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Processing Fee</Typography>
                                        <Typography variant="h4">${data.revenue.processingFee}</Typography>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Revenue Charts */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Revenue Breakdown</Typography>
                            {/* Add revenue breakdown chart here */}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Payment Methods</Typography>
                            {/* Add payment methods chart here */}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    return (
        <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Reports & Analytics</Typography>
                <Stack direction="row" spacing={2}>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={handleTimeRangeChange}
                            label="Time Range"
                        >
                            <MenuItem value="day">Today</MenuItem>
                            <MenuItem value="week">This Week</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="quarter">This Quarter</MenuItem>
                            <MenuItem value="year">This Year</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExport(
                            tabValue === 0 ? 'overview' :
                            tabValue === 1 ? 'events' :
                            tabValue === 2 ? 'users' :
                            'revenue'
                        )}
                    >
                        Export Report
                    </Button>
                </Stack>
            </Stack>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Overview" />
                <Tab label="Events" />
                <Tab label="Users" />
                <Tab label="Revenue" />
            </Tabs>

            {loading ? (
                <Typography>Loading analytics data...</Typography>
            ) : (
                <>
                    {tabValue === 0 && renderOverview()}
                    {tabValue === 1 && renderEvents()}
                    {tabValue === 2 && renderUsers()}
                    {tabValue === 3 && renderRevenue()}
                </>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ReportsAnalytics; 