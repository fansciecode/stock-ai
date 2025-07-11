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
  Radio,
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
  RobotOutlined,
  ArrowUpOutlined as TrendingUpOutlined,
  SmileOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './DashboardScreen.css';
import aiService from "../../services/aiService";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [businessAnalytics, setBusinessAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('month');

  useEffect(() => {
    loadDashboardData();
    if (user && user.businessId) {
      loadBusinessAnalytics(analyticsPeriod);
    }
  }, [user?.businessId, analyticsPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - replace with actual API call
      setDashboardData({
        stats: {
          totalEvents: 15,
          upcomingEvents: 8,
          totalAttendees: 1250,
          totalRevenue: 45000,
          growthRate: 12.5,
        },
        recentEvents: [
          {
            id: 1,
            title: 'Tech Conference 2024',
            date: '2024-02-15',
            attendees: 150,
            status: 'upcoming',
            image: '/api/placeholder/60/60',
          },
          {
            id: 2,
            title: 'Business Networking',
            date: '2024-02-10',
            attendees: 75,
            status: 'completed',
            image: '/api/placeholder/60/60',
          },
          {
            id: 3,
            title: 'Workshop Series',
            date: '2024-02-20',
            attendees: 45,
            status: 'upcoming',
            image: '/api/placeholder/60/60',
          },
        ],
        notifications: [
          {
            id: 1,
            title: 'New event registration',
            message: 'John Doe registered for Tech Conference 2024',
            time: '2 hours ago',
            type: 'success',
          },
          {
            id: 2,
            title: 'Payment received',
            message: 'Payment of $299 received for Business Networking',
            time: '4 hours ago',
            type: 'info',
          },
          {
            id: 3,
            title: 'Event reminder',
            message: 'Workshop Series starts in 3 days',
            time: '1 day ago',
            type: 'warning',
          },
        ],
        activities: [
          {
            id: 1,
            action: 'Created new event',
            item: 'Tech Conference 2024',
            time: '2024-02-01 10:30',
          },
          {
            id: 2,
            action: 'Updated event details',
            item: 'Business Networking',
            time: '2024-01-30 14:15',
          },
          {
            id: 3,
            action: 'Published event',
            item: 'Workshop Series',
            time: '2024-01-28 09:45',
          },
        ],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessAnalytics = async (period = 'month') => {
    if (!user || !user.businessId) return;
    
    setAnalyticsLoading(true);
    try {
      const analytics = await aiService.getBusinessAnalytics(user.businessId, period);
      setBusinessAnalytics(analytics);
    } catch (error) {
      console.error("Failed to load business analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    navigate('/create-event');
  };

  const handleViewAllEvents = () => {
    navigate('/events');
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const onPanelChange = (value, mode) => {
    setSelectedDate(value);
  };

  const handlePeriodChange = (period) => {
    setAnalyticsPeriod(period);
  };

  const renderOverviewTab = () => (
    <div>
      {/* Welcome Section */}
      <Card className="welcome-card" bordered={false}>
        <Row align="middle" gutter={[24, 24]}>
          <Col flex="auto">
            <div className="welcome-content">
              <Title level={2} className="welcome-title">
                Welcome back, {user?.firstName || 'User'}! 👋
              </Title>
              <Paragraph className="welcome-subtitle">
                Here's what's happening with your events today
              </Paragraph>
            </div>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreateEvent}
              className="create-event-btn"
            >
              Create Event
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Events"
              value={dashboardData?.stats.totalEvents}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Upcoming Events"
              value={dashboardData?.stats.upcomingEvents}
              prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Attendees"
              value={dashboardData?.stats.totalAttendees}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Revenue"
              value={dashboardData?.stats.totalRevenue}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              precision={0}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]} className="main-content">
        <Col xs={24} lg={16}>
          {/* Recent Events */}
          <Card
            title="Recent Events"
            extra={
              <Button type="link" onClick={handleViewAllEvents}>
                View All
              </Button>
            }
            className="recent-events-card"
          >
            {loading ? (
              <Skeleton active />
            ) : (
              <List
                dataSource={dashboardData?.recentEvents}
                renderItem={(event) => (
                  <List.Item
                    key={event.id}
                    className="event-item"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={event.image}
                          size={48}
                          icon={<CalendarOutlined />}
                        />
                      }
                      title={
                        <div className="event-title">
                          {event.title}
                          <Tag
                            color={event.status === 'upcoming' ? 'blue' : 'green'}
                            className="event-status"
                          >
                            {event.status}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="event-details">
                          <Text type="secondary">{event.date}</Text>
                          <Divider type="vertical" />
                          <Text type="secondary">
                            <TeamOutlined /> {event.attendees} attendees
                          </Text>
                        </div>
                      }
                    />
                    <div className="event-actions">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                      />
                      <Button
                        type="text"
                        icon={<SettingOutlined />}
                        size="small"
                      />
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Performance Chart */}
          <Card title="Performance Overview" className="performance-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="performance-item">
                  <Text type="secondary">Event Completion Rate</Text>
                  <Progress
                    percent={85}
                    strokeColor="#52c41a"
                    className="performance-progress"
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="performance-item">
                  <Text type="secondary">Attendance Rate</Text>
                  <Progress
                    percent={92}
                    strokeColor="#1890ff"
                    className="performance-progress"
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="performance-item">
                  <Text type="secondary">Revenue Growth</Text>
                  <Progress
                    percent={dashboardData?.stats.growthRate}
                    strokeColor="#fa8c16"
                    className="performance-progress"
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="performance-item">
                  <Text type="secondary">Customer Satisfaction</Text>
                  <Progress
                    percent={88}
                    strokeColor="#722ed1"
                    className="performance-progress"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Notifications */}
          <Card
            title={
              <Space>
                <BellOutlined />
                Notifications
                <Badge count={dashboardData?.notifications.length} />
              </Space>
            }
            className="notifications-card"
          >
            {loading ? (
              <Skeleton active />
            ) : (
              <List
                dataSource={dashboardData?.notifications}
                renderItem={(notification) => (
                  <List.Item key={notification.id} className="notification-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          style={{
                            backgroundColor:
                              notification.type === 'success'
                                ? '#52c41a'
                                : notification.type === 'warning'
                                ? '#faad14'
                                : '#1890ff',
                          }}
                        />
                      }
                      title={notification.title}
                      description={
                        <div>
                          <Text type="secondary">{notification.message}</Text>
                          <br />
                          <Text type="secondary" className="notification-time">
                            {notification.time}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Calendar */}
          <Card title="Calendar" className="calendar-card">
            <Calendar
              fullscreen={false}
              onPanelChange={onPanelChange}
              className="dashboard-calendar"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderActivityTab = () => (
    <Card title="Recent Activity" className="activity-card">
      {loading ? (
        <Skeleton active />
      ) : (
        <Timeline
          items={dashboardData?.activities.map((activity) => ({
            children: (
              <div>
                <Text strong>{activity.action}</Text>
                <br />
                <Text type="secondary">{activity.item}</Text>
                <br />
                <Text type="secondary" className="activity-time">
                  {activity.time}
                </Text>
              </div>
            ),
          }))}
        />
      )}
    </Card>
  );

  const renderBusinessAnalytics = () => {
    if (!user || !user.businessId) return null;
    
    return (
      <Card 
        title={
          <div className="analytics-header">
            <span><RobotOutlined /> AI Business Analytics</span>
            <Radio.Group 
              value={analyticsPeriod} 
              onChange={(e) => handlePeriodChange(e.target.value)}
              buttonStyle="solid" 
              size="small"
            >
              <Radio.Button value="week">Week</Radio.Button>
              <Radio.Button value="month">Month</Radio.Button>
              <Radio.Button value="quarter">Quarter</Radio.Button>
              <Radio.Button value="year">Year</Radio.Button>
            </Radio.Group>
          </div>
        } 
        className="analytics-card"
        loading={analyticsLoading}
      >
        {businessAnalytics ? (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Demand Score" 
                  value={businessAnalytics.demandScore ? (businessAnalytics.demandScore * 100).toFixed(0) : 0} 
                  suffix="%" 
                  prefix={<TrendingUpOutlined />} 
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Customer Satisfaction" 
                  value={businessAnalytics.customerSatisfaction ? (businessAnalytics.customerSatisfaction * 100).toFixed(0) : 0} 
                  suffix="%" 
                  prefix={<SmileOutlined />} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Growth Trend" 
                  value={businessAnalytics.growthTrend || 0} 
                  prefix={<RiseOutlined />} 
                  valueStyle={{ color: businessAnalytics.growthTrend > 0 ? '#3f8600' : '#cf1322' }}
                  suffix="%"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Competitive Position" 
                  value={businessAnalytics.competitivePosition || 'Average'} 
                  prefix={<TrophyOutlined />} 
                />
              </Col>
            </Row>
            
            {businessAnalytics.topPerformingEvents && businessAnalytics.topPerformingEvents.length > 0 && (
              <div className="analytics-section">
                <Title level={5}>Top Performing Events</Title>
                <List
                  size="small"
                  dataSource={businessAnalytics.topPerformingEvents}
                  renderItem={event => (
                    <List.Item>
                      <List.Item.Meta
                        title={event.title}
                        description={`Score: ${(event.score * 100).toFixed(0)}% • Revenue: $${event.revenue?.toFixed(2) || 0}`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
            
            {businessAnalytics.recommendations && businessAnalytics.recommendations.length > 0 && (
              <div className="analytics-section">
                <Title level={5}>AI Recommendations</Title>
                <List
                  size="small"
                  dataSource={businessAnalytics.recommendations}
                  renderItem={recommendation => (
                    <List.Item>
                      <List.Item.Meta
                        title={recommendation.title}
                        description={recommendation.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
            
            {businessAnalytics.customerSegments && (
              <div className="analytics-section">
                <Title level={5}>Customer Segments</Title>
                <Row gutter={[16, 16]}>
                  {Object.entries(businessAnalytics.customerSegments).map(([segment, percentage]) => (
                    <Col xs={24} sm={12} md={8} key={segment}>
                      <Card size="small">
                        <Statistic 
                          title={segment} 
                          value={percentage} 
                          suffix="%" 
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
            
            {businessAnalytics.pricingInsights && (
              <div className="analytics-section">
                <Title level={5}>Pricing Insights</Title>
                <Alert
                  message={businessAnalytics.pricingInsights.recommendation}
                  description={businessAnalytics.pricingInsights.explanation}
                  type="info"
                  showIcon
                />
              </div>
            )}
          </>
        ) : (
          <Empty description="No analytics available yet. Create more events to get business insights." />
        )}
      </Card>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title level={1} className="dashboard-title">
          Dashboard
        </Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="dashboard-tabs"
      >
        <TabPane tab="Overview" key="overview">
          {renderOverviewTab()}
        </TabPane>
        <TabPane tab="Activity" key="activity">
          {renderActivityTab()}
        </TabPane>
        <TabPane tab="Analytics" key="analytics">
          {renderBusinessAnalytics()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DashboardScreen;
