import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Select,
  Button,
  List,
  Avatar,
  Tag,
  Space,
  Skeleton,
  Empty,
  Pagination,
  DatePicker,
  Slider,
  Checkbox,
  Divider,
  Rate,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  StarOutlined,
  HeartOutlined,
  ShareAltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

const EventBrowseScreen = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const categories = [
    'all',
    'corporate',
    'wedding',
    'birthday',
    'conference',
    'workshop',
    'party',
    'concert',
    'sports',
    'charity',
    'networking',
    'other'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, categoryFilter, priceRange, locationFilter, sortBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockEvents = [
          {
            id: '1',
            title: 'Annual Tech Conference 2024',
            description: 'Join us for the biggest tech conference of the year with industry leaders and innovators.',
            category: 'conference',
            price: 150,
            location: 'San Francisco, CA',
            date: '2024-03-15',
            time: '09:00',
            organizer: 'Tech Events Inc.',
            attendees: 500,
            rating: 4.8,
            image: '/api/placeholder/300/200',
            tags: ['technology', 'networking', 'innovation'],
            featured: true,
          },
          {
            id: '2',
            title: 'Wedding Photography Workshop',
            description: 'Learn professional wedding photography techniques from award-winning photographers.',
            category: 'workshop',
            price: 75,
            location: 'New York, NY',
            date: '2024-03-20',
            time: '10:00',
            organizer: 'Photo Masters',
            attendees: 25,
            rating: 4.9,
            image: '/api/placeholder/300/200',
            tags: ['photography', 'wedding', 'education'],
            featured: false,
          },
          {
            id: '3',
            title: 'Corporate Team Building Event',
            description: 'Strengthen your team bonds with our engaging team building activities and challenges.',
            category: 'corporate',
            price: 200,
            location: 'Los Angeles, CA',
            date: '2024-03-25',
            time: '14:00',
            organizer: 'Team Dynamics LLC',
            attendees: 100,
            rating: 4.6,
            image: '/api/placeholder/300/200',
            tags: ['teambuilding', 'corporate', 'activities'],
            featured: true,
          },
          {
            id: '4',
            title: 'Birthday Party Planning Service',
            description: 'Complete birthday party planning with decorations, entertainment, and catering.',
            category: 'birthday',
            price: 300,
            location: 'Chicago, IL',
            date: '2024-04-01',
            time: '16:00',
            organizer: 'Party Perfect',
            attendees: 50,
            rating: 4.7,
            image: '/api/placeholder/300/200',
            tags: ['birthday', 'party', 'celebration'],
            featured: false,
          },
          {
            id: '5',
            title: 'Music Concert Under the Stars',
            description: 'Enjoy an evening of live music performances under the beautiful night sky.',
            category: 'concert',
            price: 45,
            location: 'Austin, TX',
            date: '2024-04-05',
            time: '19:00',
            organizer: 'Starlight Events',
            attendees: 300,
            rating: 4.5,
            image: '/api/placeholder/300/200',
            tags: ['music', 'concert', 'outdoor'],
            featured: true,
          },
          {
            id: '6',
            title: 'Charity Fundraising Gala',
            description: 'An elegant evening to support local children\'s education with dinner and auction.',
            category: 'charity',
            price: 100,
            location: 'Miami, FL',
            date: '2024-04-10',
            time: '18:00',
            organizer: 'Hope Foundation',
            attendees: 200,
            rating: 4.8,
            image: '/api/placeholder/300/200',
            tags: ['charity', 'fundraising', 'education'],
            featured: false,
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

  const filterEvents = () => {
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
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    // Price filter
    filtered = filtered.filter(event =>
      event.price >= priceRange[0] && event.price <= priceRange[1]
    );

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
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
    navigate(`/events/${eventId}/book`);
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              Browse Events
            </Title>
            <Text type="secondary">
              Discover amazing events happening near you
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/events/create')}
            >
              Create Event
            </Button>
          </Col>
        </Row>
      </div>

      {/* Search and Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search events..."
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={setSearchQuery}
              size="large"
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              size="large"
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Option>
              ))}
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
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Advanced Filters
              </Button>
              <Text type="secondary">
                {filteredEvents.length} events found
              </Text>
            </Space>
          </Col>
        </Row>

        {showFilters && (
          <>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text strong>Price Range: ${priceRange[0]} - ${priceRange[1]}</Text>
                <Slider
                  range
                  min={0}
                  max={1000}
                  value={priceRange}
                  onChange={setPriceRange}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  prefix={<EnvironmentOutlined />}
                />
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setPriceRange([0, 1000]);
                      setLocationFilter('');
                      setSortBy('date');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Space>
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <Empty
            description="No events found matching your criteria"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/events/create')}>
              Create First Event
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
                      <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary">Event Image</Text>
                      </div>
                    }
                    actions={[
                      <Button type="link" icon={<EyeOutlined />} onClick={() => handleEventClick(event.id)}>
                        View Details
                      </Button>,
                      <Button type="primary" onClick={() => handleBookEvent(event.id)}>
                        Book Now
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text strong ellipsis={{ tooltip: event.title }}>
                            {event.title}
                          </Text>
                          <Space>
                            <Tag color="blue">{event.category}</Tag>
                            <Text strong style={{ color: '#52c41a' }}>
                              {formatPrice(event.price)}
                            </Text>
                          </Space>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Paragraph ellipsis={{ rows: 2, tooltip: event.description }}>
                            {event.description}
                          </Paragraph>

                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space>
                              <CalendarOutlined />
                              <Text>{formatDate(event.date)} at {event.time}</Text>
                            </Space>
                            <Space>
                              <EnvironmentOutlined />
                              <Text>{event.location}</Text>
                            </Space>
                            <Space>
                              <UserOutlined />
                              <Text>{event.attendees} attendees</Text>
                            </Space>
                            <Space>
                              <StarOutlined />
                              <Rate disabled defaultValue={event.rating} size="small" />
                              <Text>({event.rating})</Text>
                            </Space>
                          </Space>

                          <div>
                            {event.tags.map(tag => (
                              <Tag key={tag} size="small" style={{ marginBottom: 4 }}>
                                {tag}
                              </Tag>
                            ))}
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
    </div>
  );
};

export default EventBrowseScreen;
