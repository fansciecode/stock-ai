import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Avatar,
  Tag,
  Rate,
  Statistic,
  List,
  Empty,
  Skeleton,
  Divider,
  Badge,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  StarOutlined,
  TeamOutlined,
  MessageOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;

const PublicProfileScreen = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockProfile = {
          id: userId,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          location: 'New York, NY',
          bio: 'Passionate event organizer and community builder. Love creating memorable experiences that bring people together.',
          profilePicture: '/api/placeholder/120/120',
          joinDate: '2022-06-15',
          verified: true,
          rating: 4.9,
          totalReviews: 87,
          eventsOrganized: 15,
          eventsAttended: 43,
          followers: 156,
          following: 89,
          isOwnProfile: user?.uid === userId,
          achievements: [
            { id: 1, title: 'Event Master', icon: 'trophy', earned: true },
            { id: 2, title: 'Community Builder', icon: 'team', earned: true },
            { id: 3, title: 'Rising Star', icon: 'star', earned: true },
          ],
          recentEvents: [
            {
              id: '1',
              title: 'Creative Workshop Series',
              date: '2024-03-10',
              type: 'organized',
              status: 'completed',
              rating: 4.8,
              attendees: 45,
              image: '/api/placeholder/80/60',
            },
            {
              id: '2',
              title: 'Tech Networking Mixer',
              date: '2024-02-28',
              type: 'attended',
              status: 'completed',
              rating: 4.6,
              image: '/api/placeholder/80/60',
            },
            {
              id: '3',
              title: 'Art Gallery Opening',
              date: '2024-04-15',
              type: 'organized',
              status: 'upcoming',
              registrations: 67,
              image: '/api/placeholder/80/60',
            },
          ],
          reviews: [
            {
              id: 1,
              reviewer: 'John Doe',
              avatar: '/api/placeholder/32/32',
              rating: 5,
              comment: 'Amazing event organizer! The workshop was perfectly planned and executed.',
              date: '2024-03-11',
              eventTitle: 'Creative Workshop Series',
            },
            {
              id: 2,
              reviewer: 'Sarah Johnson',
              avatar: '/api/placeholder/32/32',
              rating: 5,
              comment: 'Jane created such a welcoming atmosphere. Will definitely attend more events!',
              date: '2024-03-10',
              eventTitle: 'Creative Workshop Series',
            },
          ],
        };
        setProfileData(mockProfile);
        setIsFollowing(false); // Would check from API
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    showSuccess(isFollowing ? 'Unfollowed user' : 'Following user');
  };

  const handleMessage = () => {
    navigate(`/chat/${userId}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'organized':
        return 'blue';
      case 'attended':
        return 'green';
      case 'upcoming':
        return 'orange';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active avatar paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Empty
          description="Profile not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={20} xl={16}>
          {/* Profile Header */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                <Badge
                  count={profileData.verified ? <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> : 0}
                  offset={[-10, 10]}
                >
                  <Avatar
                    size={120}
                    src={profileData.profilePicture}
                    icon={<UserOutlined />}
                  />
                </Badge>
                <div style={{ marginTop: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    {profileData.firstName} {profileData.lastName}
                  </Title>
                  {profileData.verified && (
                    <Text type="secondary">
                      <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                      Verified User
                    </Text>
                  )}
                </div>
              </Col>

              <Col xs={24} sm={16}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Space>
                      <Rate disabled defaultValue={profileData.rating} />
                      <Text strong>{profileData.rating}</Text>
                      <Text type="secondary">({profileData.totalReviews} reviews)</Text>
                    </Space>
                  </div>

                  <Row gutter={[16, 8]}>
                    <Col span={8}>
                      <Statistic
                        title="Events"
                        value={profileData.eventsOrganized}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Followers"
                        value={profileData.followers}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Following"
                        value={profileData.following}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>

                  {!profileData.isOwnProfile && user && (
                    <Space>
                      <Button
                        type={isFollowing ? 'default' : 'primary'}
                        icon={<UserAddOutlined />}
                        onClick={handleFollow}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Button
                        icon={<MessageOutlined />}
                        onClick={handleMessage}
                      >
                        Message
                      </Button>
                    </Space>
                  )}

                  {profileData.isOwnProfile && (
                    <Button
                      type="primary"
                      onClick={() => navigate('/profile/edit')}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            {/* Left Column */}
            <Col xs={24} lg={16}>
              {/* About Section */}
              <Card title="About" style={{ marginBottom: 16 }}>
                <Paragraph>{profileData.bio}</Paragraph>
                <Space direction="vertical" size={8}>
                  <Space>
                    <EnvironmentOutlined />
                    <Text>{profileData.location}</Text>
                  </Space>
                  <Space>
                    <CalendarOutlined />
                    <Text>Joined {formatDate(profileData.joinDate)}</Text>
                  </Space>
                </Space>
              </Card>

              {/* Recent Events */}
              <Card title="Recent Events" style={{ marginBottom: 16 }}>
                <List
                  dataSource={profileData.recentEvents}
                  renderItem={(event) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 80,
                              height: 60,
                              background: '#f0f0f0',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              color: '#999'
                            }}
                          >
                            Event
                          </div>
                        }
                        title={
                          <Space>
                            {event.title}
                            <Tag color={getEventTypeColor(event.type)}>
                              {event.type}
                            </Tag>
                            <Tag color={event.status === 'completed' ? 'green' : 'blue'}>
                              {event.status}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">{formatDate(event.date)}</Text>
                            {event.rating && (
                              <Space>
                                <Rate disabled defaultValue={event.rating} size="small" />
                                <Text type="secondary">({event.rating})</Text>
                              </Space>
                            )}
                            {event.attendees && (
                              <Text type="secondary">{event.attendees} attendees</Text>
                            )}
                            {event.registrations && (
                              <Text type="secondary">{event.registrations} registrations</Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>

              {/* Reviews */}
              <Card title="Reviews">
                <List
                  dataSource={profileData.reviews}
                  renderItem={(review) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={review.avatar} />}
                        title={
                          <Space>
                            <Text strong>{review.reviewer}</Text>
                            <Rate disabled defaultValue={review.rating} size="small" />
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Text>{review.comment}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {review.eventTitle} • {formatDate(review.date)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Right Column */}
            <Col xs={24} lg={8}>
              {/* Stats */}
              <Card title="Statistics" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic
                        title="Organized"
                        value={profileData.eventsOrganized}
                        prefix={<CalendarOutlined />}
                        valueStyle={{ fontSize: 16, color: '#3f8600' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Attended"
                        value={profileData.eventsAttended}
                        prefix={<UserOutlined />}
                        valueStyle={{ fontSize: 16, color: '#1890ff' }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic
                        title="Followers"
                        value={profileData.followers}
                        prefix={<TeamOutlined />}
                        valueStyle={{ fontSize: 16, color: '#722ed1' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Rating"
                        value={profileData.rating}
                        precision={1}
                        prefix={<StarOutlined />}
                        valueStyle={{ fontSize: 16, color: '#faad14' }}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>

              {/* Achievements */}
              <Card title="Achievements">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {profileData.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 8,
                        background: achievement.earned ? '#f6ffed' : '#f5f5f5',
                        borderRadius: 6,
                        border: achievement.earned ? '1px solid #b7eb8f' : '1px solid #d9d9d9',
                      }}
                    >
                      <Avatar
                        size={32}
                        icon={
                          achievement.icon === 'trophy' ? <TrophyOutlined /> :
                          achievement.icon === 'team' ? <TeamOutlined /> :
                          <StarOutlined />
                        }
                        style={{
                          backgroundColor: achievement.earned ? '#52c41a' : '#d9d9d9',
                          marginRight: 12,
                        }}
                      />
                      <div>
                        <Text strong style={{ fontSize: 14 }}>
                          {achievement.title}
                        </Text>
                        {achievement.earned && (
                          <SafetyCertificateOutlined
                            style={{ color: '#52c41a', marginLeft: 8 }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default PublicProfileScreen;
