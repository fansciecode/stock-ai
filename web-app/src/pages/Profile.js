import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import MainLayout from '../components/Layout/MainLayout';
import api from '../services/api';

const { Title } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me');
      form.setFieldsValue({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      message.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      await api.put('/users/update', values);
      message.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <Title level={2}>Profile Settings</Title>
      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ name: '', email: '', phone: '' }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Your name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Your email" disabled />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ pattern: /^\+?[\d\s-]+$/, message: 'Please enter a valid phone number' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Your phone number" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </MainLayout>
  );
};

export default Profile;
