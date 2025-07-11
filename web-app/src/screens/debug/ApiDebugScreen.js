import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tab,
  Tabs,
  IconButton,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-debug-tabpanel-${index}`}
      aria-labelledby={`api-debug-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ApiDebugScreen = () => {
  const { user, token } = useAuth();
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/events');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [history, setHistory] = useState([]);
  const [savedRequests, setSavedRequests] = useState([]);

  const handleMethodChange = (event) => {
    setMethod(event.target.value);
  };

  const handleEndpointChange = (event) => {
    setEndpoint(event.target.value);
  };

  const handleRequestBodyChange = (event) => {
    setRequestBody(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();
    
    try {
      let requestConfig = {
        method,
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        try {
          requestConfig.data = JSON.parse(requestBody);
        } catch (e) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      const res = await axios(requestConfig);

      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data
      });

      // Add to history
      const historyItem = {
        id: Date.now(),
        method,
        endpoint,
        requestBody: requestBody || null,
        timestamp: new Date().toISOString()
      };
      setHistory([historyItem, ...history].slice(0, 10)); // Keep only last 10 requests
      
    } catch (err) {
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
      setError({
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequest = () => {
    const savedRequest = {
      id: Date.now(),
      name: `${method} ${endpoint}`,
      method,
      endpoint,
      requestBody: requestBody || null
    };
    setSavedRequests([...savedRequests, savedRequest]);
  };

  const loadSavedRequest = (request) => {
    setMethod(request.method);
    setEndpoint(request.endpoint);
    setRequestBody(request.requestBody || '');
  };

  const deleteSavedRequest = (id) => {
    setSavedRequests(savedRequests.filter(req => req.id !== id));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatJSON = (json) => {
    try {
      if (typeof json === 'string') {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return json;
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setError(null);
  };

  const handleKeyDown = (e) => {
    // Send request on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      sendRequest();
    }
  };

  return (
    <Container maxWidth="xl">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          API Debug Console
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Request
              </Typography>
              
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Method</InputLabel>
                    <Select
                      value={method}
                      onChange={handleMethodChange}
                      label="Method"
                    >
                      <MenuItem value="GET">GET</MenuItem>
                      <MenuItem value="POST">POST</MenuItem>
                      <MenuItem value="PUT">PUT</MenuItem>
                      <MenuItem value="PATCH">PATCH</MenuItem>
                      <MenuItem value="DELETE">DELETE</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={9}>
                  <TextField
                    label="Endpoint"
                    value={endpoint}
                    onChange={handleEndpointChange}
                    fullWidth
                    sx={{ mb: 2 }}
                    placeholder="e.g. /api/events"
                  />
                </Grid>
              </Grid>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <TextField
                  label="Request Body (JSON)"
                  value={requestBody}
                  onChange={handleRequestBodyChange}
                  multiline
                  rows={10}
                  fullWidth
                  sx={{ mb: 2, fontFamily: 'monospace' }}
                  placeholder='{"key": "value"}'
                  onKeyDown={handleKeyDown}
                />
              )}

              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={clearResponse}
                  startIcon={<DeleteIcon />}
                >
                  Clear
                </Button>
                
                <Box>
                  <Button
                    variant="outlined"
                    onClick={handleSaveRequest}
                    startIcon={<SaveIcon />}
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={sendRequest}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Box mt={4}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Saved Requests" />
                <Tab label="History" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  {savedRequests.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                      No saved requests. Use the "Save" button to save requests for later use.
                    </Typography>
                  ) : (
                    <Box>
                      {savedRequests.map((req) => (
                        <Box
                          key={req.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle2">
                              {req.name}
                            </Typography>
                            <Box display="flex" alignItems="center" mt={0.5}>
                              <Chip
                                label={req.method}
                                size="small"
                                color={
                                  req.method === 'GET' ? 'info' :
                                  req.method === 'POST' ? 'success' :
                                  req.method === 'PUT' || req.method === 'PATCH' ? 'warning' :
                                  req.method === 'DELETE' ? 'error' : 'default'
                                }
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {req.endpoint}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => loadSavedRequest(req)}
                              title="Load request"
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteSavedRequest(req.id)}
                              title="Delete request"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  {history.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                      No request history yet. Send requests to populate history.
                    </Typography>
                  ) : (
                    <Box>
                      {history.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => loadSavedRequest(item)}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center">
                              <Chip
                                label={item.method}
                                size="small"
                                color={
                                  item.method === 'GET' ? 'info' :
                                  item.method === 'POST' ? 'success' :
                                  item.method === 'PUT' || item.method === 'PATCH' ? 'warning' :
                                  item.method === 'DELETE' ? 'error' : 'default'
                                }
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="body2">
                                {item.endpoint}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </TabPanel>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Response
              </Typography>

              {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              )}

              {!loading && error && (
                <Box>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Error: {error.message} {error.status && `(${error.status} ${error.statusText})`}
                  </Alert>
                  
                  {responseTime && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Response time: {responseTime}ms
                    </Typography>
                  )}
                  
                  {error.data && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2">
                          Response Body
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(formatJSON(error.data))}
                          title="Copy to clipboard"
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          maxHeight: '400px',
                          overflow: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {formatJSON(error.data)}
                      </Paper>
                    </Box>
                  )}
                </Box>
              )}

              {!loading && response && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Chip
                      label={`${response.status} ${response.statusText}`}
                      color={
                        response.status < 300 ? 'success' :
                        response.status < 400 ? 'info' :
                        response.status < 500 ? 'warning' : 'error'
                      }
                      sx={{ mr: 2 }}
                    />
                    
                    {responseTime && (
                      <Typography variant="caption" color="text.secondary">
                        Response time: {responseTime}ms
                      </Typography>
                    )}
                  </Box>
                  
                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2">
                        Response Headers
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(formatJSON(response.headers))}
                        title="Copy to clipboard"
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        maxHeight: '150px',
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    >
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key}><strong>{key}:</strong> {value}</div>
                      ))}
                    </Paper>
                  </Box>
                  
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2">
                        Response Body
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(formatJSON(response.data))}
                        title="Copy to clipboard"
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        maxHeight: '400px',
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {formatJSON(response.data)}
                    </Paper>
                  </Box>
                </Box>
              )}

              {!loading && !response && !error && (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="200px"
                >
                  <Typography color="text.secondary">
                    Send a request to see the response here
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ApiDebugScreen; 