import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Avatar,
  Form,
  Input,
  Upload,
  Switch,
  Tabs,
  List,
  Tag,
  Rate,
  Statistic,
  Badge,
  Alert,
  Skeleton,
  Divider,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  StarOutlined,
  HeartOutlined,
  TrophyOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const UserProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [imageList, setImageList] = useState([]);

  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockProfile = {
          id: user?.uid || '1',
          firstName: user?.displayName?.split(' ')[0] || 'John',
          lastName: user?.displayName?.split(' ')[1] || 'Doe',
          email: user?.email || 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          bio: 'Event enthusiast and community builder passionate about creating memorable experiences.',
          profilePicture: user?.photoURL || '/api/placeholder/120/120',
          joinDate: '2023-01-15',
          verified: true,
          rating: 4.7,
          totalReviews: 89,
          eventsOrganized: 12,
          eventsAttended: 45,
          followers: 156,
          following: 78,
          wishlistCount: 23,
          achievements: [
            { id: 1, title: 'Event Master', description: 'Organized 10+ events', earned: true },
            { id: 2, title: 'Community Builder', description: '50+ attendees', earned: true },
            { id: 3, title: 'Rising Star', description: 'Top rated organizer', earned: false },
          ],
          recentEvents: [
            {
              id: '1',
              title: 'Tech Innovation Summit',
              date: '2024-03-15',
              type: 'organized',
              status: 'completed',
              rating: 4.8,
              attendees: 150,
            },
            {
              id: '2',
              title: 'Design Workshop',
              date: '2024-02-28',
              type: 'attended',
              status: 'completed',
              rating: 4.6,
            },
          ],
        };
        setProfileData(mockProfile);
        form.setFieldsValue(mockProfile);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleSaveProfile = async (values) => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setProfileData({ ...profileData, ...values });
        setEditing(false);
        showSuccess('Profile updated successfully');
        setLoading(false);
      }, 1500);
    } catch (error) {
      showError('Failed to update profile');
      setLoading(false);
    }
  };

  const handleImageUpload = ({ fileList }) => {
    setImageList(fileList);
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
      default:
        return 'default';
    }
  };

  const renderOverviewTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Profile Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Events"
              value={profileData?.eventsOrganized}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Attended"
              value={profileData?.eventsAttended}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Followers"
              value={profileData?.followers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Rating"
              value={profileData?.rating}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bio Section */}
      <Card title="About">
        <Paragraph>{profileData?.bio}</Paragraph>
        <Space>
          <Text type="secondary">
            <EnvironmentOutlined /> {profileData?.location}
          </Text>
          <Text type="secondary">
            <CalendarOutlined /> Joined {formatDate(profileData?.joinDate)}
          </Text>
        </Space>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Events">
        <List
          dataSource={profileData?.recentEvents}
          renderItem={(event) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  View Details
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<CalendarOutlined />}
                    style={{
                      backgroundColor: getEventTypeColor(event.type) === 'blue' ? '#1890ff' : '#52c41a'
                    }}
                  />
                }
                title={
                  <Space>
                    {event.title}
                    <Tag color={getEventTypeColor(event.type)}>
                      {event.type}
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
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );

  const renderEditTab = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSaveProfile}
      size="large"
    >
      <Card title="Basic Information">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter valid email' }
          ]}
        >
          <Input prefix={<MailOutlined />} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
        >
          <Input prefix={<PhoneOutlined />} />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
        >
          <Input prefix={<EnvironmentOutlined />} />
        </Form.Item>

        <Form.Item
          name="bio"
          label="Bio"
        >
          <TextArea rows={4} placeholder="Tell us about yourself..." />
        </Form.Item>

        <Form.Item
          name="profilePicture"
          label="Profile Picture"
        >
          <Upload
            listType="picture-card"
            fileList={imageList}
            onChange={handleImageUpload}
            beforeUpload={() => false}
            maxCount={1}
          >
            {imageList.length === 0 && (
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Card>

      <Card style={{ marginTop: 16, textAlign: 'center' }}>
        <Space size="large">
          <Button size="large" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="primary" size="large" htmlType="submit" loading={loading}>
            Save Changes
          </Button>
        </Space>
      </Card>
    </Form>
  );

  if (loading && !profileData) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={18} xl={14}>
          {/* Profile Header */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                <Badge
                  count={profileData?.verified ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 0}
                  offset={[-10, 10]}
                >
                  <Avatar
                    size={120}
                    src={profileData?.profilePicture}
                    icon={<UserOutlined />}
                  />
                </Badge>
                <div style={{ marginTop: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    {profileData?.firstName} {profileData?.lastName}
                  </Title>
                  {profileData?.verified && (
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
                      <Rate disabled defaultValue={profileData?.rating} />
                      <Text strong>{profileData?.rating}</Text>
                      <Text type="secondary">({profileData?.totalReviews} reviews)</Text>
                    </Space>
                  </div>

                  <Row gutter={[16, 8]}>
                    <Col span={8}>
                      <Statistic
                        title="Events"
                        value={profileData?.eventsOrganized}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Followers"
                        value={profileData?.followers}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Following"
                        value={profileData?.following}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>

                  <Space>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setActiveTab('edit')}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      icon={<SettingOutlined />}
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </Button>
                    <Button
                      icon={<HeartOutlined />}
                      onClick={() => navigate('/wishlist')}
                    >
                      Wishlist ({profileData?.wishlistCount})
                    </Button>
                  </Space>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Profile Tabs */}
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Overview" key="overview">
                {renderOverviewTab()}
              </TabPane>
              <TabPane tab="Edit Profile" key="edit">
                {renderEditTab()}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfileScreen;
