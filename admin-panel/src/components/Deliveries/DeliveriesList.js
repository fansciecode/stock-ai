import React, { useState, useEffect, useCallback } from 'react';
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
  Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { deliveryAPI } from '../../services/api';

function DeliveriesList() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      const response = await deliveryAPI.getAll(page + 1, rowsPerPage);
      setDeliveries(response.data.deliveries);
      setTotalCount(response.data.total);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewClick = (delivery) => {
    setSelectedDelivery(delivery);
    setViewDialog(true);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" />;
      case 'in_progress':
        return <Chip label="In Progress" color="info" />;
      case 'completed':
        return <Chip label="Completed" color="success" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" />;
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
        Error loading deliveries: {error}
      </Alert>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Deliveries Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Delivery ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Business</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow key={delivery._id}>
                <TableCell>{delivery._id}</TableCell>
                <TableCell>{delivery.customerName}</TableCell>
                <TableCell>{delivery.businessName}</TableCell>
                <TableCell>{getStatusChip(delivery.status)}</TableCell>
                <TableCell>{new Date(delivery.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewClick(delivery)}>
                    <VisibilityIcon />
                  </IconButton>
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

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Delivery Details</DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Delivery ID:</strong> {selectedDelivery._id}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Customer:</strong> {selectedDelivery.customerName}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Business:</strong> {selectedDelivery.businessName}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong> {selectedDelivery.status}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Created At:</strong> {new Date(selectedDelivery.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Pickup Address:</strong> {selectedDelivery.pickupAddress}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Delivery Address:</strong> {selectedDelivery.deliveryAddress}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Items:</strong>
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDelivery.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                <strong>Total Amount:</strong> ${selectedDelivery.totalAmount.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DeliveriesList; 