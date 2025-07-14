import React from 'react';
import { Layout, Row, Col, Button, Typography, Card, Space, Divider } from 'antd';
import {
  CalendarOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  SecurityScanOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  StarOutlined,
  TeamOutlined,
  DashboardOutlined,
  BellOutlined,
  AndroidOutlined,
  AppleOutlined,
  LoginOutlined,
  UserAddOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  MobileOutlined,
  LaptopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const { Content, Header, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <CalendarOutlined className="feature-icon" />,
      title: "Event Management",
      description: "Create, discover, and manage events with ease. From corporate meetings to social gatherings."
    },
    {
      icon: <CreditCardOutlined className="feature-icon" />,
      title: "Secure Payments",
      description: "Process payments securely with multiple payment gateways. Subscription packages available."
    },
    {
      icon: <MessageOutlined className="feature-icon" />,
      title: "Real-time Chat",
      description: "Connect with other users through our integrated messaging system and community features."
    },
    {
      icon: <EnvironmentOutlined className="feature-icon" />,
      title: "Location Services",
      description: "Find nearby events and services based on your location with GPS integration."
    },
    {
      icon: <ShoppingCartOutlined className="feature-icon" />,
      title: "E-commerce",
      description: "Browse and purchase products with our comprehensive e-commerce platform."
    },
    {
      icon: <SecurityScanOutlined className="feature-icon" />,
      title: "Advanced Security",
      description: "Two-factor authentication, biometric security, and comprehensive privacy controls."
    },
    {
      icon: <StarOutlined className="feature-icon" />,
      title: "Reviews & Ratings",
      description: "Share your experiences and read reviews from verified users in our community."
    },
    {
      icon: <DashboardOutlined className="feature-icon" />,
      title: "Analytics Dashboard",
      description: "Track your activities, view insights, and manage your profile with detailed analytics."
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "5K+", label: "Events Created" },
    { value: "500+", label: "Cities Covered" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (
    <Layout className="landing-layout">
      <Header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <Title level={2} className="logo-text">IBCM</Title>
            <Text className="logo-subtitle">Business & Community Platform</Text>
          </div>
          <Space size="large" className="header-actions">
            <Button 
              type="default" 
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              size="large"
            >
              Login
            </Button>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={() => navigate('/signup')}
              size="large"
            >
              Sign Up
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <Row justify="center" align="middle" className="hero-row">
            <Col xs={24} lg={12} className="hero-text">
              <Title level={1} className="hero-title">
                Your All-in-One Business & Community Platform
              </Title>
              <Paragraph className="hero-description">
                Connect, manage events, process payments, and grow your business with IBCM. 
                A comprehensive platform designed for modern businesses and communities.
              </Paragraph>
              <Space size="large" className="hero-actions">
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/signup')}
                  className="cta-button"
                >
                  Get Started Free
                </Button>
                <Button 
                  size="large" 
                  onClick={() => navigate('/login')}
                  className="demo-button"
                >
                  View Demo
                </Button>
              </Space>
            </Col>
            <Col xs={24} lg={12} className="hero-image">
              <div className="hero-visual">
                <div className="floating-card card-1">
                  <CalendarOutlined /> Events
                </div>
                                 <div className="floating-card card-2">
                   <CreditCardOutlined /> Payments
                 </div>
                <div className="floating-card card-3">
                  <MessageOutlined /> Chat
                </div>
                <div className="main-app-mockup">
                  <LaptopOutlined className="mockup-icon" />
                  <MobileOutlined className="mobile-mockup-icon" />
                </div>
              </div>
            </Col>
          </Row>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <Row gutter={[32, 32]} justify="center">
            {stats.map((stat, index) => (
              <Col xs={12} md={6} key={index}>
                <div className="stat-card">
                  <Title level={2} className="stat-value">{stat.value}</Title>
                  <Text className="stat-label">{stat.label}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <Row justify="center" className="section-header">
            <Col xs={24} lg={16} className="text-center">
              <Title level={2}>Powerful Features for Every Need</Title>
              <Paragraph className="section-description">
                From event management to secure payments, IBCM provides all the tools you need to succeed.
              </Paragraph>
            </Col>
          </Row>
          <Row gutter={[32, 32]} className="features-grid">
            {features.map((feature, index) => (
              <Col xs={24} md={12} lg={6} key={index}>
                <Card className="feature-card" hoverable>
                  <div className="feature-content">
                    {feature.icon}
                    <Title level={4} className="feature-title">{feature.title}</Title>
                    <Paragraph className="feature-description">{feature.description}</Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Cross-Platform Section */}
        <section className="platform-section">
          <Row justify="center" align="middle" gutter={[48, 48]}>
            <Col xs={24} lg={12} className="platform-text">
              <Title level={2}>Available Everywhere</Title>
              <Paragraph>
                Access IBCM on any device - web, mobile, or tablet. Seamless synchronization 
                across all your devices ensures you're always connected.
              </Paragraph>
              <div className="platform-features">
                <div className="platform-feature">
                  <CheckCircleOutlined className="check-icon" />
                  <Text>Cross-platform synchronization</Text>
                </div>
                <div className="platform-feature">
                  <CheckCircleOutlined className="check-icon" />
                  <Text>Offline mode support</Text>
                </div>
                <div className="platform-feature">
                  <CheckCircleOutlined className="check-icon" />
                  <Text>Real-time notifications</Text>
                </div>
                <div className="platform-feature">
                  <CheckCircleOutlined className="check-icon" />
                  <Text>Cloud backup & sync</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12} className="platform-apps">
              <div className="app-downloads">
                <Title level={3}>Download Our Apps</Title>
                <Space direction="vertical" size="large" className="download-buttons">
                  <Button 
                    type="default" 
                    size="large" 
                    icon={<AndroidOutlined />}
                    className="download-btn android-btn"
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.ibcm.app', '_blank')}
                  >
                    Download for Android
                  </Button>
                  <Button 
                    type="default" 
                    size="large" 
                    icon={<AppleOutlined />}
                    className="download-btn ios-btn"
                    onClick={() => window.open('https://apps.apple.com/app/ibcm/id1234567890', '_blank')}
                  >
                    Download for iOS
                  </Button>
                  <Button 
                    type="default" 
                    size="large" 
                    icon={<GlobalOutlined />}
                    className="download-btn web-btn"
                    onClick={() => navigate('/signup')}
                  >
                    Use Web App
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <Title level={2} className="cta-title">Ready to Get Started?</Title>
            <Paragraph className="cta-description">
              Join thousands of businesses and communities already using IBCM to grow and connect.
            </Paragraph>
            <Space size="large" className="cta-actions">
              <Button 
                type="primary" 
                size="large" 
                icon={<UserAddOutlined />}
                onClick={() => navigate('/signup')}
                className="cta-primary"
              >
                Start Free Trial
              </Button>
              <Button 
                size="large" 
                icon={<MessageOutlined />}
                className="cta-secondary"
              >
                Contact Sales
              </Button>
            </Space>
          </div>
        </section>
      </Content>

      <Footer className="landing-footer">
        <div className="footer-content">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Title level={4} className="footer-title">IBCM</Title>
              <Paragraph className="footer-description">
                Empowering businesses and communities with modern digital solutions.
              </Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} className="footer-section-title">Product</Title>
              <div className="footer-links">
                <Button type="link" onClick={() => navigate('/signup')}>Features</Button>
                <Button type="link" onClick={() => navigate('/signup')}>Pricing</Button>
                <Button type="link" onClick={() => navigate('/signup')}>Enterprise</Button>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} className="footer-section-title">Support</Title>
              <div className="footer-links">
                <Button type="link">Help Center</Button>
                <Button type="link">Documentation</Button>
                <Button type="link">Contact Us</Button>
              </div>
            </Col>
          </Row>
          <Divider />
          <div className="footer-bottom">
            <Text className="copyright">© 2024 IBCM. All rights reserved.</Text>
            <Space className="legal-links">
              <Button type="link" size="small">Privacy Policy</Button>
              <Button type="link" size="small">Terms of Service</Button>
              <Button type="link" size="small">Cookie Policy</Button>
            </Space>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default LandingPage;