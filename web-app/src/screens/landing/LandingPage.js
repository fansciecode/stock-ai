import React from 'react';
import { Layout, Row, Col, Button, Typography, Card, Space, Divider, Carousel } from 'antd';
import {
  CalendarOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  SecurityScanOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  StarOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  AndroidOutlined,
  AppleOutlined,
  GlobalOutlined,
  MobileOutlined,
  LaptopOutlined,
  UserAddOutlined,
  LoginOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const { Content, Header, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const testimonials = [
  {
    name: 'Sarah',
    role: 'Musician',
    quote: '"IBCM helped me get my first 100 event attendees!"',
    img: '/logo192.png',
  },
  {
    name: 'Mike',
    role: 'Gym Owner',
    quote: '"Now I promote fitness boot camps & get new clients weekly!"',
    img: '/logo192.png',
  },
  {
    name: 'Local Café',
    role: 'Business',
    quote: '"We hosted a ‘Weekend Coffee Tasting’ event and saw a 30% increase in sales!"',
    img: '/logo192.png',
  },
];

const features = [
  {
    icon: <StarOutlined className="feature-icon" />, title: "AI-Powered Suggestions", description: "Personalized event recommendations based on your interests and location."
  },
  {
    icon: <EnvironmentOutlined className="feature-icon" />, title: "Live Map View", description: "Explore events happening around you in real-time, visually."
  },
  {
    icon: <CalendarOutlined className="feature-icon" />, title: "Easy Event Creation", description: "Set up an event in minutes, no tech skills needed."
  },
  {
    icon: <ShoppingCartOutlined className="feature-icon" />, title: "Local Business Promotions", description: "Sell products & services through event listings."
  },
  {
    icon: <MessageOutlined className="feature-icon" />, title: "In-App Messaging", description: "Chat with attendees & organizers."
  },
  {
    icon: <CreditCardOutlined className="feature-icon" />, title: "Secure Payments", description: "Easy checkout with multiple options."
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Layout className="landing-layout">
      <Header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/logo192.png" alt="IBCM Logo" className="ibcm-logo" />
            <Title level={2} className="logo-text">IBCM</Title>
          </div>
          <Space size="large" className="header-actions">
            <Button type="default" icon={<LoginOutlined />} onClick={() => navigate('/login')} size="large">Login</Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/signup')} size="large">Sign Up</Button>
          </Space>
        </div>
      </Header>
      <Content className="landing-content">
        {/* Hero Section with background image/video */}
        <section className="hero-section aesthetic-hero">
          <div className="hero-bg-media">
            {/* Placeholder for background image or video */}
            <img src="/logo192.png" alt="Hero Visual" className="hero-bg-img" />
          </div>
          <Row justify="center" align="middle" className="hero-row">
            <Col xs={24} lg={12} className="hero-text">
              <Title level={1} className="hero-title">Discover. Connect. Experience.</Title>
              <Paragraph className="hero-description">
                The all-in-one platform for hyperlocal events, business promotions, and community experiences.<br />
                Find, create, and join events near you. Promote your business, connect with your community, and never miss out again.
              </Paragraph>
              <Space size="large" className="hero-actions">
                <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => navigate('/signup')} className="cta-button">Get Started Free</Button>
                <Button size="large" onClick={() => navigate('/login')} className="demo-button">Login</Button>
              </Space>
            </Col>
            <Col xs={24} lg={12} className="hero-image">
              <div className="hero-visual">
                {/* Placeholder for animated app mockup or video */}
                <img src="/logo192.png" alt="App Demo" className="app-mockup-img" />
              </div>
            </Col>
          </Row>
        </section>

        {/* Features Section */}
        <section className="features-section aesthetic-features">
          <Row justify="center" className="section-header">
            <Col xs={24} lg={16} className="text-center">
              <Title level={2}>Why Use IBCM?</Title>
              <Paragraph className="section-description">
                For event lovers, businesses, creators, and communities—IBCM brings people together through experiences.
              </Paragraph>
            </Col>
          </Row>
          <Row gutter={[32, 32]} className="features-grid">
            {features.map((feature, index) => (
              <Col xs={24} md={12} lg={8} key={index}>
                <Card className="feature-card animated-feature" hoverable>
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

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <Title level={2} className="text-center">How IBCM Works</Title>
          <Row gutter={[32, 32]} justify="center" className="how-steps">
            <Col xs={24} md={6} className="how-step">
              <CalendarOutlined className="how-icon" />
              <Title level={4}>Browse & Discover</Title>
              <Paragraph>Find events that match your interests and location.</Paragraph>
            </Col>
            <Col xs={24} md={6} className="how-step">
              <CreditCardOutlined className="how-icon" />
              <Title level={4}>Join or Book</Title>
              <Paragraph>Book tickets or join instantly with secure payments.</Paragraph>
            </Col>
            <Col xs={24} md={6} className="how-step">
              <ShoppingCartOutlined className="how-icon" />
              <Title level={4}>Create & Promote</Title>
              <Paragraph>Host your own events and promote your business.</Paragraph>
            </Col>
            <Col xs={24} md={6} className="how-step">
              <MessageOutlined className="how-icon" />
              <Title level={4}>Connect</Title>
              <Paragraph>Chat with organizers & attendees in real time.</Paragraph>
            </Col>
          </Row>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <Title level={2} className="text-center">What Our Users Say</Title>
          <Carousel autoplay className="testimonial-carousel">
            {testimonials.map((t, idx) => (
              <div key={idx} className="testimonial-slide">
                <div className="testimonial-card">
                  <img src={t.img} alt={t.name} className="testimonial-img" />
                  <Title level={4}>{t.name}</Title>
                  <Text type="secondary">{t.role}</Text>
                  <Paragraph className="testimonial-quote">{t.quote}</Paragraph>
                </div>
              </div>
            ))}
          </Carousel>
        </section>

        {/* Download & Get Started Section */}
        <section className="download-section">
          <Row justify="center" align="middle" gutter={[48, 48]}>
            <Col xs={24} lg={12} className="download-text">
              <Title level={2}>Download & Get Started!</Title>
              <Paragraph>
                Join IBCM today and discover exciting events, grow your business, and connect with like-minded people.
              </Paragraph>
              <Space direction="vertical" size="large" className="download-buttons">
                <Button type="default" size="large" icon={<AndroidOutlined />} className="download-btn android-btn">Coming Soon on Android</Button>
                <Button type="default" size="large" icon={<AppleOutlined />} className="download-btn ios-btn">Coming Soon on iOS</Button>
                <Button type="default" size="large" icon={<GlobalOutlined />} className="download-btn web-btn" onClick={() => navigate('/signup')}>Use Web App</Button>
              </Space>
            </Col>
            <Col xs={24} lg={12} className="download-visual">
              <img src="/logo192.png" alt="App Demo" className="app-demo-img" />
            </Col>
          </Row>
        </section>
      </Content>
      <Footer className="landing-footer">
        <div className="footer-content">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Title level={4} className="footer-title">IBCM</Title>
              <Paragraph className="footer-description">Your all-in-one platform for business and community management.</Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} className="footer-section-title">Features</Title>
              <div className="footer-links">
                <Button type="link" onClick={() => navigate('/signup')}>Events</Button>
                <Button type="link" onClick={() => navigate('/signup')}>Products</Button>
                <Button type="link" onClick={() => navigate('/signup')}>Services</Button>
                <Button type="link" onClick={() => navigate('/signup')}>Community</Button>
                <Button type="link" onClick={() => navigate('/signup')}>Packages</Button>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} className="footer-section-title">Support</Title>
              <div className="footer-links">
                <Button type="link">Help Center</Button>
                <Button type="link">Contact</Button>
                <Button type="link">FAQ</Button>
                <Button type="link">Security</Button>
              </div>
            </Col>
          </Row>
          <Divider />
          <div className="footer-bottom">
            <Text className="copyright">© 2025 IBCM. All rights reserved.</Text>
            <Space className="legal-links">
              <Button type="link" size="small">Privacy Policy</Button>
              <Button type="link" size="small">Terms of Service</Button>
            </Space>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default LandingPage;