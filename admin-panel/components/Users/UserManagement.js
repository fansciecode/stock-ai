import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import api from '../../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStatus, setUserStatus] = useState('');
    const [userRole, setUserRole] = useState('');
    const [totalUsers, setTotalUsers] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users', {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                    search: searchTerm
                }
            });
            
            setUsers(response.data.users);
            setTotalUsers(response.data.totalUsers || response.data.users.length);
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchUsers();
    };

    const handleOpenDialog = (user) => {
        setSelectedUser(user);
        setUserStatus(user.status || 'active');
        setUserRole(user.role || 'user');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
    };

    const handleUpdateUser = async () => {
        try {
            const response = await api.put(`/users/${selectedUser._id}`, {
                status: userStatus,
                role: userRole
            });
            
            setUsers(users.map(user => 
                user._id === selectedUser._id ? { ...user, ...response.data } : user
            ));
            
            handleCloseDialog();
        } catch (error) {
            console.error('Error updating user:', error);
            setError('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await api.delete(`/users/${userId}`);
            
            setUsers(users.filter(user => user._id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            setError('Failed to delete user');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'suspended':
                return 'warning';
            case 'banned':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading && users.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                User Management
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            
            <Paper sx={{ mb: 3, p: 2 }}>
                <Box component="form" onSubmit={handleSearch} display="flex" alignItems="center">
                    <TextField
                        label="Search Users"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1, mr: 2 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        type="submit"
                    >
                        Search
                    </Button>
                </Box>
            </Paper>
            
            <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                            <TableCell>Joined Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                            <TableRow key={user._id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip 
                                        label={user.role || 'user'} 
                                        color={user.role === 'admin' ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                        label={user.status || 'active'} 
                                        color={getStatusColor(user.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                        onClick={() => handleOpenDialog(user)}
                                    >
                                        <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                        onClick={() => handleDeleteUser(user._id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>Name:</strong> {selectedUser.name}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Email:</strong> {selectedUser.email}
                            </Typography>
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={userStatus}
                                    label="Status"
                                    onChange={(e) => setUserStatus(e.target.value)}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="suspended">Suspended</MenuItem>
                                    <MenuItem value="banned">Banned</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={userRole}
                                    label="Role"
                                    onChange={(e) => setUserRole(e.target.value)}
                                >
                                    <MenuItem value="user">User</MenuItem>
                                    <MenuItem value="business">Business</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleUpdateUser} variant="contained">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement; 