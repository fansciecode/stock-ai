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
    Link
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    History as HistoryIcon,
    Description as DocumentIcon
} from '@mui/icons-material';

const BusinessVerification = () => {
    const [verifications, setVerifications] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [notes, setNotes] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
        status: 'pending',
        type: 'all'
    });
    const [businessDetails, setBusinessDetails] = useState(null);

    useEffect(() => {
        fetchVerifications();
    }, [filters]);

    const fetchVerifications = async () => {
        try {
            const response = await fetch('/api/admin/verifications/business', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });
            const data = await response.json();
            setVerifications(data);
        } catch (error) {
            showSnackbar('Error fetching verifications', 'error');
        }
    };

    const handleAction = async (business, action) => {
        setSelectedBusiness(business);
        setActionType(action);
        
        if (action === 'view') {
            await fetchBusinessDetails(business.id);
        }
        
        setDialogOpen(true);
    };

    const fetchBusinessDetails = async (businessId) => {
        try {
            const response = await fetch(`/api/admin/businesses/${businessId}/details`);
            const data = await response.json();
            setBusinessDetails(data);
        } catch (error) {
            showSnackbar('Error fetching business details', 'error');
        }
    };

    const handleConfirmAction = async () => {
        try {
            let response;
            switch (actionType) {
                case 'approve':
                    response = await fetch(`/api/admin/verifications/business/${selectedBusiness.id}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes })
                    });
                    break;
                case 'reject':
                    response = await fetch(`/api/admin/verifications/business/${selectedBusiness.id}/reject`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes })
                    });
                    break;
            }

            if (response.ok) {
                showSnackbar(`Business ${actionType}d successfully`, 'success');
                fetchVerifications();
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
        setSelectedBusiness(null);
        setActionType('');
        setNotes('');
        setBusinessDetails(null);
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

    const renderBusinessDetails = () => {
        if (!businessDetails) {
            return <Typography>Loading business details...</Typography>;
        }

        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Business Information
                    </Typography>
                </Grid>
                
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Basic Details
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption">Business Name</Typography>
                                    <Typography>{businessDetails.name}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Registration Number</Typography>
                                    <Typography>{businessDetails.registrationNumber}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Tax ID</Typography>
                                    <Typography>{businessDetails.taxId}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Contact Information
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption">Email</Typography>
                                    <Typography>{businessDetails.email}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Phone</Typography>
                                    <Typography>{businessDetails.phone}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption">Address</Typography>
                                    <Typography>{businessDetails.address}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Documents */}
                <Grid item xs={12}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Verification Documents
                            </Typography>
                            <Grid container spacing={2}>
                                {businessDetails.documents.map((doc, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Stack spacing={1}>
                                                    <Typography variant="subtitle2">
                                                        {doc.type}
                                                    </Typography>
                                                    <Link href={doc.url} target="_blank">
                                                        View Document
                                                    </Link>
                                                    <Typography variant="caption">
                                                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Verification History */}
                {businessDetails.verificationHistory && (
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Verification History
                                </Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Action</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Notes</TableCell>
                                            <TableCell>Admin</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {businessDetails.verificationHistory.map((history, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {new Date(history.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{history.action}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={history.status}
                                                        size="small"
                                                        color={
                                                            history.status === 'approved' ? 'success' :
                                                            history.status === 'rejected' ? 'error' :
                                                            'default'
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>{history.notes}</TableCell>
                                                <TableCell>{history.admin}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
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
                Business Verification Management
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
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Business Name</TableCell>
                                <TableCell>Registration Number</TableCell>
                                <TableCell>Submitted Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {verifications.map((business) => (
                                <TableRow key={business.id}>
                                    <TableCell>{business.id}</TableCell>
                                    <TableCell>{business.name}</TableCell>
                                    <TableCell>{business.registrationNumber}</TableCell>
                                    <TableCell>
                                        {new Date(business.submittedDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={business.status}
                                            color={
                                                business.status === 'approved' ? 'success' :
                                                business.status === 'rejected' ? 'error' :
                                                'warning'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(business, 'view')}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            {business.status === 'pending' && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAction(business, 'approve')}
                                                        color="success"
                                                    >
                                                        <ApproveIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAction(business, 'reject')}
                                                        color="error"
                                                    >
                                                        <RejectIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(business, 'history')}
                                                color="default"
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(business, 'documents')}
                                                color="info"
                                            >
                                                <DocumentIcon />
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
                    {actionType === 'view' ? 'Business Details' :
                     actionType === 'approve' ? 'Approve Business' :
                     actionType === 'reject' ? 'Reject Business' :
                     actionType === 'history' ? 'Verification History' :
                     actionType === 'documents' ? 'Business Documents' :
                     'Business Action'}
                </DialogTitle>
                <DialogContent>
                    {actionType === 'view' ? (
                        renderBusinessDetails()
                    ) : actionType === 'approve' || actionType === 'reject' ? (
                        <TextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            margin="normal"
                            required
                            helperText="Please provide a reason for your decision"
                        />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        {actionType === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {(actionType === 'approve' || actionType === 'reject') && (
                        <Button 
                            onClick={handleConfirmAction}
                            color={actionType === 'approve' ? 'success' : 'error'}
                            variant="contained"
                            disabled={!notes.trim()}
                        >
                            {actionType === 'approve' ? 'Approve' : 'Reject'}
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

export default BusinessVerification; 