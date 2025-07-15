import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Typography, Row, Col, Card, Empty, Spin, Tag } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

const CategoryEvents = () => {
  const { categoryId } = useParams();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    // Mock data for demonstration
    setTimeout(() => {
      const categoryData = {
        id: categoryId,
        name: getCategoryName(categoryId),
        description: `Events related to ${getCategoryName(categoryId)}`,
        color: getCategoryColor(categoryId)
      };
      
      const mockEvents = [
        {
          id: '1',
          title: `${categoryData.name} Conference 2023`,
          description: 'Annual conference for professionals and enthusiasts',
          date: '2023-12-15',
          location: 'San Francisco, CA',
          organizer: 'IBCM Events',
          image: 'https://via.placeholder.com/300x200'
        },
        {
          id: '2',
          title: `${categoryData.name} Workshop`,
          description: 'Hands-on workshop for beginners and intermediates',
          date: '2023-11-20',
          location: 'New York, NY',
          organizer: 'IBCM Learning',
          image: 'https://via.placeholder.com/300x200'
        },
        {
          id: '3',
          title: `${categoryData.name} Networking Event`,
          description: 'Connect with professionals in the industry',
          date: '2023-12-05',
          location: 'Chicago, IL',
          organizer: 'IBCM Network',
          image: 'https://via.placeholder.com/300x200'
        },
        {
          id: '4',
          title: `${categoryData.name} Expo`,
          description: 'Showcase of the latest innovations and products',
          date: '2024-01-10',
          location: 'Austin, TX',
          organizer: 'IBCM Showcase',
          image: 'https://via.placeholder.com/300x200'
        }
      ];
      
      setCategory(categoryData);
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, [categoryId]);

  const getCategoryName = (id) => {
    const categories = {
      'tech': 'Technology',
      'music': 'Music',
      'art': 'Art & Culture',
      'business': 'Business',
      'sports': 'Sports',
      'food': 'Food & Dining',
      'health': 'Health & Wellness',
      'education': 'Education'
    };
    
    return categories[id] || 'Unknown Category';
  };
  
  const getCategoryColor = (id) => {
    const colors = {
      'tech': '#1890ff',
      'music': '#722ed1',
      'art': '#eb2f96',
      'business': '#52c41a',
      'sports': '#fa8c16',
      'food': '#fa541c',
      'health': '#13c2c2',
      'education': '#2f54eb'
    };
    
    return colors[id] || '#1890ff';
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '16px' }}>
        <Tag color={category.color} style={{ marginRight: '8px' }}>{category.name}</Tag> 
        Events
      </Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {category.description}
      </Text>
      
      {events.length > 0 ? (
        <Row gutter={[16, 16]}>
          {events.map(event => (
            <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
              <Card
                hoverable
                cover={<img alt={event.title} src={event.image} />}
                style={{ height: '100%' }}
              >
                <Card.Meta 
                  title={event.title} 
                  description={event.description} 
                />
                <div style={{ marginTop: '16px' }}>
                  <p>
                    <CalendarOutlined style={{ marginRight: '8px' }} />
                    {event.date}
                  </p>
                  <p>
                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                    {event.location}
                  </p>
                  <p>
                    <UserOutlined style={{ marginRight: '8px' }} />
                    {event.organizer}
                  </p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty 
          description={`No events found for ${category.name}`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Content>
  );
};

export default CategoryEvents;