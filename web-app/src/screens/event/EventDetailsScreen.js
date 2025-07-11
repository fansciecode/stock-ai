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
  Divider,
  Rate,
  Statistic,
  Image,
  List,
  Form,
  Input,
  Modal,
  Alert,
  Skeleton,
  Badge,
  Carousel,
  Descriptions,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  StarOutlined,
  HeartOutlined,
  ShareAltOutlined,
  MessageOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import moment from 'moment';
import Comment from '../../components/Comment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const EventDetailsScreen = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventDetails();
    fetchReviews();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockEvent = {
          id: eventId,
          title: 'Annual Tech Conference 2024',
          description: 'Join us for the biggest tech conference of the year featuring industry leaders, cutting-edge technology showcases, and networking opportunities. This event brings together professionals, entrepreneurs, and tech enthusiasts from around the world to share insights, learn about emerging trends, and build valuable connections.',
          category: 'conference',
          price: 150,
          earlyBirdPrice: 120,
          location: 'San Francisco Convention Center, 747 Howard St, San Francisco, CA 94103',
          address: '747 Howard St, San Francisco, CA 94103',
          date: '2024-03-15',
          time: '09:00',
          endTime: '18:00',
          duration: 9,
          organizer: {
            name: 'Tech Events Inc.',
            avatar: '/api/placeholder/40/40',
            email: 'info@techevents.com',
            phone: '+1 (555) 123-4567',
            rating: 4.8,
            eventsOrganized: 25
          },
          maxAttendees: 500,
          currentAttendees: 342,
          minAttendees: 50,
          rating: 4.8,
          totalReviews: 156,
          images: [
            '/api/placeholder/800/400',
            '/api/placeholder/800/400',
            '/api/placeholder/800/400'
          ],
          tags: ['technology', 'networking', 'innovation', 'AI', 'blockchain'],
          featured: true,
          status: 'active',
          registrationDeadline: '2024-03-10',
          refundPolicy: 'Full refund up to 24 hours before event',
          requirements: 'Bring laptop and business cards. Professional attire recommended.',
          agenda: [
            { time: '09:00-10:00', activity: 'Registration & Coffee' },
            { time: '10:00-11:30', activity: 'Keynote: Future of AI' },
            { time: '11:45-12:45', activity: 'Panel: Blockchain Revolution' },
            { time: '12:45-14:00', activity: 'Networking Lunch' },
            { time: '14:00-15:30', activity: 'Workshop: Machine Learning' },
            { time: '15:45-17:00', activity: 'Startup Pitch Competition' },
            { time: '17:00-18:00', activity: 'Closing Reception' }
          ],
          amenities: ['WiFi', 'Parking', 'Catering', 'Live Streaming', 'Certificates'],
          isOnline: false,
          allowWaitlist: true,
          requiresApproval: false
        };
        setEvent(mockEvent);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load event details');
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    // Simulate API call for reviews
    const mockReviews = [
      {
        id: 1,
        author: 'John Doe',
        avatar: '/api/placeholder/32/32',
        rating: 5,
        comment: 'Amazing event! Great speakers and excellent networking opportunities.',
        date: '2024-01-15',
        helpful: 12
      },
      {
        id: 2,
        author: 'Jane Smith',
        avatar: '/api/placeholder/32/32',
        rating: 4,
        comment: 'Well organized conference with valuable insights. The venue was perfect.',
        date: '2024-01-14',
        helpful: 8
      },
      {
        id: 3,
        author: 'Mike Johnson',
        avatar: '/api/placeholder/32/32',
        rating: 5,
        comment: 'Best tech conference I\'ve attended. Highly recommend!',
        date: '2024-01-13',
        helpful: 15
      }
    ];
    setReviews(mockReviews);
  };

  const handleBookEvent = async () => {
    if (!user) {
      showError('Please login to book this event');
      navigate('/login');
      return;
    }

    try {
      setIsBooking(true);
      // Simulate booking process
      setTimeout(() => {
        showSuccess('Event booked successfully!');
        setIsBooking(false);
        navigate('/profile/bookings');
      }, 2000);
    } catch (error) {
      showError('Failed to book event');
      setIsBooking(false);
    }
  };

  const handleContactOrganizer = () => {
    setShowContactModal(true);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    showSuccess(isLiked ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Event link copied to clipboard');
    }
  };

  const submitReview = () => {
    if (!newReview.trim() || rating === 0) {
      showError('Please provide both rating and review');
      return;
    }

    const review = {
      id: reviews.length + 1,
      author: user?.displayName || 'Anonymous',
      avatar: user?.photoURL || '/api/placeholder/32/32',
      rating,
      comment: newReview,
      date: moment().format('YYYY-MM-DD'),
      helpful: 0
    };

    setReviews([review, ...reviews]);
    setNewReview('');
    setRating(0);
    showSuccess('Review submitted successfully');
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatDate = (date) => {
    return moment(date).format('dddd, MMMM Do YYYY');
  };

  const getAvailableSpots = () => {
    return event.maxAttendees - event.currentAttendees;
  };

  const isEventFull = () => {
    return event.currentAttendees >= event.maxAttendees;
  };

  const isRegistrationOpen = () => {
    return moment().isBefore(moment(event.registrationDeadline));
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active avatar paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Alert
          message="Event Not Found"
          description="The event you're looking for doesn't exist or has been removed."
          type="error"
          showIcon
        />
        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/events')}
        >
          Browse Events
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          {/* Event Images */}
          <Card style={{ marginBottom: 24 }}>
            <Carousel autoplay>
              {event.images.map((image, index) => (
                <div key={index}>
                  <div
                    style={{
                      height: 400,
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      color: '#999'
                    }}
                  >
                    Event Image {index + 1}
                  </div>
                </div>
              ))}
            </Carousel>
          </Card>

          {/* Event Info */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color="blue">{event.category}</Tag>
                {event.featured && <Badge.Ribbon text="Featured" color="gold" />}
                <Rate disabled defaultValue={event.rating} size="small" />
                <Text>({event.totalReviews} reviews)</Text>
              </Space>
            </div>

            <Title level={1} style={{ marginBottom: 8 }}>
              {event.title}
            </Title>

            <Space size="large" wrap style={{ marginBottom: 24 }}>
              <Space>
                <CalendarOutlined />
                <Text strong>{formatDate(event.date)}</Text>
              </Space>
              <Space>
                <ClockCircleOutlined />
                <Text>{event.time} - {event.endTime}</Text>
              </Space>
              <Space>
                <EnvironmentOutlined />
                <Text>{event.location}</Text>
              </Space>
              <Space>
                <TeamOutlined />
                <Text>{event.currentAttendees}/{event.maxAttendees} attendees</Text>
              </Space>
            </Space>

            <Paragraph style={{ fontSize: 16, lineHeight: 1.6 }}>
              {event.description}
            </Paragraph>

            <div style={{ marginTop: 24 }}>
              <Text strong>Tags: </Text>
              {event.tags.map(tag => (
                <Tag key={tag} style={{ marginBottom: 4 }}>
                  {tag}
                </Tag>
              ))}
            </div>
          </Card>

          {/* Event Agenda */}
          <Card title="Event Agenda" style={{ marginBottom: 24 }}>
            <List
              dataSource={event.agenda}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#1890ff' }}
                        size="small"
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={item.time}
                    description={item.activity}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Event Details */}
          <Card title="Event Details" style={{ marginBottom: 24 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="Registration Deadline">
                {moment(event.registrationDeadline).format('MMMM Do, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Refund Policy">
                {event.refundPolicy}
              </Descriptions.Item>
              <Descriptions.Item label="Special Requirements">
                {event.requirements}
              </Descriptions.Item>
              <Descriptions.Item label="Amenities">
                {event.amenities.map(amenity => (
                  <Tag key={amenity} style={{ marginBottom: 4 }}>
                    {amenity}
                  </Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Reviews Section */}
          <Card title="Reviews & Ratings" style={{ marginBottom: 24 }}>
            {user && (
              <div style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <Title level={5}>Write a Review</Title>
                <Rate
                  value={rating}
                  onChange={setRating}
                  style={{ marginBottom: 12 }}
                />
                <TextArea
                  rows={3}
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your experience..."
                  style={{ marginBottom: 12 }}
                />
                <Button
                  type="primary"
                  onClick={submitReview}
                  disabled={!newReview.trim() || rating === 0}
                >
                  Submit Review
                </Button>
              </div>
            )}

            <List
              dataSource={reviews}
              renderItem={(review) => (
                <Comment
                  author={review.author}
                  avatar={
                    <Avatar
                      src={review.avatar}
                      alt={review.author}
                    />
                  }
                  content={
                    <div>
                      <Rate
                        disabled
                        defaultValue={review.rating}
                        size="small"
                        style={{ marginBottom: 8 }}
                      />
                      <p>{review.comment}</p>
                    </div>
                  }
                  datetime={moment(review.date).fromNow()}
                />
              )}
            />
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Booking Card */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
                {formatPrice(event.price)}
              </Title>
              {event.earlyBirdPrice && event.earlyBirdPrice < event.price && (
                <Text type="secondary" delete>
                  {formatPrice(event.earlyBirdPrice)}
                </Text>
              )}
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Statistic
                title="Available Spots"
                value={getAvailableSpots()}
                valueStyle={{ color: getAvailableSpots() < 10 ? '#cf1322' : '#3f8600' }}
              />

              {isEventFull() ? (
                <Alert
                  message="Event is Full"
                  description={event.allowWaitlist ? "Join waitlist to be notified if spots open up." : "This event has reached maximum capacity."}
                  type="warning"
                  showIcon
                />
              ) : !isRegistrationOpen() ? (
                <Alert
                  message="Registration Closed"
                  description="Registration deadline has passed."
                  type="error"
                  showIcon
                />
              ) : null}

              <Button
                type="primary"
                size="large"
                block
                loading={isBooking}
                onClick={handleBookEvent}
                disabled={!isRegistrationOpen() || (isEventFull() && !event.allowWaitlist)}
                icon={<BookOutlined />}
              >
                {isEventFull() && event.allowWaitlist ? 'Join Waitlist' : 'Book Now'}
              </Button>

              <Row gutter={8}>
                <Col span={12}>
                  <Button
                    block
                    icon={<HeartOutlined />}
                    onClick={handleLike}
                    type={isLiked ? 'primary' : 'default'}
                  >
                    {isLiked ? 'Liked' : 'Like'}
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Organizer Info */}
          <Card title="Event Organizer" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar
                  size={64}
                  src={event.organizer.avatar}
                  icon={<UserOutlined />}
                />
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {event.organizer.name}
                  </Title>
                  <Space>
                    <Rate
                      disabled
                      defaultValue={event.organizer.rating}
                      size="small"
                    />
                    <Text type="secondary">
                      {event.organizer.eventsOrganized} events
                    </Text>
                  </Space>
                </div>
              </Space>

              <Button
                block
                icon={<MessageOutlined />}
                onClick={handleContactOrganizer}
              >
                Contact Organizer
              </Button>
            </Space>
          </Card>

          {/* Location Map */}
          <Card title="Location" style={{ marginBottom: 24 }}>
            <div
              style={{
                height: 200,
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderRadius: 8
              }}
            >
              <Text type="secondary">Interactive Map</Text>
            </div>
            <Text>{event.address}</Text>
          </Card>
        </Col>
      </Row>

      {/* Contact Modal */}
      <Modal
        title="Contact Organizer"
        open={showContactModal}
        onCancel={() => setShowContactModal(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <MailOutlined />
            <Text copyable>{event.organizer.email}</Text>
          </Space>
          <Space>
            <PhoneOutlined />
            <Text copyable>{event.organizer.phone}</Text>
          </Space>
          <Divider />
          <Form layout="vertical">
            <Form.Item label="Your Message">
              <TextArea
                rows={4}
                placeholder="Type your message here..."
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" block>
                Send Message
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  );
};

export default EventDetailsScreen;
