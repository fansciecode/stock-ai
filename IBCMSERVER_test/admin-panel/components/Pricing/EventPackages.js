import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Grid
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { pricing } from '../../services/api';

const EventPackages = () => {
    const [packages, setPackages] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        duration: 30,
        maxEvents: 10,
        features: [],
        discountPercentage: 0,
        isPromotional: false,
        restrictions: []
    });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await pricing.getEventPackages();
            setPackages(response.data);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedPackage) {
                await pricing.updateEventPackage(selectedPackage.id, formData);
                setSuccess('Package updated successfully');
            } else {
                await pricing.createEventPackage(formData);
                setSuccess('Package created successfully');
            }
            fetchPackages();
            handleCloseDialog();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await pricing.deleteEventPackage(id);
            setSuccess('Package deleted successfully');
            fetchPackages();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEdit = (pkg) => {
        setSelectedPackage(pkg);
        setFormData({
            name: pkg.name,
            description: pkg.description,
            category: pkg.category,
            price: pkg.price,
            duration: pkg.duration,
            maxEvents: pkg.maxEvents,
            features: pkg.features,
            discountPercentage: pkg.discountPercentage,
            isPromotional: pkg.isPromotional,
            restrictions: pkg.restrictions
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPackage(null);
        setFormData({
            name: '',
            description: '',
            category: '',
            price: '',
            duration: 30,
            maxEvents: 10,
            features: [],
            discountPercentage: 0,
            isPromotional: false,
            restrictions: []
        });
    };

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={3}>
                <Typography variant="h6">Event Packages</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                >
                    Add Package
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={3}>
                {packages.map((pkg) => (
                    <Grid item xs={12} md={4} key={pkg.id}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Typography variant="h6">{pkg.name}</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(pkg)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(pkg.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    <Typography color="textSecondary">
                                        {pkg.description}
                                    </Typography>

                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            label={pkg.category}
                                            size="small"
                                            color="primary"
                                        />
                                        {pkg.isPromotional && (
                                            <Chip
                                                label="Promotional"
                                                size="small"
                                                color="secondary"
                                            />
                                        )}
                                    </Stack>

                                    <Typography variant="h5">
                                        ${pkg.price}
                                    </Typography>

                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">
                                            Features:
                                        </Typography>
                                        {pkg.features.map((feature, index) => (
                                            <Typography
                                                key={index}
                                                variant="body2"
                                                color="textSecondary"
                                            >
                                                • {feature}
                                            </Typography>
                                        ))}
                                    </Stack>

                                    <Typography variant="body2">
                                        Duration: {pkg.duration} days
                                    </Typography>
                                    <Typography variant="body2">
                                        Max Events: {pkg.maxEvents}
                                    </Typography>
                                    {pkg.discountPercentage > 0 && (
                                        <Typography variant="body2" color="error">
                                            {pkg.discountPercentage}% Discount
                                        </Typography>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedPackage ? 'Edit Package' : 'Add Package'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Package Name"
                            value={formData.name}
                            onChange={handleChange('name')}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={handleChange('description')}
                            multiline
                            rows={3}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={handleChange('category')}
                                required
                            >
                                <MenuItem value="entertainment">Entertainment</MenuItem>
                                <MenuItem value="sports">Sports</MenuItem>
                                <MenuItem value="food">Food & Beverages</MenuItem>
                                {/* Add more categories */}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange('price')}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Duration (days)"
                            type="number"
                            value={formData.duration}
                            onChange={handleChange('duration')}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Maximum Events"
                            type="number"
                            value={formData.maxEvents}
                            onChange={handleChange('maxEvents')}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Discount Percentage"
                            type="number"
                            value={formData.discountPercentage}
                            onChange={handleChange('discountPercentage')}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Features</InputLabel>
                            <Select
                                multiple
                                value={formData.features}
                                onChange={handleChange('features')}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </Box>
                                )}
                            >
                                <MenuItem value="priority_support">Priority Support</MenuItem>
                                <MenuItem value="analytics">Advanced Analytics</MenuItem>
                                <MenuItem value="promotion">Featured Promotion</MenuItem>
                                <MenuItem value="customization">Custom Branding</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (selectedPackage ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventPackages; 