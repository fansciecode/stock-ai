import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col, Steps, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './AuthScreen.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const ForgotPasswordScreen = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const { forgotPassword } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const result = await forgotPassword(values.email);

      if (result.success) {
        setEmail(values.email);
        setCurrentStep(1);
        showSuccess('Email Sent', 'Password reset instructions have been sent to your email');
      } else {
        setError(result.message);
        showError('Failed to Send Email', result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      showError('Failed to Send Email', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleResendEmail = async () => {
    if (email) {
      try {
        setLoading(true);
        const result = await forgotPassword(email);

        if (result.success) {
          showSuccess('Email Resent', 'Password reset instructions have been sent again');
        } else {
          showError('Failed to Resend Email', result.message);
        }
      } catch (error) {
        showError('Failed to Resend Email', 'Please try again later');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderEmailForm = () => (
    <div>
      <div className="auth-header">
        <Title level={2} className="auth-title">
          Forgot Password?
        </Title>
        <Text type="secondary" className="auth-subtitle">
          Enter your email address and we'll send you instructions to reset your password
        </Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        name="forgotPassword"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        className="auth-form"
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            {
              required: true,
              message: 'Please input your email!',
            },
            {
              type: 'email',
              message: 'Please enter a valid email!',
            },
          ]}
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="Enter your email address"
            autoComplete="email"
            autoFocus
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="auth-button"
            loading={loading}
            block
          >
            Send Reset Instructions
          </Button>
        </Form.Item>
      </Form>

      <div className="auth-footer">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={handleBackToLogin}
          className="auth-back-button"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );

  const renderSuccessMessage = () => (
    <Result
      icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      title="Check Your Email"
      subTitle={
        <div>
          <Paragraph>
            We've sent password reset instructions to:
          </Paragraph>
          <Paragraph strong style={{ color: '#1890ff', fontSize: '16px' }}>
            {email}
          </Paragraph>
          <Paragraph type="secondary">
            Please check your email and follow the instructions to reset your password.
            If you don't see the email, check your spam folder.
          </Paragraph>
        </div>
      }
      extra={[
        <Button key="login" onClick={handleBackToLogin}>
          Back to Login
        </Button>,
        <Button key="resend" type="primary" onClick={handleResendEmail} loading={loading}>
          Resend Email
        </Button>,
      ]}
    />
  );

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay">
          <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
            <Col xs={22} sm={20} md={16} lg={12} xl={10}>
              <Card className="auth-card" bordered={false}>
                <div style={{ marginBottom: 24 }}>
                  <Steps current={currentStep} size="small">
                    <Step title="Enter Email" />
                    <Step title="Check Email" />
                  </Steps>
                </div>

                {currentStep === 0 && renderEmailForm()}
                {currentStep === 1 && renderSuccessMessage()}
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
