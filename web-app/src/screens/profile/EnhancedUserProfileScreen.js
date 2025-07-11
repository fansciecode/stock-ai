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
  Select,
  Upload,
  Switch,
  Tabs,
  List,
  Tag,
  Rate,
  Statistic,
  Progress,
  Badge,
  Alert,
  Modal,
  Divider,
  Empty,
  Skeleton,
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
  BankOutlined,
  NotificationOutlined,
  LockOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const EnhancedUserProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [imageList, setImageList] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
          bio: 'Passionate event organizer with 5+ years of experience in creating memorable experiences.',
          profilePicture: user?.photoURL || '/api/placeholder/120/120',
          joinDate: '2023-01-15',
          verified: true,
          rating: 4.8,
          totalReviews: 156,
          eventsOrganized: 24,
          eventsAttended: 87,
          followers: 342,
          following: 128,
          achievements: [
            { id: 1, title: 'Event Master', description: 'Organized 20+ events', icon: 'trophy', earned: true },
            { id: 2, title: 'Community Builder', description: '100+ attendees', icon: 'team', earned: true },
            { id: 3, title: 'Rising Star', description: 'Top rated organizer', icon: 'star', earned: false },
          ],
          recentEvents: [
            {
              id: '1',
              title: 'Tech Innovation Summit',
              date: '2024-03-15',
              type: 'organized',
              status: 'completed',
              rating: 4.9,
              attendees: 250,
            },
            {
              id: '2',
              title: 'Design Workshop',
              date: '2024-02-28',
              type: 'attended',
              status: 'completed',
              rating: 4.7,
            },
            {
              id: '3',
              title: 'Business Networking',
              date: '2024-04-10',
              type: 'organized',
              status: 'upcoming',
              registrations: 89,
            },
          ],
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            privacy: {
              showEmail: false,
              showPhone: false,
              showLocation: true,
            },
          },
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

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    // Simulate account deletion
    showSuccess('Account deletion request submitted');
    setShowDeleteModal(false);
    navigate('/');
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

  const renderOverviewTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Profile Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Events Organized"
              value={profileData?.eventsOrganized}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Events Attended"
              value={profileData?.eventsAttended}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Followers"
              value={profileData?.followers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Average Rating"
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

      {/* Achievements */}
      <Card title="Achievements">
        <Row gutter={[16, 16]}>
          {profileData?.achievements.map((achievement) => (
            <Col xs={24} sm={8} key={achievement.id}>
              <Card
                style={{
                  opacity: achievement.earned ? 1 : 0.5,
                  border: achievement.earned ? '2px solid #52c41a' : '1px solid #f0f0f0',
                }}
              >
                <Space direction="vertical" style={{ textAlign: 'center', width: '100%' }}>
                  <Avatar
                    size={48}
                    icon={
                      achievement.icon === 'trophy' ? <TrophyOutlined /> :
                      achievement.icon === 'team' ? <TeamOutlined /> :
                      <StarOutlined />
                    }
                    style={{
                      backgroundColor: achievement.earned ? '#52c41a' : '#d9d9d9',
                    }}
                  />
                  <div>
                    <Text strong>{achievement.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {achievement.description}
                    </Text>
                  </div>
                  {achievement.earned && (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
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
                      backgroundColor: getEventTypeColor(event.type) === 'blue' ? '#1890ff' :
                                     getEventTypeColor(event.type) === 'green' ? '#52c41a' : '#fa8c16'
                    }}
                  />
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

      <Card title="Preferences" style={{ marginTop: 16 }}>
        <Title level={5}>Notification Settings</Title>
        <Form.Item name={['preferences', 'notifications', 'email']} valuePropName="checked">
          <Switch /> <Text style={{ marginLeft: 8 }}>Email notifications</Text>
        </Form.Item>
        <Form.Item name={['preferences', 'notifications', 'push']} valuePropName="checked">
          <Switch /> <Text style={{ marginLeft: 8 }}>Push notifications</Text>
        </Form.Item>
        <Form.Item name={['preferences', 'notifications', 'sms']} valuePropName="checked">
          <Switch /> <Text style={{ marginLeft: 8 }}>SMS notifications</Text>
        </Form.Item>

        <Divider />

        <Title level={5}>Privacy Settings</Title>
        <Form.Item name={['preferences', 'privacy', 'showEmail']} valuePropName="checked">
          <Switch /> <Text style={{ marginLeft: 8 }}>Show email publicly</Text>
        </Form.Item>
        <Form.Item name={['preferences', 'privacy', 'showPhone']} valuePropName="checked">
          <Switch /> <Text style={{ marginLeft: 8 }}>Show phone publicly</Text>
        </Form.Item>
        <Form.Item name={['preferences', 'privacy', 'showLocation']} valuePropName="checked">
          <Switch /> <Text style={{ marginLeft: 8 }}>Show location publicly</Text>
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

  const renderSecurityTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Security Settings">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Change Password</Text>
            <br />
            <Text type="secondary">Update your password to keep your account secure</Text>
            <br />
            <Button type="primary" style={{ marginTop: 8 }}>
              Change Password
            </Button>
          </div>

          <Divider />

          <div>
            <Text strong>Two-Factor Authentication</Text>
            <br />
            <Text type="secondary">Add an extra layer of security to your account</Text>
            <br />
            <Button style={{ marginTop: 8 }}>
              Enable 2FA
            </Button>
          </div>

          <Divider />

          <div>
            <Text strong>Login Sessions</Text>
            <br />
            <Text type="secondary">View and manage your active login sessions</Text>
            <br />
            <Button style={{ marginTop: 8 }}>
              Manage Sessions
            </Button>
          </div>
        </Space>
      </Card>

      <Card title="Account Actions">
        <Alert
          message="Danger Zone"
          description="These actions cannot be undone. Please proceed with caution."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Export Account Data</Text>
            <br />
            <Text type="secondary">Download a copy of your account data</Text>
            <br />
            <Button style={{ marginTop: 8 }}>
              Export Data
            </Button>
          </div>

          <Divider />

          <div>
            <Text strong>Delete Account</Text>
            <br />
            <Text type="secondary">Permanently delete your account and all associated data</Text>
            <br />
            <Button danger style={{ marginTop: 8 }} onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </Space>
      </Card>
    </Space>
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
        <Col xs={24} lg={20} xl={16}>
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
                    <Button icon={<SettingOutlined />}>
                      Settings
                    </Button>
                    <Button icon={<HeartOutlined />}>
                      Wishlist
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
              <TabPane tab="Security" key="security">
                {renderSecurityTab()}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Delete Account Modal */}
      <Modal
        title="Delete Account"
        open={showDeleteModal}
        onOk={confirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        okText="Delete Account"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="This action cannot be undone"
          description="Deleting your account will permanently remove all your data, including events, bookings, and profile information."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Text>
          Are you sure you want to delete your account? This action cannot be reversed.
        </Text>
      </Modal>
    </div>
  );
};

export default EnhancedUserProfileScreen;
