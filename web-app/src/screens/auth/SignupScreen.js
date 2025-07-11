import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, Row, Col, Select, DatePicker, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './AuthScreen.css';

const { Title, Text } = Typography;
const { Option } = Select;

const SignupScreen = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signup } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        gender: values.gender,
        termsAccepted: values.terms,
        marketingConsent: values.marketing || false,
      };

      const result = await signup(userData);

      if (result.success) {
        showSuccess('Registration Successful', 'Your account has been created successfully! Please check your email for verification.');
        navigate('/login');
      } else {
        setError(result.message);
        showError('Registration Failed', result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      showError('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Implement Google OAuth signup
    showError('Coming Soon', 'Google signup will be available soon');
  };

  const handleFacebookSignup = () => {
    // Implement Facebook OAuth signup
    showError('Coming Soon', 'Facebook signup will be available soon');
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay">
          <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
            <Col xs={22} sm={20} md={18} lg={14} xl={12}>
              <Card className="auth-card" bordered={false}>
                <div className="auth-header">
                  <Title level={2} className="auth-title">
                    Create Account
                  </Title>
                  <Text type="secondary" className="auth-subtitle">
                    Join IBCM and discover amazing events
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
                  name="signup"
                  onFinish={onFinish}
                  layout="vertical"
                  size="large"
                  className="auth-form"
                  scrollToFirstError
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="firstName"
                        label="First Name"
                        rules={[
                          {
                            required: true,
                            message: 'Please input your first name!',
                          },
                          {
                            min: 2,
                            message: 'First name must be at least 2 characters!',
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined className="site-form-item-icon" />}
                          placeholder="Enter your first name"
                          autoComplete="given-name"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lastName"
                        label="Last Name"
                        rules={[
                          {
                            required: true,
                            message: 'Please input your last name!',
                          },
                          {
                            min: 2,
                            message: 'Last name must be at least 2 characters!',
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined className="site-form-item-icon" />}
                          placeholder="Enter your last name"
                          autoComplete="family-name"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

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
                      prefix={<MailOutlined className="site-form-item-icon" />}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your phone number!',
                      },
                      {
                        pattern: /^[+]?[\d\s\-\(\)]+$/,
                        message: 'Please enter a valid phone number!',
                      },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined className="site-form-item-icon" />}
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="dateOfBirth"
                        label="Date of Birth"
                        rules={[
                          {
                            required: true,
                            message: 'Please select your date of birth!',
                          },
                        ]}
                      >
                        <DatePicker
                          placeholder="Select date of birth"
                          style={{ width: '100%' }}
                          disabledDate={(current) => current && current > new Date()}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="gender"
                        label="Gender"
                        rules={[
                          {
                            required: true,
                            message: 'Please select your gender!',
                          },
                        ]}
                      >
                        <Select placeholder="Select gender">
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                          <Option value="prefer-not-to-say">Prefer not to say</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your password!',
                      },
                      {
                        min: 8,
                        message: 'Password must be at least 8 characters!',
                      },
                      {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character!',
                      },
                    ]}
                    hasFeedback
                  >
                    <Input.Password
                      prefix={<LockOutlined className="site-form-item-icon" />}
                      placeholder="Enter your password"
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['password']}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: 'Please confirm your password!',
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('The two passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="site-form-item-icon" />}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item
                    name="terms"
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value ? Promise.resolve() : Promise.reject(new Error('Should accept agreement')),
                      },
                    ]}
                  >
                    <Checkbox>
                      I agree to the{' '}
                      <Link to="/terms" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" target="_blank">
                        Privacy Policy
                      </Link>
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="marketing" valuePropName="checked">
                    <Checkbox>
                      I would like to receive marketing communications and updates about events
                    </Checkbox>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="auth-button"
                      loading={loading}
                      block
                    >
                      Create Account
                    </Button>
                  </Form.Item>
                </Form>

                <Divider>
                  <Text type="secondary">or continue with</Text>
                </Divider>

                <div className="auth-social-buttons">
                  <Button
                    icon={<GoogleOutlined />}
                    onClick={handleGoogleSignup}
                    className="social-button google-button"
                    block
                  >
                    Google
                  </Button>
                  <Button
                    icon={<FacebookOutlined />}
                    onClick={handleFacebookSignup}
                    className="social-button facebook-button"
                    block
                  >
                    Facebook
                  </Button>
                </div>

                <div className="auth-footer">
                  <Text type="secondary">
                    Already have an account?{' '}
                    <Link to="/login">
                      <Text type="primary">Sign in</Text>
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

export default SignupScreen;
