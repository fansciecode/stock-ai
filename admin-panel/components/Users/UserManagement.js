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
    Snackbar
} from '@mui/material';
import {
    Block as BlockIcon,
    CheckCircle as VerifyIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Security as RoleIcon,
    History as HistoryIcon
} from '@mui/icons-material';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reason, setReason] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        role: 'all'
    });

    const roles = [
        { id: 'admin', name: 'Administrator' },
        { id: 'moderator', name: 'Moderator' },
        { id: 'support', name: 'Support' },
        { id: 'user', name: 'Regular User' },
        { id: 'business', name: 'Business User' }
    ];

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const fetchUsers = async () => {
        try {
            // Simulated API call - replace with actual API integration
            const response = await fetch('/api/admin/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            showSnackbar('Error fetching users', 'error');
        }
    };

    const handleAction = (user, action) => {
        setSelectedUser(user);
        setActionType(action);
        setDialogOpen(true);
        if (action === 'role') {
            setSelectedRole(user.role);
        }
    };

    const handleConfirmAction = async () => {
        try {
            let response;
            switch (actionType) {
                case 'block':
                    response = await fetch(`/api/admin/users/${selectedUser.id}/block`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason })
                    });
                    break;
                case 'verify':
                    response = await fetch(`/api/admin/users/${selectedUser.id}/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason })
                    });
                    break;
                case 'role':
                    response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: selectedRole, reason })
                    });
                    break;
                case 'delete':
                    response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason })
                    });
                    break;
            }

            if (response.ok) {
                showSnackbar('Action completed successfully', 'success');
                fetchUsers();
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
        setSelectedUser(null);
        setActionType('');
        setReason('');
        setSelectedRole('');
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

    const renderDialogContent = () => {
        switch (actionType) {
            case 'role':
                return (
                    <>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                {roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Reason for Change"
                            multiline
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            margin="normal"
                        />
                    </>
                );
            case 'delete':
                return (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone. Are you sure you want to delete this user?
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
                User Management
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
                                <MenuItem value="blocked">Blocked</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
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
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="business">Business</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={filters.role}
                                onChange={(e) => handleFilterChange('role', e.target.value)}
                                label="Role"
                            >
                                <MenuItem value="all">All</MenuItem>
                                {roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label="All Users" />
                        <Tab label="Pending Verifications" />
                        <Tab label="Blocked Users" />
                    </Tabs>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.type}
                                            color={user.type === 'business' ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.role}
                                            color="info"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.status}
                                            color={
                                                user.status === 'active' ? 'success' :
                                                user.status === 'blocked' ? 'error' :
                                                'warning'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(user, user.status === 'blocked' ? 'unblock' : 'block')}
                                                color={user.status === 'blocked' ? 'success' : 'error'}
                                            >
                                                <BlockIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(user, 'verify')}
                                                color="primary"
                                            >
                                                <VerifyIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(user, 'role')}
                                                color="info"
                                            >
                                                <RoleIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(user, 'history')}
                                                color="default"
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(user, 'delete')}
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

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {actionType === 'block' ? 'Block User' :
                     actionType === 'unblock' ? 'Unblock User' :
                     actionType === 'verify' ? 'Verify User' :
                     actionType === 'role' ? 'Change User Role' :
                     actionType === 'delete' ? 'Delete User' :
                     'User Action'}
                </DialogTitle>
                <DialogContent>
                    {renderDialogContent()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleConfirmAction}
                        color={actionType === 'delete' ? 'error' : 'primary'}
                        variant="contained"
                    >
                        Confirm
                    </Button>
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

export default UserManagement; 