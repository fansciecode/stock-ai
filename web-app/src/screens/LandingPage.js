import React, { useEffect, useRef } from 'react';
import { Typography, Row, Col, Card, Button, Space, Tag, Avatar } from 'antd';
import { CalendarOutlined, UserOutlined, ShopOutlined, MessageOutlined, StarOutlined, CheckCircleOutlined, RocketOutlined, EnvironmentOutlined, SmileOutlined, PhoneOutlined, TeamOutlined, PlusOutlined, LoginOutlined, BulbOutlined, DollarOutlined, GlobalOutlined, QrcodeOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

const testimonials = [
  {
    name: 'Amit',
    role: 'Event Creator',
    avatar: <Avatar size={64} style={{ background: '#fadb14' }} icon={<UserOutlined />} />,
    quote: 'IBCM lets me reach new audiences every day, and AI helps me plan the best events!'
  },
  {
    name: 'Priya',
    role: 'Traveler',
    avatar: <Avatar size={64} style={{ background: '#52c41a' }} icon={<UserOutlined />} />,
    quote: 'Wherever I go, IBCM shows me what’s happening and what’s on offer nearby.'
  },
  {
    name: 'FreshMart',
    role: 'Business',
    avatar: <Avatar size={64} style={{ background: '#1890ff' }} icon={<ShopOutlined />} />,
    quote: 'We boosted our sales and got new customers with real-time offers and analytics.'
  }
];

const howSteps = [
  {
    icon: <GlobalOutlined style={{ fontSize: 32 }} />,
    title: 'Open IBCM',
    desc: 'Wherever you are, whenever you want.'
  },
  {
    icon: <StarOutlined style={{ fontSize: 32 }} />,
    title: 'See Dynamic Data',
    desc: 'Get real-time, location-based activities, offers, services.'
  },
  {
    icon: <SearchOutlined style={{ fontSize: 32 }} />,
    title: 'Search & Discover',
    desc: 'Find anything—events, products, services, and more.'
  },
  {
    icon: <CheckCircleOutlined style={{ fontSize: 32 }} />,
    title: 'Book & Pay',
    desc: 'Easy, secure payments and instant booking.'
  },
  {
    icon: <QrcodeOutlined style={{ fontSize: 32 }} />,
    title: 'Check In & Enjoy',
    desc: 'QR-based check-in for events, seamless product delivery.'
  }
];

const LandingPage = () => {
  const animationRef = useRef(null);

  useEffect(() => {
    const animationElement = animationRef.current;
    if (animationElement) {
      // Interactive animation logic if needed
    }
  }, []);

  return (
    <div className="landing-page rich-bg-gradient">
      {/* Landing NavBar */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <Link to="/">
            <img src="/logo.svg" alt="IBCM Logo" className="logo-image" />
            <span>IBCM</span>
          </Link>
        </div>
        <div className="landing-nav-links">
          <Link to="/login">
            <Button type="text" icon={<LoginOutlined />}>Login</Button>
          </Link>
          <Link to="/signup">
            <Button type="primary" icon={<PlusOutlined />}>Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section with Lottie Animation */}
      <section className="landing-section hero-section">
        <Row justify="center" align="middle" style={{ minHeight: 420 }}>
          <Col xs={24} md={12} style={{ textAlign: 'left' }}>
            <Title level={1} style={{ fontWeight: 800, marginBottom: 0, color: '#222' }}>Your Day. Your Place. Your Dynamic World.</Title>
            <Paragraph style={{ fontSize: 22, margin: '24px 0 8px 0', color: '#555' }}>
              <Text strong>IBCM is your real-time, location-based discovery engine for everything happening around you—events, offers, services, and more.</Text>
            </Paragraph>
            <Paragraph style={{ fontSize: 18, color: '#666' }}>
              Whether you’re traveling or at home, open IBCM and instantly see the most active events, best deals, trending products, and available services—<b>all tailored to your location, time, and interests</b>.<br />
              <br />
              <Tag color="blue">Events</Tag> <Tag color="green">Products</Tag> <Tag color="orange">Services</Tag> <Tag color="purple">AI Suggestions</Tag>
            </Paragraph>
            <Space>
              <Link to="/signup">
                <Button type="primary" size="large" icon={<PlusOutlined />}>Get Started Free</Button>
              </Link>
              <Link to="/login">
                <Button size="large" icon={<LoginOutlined />}>Login</Button>
              </Link>
            </Space>
          </Col>
          <Col xs={24} md={12} className="hero-image-container" style={{ textAlign: 'center' }}>
            <img src="/hero-events.svg" alt="Dynamic, real-time discovery" style={{ width: 320, height: 320, margin: '0 auto' }} />
            <div style={{ marginTop: 16, color: '#888' }}>Dynamic, real-time discovery</div>
          </Col>
        </Row>
      </section>

      {/* Explanatory Video Section */}
      <section className="landing-section video-section" style={{ background: 'rgba(255,255,255,0.9)', padding: '32px 0' }}>
        <Row justify="center">
          <Col xs={24} md={16} style={{ textAlign: 'center' }}>
            <Title level={2}>See IBCM in Action</Title>
            <video
              src="/oneIbcm.mp4"
              controls
              poster="/hero-events.svg"
              style={{ width: '100%', maxWidth: 600, borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
            >
              Sorry, your browser does not support embedded videos.
            </video>
            <Paragraph style={{ marginTop: 16, color: '#666' }}>
              Watch how IBCM helps you discover, connect, and experience the best around you—anywhere, anytime.
            </Paragraph>
          </Col>
        </Row>
      </section>

      {/* Value Proposition Section */}
      <section className="landing-section value-section">
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} md={8}>
            <Card bordered={false} className="feature-card" hoverable>
              <BulbOutlined style={{ fontSize: 36, color: '#faad14' }} />
              <Title level={3}>For Users</Title>
              <Paragraph>
                <b>Instantly see what’s happening nearby</b>—from concerts, sports, and cultural events to flash sales, food offers, and local services. Search for anything, anytime, anywhere. Get AI-powered, distance- and price-optimized suggestions based on your interests and previous activity.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} className="feature-card" hoverable>
              <RocketOutlined style={{ fontSize: 36, color: '#52c41a' }} />
              <Title level={3}>For Creators</Title>
              <Paragraph>
                <b>Update your activities for the day</b>—events, offers, or services. Get AI-suggested content, demand prediction analytics, and user insights to maximize your reach. Promote your business, engage with your audience, and grow with real-time feedback.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} className="feature-card" hoverable>
              <DollarOutlined style={{ fontSize: 36, color: '#1890ff' }} />
              <Title level={3}>For Businesses</Title>
              <Paragraph>
                <b>Promote your products and services</b> to a dynamic, competitive marketplace. Use AI and analytics to optimize pricing, boost sales, and reach new customers. Enjoy easy payment processing, QR-based event check-in, and full e-commerce management—including returns.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </section>

      {/* How IBCM Works Section (Improved Flex Layout) */}
      <section className="landing-section how-section" style={{ background: 'linear-gradient(90deg, #f0f7ff 0%, #e6f7ff 100%)', padding: '48px 0' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>How IBCM Works</Title>
        <div className="how-steps-flex improved-flex">
          {howSteps.map((step, idx) => (
            <div className="how-step-item improved-step" key={idx}>
              <div className="how-step-icon">{step.icon}</div>
              <div className="how-step-title">{step.title}</div>
              <div className="how-step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI & Analytics Section with Animation */}
      <section className="landing-section ai-section">
        <Row justify="center" gutter={[32, 32]} align="middle">
          <Col xs={24} md={12} style={{ textAlign: 'center' }}>
            <Card bordered={false} className="feature-card" hoverable>
              <BulbOutlined style={{ fontSize: 36, color: '#722ed1' }} />
              <Title level={4}>AI for Everyone</Title>
              <Paragraph>
                <b>For users:</b> Get personalized, AI-driven suggestions for activities, products, and services.<br />
                <b>For creators & businesses:</b> Use AI to create content, predict demand, and optimize your offerings.
              </Paragraph>
              <div style={{ margin: '24px auto 0', maxWidth: 220 }}>
                <img src="/hero-events.svg" alt="AI Animation" style={{ width: 180, height: 180 }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'center' }}>
            <Card bordered={false} className="feature-card" hoverable>
              <RocketOutlined style={{ fontSize: 36, color: '#eb2f96' }} />
              <Title level={4}>Business & Community Growth</Title>
              <Paragraph>
                <b>Leverage analytics</b> to understand user demand, optimize pricing, and promote your business. Get support from the IBCM team for event hosting, sales, and more.
              </Paragraph>
              <div style={{ margin: '24px auto 0', maxWidth: 320 }}>
                <video src="/twoIBCM.mp4" controls poster="/business-growth.svg" style={{ width: '100%', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }} />
              </div>
            </Card>
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
        <Paragraph style={{ fontSize: 18 }}>Sign up now and get real-time, dynamic, and personalized experiences—wherever you are!</Paragraph>
        <Space>
          <Link to="/signup">
            <Button type="primary" size="large" icon={<PlusOutlined />}>Sign Up Free</Button>
          </Link>
          <Link to="/login">
            <Button size="large" icon={<LoginOutlined />}>Login</Button>
          </Link>
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
};

export default LandingPage; 