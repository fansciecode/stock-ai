import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Avatar,
  Button,
  List,
  Badge,
  Progress,
  Calendar,
  Timeline,
  Tabs,
  Space,
  Divider,
  Tag,
  Empty,
  Skeleton,
  Table,
  Select,
  DatePicker,
  Input,
  Alert,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  BellOutlined,
  PlusOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  SettingOutlined,
  ShopOutlined,
  LineChartOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EnterpriseDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setDashboardData({
          stats: {
            totalEvents: 156,
            totalRevenue: 125000,
            totalCustomers: 2340,
            activeBookings: 89,
            eventViews: 15200,
            conversionRate: 12.5,
          },
          recentOrders: [
            {
              id: '1',
              customer: 'John Doe',
              event: 'Corporate Conference 2024',
              amount: 2500,
              status: 'confirmed',
              date: '2024-01-15',
            },
            {
              id: '2',
              customer: 'Jane Smith',
              event: 'Wedding Photography',
              amount: 1800,
              status: 'pending',
              date: '2024-01-14',
            },
            {
              id: '3',
              customer: 'Mike Johnson',
              event: 'Birthday Party',
              amount: 850,
              status: 'completed',
              date: '2024-01-13',
            },
          ],
          upcomingEvents: [
            {
              id: '1',
              title: 'Annual Tech Summit',
              date: '2024-02-01',
              attendees: 250,
              status: 'confirmed',
            },
            {
              id: '2',
              title: 'Music Festival',
              date: '2024-02-15',
              attendees: 500,
              status: 'planning',
            },
          ],
          analytics: {
            revenue: [
              { month: 'Jan', amount: 25000 },
              { month: 'Feb', amount: 32000 },
              { month: 'Mar', amount: 28000 },
              { month: 'Apr', amount: 40000 },
            ],
            eventTypes: [
              { type: 'Corporate', count: 45, percentage: 35 },
              { type: 'Wedding', count: 38, percentage: 30 },
              { type: 'Birthday', count: 25, percentage: 20 },
              { type: 'Other', count: 19, percentage: 15 },
            ],
          },
        });
        setLoading(false);
      }, 1500);
    } catch (error) {
      showError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleOutlined />;
      case 'pending':
        return <ClockCircleOutlined />;
      case 'completed':
        return <CheckCircleOutlined />;
      case 'planning':
        return <SyncOutlined />;
      default:
        return <ExclamationCircleOutlined />;
    }
  };

  const orderColumns = [
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Enterprise Dashboard
            </Title>
            <Text type="secondary">
              Welcome back, {user?.displayName || 'Business Owner'}
            </Text>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
              >
                <Option value="week">This Week</Option>
                <Option value="month">This Month</Option>
                <Option value="quarter">This Quarter</Option>
                <Option value="year">This Year</Option>
              </Select>
              <Button type="primary" icon={<PlusOutlined />}>
                Create Event
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={dashboardData?.stats.totalEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={dashboardData?.stats.totalRevenue}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="USD"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={dashboardData?.stats.totalCustomers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Bookings"
              value={dashboardData?.stats.activeBookings}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Event Views" extra={<EyeOutlined />}>
            <Statistic
              value={dashboardData?.stats.eventViews}
              suffix={<Text type="secondary">views</Text>}
            />
            <Progress
              percent={75}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary">+12% from last month</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Conversion Rate" extra={<LineChartOutlined />}>
            <Statistic
              value={dashboardData?.stats.conversionRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
            <Progress
              percent={dashboardData?.stats.conversionRate * 8}
              strokeColor="#1890ff"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary">+2.3% from last week</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Customer Satisfaction" extra={<HeartOutlined />}>
            <Statistic
              value={4.8}
              precision={1}
              suffix="/ 5.0"
              valueStyle={{ color: '#faad14' }}
            />
            <Progress
              percent={96}
              strokeColor="#faad14"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
            <Text type="secondary">Based on 342 reviews</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Recent Orders" extra={<Button type="link">View All</Button>}>
                  <Table
                    dataSource={dashboardData?.recentOrders}
                    columns={orderColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Upcoming Events" extra={<Button type="link">View All</Button>}>
                  <List
                    dataSource={dashboardData?.upcomingEvents}
                    renderItem={(event) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<CalendarOutlined />} />}
                          title={
                            <Space>
                              {event.title}
                              <Tag color={getStatusColor(event.status)}>
                                {event.status}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Space split={<Divider type="vertical" />}>
                              <Text>{event.date}</Text>
                              <Text>{event.attendees} attendees</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Analytics" key="analytics">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card title="Revenue Trend">
                  <Empty description="Revenue chart would be displayed here" />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="Event Types Distribution">
                  {dashboardData?.analytics.eventTypes.map((type) => (
                    <div key={type.type} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>{type.type}</Text>
                        <Text strong>{type.count}</Text>
                      </div>
                      <Progress
                        percent={type.percentage}
                        showInfo={false}
                        strokeColor="#1890ff"
                      />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Reports" key="reports">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Reports"
                  description="Financial reports, customer analytics, and event performance metrics would be displayed here."
                  type="info"
                  showIcon
                />
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Settings" key="settings">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Business Settings"
                  description="Configure your business profile, payment methods, notification preferences, and other enterprise settings."
                  type="info"
                  showIcon
                />
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default EnterpriseDashboardScreen;
