import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Alert, Spin, Select, Timeline } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  RiseOutlined
} from '@ant-design/icons';
import MainLayout from '../components/Layout/MainLayout';
import dashboardService from '../services/dashboardService';

const { Option } = Select;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [metrics, setMetrics] = useState({
    delivery: [],
    business: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, activityData, deliveryMetrics, businessMetrics, userMetrics] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getDeliveryMetrics(period),
        dashboardService.getBusinessMetrics(period),
        dashboardService.getUserMetrics(period)
      ]);

      setStats(statsData);
      setActivity(activityData);
      setMetrics({
        delivery: deliveryMetrics,
        business: businessMetrics,
        users: userMetrics
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Businesses"
              value={stats?.activeBusinesses || 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Deliveries Today"
              value={stats?.deliveriesToday || 0}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Growth Rate"
              value={stats?.growthRate || 0}
              prefix={<RiseOutlined />}
              suffix="%"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title="Metrics Overview"
            extra={
              <Select
                value={period}
                onChange={setPeriod}
                style={{ width: 120 }}
              >
                <Option value="day">Today</Option>
                <Option value="week">This Week</Option>
                <Option value="month">This Month</Option>
              </Select>
            }
          >
            {/* Add charts/graphs here using metrics data */}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Activity">
            <Timeline>
              {activity.map((item, index) => (
                <Timeline.Item key={index}>
                  <p>{item.description}</p>
                  <small>{new Date(item.timestamp).toLocaleString()}</small>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default Dashboard; 