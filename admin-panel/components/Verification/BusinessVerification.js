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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Chip,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Tabs,
    Tab
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    Image as ImageIcon,
    Description as DocumentIcon
} from '@mui/icons-material';
import api from '../../services/api';

const BusinessVerification = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [totalBusinesses, setTotalBusinesses] = useState(0);
    const [documentPreview, setDocumentPreview] = useState({ open: false, url: '', title: '' });

    useEffect(() => {
        fetchBusinesses();
    }, [page, rowsPerPage]);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/verifications', {
                params: {
                    page: page + 1,
                    limit: rowsPerPage
                }
            });
            
            setBusinesses(response.data.businesses);
            setTotalBusinesses(response.data.totalPages * rowsPerPage);
            setError(null);
        } catch (error) {
            console.error('Error fetching businesses:', error);
            setError('Failed to load businesses for verification');
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

    const handleOpenDialog = (business) => {
        setSelectedBusiness(business);
        setVerificationNotes('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedBusiness(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleVerification = async (status) => {
        try {
            await api.put(`/admin/verifications/${selectedBusiness._id}`, {
                status,
                notes: verificationNotes
            });
            
            // Update the local state
            setBusinesses(businesses.filter(business => business._id !== selectedBusiness._id));
            handleCloseDialog();
        } catch (error) {
            console.error('Error updating business verification:', error);
            setError('Failed to update business verification status');
        }
    };

    const handleViewDocument = (url, title) => {
        setDocumentPreview({
            open: true,
            url,
            title
        });
    };

    const handleCloseDocumentPreview = () => {
        setDocumentPreview({ open: false, url: '', title: '' });
    };

    if (loading && businesses.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                                </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Business Verification
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            
            <Paper sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Pending Verifications: {totalBusinesses}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Review and verify business accounts to ensure they meet platform standards
                </Typography>
            </Paper>
            
            <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Business Name</TableCell>
                            <TableCell>Owner</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Documents</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {businesses.map((business) => (
                            <TableRow key={business._id}>
                                    <TableCell>{business.name}</TableCell>
                                <TableCell>{business.owner?.name || 'Unknown'}</TableCell>
                                <TableCell>{business.businessType}</TableCell>
                                    <TableCell>
                                    {new Date(business.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                        label={`${business.documents?.length || 0} docs`} 
                                        color="primary"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                        onClick={() => handleOpenDialog(business)}
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                        onClick={() => {
                                            setSelectedBusiness(business);
                                            handleVerification('approved');
                                        }}
                                                    >
                                                        <ApproveIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                        onClick={() => {
                                            setSelectedBusiness(business);
                                            handleVerification('rejected');
                                        }}
                                                    >
                                                        <RejectIcon />
                                                    </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalBusinesses}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            
            {/* Business Details Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>Business Verification</DialogTitle>
                <DialogContent>
                    {selectedBusiness && (
                        <Box sx={{ pt: 2 }}>
                            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                                <Tab label="Business Info" />
                                <Tab label="Documents" />
                                <Tab label="Verification" />
                            </Tabs>
                            
                            {/* Business Info Tab */}
                            {tabValue === 0 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom>
                                            {selectedBusiness.name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Business Type:</strong> {selectedBusiness.businessType}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Registration Number:</strong> {selectedBusiness.registrationNumber || 'Not provided'}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Tax ID:</strong> {selectedBusiness.taxId || 'Not provided'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Owner:</strong> {selectedBusiness.owner?.name || 'Unknown'}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Email:</strong> {selectedBusiness.email}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Phone:</strong> {selectedBusiness.phone || 'Not provided'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Address:</strong> {selectedBusiness.address || 'Not provided'}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Description:</strong> {selectedBusiness.description || 'Not provided'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            )}
                            
                            {/* Documents Tab */}
                            {tabValue === 1 && (
                                <Grid container spacing={2}>
                                    {selectedBusiness.documents?.length > 0 ? (
                                        selectedBusiness.documents.map((doc, index) => (
                                            <Grid item xs={12} sm={6} md={4} key={index}>
                                                <Card>
                                                    <CardMedia
                                                        component="img"
                                                        height="140"
                                                        image={doc.isImage ? doc.url : '/document-placeholder.png'}
                                                        alt={doc.title}
                                                    />
                                                    <CardContent>
                                                        <Typography variant="body1" gutterBottom>
                                                            {doc.title || `Document ${index + 1}`}
                                                        </Typography>
                                                        <Button
                                                            startIcon={doc.isImage ? <ImageIcon /> : <DocumentIcon />}
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => handleViewDocument(doc.url, doc.title)}
                                                        >
                                                            View
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))
                                    ) : (
                                        <Grid item xs={12}>
                                            <Alert severity="warning">
                                                No documents provided
                                            </Alert>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                            
                            {/* Verification Tab */}
                            {tabValue === 2 && (
                                <Box>
                        <TextField
                            fullWidth
                                        label="Verification Notes"
                            multiline
                            rows={4}
                                        value={verificationNotes}
                                        onChange={(e) => setVerificationNotes(e.target.value)}
                            margin="normal"
                                        placeholder="Enter notes regarding the verification decision"
                                    />
                                    <Box display="flex" justifyContent="space-between" mt={2}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() => handleVerification('approved')}
                                        >
                                            Approve Business
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleVerification('rejected')}
                                        >
                                            Reject Business
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Document Preview Dialog */}
            <Dialog
                open={documentPreview.open}
                onClose={handleCloseDocumentPreview}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{documentPreview.title || 'Document Preview'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        {documentPreview.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img 
                                src={documentPreview.url} 
                                alt={documentPreview.title}
                                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                            />
                        ) : (
                            <iframe
                                src={documentPreview.url}
                                title={documentPreview.title}
                                width="100%"
                                height="500px"
                                frameBorder="0"
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDocumentPreview}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BusinessVerification; 