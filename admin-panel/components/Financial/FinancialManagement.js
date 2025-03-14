import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Alert,
    Snackbar,
    Tabs,
    Tab
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Receipt as RefundIcon,
    History as HistoryIcon,
    Assessment as AnalyticsIcon,
    Download as ExportIcon
} from '@mui/icons-material';

const FinancialManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [notes, setNotes] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        dateRange: 'all'
    });
    const [tabValue, setTabValue] = useState(0);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchTransactions();
        fetchAnalytics();
    }, [filters]);

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/admin/transactions', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            showSnackbar('Error fetching transactions', 'error');
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/financial/analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            showSnackbar('Error fetching analytics', 'error');
        }
    };

    const handleAction = async (transaction, action) => {
        setSelectedTransaction(transaction);
        setActionType(action);
        setDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        try {
            let response;
            switch (actionType) {
                case 'refund':
                    response = await fetch(`/api/admin/transactions/${selectedTransaction.id}/refund`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes })
                    });
                    break;
            }

            if (response.ok) {
                showSnackbar('Action completed successfully', 'success');
                fetchTransactions();
                fetchAnalytics();
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            showSnackbar('Error performing action', 'error');
        } finally {
            handleCloseDialog();
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedTransaction(null);
        setActionType('');
        setNotes('');
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const renderAnalytics = () => {
        if (!analytics) return <Typography>Loading analytics...</Typography>;

        return (
            <Grid container spacing={3}>
                {/* Revenue Overview */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Revenue Overview</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Total Revenue</Typography>
                                    <Typography variant="h4">${analytics.totalRevenue}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Net Revenue</Typography>
                                    <Typography variant="h4">${analytics.netRevenue}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Refunds</Typography>
                                    <Typography variant="h4">${analytics.totalRefunds}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Processing Fees</Typography>
                                    <Typography variant="h4">${analytics.processingFees}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Transaction Metrics */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Transaction Metrics</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Total Transactions</Typography>
                                    <Typography variant="h4">{analytics.totalTransactions}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Successful Rate</Typography>
                                    <Typography variant="h4">{analytics.successRate}%</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Refund Rate</Typography>
                                    <Typography variant="h4">{analytics.refundRate}%</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Average Transaction</Typography>
                                    <Typography variant="h4">${analytics.averageTransaction}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Revenue Trends */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Revenue Trends</Typography>
                            {/* Add revenue trend chart here */}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderTransactionDetails = () => {
        if (!selectedTransaction) return null;

        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Transaction Details
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="subtitle2">Transaction ID</Typography>
                    <Typography>{selectedTransaction.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="subtitle2">Amount</Typography>
                    <Typography>${selectedTransaction.amount}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="subtitle2">Status</Typography>
                    <Chip
                        label={selectedTransaction.status}
                        color={
                            selectedTransaction.status === 'completed' ? 'success' :
                            selectedTransaction.status === 'refunded' ? 'error' :
                            'warning'
                        }
                        size="small"
                    />
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="subtitle2">Date</Typography>
                    <Typography>
                        {new Date(selectedTransaction.date).toLocaleDateString()}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2">Customer</Typography>
                    <Typography>{selectedTransaction.customer}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2">Description</Typography>
                    <Typography>{selectedTransaction.description}</Typography>
                </Grid>
            </Grid>
        );
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Financial Management
            </Typography>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Overview" />
                <Tab label="Transactions" />
                <Tab label="Reports" />
            </Tabs>

            {tabValue === 0 && renderAnalytics()}

            {tabValue === 1 && (
                <Card>
                    <CardContent>
                        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="refunded">Refunded</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    label="Type"
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="ticket">Ticket Sales</MenuItem>
                                    <MenuItem value="service">Service Fees</MenuItem>
                                    <MenuItem value="refund">Refunds</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Date Range</InputLabel>
                                <Select
                                    value={filters.dateRange}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                    label="Date Range"
                                >
                                    <MenuItem value="all">All Time</MenuItem>
                                    <MenuItem value="today">Today</MenuItem>
                                    <MenuItem value="week">This Week</MenuItem>
                                    <MenuItem value="month">This Month</MenuItem>
                                    <MenuItem value="year">This Year</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                startIcon={<ExportIcon />}
                                onClick={() => {/* Add export functionality */}}
                            >
                                Export
                            </Button>
                        </Stack>

                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{transaction.id}</TableCell>
                                        <TableCell>
                                            {new Date(transaction.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{transaction.customer}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={transaction.type}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>${transaction.amount}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={transaction.status}
                                                color={
                                                    transaction.status === 'completed' ? 'success' :
                                                    transaction.status === 'refunded' ? 'error' :
                                                    transaction.status === 'failed' ? 'error' :
                                                    'warning'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAction(transaction, 'view')}
                                                    color="primary"
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                                {transaction.status === 'completed' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAction(transaction, 'refund')}
                                                        color="error"
                                                    >
                                                        <RefundIcon />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAction(transaction, 'history')}
                                                    color="default"
                                                >
                                                    <HistoryIcon />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {tabValue === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Financial Reports
                        </Typography>
                        {/* Add financial reports section */}
                    </CardContent>
                </Card>
            )}

            <Dialog 
                open={dialogOpen} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {actionType === 'view' ? 'Transaction Details' :
                     actionType === 'refund' ? 'Process Refund' :
                     actionType === 'history' ? 'Transaction History' :
                     'Transaction Action'}
                </DialogTitle>
                <DialogContent>
                    {actionType === 'view' ? (
                        renderTransactionDetails()
                    ) : actionType === 'refund' ? (
                        <>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Are you sure you want to process a refund for this transaction?
                            </Alert>
                            <TextField
                                fullWidth
                                label="Refund Reason"
                                multiline
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                margin="normal"
                                required
                            />
                        </>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        {actionType === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {actionType === 'refund' && (
                        <Button 
                            onClick={handleConfirmAction}
                            color="error"
                            variant="contained"
                            disabled={!notes.trim()}
                        >
                            Process Refund
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

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

export default FinancialManagement; 