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
  Empty,
  Rate,
  Skeleton,
  Modal,
  Input,
  Select,
  Pagination,
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  StarOutlined,
  EyeOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  BookOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const WishlistScreen = () => {
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [wishlistItems, searchQuery, sortBy, filterBy]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockWishlist = [
          {
            id: '1',
            eventId: 'event-1',
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
            addedDate: '2024-01-15',
            featured: true,
            tags: ['technology', 'innovation', 'networking'],
          },
          {
            id: '2',
            eventId: 'event-2',
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
            addedDate: '2024-01-12',
            featured: false,
            tags: ['design', 'creative', 'workshop'],
          },
          {
            id: '3',
            eventId: 'event-3',
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
            addedDate: '2024-01-10',
            featured: true,
            tags: ['music', 'festival', 'entertainment'],
          },
          {
            id: '4',
            eventId: 'event-4',
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
            addedDate: '2024-01-08',
            featured: false,
            tags: ['business', 'networking', 'professional'],
          },
        ];
        setWishlistItems(mockWishlist);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load wishlist');
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...wishlistItems];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      if (filterBy === 'featured') {
        filtered = filtered.filter(item => item.featured);
      } else {
        filtered = filtered.filter(item => item.category === filterBy);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'added':
          return new Date(b.addedDate) - new Date(a.addedDate);
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const handleRemoveFromWishlist = (itemId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    showSuccess('Removed from wishlist');
  };

  const handleBulkRemove = () => {
    setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    setShowDeleteModal(false);
    showSuccess(`Removed ${selectedItems.length} items from wishlist`);
  };

  const handleEventView = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleBookEvent = (eventId) => {
    navigate(`/events/${eventId}/book`);
  };

  const handleShareEvent = (event) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: `${window.location.origin}/events/${event.eventId}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/events/${event.eventId}`);
      showSuccess('Event link copied to clipboard');
    }
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          {[...Array(4)].map((_, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
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
        <Title level={2} style={{ margin: 0 }}>
          <HeartFilled style={{ color: '#ff4d4f', marginRight: 8 }} />
          My Wishlist
        </Title>
        <Text type="secondary">
          Events you've saved for later - {wishlistItems.length} items
        </Text>
      </div>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search wishlist..."
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
            </Select>
          </Col>

          <Col xs={24} md={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="added">Recently Added</Option>
              <Option value="date">Event Date</Option>
              <Option value="price">Price</Option>
              <Option value="rating">Rating</Option>
              <Option value="alphabetical">A-Z</Option>
            </Select>
          </Col>

          <Col xs={24} md={8}>
            <Space>
              {selectedItems.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Remove Selected ({selectedItems.length})
                </Button>
              )}
              <Text type="secondary">
                {filteredItems.length} events found
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Wishlist Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <Empty
            description={
              searchQuery || filterBy !== 'all'
                ? "No events match your search criteria"
                : "Your wishlist is empty"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchQuery && filterBy === 'all' ? (
              <Button
                type="primary"
                onClick={() => navigate('/events')}
                icon={<HeartOutlined />}
              >
                Discover Events
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {paginatedItems.map((item) => (
              <Col xs={24} sm={12} lg={6} key={item.id}>
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
                        fontSize: 14,
                        fontWeight: 'bold',
                        position: 'relative'
                      }}
                    >
                      {item.featured && (
                        <Tag
                          color="gold"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            margin: 0
                          }}
                        >
                          Featured
                        </Tag>
                      )}
                      {item.title.substring(0, 25)}...
                    </div>
                  }
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleEventView(item.eventId)}
                    >
                      View
                    </Button>,
                    <Button
                      type="link"
                      icon={<ShareAltOutlined />}
                      onClick={() => handleShareEvent(item)}
                    >
                      Share
                    </Button>,
                    <Button
                      type="link"
                      danger
                      icon={<HeartFilled />}
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      Remove
                    </Button>,
                  ]}
                  style={{
                    height: '100%',
                    border: selectedItems.includes(item.id) ? '2px solid #1890ff' : undefined
                  }}
                  onClick={() => {
                    if (selectedItems.includes(item.id)) {
                      setSelectedItems(prev => prev.filter(id => id !== item.id));
                    } else {
                      setSelectedItems(prev => [...prev, item.id]);
                    }
                  }}
                >
                  <Card.Meta
                    title={
                      <div>
                        <Text
                          strong
                          ellipsis={{ tooltip: item.title }}
                          style={{ fontSize: 16 }}
                        >
                          {item.title}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue">{item.category}</Tag>
                          <Text
                            strong
                            style={{ color: '#52c41a', float: 'right' }}
                          >
                            {formatPrice(item.price)}
                          </Text>
                        </div>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Paragraph
                          ellipsis={{ rows: 2, tooltip: item.description }}
                          style={{ margin: 0, fontSize: 12 }}
                        >
                          {item.description}
                        </Paragraph>

                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space size={4}>
                            <CalendarOutlined style={{ color: '#1890ff' }} />
                            <Text style={{ fontSize: 11 }}>
                              {formatDate(item.date)} at {item.time}
                            </Text>
                          </Space>

                          <Space size={4}>
                            <EnvironmentOutlined style={{ color: '#52c41a' }} />
                            <Text
                              style={{ fontSize: 11 }}
                              ellipsis={{ tooltip: item.location }}
                            >
                              {item.location}
                            </Text>
                          </Space>

                          <Space size={4}>
                            <UserOutlined style={{ color: '#722ed1' }} />
                            <Text style={{ fontSize: 11 }}>
                              {item.attendees}/{item.maxAttendees} attending
                            </Text>
                          </Space>

                          <Space size={4}>
                            <StarOutlined style={{ color: '#faad14' }} />
                            <Rate
                              disabled
                              defaultValue={item.rating}
                              size="small"
                              style={{ fontSize: 10 }}
                            />
                            <Text style={{ fontSize: 11 }}>({item.rating})</Text>
                          </Space>
                        </Space>

                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            Added {new Date(item.addedDate).toLocaleDateString()}
                          </Text>
                        </div>

                        <Button
                          type="primary"
                          size="small"
                          block
                          icon={<BookOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookEvent(item.eventId);
                          }}
                        >
                          Book Now
                        </Button>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredItems.length}
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

      {/* Bulk Delete Modal */}
      <Modal
        title="Remove Events from Wishlist"
        open={showDeleteModal}
        onOk={handleBulkRemove}
        onCancel={() => setShowDeleteModal(false)}
        okText="Remove"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to remove {selectedItems.length} event{selectedItems.length !== 1 ? 's' : ''} from your wishlist?
        </p>
        <p>
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default WishlistScreen;
