import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    Grid,
    TextField,
    Paper,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Warning as WarningIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Timeline as TimelineIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { analytics, orders } from '../../services/api';

const FraudDetection = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [resolution, setResolution] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await analytics.getFraudAlerts();
            setAlerts(response.data);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleAlertAction = async (alertId, action) => {
        setLoading(true);
        try {
            if (action === 'block') {
                await orders.flagAsFraud(alertId, resolution);
            } else if (action === 'resolve') {
                await orders.resolveDispute(alertId, {
                    resolution,
                    action: 'resolved'
                });
            }
            setSuccess(`Alert ${action === 'block' ? 'blocked' : 'resolved'} successfully`);
            fetchAlerts();
            handleCloseDialog();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (alert) => {
        setSelectedAlert(alert);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedAlert(null);
        setDialogOpen(false);
        setResolution('');
    };

    const renderAlertSeverity = (severity) => {
        switch (severity) {
            case 'high':
                return <Chip label="High" color="error" size="small" />;
            case 'medium':
                return <Chip label="Medium" color="warning" size="small" />;
            case 'low':
                return <Chip label="Low" color="info" size="small" />;
            default:
                return null;
        }
    };

    const renderMetrics = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography color="textSecondary" variant="overline">
                                Total Alerts
                            </Typography>
                            <Typography variant="h4">
                                {alerts.length}
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography color="textSecondary" variant="overline">
                                High Risk
                            </Typography>
                            <Typography variant="h4" color="error">
                                {alerts.filter(a => a.severity === 'high').length}
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography color="textSecondary" variant="overline">
                                Resolved Today
                            </Typography>
                            <Typography variant="h4" color="success">
                                {alerts.filter(a => a.status === 'resolved').length}
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography color="textSecondary" variant="overline">
                                Pending Review
                            </Typography>
                            <Typography variant="h4" color="warning">
                                {alerts.filter(a => a.status === 'pending').length}
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderAlertList = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Alert ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Detected At</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {alerts.map((alert) => (
                        <TableRow key={alert.id}>
                            <TableCell>{alert.id}</TableCell>
                            <TableCell>{alert.type}</TableCell>
                            <TableCell>
                                {renderAlertSeverity(alert.severity)}
                            </TableCell>
                            <TableCell>{alert.description}</TableCell>
                            <TableCell>
                                <Chip
                                    label={alert.status}
                                    color={alert.status === 'resolved' ? 'success' : 'warning'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                {new Date(alert.detectedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(alert)}
                                        color="primary"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                    {alert.status !== 'resolved' && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(alert)}
                                            color="error"
                                        >
                                            <BlockIcon />
                                        </IconButton>
                                    )}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            <Typography variant="h6" mb={3}>Fraud Detection & Monitoring</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {renderMetrics()}

            <Paper sx={{ mt: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="Active Alerts" />
                    <Tab label="Resolved" />
                    <Tab label="Blocked Users" />
                </Tabs>
            </Paper>

            <Box sx={{ mt: 3 }}>
                {renderAlertList()}
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Alert Details
                </DialogTitle>
                <DialogContent>
                    {selectedAlert && (
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Alert Type</Typography>
                                    <Typography>{selectedAlert.type}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Severity</Typography>
                                    {renderAlertSeverity(selectedAlert.severity)}
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Description</Typography>
                                    <Typography>{selectedAlert.description}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Related Data</Typography>
                                    <List>
                                        {selectedAlert.relatedData?.map((item, index) => (
                                            <ListItem key={index}>
                                                <ListItemText
                                                    primary={item.label}
                                                    secondary={item.value}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            </Grid>

                            <TextField
                                fullWidth
                                label="Resolution Notes"
                                multiline
                                rows={4}
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={() => handleAlertAction(selectedAlert.id, 'resolve')}
                        color="primary"
                        variant="contained"
                        disabled={loading || !resolution}
                    >
                        Resolve
                    </Button>
                    <Button
                        onClick={() => handleAlertAction(selectedAlert.id, 'block')}
                        color="error"
                        variant="contained"
                        disabled={loading || !resolution}
                    >
                        Block
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FraudDetection; 