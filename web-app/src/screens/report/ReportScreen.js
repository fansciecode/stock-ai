import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ReportScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  
  // Get entity type and ID from URL params if available
  const entityType = queryParams.get('type') || '';
  const entityId = queryParams.get('id') || '';
  
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [entityData, setEntityData] = useState(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (entityType && entityId) {
      fetchEntityDetails();
    }
  }, [entityType, entityId]);
  
  const fetchEntityDetails = async () => {
    try {
      setLoadingEntity(true);
      setError(null);
      
      let endpoint;
      switch (entityType.toLowerCase()) {
        case 'event':
          endpoint = `/api/events/${entityId}`;
          break;
        case 'user':
          endpoint = `/api/users/${entityId}`;
          break;
        case 'product':
          endpoint = `/api/products/${entityId}`;
          break;
        case 'review':
          endpoint = `/api/reviews/${entityId}`;
          break;
        default:
          throw new Error('Unknown entity type');
      }
      
      const { data } = await axios.get(endpoint);
      setEntityData(data);
    } catch (err) {
      setError(`Failed to fetch ${entityType} details: ${err.message}`);
    } finally {
      setLoadingEntity(false);
    }
  };
  
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportType || !reportDescription.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.post('/api/reports', {
        entityType,
        entityId,
        reportType,
        description: reportDescription,
      });
      
      setSuccess(true);
      setReportType('');
      setReportDescription('');
      
      // Automatically navigate back after success
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    navigate(-1);
  };
  
  const reportTypes = [
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
    { value: 'SPAM', label: 'Spam' },
    { value: 'HARASSMENT', label: 'Harassment' },
    { value: 'MISINFORMATION', label: 'Misinformation' },
    { value: 'FRAUD', label: 'Fraud or Scam' },
    { value: 'COPYRIGHT', label: 'Copyright Violation' },
    { value: 'OTHER', label: 'Other Issue' }
  ];
  
  // Format the entity name for display
  const getEntityName = () => {
    if (!entityData) return entityType;
    
    switch (entityType.toLowerCase()) {
      case 'event':
        return entityData.title || entityData.name || 'Event';
      case 'user':
        return entityData.name || entityData.username || 'User';
      case 'product':
        return entityData.name || 'Product';
      case 'review':
        return 'Review';
      default:
        return 'Item';
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Report an Issue
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Paper elevation={3} sx={{ p: 3 }}>
          {loadingEntity && (
            <Box display="flex" justifyContent="center" mb={3}>
              <CircularProgress size={30} />
            </Box>
          )}
          
          {entityType && entityId && entityData && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                You are reporting:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1" fontWeight="medium">
                  {getEntityName()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase()} ID: {entityId.substring(0, 8)}...
                </Typography>
              </Paper>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmitReport}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  multiline
                  rows={6}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  fullWidth
                  required
                  placeholder="Please provide details about the issue..."
                  helperText="Be specific and include any relevant information that will help us investigate"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary">
            Thank you for helping to keep our platform safe and respectful. We will review your report and take appropriate action.
          </Typography>
        </Box>
      </Box>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Report submitted successfully. Thank you!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportScreen; 