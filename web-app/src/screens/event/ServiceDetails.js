import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Typography, Card, Row, Col, Spin, Divider, Button, Tag, Rate, Avatar, List } from 'antd';
import { 
  ClockCircleOutlined, 
  DollarOutlined, 
  UserOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ServiceDetails = () => {
  const { serviceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState(null);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    // Mock data for demonstration
    setTimeout(() => {
      const mockServiceData = {
        id: serviceId,
        title: 'Professional Photography Service',
        description: 'Professional event photography service with high-quality equipment and experienced photographers. We capture the best moments of your event with attention to detail and creative composition.',
        price: '$150/hour',
        provider: 'CapturePro Studios',
        providerRating: 4.8,
        availability: 'Mon-Sat, 9AM-6PM',
        location: 'San Francisco Bay Area',
        coverImage: 'https://via.placeholder.com/800x400',
        gallery: [
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200'
        ],
        features: [
          'Professional DSLR cameras and lenses',
          'Experienced photographers',
          'Quick turnaround time (48 hours)',
          'Digital delivery of all photos',
          'Basic photo editing included',
          'Print packages available'
        ],
        reviews: [
          {
            author: 'John Smith',
            avatar: 'https://via.placeholder.com/50',
            rating: 5,
            date: '2023-09-15',
            content: 'Excellent service! The photographer was professional and captured amazing moments at our corporate event.'
          },
          {
            author: 'Sarah Johnson',
            avatar: 'https://via.placeholder.com/50',
            rating: 4,
            date: '2023-08-22',
            content: 'Great photos and good communication throughout the process. Would recommend.'
          },
          {
            author: 'Michael Brown',
            avatar: 'https://via.placeholder.com/50',
            rating: 5,
            date: '2023-07-30',
            content: 'Very professional service with quick delivery. The quality of photos exceeded our expectations.'
          }
        ]
      };
      
      setServiceData(mockServiceData);
      setLoading(false);
    }, 1000);
  }, [serviceId]);

  const toggleFavorite = () => {
    setFavorite(!favorite);
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card 
        cover={<img alt={serviceData.title} src={serviceData.coverImage} />}
        actions={[
          <Button 
            type="primary" 
            icon={<ShoppingCartOutlined />} 
            size="large"
          >
            Book Now
          </Button>,
          <Button 
            icon={favorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />} 
            onClick={toggleFavorite}
            size="large"
          >
            {favorite ? 'Saved' : 'Save'}
          </Button>,
          <Button 
            icon={<MessageOutlined />} 
            size="large"
          >
            Contact
          </Button>
        ]}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={2}>{serviceData.title}</Title>
            <div style={{ marginBottom: '16px' }}>
              <Rate disabled defaultValue={serviceData.providerRating} /> 
              <Text style={{ marginLeft: '8px' }}>
                ({serviceData.providerRating})
              </Text>
            </div>
            
            <Paragraph style={{ fontSize: '16px' }}>
              {serviceData.description}
            </Paragraph>
            
            <Divider />
            
            <Title level={4}>Service Features</Title>
            <List
              dataSource={serviceData.features}
              renderItem={item => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  {item}
                </List.Item>
              )}
            />
            
            <Divider />
            
            <Title level={4}>Gallery</Title>
            <Row gutter={[16, 16]}>
              {serviceData.gallery.map((image, index) => (
                <Col xs={12} sm={6} key={index}>
                  <img 
                    src={image} 
                    alt={`Gallery ${index + 1}`} 
                    style={{ width: '100%', borderRadius: '4px' }} 
                  />
                </Col>
              ))}
            </Row>
          </Col>
          
          <Col xs={24} md={8}>
            <Card>
              <Title level={4} style={{ color: '#1890ff' }}>
                {serviceData.price}
              </Title>
              
              <Paragraph>
                <UserOutlined style={{ marginRight: '8px' }} />
                Provider: {serviceData.provider}
              </Paragraph>
              
              <Paragraph>
                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                Availability: {serviceData.availability}
              </Paragraph>
              
              <Paragraph>
                <DollarOutlined style={{ marginRight: '8px' }} />
                Booking Fee: 10% (refundable)
              </Paragraph>
              
              <Button 
                type="primary" 
                block 
                size="large" 
                icon={<ShoppingCartOutlined />}
                style={{ marginTop: '16px' }}
              >
                Book Now
              </Button>
              
              <Button 
                block 
                style={{ marginTop: '12px' }}
                icon={<MessageOutlined />}
              >
                Contact Provider
              </Button>
            </Card>
          </Col>
        </Row>
        
        <Divider />
        
        <Title level={3}>Reviews</Title>
        <List
          itemLayout="vertical"
          dataSource={serviceData.reviews}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} />}
                title={
                  <div>
                    <Text strong>{item.author}</Text>
                    <Rate disabled defaultValue={item.rating} style={{ fontSize: '14px', marginLeft: '8px' }} />
                  </div>
                }
                description={item.date}
              />
              {item.content}
            </List.Item>
          )}
        />
      </Card>
    </Content>
  );
};

export default ServiceDetails; 