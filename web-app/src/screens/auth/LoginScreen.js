import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './AuthScreen.css';

const { Title, Text } = Typography;

const LoginScreen = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const result = await login(values.email, values.password);

      if (result.success) {
        showSuccess('Login Successful', 'Welcome back!');
        navigate('/app');
      } else {
        setError(result.message);
        showError('Login Failed', result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      showError('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google OAuth login
    showError('Coming Soon', 'Google login will be available soon');
  };

  const handleFacebookLogin = () => {
    // Implement Facebook OAuth login
    showError('Coming Soon', 'Facebook login will be available soon');
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay">
          <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
            <Col xs={22} sm={20} md={16} lg={12} xl={10}>
              <Card className="auth-card" bordered={false}>
                <div className="auth-header">
                  <Title level={2} className="auth-title">
                    Welcome Back
                  </Title>
                  <Text type="secondary" className="auth-subtitle">
                    Sign in to your IBCM account
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
                  name="login"
                  onFinish={onFinish}
                  layout="vertical"
                  size="large"
                  className="auth-form"
                >
                  <Form.Item
                    name="email"
                    label="Email"
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
                      prefix={<UserOutlined className="site-form-item-icon" />}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your password!',
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="site-form-item-icon" />}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <div className="auth-forgot-password">
                    <Link to="/forgot-password">
                      <Text type="secondary">Forgot password?</Text>
                    </Link>
                  </div>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="auth-button"
                      loading={loading}
                      block
                    >
                      Sign In
                    </Button>
                  </Form.Item>
                </Form>

                <Divider>
                  <Text type="secondary">or continue with</Text>
                </Divider>

                <div className="auth-social-buttons">
                  <Button
                    icon={<GoogleOutlined />}
                    onClick={handleGoogleLogin}
                    className="social-button google-button"
                    block
                  >
                    Google
                  </Button>
                  <Button
                    icon={<FacebookOutlined />}
                    onClick={handleFacebookLogin}
                    className="social-button facebook-button"
                    block
                  >
                    Facebook
                  </Button>
                </div>

                <div className="auth-footer">
                  <Text type="secondary">
                    Don't have an account?{' '}
                    <Link to="/signup">
                      <Text type="primary">Sign up</Text>
                    </Link>
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
