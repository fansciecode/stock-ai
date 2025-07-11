import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Avatar,
  List,
  Skeleton,
  Empty,
  Pagination,
  Select,
  Input,
  Badge,
  Statistic,
  Progress,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  StarOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const EventDisplayScreen = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, searchQuery, sortBy, filterBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockEvents = [
          {
            id: '1',
            title: 'Tech Innovation Summit 2024',
            description: 'Explore the latest in technology and innovation with industry leaders.',
            category: 'conference',
            price: 199,
            location: 'San Francisco, CA',
            date: '2024-03-20',
            time: '09:00',
            organizer: 'Tech Innovators Inc.',
            attendees: 150,
            maxAttendees: 300,
            rating: 4.8,
            image: '/api/placeholder/300/200',
            status: 'upcoming',
            featured: true,
            tags: ['technology', 'innovation', 'networking'],
          },
          {
            id: '2',
            title: 'Creative Design Workshop',
            description: 'Hands-on workshop for designers and creative professionals.',
            category: 'workshop',
            price: 89,
            location: 'New York, NY',
            date: '2024-03-25',
            time: '14:00',
            organizer: 'Design Masters',
            attendees: 25,
            maxAttendees: 30,
            rating: 4.9,
            image: '/api/placeholder/300/200',
            status: 'upcoming',
            featured: false,
            tags: ['design', 'creative', 'workshop'],
          },
          {
            id: '3',
            title: 'Business Networking Gala',
            description: 'Connect with business leaders and entrepreneurs in an elegant setting.',
            category: 'networking',
            price: 125,
            location: 'Chicago, IL',
            date: '2024-04-05',
            time: '18:00',
            organizer: 'Business Connect',
            attendees: 200,
            maxAttendees: 250,
            rating: 4.6,
            image: '/api/placeholder/300/200',
            status: 'upcoming',
            featured: true,
            tags: ['business', 'networking', 'professional'],
          },
          {
            id: '4',
            title: 'Music Festival Weekend',
            description: 'Two days of incredible music performances and food trucks.',
            category: 'entertainment',
            price: 75,
            location: 'Austin, TX',
            date: '2024-04-12',
            time: '12:00',
            organizer: 'Austin Music Events',
            attendees: 800,
            maxAttendees: 1000,
            rating: 4.7,
            image: '/api/placeholder/300/200',
            status: 'upcoming',
            featured: false,
            tags: ['music', 'festival', 'entertainment'],
          },
          {
            id: '5',
            title: 'Charity Fundraising Dinner',
            description: 'Elegant dinner to support local children\'s education programs.',
            category: 'charity',
            price: 150,
            location: 'Miami, FL',
            date: '2024-04-18',
            time: '19:00',
            organizer: 'Hope Foundation',
            attendees: 120,
            maxAttendees: 150,
            rating: 4.9,
            image: '/api/placeholder/300/200',
            status: 'upcoming',
            featured: true,
            tags: ['charity', 'fundraising', 'education'],
          },
          {
            id: '6',
            title: 'Startup Pitch Competition',
            description: 'Watch promising startups pitch their ideas to investors.',
            category: 'business',
            price: 50,
            location: 'Seattle, WA',
            date: '2024-04-22',
            time: '16:00',
            organizer: 'Startup Hub',
            attendees: 75,
            maxAttendees: 100,
            rating: 4.5,
            image: '/api/placeholder/300/200',
            status: 'upcoming',
            featured: false,
            tags: ['startup', 'investment', 'business'],
          },
        ];
        setEvents(mockEvents);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load events');
      setLoading(false);
    }
  };

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      if (filterBy === 'featured') {
        filtered = filtered.filter(event => event.featured);
      } else {
        filtered = filtered.filter(event => event.category === filterBy);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popularity':
          return b.attendees - a.attendees;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleBookEvent = (eventId) => {
    if (!user) {
      showError('Please login to book events');
      navigate('/login');
      return;
    }
    navigate(`/events/${eventId}/book`);
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendancePercentage = (current, max) => {
    return Math.round((current / max) * 100);
  };

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          {[...Array(6)].map((_, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card>
                <Skeleton.Image style={{ width: '100%', height: 200 }} />
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Discover Events
            </Title>
            <Text type="secondary">
              Find and attend amazing events in your area
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/events/create')}
              >
                Create Event
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search events..."
              allowClear
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={setSearchQuery}
            />
          </Col>

          <Col xs={24} md={4}>
            <Select
              value={filterBy}
              onChange={setFilterBy}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="all">All Categories</Option>
              <Option value="featured">Featured</Option>
              <Option value="conference">Conference</Option>
              <Option value="workshop">Workshop</Option>
              <Option value="networking">Networking</Option>
              <Option value="entertainment">Entertainment</Option>
              <Option value="charity">Charity</Option>
              <Option value="business">Business</Option>
            </Select>
          </Col>

          <Col xs={24} md={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="date">Sort by Date</Option>
              <Option value="price">Sort by Price</Option>
              <Option value="rating">Sort by Rating</Option>
              <Option value="popularity">Sort by Popularity</Option>
              <Option value="alphabetical">Sort A-Z</Option>
            </Select>
          </Col>

          <Col xs={24} md={8}>
            <Text type="secondary">
              Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <Empty
            description="No events found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              onClick={() => {
                setSearchQuery('');
                setFilterBy('all');
              }}
            >
              Clear Filters
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {paginatedEvents.map((event) => (
              <Col xs={24} sm={12} lg={8} key={event.id}>
                <Badge.Ribbon
                  text="Featured"
                  color="gold"
                  style={{ display: event.featured ? 'block' : 'none' }}
                >
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 200,
                          background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 16,
                          fontWeight: 'bold'
                        }}
                      >
                        {event.title.substring(0, 20)}...
                      </div>
                    }
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleEventClick(event.id)}
                      >
                        View
                      </Button>,
                      <Button
                        type="link"
                        icon={<HeartOutlined />}
                        onClick={() => showSuccess('Added to wishlist')}
                      >
                        Like
                      </Button>,
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleBookEvent(event.id)}
                      >
                        Book
                      </Button>,
                    ]}
                    style={{ height: '100%' }}
                  >
                    <Card.Meta
                      title={
                        <div>
                          <Text
                            strong
                            ellipsis={{ tooltip: event.title }}
                            style={{ fontSize: 16 }}
                          >
                            {event.title}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <Tag color="blue">{event.category}</Tag>
                            <Text
                              strong
                              style={{ color: '#52c41a', float: 'right' }}
                            >
                              {formatPrice(event.price)}
                            </Text>
                          </div>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Paragraph
                            ellipsis={{ rows: 2, tooltip: event.description }}
                            style={{ margin: 0 }}
                          >
                            {event.description}
                          </Paragraph>

                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space size={4}>
                              <CalendarOutlined style={{ color: '#1890ff' }} />
                              <Text style={{ fontSize: 12 }}>
                                {formatDate(event.date)} at {event.time}
                              </Text>
                            </Space>

                            <Space size={4}>
                              <EnvironmentOutlined style={{ color: '#52c41a' }} />
                              <Text
                                style={{ fontSize: 12 }}
                                ellipsis={{ tooltip: event.location }}
                              >
                                {event.location}
                              </Text>
                            </Space>

                            <Space size={4}>
                              <UserOutlined style={{ color: '#722ed1' }} />
                              <Text style={{ fontSize: 12 }}>
                                by {event.organizer}
                              </Text>
                            </Space>

                            <Space size={4}>
                              <StarOutlined style={{ color: '#faad14' }} />
                              <Text style={{ fontSize: 12 }}>
                                {event.rating} rating
                              </Text>
                            </Space>
                          </Space>

                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ fontSize: 11 }}>
                                {event.attendees}/{event.maxAttendees} attending
                              </Text>
                              <Text style={{ fontSize: 11 }}>
                                {getAttendancePercentage(event.attendees, event.maxAttendees)}%
                              </Text>
                            </div>
                            <Progress
                              percent={getAttendancePercentage(event.attendees, event.maxAttendees)}
                              size="small"
                              showInfo={false}
                              strokeColor={
                                getAttendancePercentage(event.attendees, event.maxAttendees) > 80
                                  ? '#ff4d4f'
                                  : getAttendancePercentage(event.attendees, event.maxAttendees) > 60
                                  ? '#faad14'
                                  : '#52c41a'
                              }
                            />
                          </div>

                          <div style={{ marginTop: 8 }}>
                            {event.tags.slice(0, 2).map(tag => (
                              <Tag key={tag} size="small" style={{ fontSize: 10 }}>
                                {tag}
                              </Tag>
                            ))}
                            {event.tags.length > 2 && (
                              <Tag size="small" style={{ fontSize: 10 }}>
                                +{event.tags.length - 2} more
                              </Tag>
                            )}
                          </div>
                        </Space>
                      }
                    />
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredEvents.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} events`
              }
            />
          </div>
        </>
      )}

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Events"
              value={events.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Attendees"
              value={events.reduce((sum, event) => sum + event.attendees, 0)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Rating"
              value={events.reduce((sum, event) => sum + event.rating, 0) / events.length}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EventDisplayScreen;
