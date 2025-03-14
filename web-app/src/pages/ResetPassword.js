import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import { resetPassword } from '../services/authService';
import '../styles/ResetPassword.css';
import './Auth.css';

const ResetPassword = () => {
  console.log('ResetPassword component rendered');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);

  console.log('Token:', token);

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending reset request with data:', {
        token,
        password: values.newPassword
      });
      
      const response = await resetPassword(token, values.newPassword);
      console.log('Reset response:', response);
      message.success('Password reset successful');
      navigate('/login');
    } catch (error) {
      console.error('Reset error details:', {
        message: error.response?.data?.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      message.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    message.error('Invalid reset link');
    navigate('/login');
    return null;
  }

  return (
    <div className="reset-password-container">
      <Card title="Reset Password" className="reset-password-card">
        <Form
          form={form}
          name="resetPassword"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[
              { required: true, message: 'Please confirm your password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword; 