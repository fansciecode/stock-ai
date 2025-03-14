import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  CarOutlined
} from '@ant-design/icons';
import MainLayout from '../components/Layout/MainLayout';
import api from '../services/api';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalBusinesses: 0,
    totalDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Title level={2}>Dashboard Overview</Title>
      {error && (
        <div style={{ marginBottom: '24px', color: '#ff4d4f' }}>
          {error}
        </div>
      )}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Businesses"
              value={stats.totalBusinesses}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Deliveries"
              value={stats.totalDeliveries}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default Dashboard; 