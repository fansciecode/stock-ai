import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { forgotPassword } from '../services/authService';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      message.success('Password reset link has been sent to your email');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <Card title="Forgot Password" className="forgot-password-card">
        <Form
          form={form}
          name="forgotPassword"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Send Reset Link
            </Button>
          </Form.Item>

          <Form.Item>
            <Link to="/login">Back to Login</Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword; 