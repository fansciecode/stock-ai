import React from 'react';
import { Card, Typography, Avatar, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfileScreen = () => (
  <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
    <Card style={{ width: 350, textAlign: 'center' }}>
      <Avatar size={120} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
      <Title level={3}>John Doe</Title>
      <Text type="secondary">john.doe@example.com</Text>
      <div style={{ margin: '24px 0' }}>
        <Text>Member since: January 2023</Text><br />
        <Text>Events attended: 12</Text>
      </div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text strong>Welcome to your profile!</Text>
      </Space>
    </Card>
  </div>
);

export default ProfileScreen; 