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
    Checkbox,
    FormGroup,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Switch
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Security as SecurityIcon
} from '@mui/icons-material';

const RolePermissions = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permissions: {}
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const permissionGroups = {
        users: [
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            'block_users',
            'verify_users'
        ],
        events: [
            'view_events',
            'create_events',
            'edit_events',
            'delete_events',
            'block_events',
            'verify_events'
        ],
        orders: [
            'view_orders',
            'manage_orders',
            'process_refunds',
            'view_transactions'
        ],
        reports: [
            'view_reports',
            'export_reports',
            'view_analytics',
            'view_financials'
        ],
        settings: [
            'manage_roles',
            'manage_permissions',
            'manage_settings',
            'view_audit_logs'
        ]
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/admin/roles');
            const data = await response.json();
            setRoles(data);
        } catch (error) {
            showSnackbar('Error fetching roles', 'error');
        }
    };

    const handleAction = (role, action) => {
        setSelectedRole(role);
        setActionType(action);
        if (action === 'edit') {
            setRoleForm({
                name: role.name,
                description: role.description,
                permissions: { ...role.permissions }
            });
        } else if (action === 'add') {
            setRoleForm({
                name: '',
                description: '',
                permissions: Object.keys(permissionGroups).reduce((acc, group) => {
                    permissionGroups[group].forEach(permission => {
                        acc[permission] = false;
                    });
                    return acc;
                }, {})
            });
        }
        setDialogOpen(true);
    };

    const handlePermissionChange = (permission) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permission]: !prev.permissions[permission]
            }
        }));
    };

    const handleGroupPermissionChange = (group, value) => {
        const updatedPermissions = { ...roleForm.permissions };
        permissionGroups[group].forEach(permission => {
            updatedPermissions[permission] = value;
        });
        setRoleForm(prev => ({
            ...prev,
            permissions: updatedPermissions
        }));
    };

    const handleSubmit = async () => {
        try {
            const url = actionType === 'add' 
                ? '/api/admin/roles'
                : `/api/admin/roles/${selectedRole.id}`;
            
            const response = await fetch(url, {
                method: actionType === 'add' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleForm)
            });

            if (response.ok) {
                showSnackbar(
                    `Role ${actionType === 'add' ? 'created' : 'updated'} successfully`,
                    'success'
                );
                fetchRoles();
                handleCloseDialog();
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            showSnackbar('Error saving role', 'error');
        }
    };

    const handleDelete = async (roleId) => {
        try {
            const response = await fetch(`/api/admin/roles/${roleId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showSnackbar('Role deleted successfully', 'success');
                fetchRoles();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            showSnackbar('Error deleting role', 'error');
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedRole(null);
        setActionType('');
        setRoleForm({
            name: '',
            description: '',
            permissions: {}
        });
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const isGroupEnabled = (group) => {
        return permissionGroups[group].every(
            permission => roleForm.permissions[permission]
        );
    };

    const isGroupIndeterminate = (group) => {
        const enabledCount = permissionGroups[group].filter(
            permission => roleForm.permissions[permission]
        ).length;
        return enabledCount > 0 && enabledCount < permissionGroups[group].length;
    };

    return (
        <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Role & Permission Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleAction(null, 'add')}
                >
                    Add Role
                </Button>
            </Stack>

            <Card>
                <CardContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Role Name</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Users</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <SecurityIcon color="primary" />
                                            <Typography>{role.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{role.description}</TableCell>
                                    <TableCell>{role.userCount} users</TableCell>
                                    <TableCell>
                                        {new Date(role.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleAction(role, 'edit')}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            {!role.isDefault && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(role.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            )}
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
                    {actionType === 'add' ? 'Add Role' : 'Edit Role'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Role Name"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                margin="normal"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={roleForm.description}
                                onChange={(e) => setRoleForm(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                margin="normal"
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Permissions
                            </Typography>
                            {Object.entries(permissionGroups).map(([group, permissions]) => (
                                <Card key={group} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={isGroupEnabled(group)}
                                                    indeterminate={isGroupIndeterminate(group)}
                                                    onChange={(e) => handleGroupPermissionChange(
                                                        group,
                                                        e.target.checked
                                                    )}
                                                />
                                            }
                                            label={group.charAt(0).toUpperCase() + group.slice(1)}
                                        />
                                        <FormGroup>
                                            <Grid container spacing={2}>
                                                {permissions.map(permission => (
                                                    <Grid item xs={12} sm={6} key={permission}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={roleForm.permissions[permission] || false}
                                                                    onChange={() => handlePermissionChange(permission)}
                                                                />
                                                            }
                                                            label={permission.split('_').join(' ')}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </FormGroup>
                                    </CardContent>
                                </Card>
                            ))}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!roleForm.name.trim()}
                    >
                        {actionType === 'add' ? 'Create Role' : 'Update Role'}
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

export default RolePermissions; 