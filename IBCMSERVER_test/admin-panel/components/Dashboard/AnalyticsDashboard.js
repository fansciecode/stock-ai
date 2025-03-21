import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Stack,
    Button,
    IconButton,
    Chip,
    LinearProgress,
    Tab,
    Tabs,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert
} from '@mui/material';
import {
    TrendingUp,
    People,
    Event,
    AttachMoney,
    Warning,
    LocalShipping,
    Timeline,
    Refresh as RefreshIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { analytics } from '../../services/api';

const AnalyticsDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState({
        overview: {},
        trendingEvents: [],
        userEngagement: {},
        salesMetrics: {},
        fraudAlerts: [],
        deliveryMetrics: {},
        predictiveDemand: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [
                overview,
                trending,
                engagement,
                sales,
                fraud,
                delivery,
                predictive
            ] = await Promise.all([
                analytics.getDashboardOverview(),
                analytics.getTrendingItems(),
                analytics.getUserEngagement(),
                analytics.getSalesMetrics(),
                analytics.getFraudAlerts(),
                analytics.getDeliveryMetrics(),
                analytics.getPredictiveDemand()
            ]);

            setData({
                overview: overview.data,
                trendingEvents: trending.data,
                userEngagement: engagement.data,
                salesMetrics: sales.data,
                fraudAlerts: fraud.data,
                deliveryMetrics: delivery.data,
                predictiveDemand: predictive.data
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            const response = await analytics.exportReport(type);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-report.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            setError(error.message);
        }
    };

    const renderOverviewCards = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography color="textSecondary" variant="overline">
                                    Total Revenue
                                </Typography>
                                <AttachMoney color="primary" />
                            </Stack>
                            <Typography variant="h4">
                                ${data.overview.totalRevenue?.toLocaleString()}
                            </Typography>
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                            >
                                <TrendingUp color="success" />
                                <Typography variant="body2" color="success.main">
                                    +{data.overview.revenueGrowth}%
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography color="textSecondary" variant="overline">
                                    Active Events
                                </Typography>
                                <Event color="primary" />
                            </Stack>
                            <Typography variant="h4">
                                {data.overview.activeEvents?.toLocaleString()}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={data.overview.eventCapacityUsage || 0}
                                color="primary"
                            />
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography color="textSecondary" variant="overline">
                                    Active Users
                                </Typography>
                                <People color="primary" />
                            </Stack>
                            <Typography variant="h4">
                                {data.overview.activeUsers?.toLocaleString()}
                            </Typography>
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                            >
                                <Typography variant="body2">
                                    Retention: {data.overview.retentionRate}%
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography color="textSecondary" variant="overline">
                                    Delivery Success
                                </Typography>
                                <LocalShipping color="primary" />
                            </Stack>
                            <Typography variant="h4">
                                {data.overview.deliverySuccess}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {data.overview.totalDeliveries} Total Deliveries
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderTrendingEvents = () => (
        <Card>
            <CardContent>
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="h6">Trending Events</Typography>
                        <IconButton onClick={fetchDashboardData} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Stack>

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Bookings</TableCell>
                                    <TableCell>Revenue</TableCell>
                                    <TableCell>Trend</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.trendingEvents.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>{event.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.category}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {event.bookings.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            ${event.revenue.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                color={event.trend > 0 ? 'success.main' : 'error.main'}
                                                variant="body2"
                                            >
                                                {event.trend > 0 ? '+' : ''}{event.trend}%
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </CardContent>
        </Card>
    );

    const renderRevenueChart = () => (
        <Card>
            <CardContent>
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="h6">Revenue Trends</Typography>
                        <Button
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExport('revenue')}
                        >
                            Export
                        </Button>
                    </Stack>

                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.salesMetrics.revenueHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#82ca9d"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    const renderFraudAlerts = () => (
        <Card>
            <CardContent>
                <Stack spacing={3}>
                    <Typography variant="h6">Fraud Alerts</Typography>
                    <Stack spacing={2}>
                        {data.fraudAlerts.slice(0, 5).map((alert) => (
                            <Alert
                                key={alert.id}
                                severity={alert.severity}
                                action={
                                    <Button
                                        color="inherit"
                                        size="small"
                                        onClick={() => {/* Handle alert */}}
                                    >
                                        View
                                    </Button>
                                }
                            >
                                {alert.message}
                            </Alert>
                        ))}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography variant="h6">Analytics Dashboard</Typography>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchDashboardData}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Stack spacing={3}>
                {renderOverviewCards()}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        {renderRevenueChart()}
                    </Grid>
                    <Grid item xs={12} md={4}>
                        {renderFraudAlerts()}
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        {renderTrendingEvents()}
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    );
};

export default AnalyticsDashboard; 