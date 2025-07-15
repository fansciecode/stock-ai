import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Typography, Card, Row, Col, Spin, Divider, Button, Tag, QRCode } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TicketDetails = () => {
  const { ticketId } = useParams();
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    // Mock data for demonstration
    setTimeout(() => {
      const mockTicketData = {
        id: ticketId,
        eventName: 'Tech Conference 2023',
        eventDate: '2023-12-15',
        eventTime: '09:00 AM - 05:00 PM',
        eventLocation: 'San Francisco Convention Center',
        eventAddress: '747 Howard St, San Francisco, CA 94103',
        ticketType: 'VIP Pass',
        ticketPrice: '$150.00',
        attendeeName: 'John Doe',
        attendeeEmail: 'john.doe@example.com',
        purchaseDate: '2023-10-05',
        ticketStatus: 'confirmed',
        ticketCode: 'TECH2023-VIP-12345',
        seatInfo: 'Section A, Row 3, Seat 12'
      };
      
      setTicketData(mockTicketData);
      setLoading(false);
    }, 1000);
  }, [ticketId]);

  if (loading) {
    return (
      <Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card className="ticket-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={16}>
            <Title level={2}>{ticketData.eventName}</Title>
            <Tag color="green" style={{ marginBottom: '16px' }}>
              <CheckCircleOutlined /> {ticketData.ticketStatus.toUpperCase()}
            </Tag>
            
            <Paragraph>
              <CalendarOutlined style={{ marginRight: '8px' }} />
              {ticketData.eventDate}
            </Paragraph>
            
            <Paragraph>
              <ClockCircleOutlined style={{ marginRight: '8px' }} />
              {ticketData.eventTime}
            </Paragraph>
            
            <Paragraph>
              <EnvironmentOutlined style={{ marginRight: '8px' }} />
              {ticketData.eventLocation}
              <div style={{ marginLeft: '24px', color: 'rgba(0, 0, 0, 0.45)' }}>
                {ticketData.eventAddress}
              </div>
            </Paragraph>
          </Col>
          
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <QRCode
              value={ticketData.ticketCode}
              size={150}
              style={{ margin: '0 auto' }}
            />
            <Text style={{ display: 'block', marginTop: '8px' }}>
              {ticketData.ticketCode}
            </Text>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Title level={4}>Ticket Information</Title>
            <Paragraph>
              <strong>Type:</strong> {ticketData.ticketType}
            </Paragraph>
            <Paragraph>
              <strong>Price:</strong> {ticketData.ticketPrice}
            </Paragraph>
            {ticketData.seatInfo && (
              <Paragraph>
                <strong>Seat:</strong> {ticketData.seatInfo}
              </Paragraph>
            )}
            <Paragraph>
              <strong>Purchase Date:</strong> {ticketData.purchaseDate}
            </Paragraph>
          </Col>
          
          <Col xs={24} sm={12}>
            <Title level={4}>Attendee Information</Title>
            <Paragraph>
              <UserOutlined style={{ marginRight: '8px' }} />
              {ticketData.attendeeName}
            </Paragraph>
            <Paragraph>
              {ticketData.attendeeEmail}
            </Paragraph>
          </Col>
        </Row>
        
        <Divider />
        
        <Row justify="center" gutter={[16, 16]}>
          <Col>
            <Button type="primary" icon={<DownloadOutlined />}>
              Download Ticket
            </Button>
          </Col>
          <Col>
            <Button icon={<ShareAltOutlined />}>
              Share Ticket
            </Button>
          </Col>
        </Row>
        
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Text type="secondary">
            Please present this ticket (printed or on your mobile device) at the event entrance.
          </Text>
        </div>
      </Card>
    </Content>
  );
};

export default TicketDetails; 