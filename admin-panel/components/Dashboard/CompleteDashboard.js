import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CloudDone as CloudDoneIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

const CompleteDashboard = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // State management
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 52847,
      activeUsers: 31248,
      totalEvents: 8247,
      activeEvents: 1834,
      totalBusinesses: 3421,
      verifiedBusinesses: 2847,
      totalRevenue: 1247850,
      monthlyRevenue: 184920,
      growthRate: 23.5,
      systemHealth: 99.8
    },
    analytics: {
      userGrowth: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Users',
          data: [4200, 4800, 5200, 5800, 6400, 7100],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true
        }]
      },
      eventCategories: {
        labels: ['Business', 'Social', 'Educational', 'Sports', 'Cultural'],
        datasets: [{
          data: [2847, 1934, 1542, 1287, 934],
          backgroundColor: ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2']
        }]
      },
      revenueChart: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Revenue',
          data: [42000, 48000, 51000, 43920],
          backgroundColor: 'rgba(25, 118, 210, 0.8)'
        }]
      }
    },
    recentActivities: [
      { id: 1, type: 'user_registration', description: 'New user registered: John Doe', timestamp: new Date(), severity: 'info' },
      { id: 2, type: 'event_created', description: 'Event created: Tech Conference 2024', timestamp: new Date(Date.now() - 3600000), severity: 'success' },
      { id: 3, type: 'payment_processed', description: 'Payment processed: $299.99', timestamp: new Date(Date.now() - 7200000), severity: 'success' },
      { id: 4, type: 'business_verification', description: 'Business verified: Local Coffee Shop', timestamp: new Date(Date.now() - 10800000), severity: 'info' },
      { id: 5, type: 'security_alert', description: 'Multiple failed login attempts detected', timestamp: new Date(Date.now() - 14400000), severity: 'warning' }
    ],
    alerts: [
      { id: 1, type: 'critical', message: 'Server response time exceeding threshold', timestamp: new Date(), resolved: false },
      { id: 2, type: 'warning', message: 'High number of failed payments detected', timestamp: new Date(Date.now() - 3600000), resolved: false },
      { id: 3, type: 'info', message: 'New feature deployment completed', timestamp: new Date(Date.now() - 7200000), resolved: true }
    ],
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', joinDate: '2024-01-15', events: 5 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', joinDate: '2024-01-10', events: 12 },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'pending', joinDate: '2024-01-20', events: 2 }
    ],
    events: [
      { id: 1, title: 'Tech Conference 2024', organizer: 'Tech Corp', attendees: 250, status: 'active', date: '2024-02-15' },
      { id: 2, title: 'Community Meetup', organizer: 'Local Group', attendees: 50, status: 'pending', date: '2024-02-20' },
      { id: 3, title: 'Business Workshop', organizer: 'Business Inc', attendees: 120, status: 'completed', date: '2024-01-25' }
    ],
    businesses: [
      { id: 1, name: 'Local Coffee Shop', owner: 'Sarah Miller', status: 'verified', revenue: 15420, rating: 4.8 },
      { id: 2, name: 'Tech Solutions Inc', owner: 'Mike Wilson', status: 'pending', revenue: 89240, rating: 4.5 },
      { id: 3, name: 'Event Planners Pro', owner: 'Lisa Brown', status: 'verified', revenue: 45680, rating: 4.9 }
    ],
    payments: [
      { id: 1, amount: 299.99, customer: 'John Doe', status: 'completed', date: '2024-01-25', method: 'credit_card' },
      { id: 2, amount: 149.50, customer: 'Jane Smith', status: 'pending', date: '2024-01-25', method: 'paypal' },
      { id: 3, amount: 89.99, customer: 'Bob Johnson', status: 'failed', date: '2024-01-24', method: 'bank_transfer' }
    ]
  });
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };
    loadData();
  }, []);

  // Event handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    enqueueSnackbar('Dashboard refreshed successfully', { variant: 'success' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'failed': return 'error';
      case 'verified': return 'success';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Enterprise Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.name || 'Administrator'}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Alert Banner */}
      {dashboardData.alerts.filter(alert => !alert.resolved).length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              View All ({dashboardData.alerts.filter(alert => !alert.resolved).length})
            </Button>
          }
        >
          You have {dashboardData.alerts.filter(alert => !alert.resolved).length} unresolved alerts
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.overview.totalUsers?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{dashboardData.overview.growthRate}% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Events
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.overview.activeEvents?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    {dashboardData.overview.totalEvents} total events
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <EventIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${dashboardData.overview.monthlyRevenue?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12.5% from last month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    System Health
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.overview.systemHealth}%
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    All systems operational
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CloudDoneIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button variant="outlined" startIcon={<AddIcon />}>
              Create Event
            </Button>
            <Button variant="outlined" startIcon={<CheckCircleIcon />}>
              Verify Business
            </Button>
            <Button variant="outlined" startIcon={<AnalyticsIcon />}>
              Generate Report
            </Button>
            <Button variant="outlined" startIcon={<SecurityIcon />}>
              Security Audit
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<AnalyticsIcon />} label="Analytics" />
            <Tab icon={<PeopleIcon />} label="Users" />
            <Tab icon={<EventIcon />} label="Events" />
            <Tab icon={<BusinessIcon />} label="Businesses" />
            <Tab icon={<PaymentIcon />} label="Payments" />
          </Tabs>
        </Box>

        {/* Analytics Tab */}
        {activeTab === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  User Growth Trend
                </Typography>
                <Box height={300}>
                  <Line
                    data={dashboardData.analytics.userGrowth}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Event Categories
                </Typography>
                <Box height={300}>
                  <Pie
                    data={dashboardData.analytics.eventCategories}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Revenue This Month
                </Typography>
                <Box height={250}>
                  <Bar
                    data={dashboardData.analytics.revenueChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Users Tab */}
        {activeTab === 1 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Users</Typography>
              <Button variant="outlined" startIcon={<AddIcon />}>
                Add User
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Events</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell>{user.events}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Events Tab */}
        {activeTab === 2 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Events</Typography>
              <Button variant="outlined" startIcon={<AddIcon />}>
                Create Event
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Organizer</TableCell>
                    <TableCell>Attendees</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.organizer}</TableCell>
                      <TableCell>{event.attendees}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.status}
                          color={getStatusColor(event.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Businesses Tab */}
        {activeTab === 3 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Registered Businesses</Typography>
              <Button variant="outlined" startIcon={<AddIcon />}>
                Add Business
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.businesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell>{business.name}</TableCell>
                      <TableCell>{business.owner}</TableCell>
                      <TableCell>
                        <Chip
                          label={business.status}
                          color={getStatusColor(business.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${business.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <StarIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                          {business.rating}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <CheckCircleIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Payments Tab */}
        {activeTab === 4 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Payments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Amount</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.customer}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
      </Card>

      {/* Recent Activities */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activities
          </Typography>
          <Box>
            {dashboardData.recentActivities.map((activity) => (
              <Box key={activity.id} display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: getSeverityColor(activity.severity) + '.main', mr: 2 }}>
                  {activity.severity === 'warning' ? <WarningIcon /> : <CheckCircleIcon />}
                </Avatar>
                <Box>
                  <Typography variant="body2">
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.timestamp.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompleteDashboard;
