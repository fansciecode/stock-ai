import React from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { 
  FacebookOutlined, 
  TwitterOutlined, 
  InstagramOutlined, 
  LinkedinOutlined,
  GithubOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Title, Text, Link } = Typography;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <AntFooter className="app-footer">
      <div className="footer-content">
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <Title level={4}>IBCM</Title>
            <Text className="footer-description">
              Your all-in-one platform for business and community management.
            </Text>
            <Space className="social-icons">
              <FacebookOutlined />
              <TwitterOutlined />
              <InstagramOutlined />
              <LinkedinOutlined />
              <GithubOutlined />
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Title level={5}>Features</Title>
            <ul className="footer-links">
              <li><a href="/events">Events</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/chat">Community</a></li>
              <li><a href="/packages">Packages</a></li>
            </ul>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Title level={5}>Company</Title>
            <ul className="footer-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/press">Press Kit</a></li>
            </ul>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Title level={5}>Support</Title>
            <ul className="footer-links">
              <li><a href="/help">Help Center</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/security">Security</a></li>
            </ul>
          </Col>
        </Row>
        
        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Row justify="space-between" align="middle" className="footer-bottom">
          <Col>
            <Text className="copyright">
              © {currentYear} IBCM. All rights reserved.
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Text><MailOutlined /> support@ibcm.app</Text>
              <Text><PhoneOutlined /> +1 (555) 123-4567</Text>
              <Text><GlobalOutlined /> English</Text>
            </Space>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
};

export default Footer; 