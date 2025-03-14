import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    FormControlLabel,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { notifications } from '../../services/api';

const PromotionalNotifications = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'promotion',
        targetAudience: [],
        categories: [],
        scheduleTime: null,
        isScheduled: false,
        deepLink: '',
        image: '',
        expiryTime: null,
        priority: 'normal'
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await notifications.getTemplates();
            setTemplates(response.data);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedTemplate) {
                await notifications.updateTemplate(selectedTemplate.id, formData);
                setSuccess('Template updated successfully');
            } else {
                await notifications.createTemplate(formData);
                setSuccess('Template created successfully');
            }
            fetchTemplates();
            handleCloseDialog();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async (template) => {
        setLoading(true);
        try {
            await notifications.sendPromotion({
                ...template,
                sendTime: template.isScheduled ? template.scheduleTime : new Date()
            });
            setSuccess('Notification sent successfully');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notifications.deleteTemplate(id);
            setSuccess('Template deleted successfully');
            fetchTemplates();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setFormData({
            ...template
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedTemplate(null);
        setFormData({
            title: '',
            message: '',
            type: 'promotion',
            targetAudience: [],
            categories: [],
            scheduleTime: null,
            isScheduled: false,
            deepLink: '',
            image: '',
            expiryTime: null,
            priority: 'normal'
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
                <Typography variant="h6">Promotional Notifications</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                >
                    Create Template
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Target Audience</TableCell>
                                    <TableCell>Categories</TableCell>
                                    <TableCell>Schedule</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell>{template.title}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={template.type}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                {template.targetAudience.map((target) => (
                                                    <Chip
                                                        key={target}
                                                        label={target}
                                                        size="small"
                                                    />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                {template.categories.map((category) => (
                                                    <Chip
                                                        key={category}
                                                        label={category}
                                                        size="small"
                                                    />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            {template.isScheduled ? (
                                                <Chip
                                                    icon={<ScheduleIcon />}
                                                    label={new Date(template.scheduleTime).toLocaleString()}
                                                    size="small"
                                                />
                                            ) : (
                                                'Send Now'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(template)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(template.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleSendNotification(template)}
                                                    color="primary"
                                                >
                                                    <SendIcon />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedTemplate ? 'Edit Template' : 'Create Template'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={formData.title}
                            onChange={handleChange('title')}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Message"
                            value={formData.message}
                            onChange={handleChange('message')}
                            multiline
                            rows={4}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Target Audience</InputLabel>
                            <Select
                                multiple
                                value={formData.targetAudience}
                                onChange={handleChange('targetAudience')}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </Box>
                                )}
                            >
                                <MenuItem value="all_users">All Users</MenuItem>
                                <MenuItem value="active_users">Active Users</MenuItem>
                                <MenuItem value="new_users">New Users</MenuItem>
                                <MenuItem value="event_organizers">Event Organizers</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Categories</InputLabel>
                            <Select
                                multiple
                                value={formData.categories}
                                onChange={handleChange('categories')}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </Box>
                                )}
                            >
                                <MenuItem value="entertainment">Entertainment</MenuItem>
                                <MenuItem value="sports">Sports</MenuItem>
                                <MenuItem value="food">Food & Beverages</MenuItem>
                                {/* Add more categories */}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Deep Link"
                            value={formData.deepLink}
                            onChange={handleChange('deepLink')}
                            helperText="URL to open when notification is clicked"
                        />

                        <TextField
                            fullWidth
                            label="Image URL"
                            value={formData.image}
                            onChange={handleChange('image')}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isScheduled}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        isScheduled: e.target.checked
                                    }))}
                                />
                            }
                            label="Schedule Notification"
                        />

                        {formData.isScheduled && (
                            <DateTimePicker
                                label="Schedule Time"
                                value={formData.scheduleTime}
                                onChange={(newValue) => setFormData(prev => ({
                                    ...prev,
                                    scheduleTime: newValue
                                }))}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        )}

                        <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={formData.priority}
                                onChange={handleChange('priority')}
                            >
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
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
                        {loading ? 'Saving...' : (selectedTemplate ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PromotionalNotifications; 