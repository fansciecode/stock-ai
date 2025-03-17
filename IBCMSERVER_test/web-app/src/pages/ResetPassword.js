import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import api from '../services/api';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const onFinish = async (values) => {
    if (!token) {
      message.error('Invalid or missing reset token');
      return;
    }

    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        token,
        password: values.password
      });
      
      message.success('Password reset successful! Please login with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      message.error(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-container">
        <Card className="reset-password-card" title="Invalid Reset Link">
          <p style={{ textAlign: 'center' }}>
            This password reset link is invalid or has expired.
            Please request a new password reset link.
          </p>
          <Button type="primary" onClick={() => navigate('/login')} block>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <Card className="reset-password-card" title="Reset Password">
        <Form
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your new password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Reset Password
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword; 