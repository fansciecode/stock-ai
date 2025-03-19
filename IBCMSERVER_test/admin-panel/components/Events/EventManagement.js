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
    Tabs,
    Tab,
    Alert,
    Snackbar,
    Grid
} from '@mui/material';
import {
    Block as BlockIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    LocalOffer as PricingIcon,
    Group as AttendeesIcon,
    Assessment as AnalyticsIcon,
    Schedule as TimingIcon
} from '@mui/icons-material';

const EventManagement = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reason, setReason] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        category: 'all'
    });
    const [eventDetails, setEventDetails] = useState({
        pricing: null,
        attendees: null,
        analytics: null
    });

    const eventCategories = [
        'Conference',
        'Workshop',
        'Seminar',
        'Concert',
        'Exhibition',
        'Sports',
        'Social',
        'Other'
    ];

    useEffect(() => {
        fetchEvents();
    }, [filters]);

    const fetchEvents = async () => {
        try {
            // Simulated API call - replace with actual API integration
            const response = await fetch('/api/admin/events', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            showSnackbar('Error fetching events', 'error');
        }
    };

    const handleAction = async (event, action) => {
        setSelectedEvent(event);
        setActionType(action);
        
        if (action === 'view' || action === 'pricing' || action === 'attendees' || action === 'analytics') {
            await fetchEventDetails(event.id, action);
        }
        
        setDialogOpen(true);
    };

    const fetchEventDetails = async (eventId, type) => {
        try {
            const response = await fetch(`/api/admin/events/${eventId}/${type}`);
            const data = await response.json();
            setEventDetails(prev => ({
                ...prev,
                [type]: data
            }));
        } catch (error) {
            showSnackbar(`Error fetching event ${type}`, 'error');
        }
    };

    const handleConfirmAction = async () => {
        try {
            let response;
            switch (actionType) {
                case 'block':
                    response = await fetch(`/api/admin/events/${selectedEvent.id}/block`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason })
                    });
                    break;
                case 'delete':
                    response = await fetch(`/api/admin/events/${selectedEvent.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason })
                    });
                    break;
                // Add more cases as needed
            }

            if (response.ok) {
                showSnackbar('Action completed successfully', 'success');
                fetchEvents();
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
        setSelectedEvent(null);
        setActionType('');
        setReason('');
        setEventDetails({
            pricing: null,
            attendees: null,
            analytics: null
        });
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

    const renderEventDetails = () => {
        switch (actionType) {
            case 'view':
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6">{selectedEvent.title}</Typography>
                            <Typography color="textSecondary" gutterBottom>
                                {selectedEvent.description}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Organizer</Typography>
                            <Typography>{selectedEvent.organizer}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Venue</Typography>
                            <Typography>{selectedEvent.venue}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Date & Time</Typography>
                            <Typography>{selectedEvent.datetime}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Capacity</Typography>
                            <Typography>{selectedEvent.capacity}</Typography>
                        </Grid>
                    </Grid>
                );
            case 'pricing':
                return eventDetails.pricing ? (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6">Pricing Details</Typography>
                        </Grid>
                        {eventDetails.pricing.tiers.map((tier, index) => (
                            <Grid item xs={12} key={index}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1">{tier.name}</Typography>
                                        <Typography variant="h6">${tier.price}</Typography>
                                        <Typography color="textSecondary">
                                            {tier.description}
                                        </Typography>
                                        <Typography>
                                            Sold: {tier.sold} / {tier.capacity}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : <Typography>Loading pricing details...</Typography>;
            case 'attendees':
                return eventDetails.attendees ? (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6">Attendee Statistics</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Total Registered</Typography>
                            <Typography variant="h4">{eventDetails.attendees.total}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Check-ins</Typography>
                            <Typography variant="h4">{eventDetails.attendees.checkedIn}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>Demographics</Typography>
                            {/* Add demographic charts/stats here */}
                        </Grid>
                    </Grid>
                ) : <Typography>Loading attendee details...</Typography>;
            case 'analytics':
                return eventDetails.analytics ? (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6">Event Analytics</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Page Views</Typography>
                            <Typography variant="h4">{eventDetails.analytics.pageViews}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2">Conversion Rate</Typography>
                            <Typography variant="h4">{eventDetails.analytics.conversionRate}%</Typography>
                        </Grid>
                        {/* Add more analytics metrics */}
                    </Grid>
                ) : <Typography>Loading analytics...</Typography>;
            case 'delete':
                return (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone. Are you sure you want to delete this event?
                        <TextField
                            fullWidth
                            label="Reason for Deletion"
                            multiline
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            margin="normal"
                        />
                    </Alert>
                );
            default:
                return (
                    <TextField
                        fullWidth
                        label="Reason"
                        multiline
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        margin="normal"
                    />
                );
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Event Management
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
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                label="Category"
                            >
                                <MenuItem value="all">All</MenuItem>
                                {eventCategories.map(category => (
                                    <MenuItem key={category} value={category.toLowerCase()}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label="All Events" />
                        <Tab label="Active Events" />
                        <Tab label="Upcoming Events" />
                        <Tab label="Past Events" />
                    </Tabs>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Organizer</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>{event.id}</TableCell>
                                    <TableCell>{event.title}</TableCell>
                                    <TableCell>{event.organizer}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={event.category}
                                            color="primary"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{event.date}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={event.status}
                                            color={
                                                event.status === 'active' ? 'success' :
                                                event.status === 'cancelled' ? 'error' :
                                                event.status === 'completed' ? 'default' :
                                                'warning'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(event, 'view')}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(event, 'pricing')}
                                                color="info"
                                            >
                                                <PricingIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(event, 'attendees')}
                                                color="success"
                                            >
                                                <AttendeesIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(event, 'analytics')}
                                                color="warning"
                                            >
                                                <AnalyticsIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(event, 'block')}
                                                color="error"
                                            >
                                                <BlockIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(event, 'delete')}
                                                color="error"
                                            >
                                                <DeleteIcon />
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
                    {actionType === 'view' ? 'Event Details' :
                     actionType === 'pricing' ? 'Event Pricing' :
                     actionType === 'attendees' ? 'Attendee Management' :
                     actionType === 'analytics' ? 'Event Analytics' :
                     actionType === 'block' ? 'Block Event' :
                     actionType === 'delete' ? 'Delete Event' :
                     'Event Action'}
                </DialogTitle>
                <DialogContent>
                    {renderEventDetails()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        {['view', 'pricing', 'attendees', 'analytics'].includes(actionType) 
                            ? 'Close' 
                            : 'Cancel'
                        }
                    </Button>
                    {!['view', 'pricing', 'attendees', 'analytics'].includes(actionType) && (
                        <Button 
                            onClick={handleConfirmAction}
                            color={actionType === 'delete' ? 'error' : 'primary'}
                            variant="contained"
                        >
                            Confirm
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

export default EventManagement; 