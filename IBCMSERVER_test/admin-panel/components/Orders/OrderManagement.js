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
    Stepper,
    Step,
    StepLabel,
    Tabs,
    Tab,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot
} from '@mui/material';
import {
    Visibility as ViewIcon,
    LocalShipping as DeliveryIcon,
    Cancel as CancelIcon,
    History as HistoryIcon,
    Receipt as InvoiceIcon,
    LocationOn as TrackingIcon
} from '@mui/icons-material';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
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
    const [orderDetails, setOrderDetails] = useState(null);

    const orderStatuses = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
    ];

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/admin/orders', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            showSnackbar('Error fetching orders', 'error');
        }
    };

    const handleAction = async (order, action) => {
        setSelectedOrder(order);
        setActionType(action);
        
        if (action === 'view') {
            await fetchOrderDetails(order.id);
        }
        
        setDialogOpen(true);
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/details`);
            const data = await response.json();
            setOrderDetails(data);
        } catch (error) {
            showSnackbar('Error fetching order details', 'error');
        }
    };

    const handleConfirmAction = async () => {
        try {
            let response;
            switch (actionType) {
                case 'cancel':
                    response = await fetch(`/api/admin/orders/${selectedOrder.id}/cancel`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes })
                    });
                    break;
                case 'update-status':
                    response = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: notes })
                    });
                    break;
            }

            if (response.ok) {
                showSnackbar('Action completed successfully', 'success');
                fetchOrders();
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
        setSelectedOrder(null);
        setActionType('');
        setNotes('');
        setOrderDetails(null);
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

    const renderOrderDetails = () => {
        if (!orderDetails) return <Typography>Loading order details...</Typography>;

        return (
            <Grid container spacing={3}>
                {/* Order Information */}
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Order Information
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption">Order ID</Typography>
                                    <Typography>{orderDetails.id}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Status</Typography>
                                    <Chip
                                        label={orderDetails.status}
                                        color={
                                            orderDetails.status === 'delivered' ? 'success' :
                                            orderDetails.status === 'cancelled' ? 'error' :
                                            'warning'
                                        }
                                        size="small"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption">Date</Typography>
                                    <Typography>
                                        {new Date(orderDetails.date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Total Amount</Typography>
                                    <Typography>${orderDetails.totalAmount}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Customer Information
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption">Name</Typography>
                                    <Typography>{orderDetails.customer.name}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Email</Typography>
                                    <Typography>{orderDetails.customer.email}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Phone</Typography>
                                    <Typography>{orderDetails.customer.phone}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Items */}
                <Grid item xs={12}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Order Items
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orderDetails.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>${item.price}</TableCell>
                                            <TableCell>${item.total}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Delivery Information */}
                {orderDetails.delivery && (
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Delivery Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="caption">Address</Typography>
                                                <Typography>{orderDetails.delivery.address}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption">Tracking Number</Typography>
                                                <Typography>{orderDetails.delivery.trackingNumber}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption">Carrier</Typography>
                                                <Typography>{orderDetails.delivery.carrier}</Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Tracking Status
                                        </Typography>
                                        <Timeline>
                                            {orderDetails.delivery.tracking.map((status, index) => (
                                                <TimelineItem key={index}>
                                                    <TimelineSeparator>
                                                        <TimelineDot color={
                                                            status.completed ? 'success' : 'grey'
                                                        } />
                                                        {index < orderDetails.delivery.tracking.length - 1 && (
                                                            <TimelineConnector />
                                                        )}
                                                    </TimelineSeparator>
                                                    <TimelineContent>
                                                        <Typography variant="body2">
                                                            {status.status}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {status.date}
                                                        </Typography>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            ))}
                                        </Timeline>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        );
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Order Management
            </Typography>

            <Card sx={{ mb: 3 }}>
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
                                {orderStatuses.map(status => (
                                    <MenuItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </MenuItem>
                                ))}
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
                            </Select>
                        </FormControl>
                    </Stack>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Items</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell>
                                        {new Date(order.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{order.customer}</TableCell>
                                    <TableCell>{order.itemCount} items</TableCell>
                                    <TableCell>${order.total}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={order.status}
                                            color={
                                                order.status === 'delivered' ? 'success' :
                                                order.status === 'cancelled' ? 'error' :
                                                'warning'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(order, 'view')}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(order, 'delivery')}
                                                color="info"
                                            >
                                                <DeliveryIcon />
                                            </IconButton>
                                            {order.status !== 'cancelled' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAction(order, 'cancel')}
                                                    color="error"
                                                >
                                                    <CancelIcon />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(order, 'history')}
                                                color="default"
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(order, 'invoice')}
                                                color="primary"
                                            >
                                                <InvoiceIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog 
                open={dialogOpen} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {actionType === 'view' ? 'Order Details' :
                     actionType === 'delivery' ? 'Delivery Information' :
                     actionType === 'cancel' ? 'Cancel Order' :
                     actionType === 'history' ? 'Order History' :
                     actionType === 'invoice' ? 'Order Invoice' :
                     'Order Action'}
                </DialogTitle>
                <DialogContent>
                    {actionType === 'view' ? (
                        renderOrderDetails()
                    ) : actionType === 'cancel' ? (
                        <>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Are you sure you want to cancel this order?
                            </Alert>
                            <TextField
                                fullWidth
                                label="Cancellation Reason"
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
                    {actionType === 'cancel' && (
                        <Button 
                            onClick={handleConfirmAction}
                            color="error"
                            variant="contained"
                            disabled={!notes.trim()}
                        >
                            Confirm Cancellation
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

export default OrderManagement; 