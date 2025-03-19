import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { businessAPI } from '../../services/api';

function BusinessesList() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [editForm, setEditForm] = useState({
    businessName: '',
    businessType: '',
    address: '',
    phone: '',
    email: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  const fetchBusinesses = async () => {
    try {
      const response = await businessAPI.getAll(page + 1, rowsPerPage);
      setBusinesses(response.data.businesses);
      setTotalCount(response.data.total);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (business) => {
    setSelectedBusiness(business);
    setEditForm({
      businessName: business.businessName,
      businessType: business.businessType,
      address: business.address,
      phone: business.phone,
      email: business.email
    });
    setEditDialog(true);
  };

  const handleVerifyClick = async (business) => {
    try {
      await businessAPI.verify(business._id);
      fetchBusinesses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectClick = (business) => {
    setSelectedBusiness(business);
    setRejectDialog(true);
  };

  const handleEditSubmit = async () => {
    try {
      await businessAPI.update(selectedBusiness._id, editForm);
      setEditDialog(false);
      fetchBusinesses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectSubmit = async () => {
    try {
      await businessAPI.reject(selectedBusiness._id, rejectReason);
      setRejectDialog(false);
      setRejectReason('');
      fetchBusinesses();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" />;
      case 'verified':
        return <Chip label="Verified" color="success" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading businesses: {error}
      </Alert>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Businesses Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Business Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business._id}>
                <TableCell>{business.businessName}</TableCell>
                <TableCell>{business.businessType}</TableCell>
                <TableCell>{business.address}</TableCell>
                <TableCell>{business.phone}</TableCell>
                <TableCell>{getStatusChip(business.status)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(business)}>
                    <EditIcon />
                  </IconButton>
                  {business.status === 'pending' && (
                    <>
                      <IconButton onClick={() => handleVerifyClick(business)} color="success">
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton onClick={() => handleRejectClick(business)} color="error">
                        <CancelIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Edit Business</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Business Name"
            value={editForm.businessName}
            onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Business Type"
            value={editForm.businessType}
            onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
        <DialogTitle>Reject Business</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Reason for Rejection"
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button onClick={handleRejectSubmit} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BusinessesList; 