import React from 'react';
import { Typography, Row, Col, Card, Button, Space, Tag, Timeline, Avatar, Steps } from 'antd';
import { CalendarOutlined, UserOutlined, ShopOutlined, MessageOutlined, StarOutlined, CheckCircleOutlined, RocketOutlined, EnvironmentOutlined, SmileOutlined, PhoneOutlined, TeamOutlined, PlusOutlined, LoginOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const testimonials = [
  {
    name: 'Sarah',
    role: 'Musician',
    avatar: <Avatar size={64} style={{ background: '#fadb14' }} icon={<UserOutlined />} />,
    quote: 'IBCM helped me get my first 100 event attendees!'
  },
  {
    name: 'Mike',
    role: 'Gym Owner',
    avatar: <Avatar size={64} style={{ background: '#52c41a' }} icon={<UserOutlined />} />,
    quote: 'Now I promote fitness boot camps & get new clients weekly!'
  },
  {
    name: 'Local Café',
    role: 'Business',
    avatar: <Avatar size={64} style={{ background: '#1890ff' }} icon={<ShopOutlined />} />,
    quote: 'We hosted a “Weekend Coffee Tasting” event and saw a 30% increase in sales!'
  }
];

const LandingPage = () => (
  <div className="landing-page">
    {/* Landing NavBar */}
    <nav className="landing-navbar">
      <div className="landing-logo">
        <RocketOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 8 }} />
        <span>IBCM</span>
      </div>
      <div className="landing-nav-links">
        <Link to="/login"><Button icon={<LoginOutlined />}>Login</Button></Link>
        <Link to="/signup"><Button type="primary" icon={<PlusOutlined />}>Sign Up</Button></Link>
      </div>
    </nav>

    {/* Hero Section */}
    <section className="landing-section hero-section">
      <Row justify="center" align="middle" style={{ minHeight: 400 }}>
        <Col xs={24} md={12} style={{ textAlign: 'left' }}>
          <Title level={1} style={{ fontWeight: 800, marginBottom: 0, color: '#222' }}>Discover. Connect. Experience.</Title>
          <Paragraph style={{ fontSize: 22, margin: '24px 0 8px 0', color: '#555' }}>
            <Text strong>The all-in-one platform for hyperlocal events, business promotions, and community experiences.</Text>
          </Paragraph>
          <Paragraph style={{ fontSize: 18, color: '#666' }}>
            Find, create, and join events near you. Promote your business, connect with your community, and never miss out again.
          </Paragraph>
          <Space>
            <Link to="/signup"><Button type="primary" size="large" icon={<PlusOutlined />}>Get Started Free</Button></Link>
            <Link to="/login"><Button size="large" icon={<LoginOutlined />}>Login</Button></Link>
          </Space>
        </Col>
        <Col xs={0} md={12} style={{ textAlign: 'center' }}>
          <img src="/public/hero-events.svg" alt="Events Hero" style={{ maxWidth: '90%', maxHeight: 320 }} />
        </Col>
      </Row>
    </section>

    {/* Features Section */}
    <section className="landing-section features-section">
      <Row justify="center" gutter={[32, 32]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="feature-card" hoverable>
            <StarOutlined style={{ fontSize: 36, color: '#faad14' }} />
            <Title level={3}>AI-Powered Suggestions</Title>
            <Paragraph>Personalized event recommendations based on your interests and location.</Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="feature-card" hoverable>
            <EnvironmentOutlined style={{ fontSize: 36, color: '#52c41a' }} />
            <Title level={3}>Live Map View</Title>
            <Paragraph>Explore events happening around you in real-time, visually.</Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="feature-card" hoverable>
            <ShopOutlined style={{ fontSize: 36, color: '#1890ff' }} />
            <Title level={3}>Business Promotions</Title>
            <Paragraph>Promote your products & services through event listings and reach new customers.</Paragraph>
          </Card>
        </Col>
      </Row>
    </section>

    {/* How It Works Section */}
    <section className="landing-section how-section">
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>How It Works</Title>
      <Row justify="center">
        <Col xs={24} md={18}>
          <Steps direction="horizontal" responsive current={-1} className="landing-steps">
            <Step title="Discover" icon={<CalendarOutlined />} description="Browse & find events that match your interests." />
            <Step title="Join or Book" icon={<CheckCircleOutlined />} description="Book tickets or join instantly with secure payments." />
            <Step title="Create & Promote" icon={<PlusOutlined />} description="Host your own events and promote your business." />
            <Step title="Connect" icon={<MessageOutlined />} description="Chat with organizers & attendees in real time." />
          </Steps>
        </Col>
      </Row>
    </section>

    {/* Testimonials Section */}
    <section className="landing-section testimonials-section">
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>What Our Users Say</Title>
      <Row justify="center" gutter={[32, 32]}>
        {testimonials.map((t, idx) => (
          <Col xs={24} md={8} key={idx} style={{ textAlign: 'center' }}>
            {t.avatar}
            <Title level={4} style={{ margin: '16px 0 0 0' }}>{t.name}</Title>
            <Text type="secondary">{t.role}</Text>
            <Paragraph style={{ fontStyle: 'italic', marginTop: 8 }}>&quot;{t.quote}&quot;</Paragraph>
          </Col>
        ))}
      </Row>
    </section>

    {/* Call to Action Section */}
    <section className="landing-section cta-section" style={{ textAlign: 'center' }}>
      <Title level={2}>Ready to Experience IBCM?</Title>
      <Paragraph style={{ fontSize: 18 }}>Sign up now and join a growing community of event lovers, creators, and businesses!</Paragraph>
      <Space>
        <Link to="/signup"><Button type="primary" size="large" icon={<PlusOutlined />}>Sign Up Free</Button></Link>
        <Link to="/login"><Button size="large" icon={<LoginOutlined />}>Login</Button></Link>
      </Space>
    </section>

    {/* Footer */}
    <footer className="landing-footer">
      <Row justify="center" align="middle">
        <Col xs={24} md={12} style={{ textAlign: 'center', padding: 16 }}>
          <Text type="secondary">&copy; {new Date().getFullYear()} IBCM. All rights reserved.</Text>
        </Col>
        <Col xs={24} md={12} style={{ textAlign: 'center', padding: 16 }}>
          <Space>
            <a href="mailto:info@ibcm.app"><PhoneOutlined /> info@ibcm.app</a>
            <a href="https://ibcm.app" target="_blank" rel="noopener noreferrer"><RocketOutlined /> ibcm.app</a>
          </Space>
        </Col>
      </Row>
    </footer>
  </div>
);

export default LandingPage; 