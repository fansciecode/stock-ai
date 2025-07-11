import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Switch,
  Form,
  Input,
  Select,
  Divider,
  Alert,
  Modal,
  List,
  Avatar,
  Tag,
} from 'antd';
import {
  SettingOutlined,
  NotificationOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
  BellOutlined,
  MailOutlined,
  PhoneOutlined,
  DeleteOutlined,
  ExportOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      eventReminders: true,
      newEvents: true,
      promotions: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowMessages: true,
    },
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      currency: 'USD',
      theme: 'light',
    },
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        // Settings would be loaded from API
        form.setFieldsValue(settings);
        setLoading(false);
      }, 500);
    } catch (error) {
      showError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values) => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setSettings(values);
        showSuccess('Settings saved successfully');
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to save settings');
      setLoading(false);
    }
  };

  const handleExportData = () => {
    // Simulate data export
    showSuccess('Data export initiated. You will receive an email when ready.');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    // Simulate account deletion
    showSuccess('Account deletion request submitted');
    setShowDeleteModal(false);
    logout();
    navigate('/');
  };

  const renderNotificationSettings = () => (
    <Card title="Notification Settings" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Email Notifications</Text>
          <div style={{ marginTop: 8 }}>
            <Form.Item name={['notifications', 'email']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Enable email notifications</Text>
            </Form.Item>
            <Form.Item name={['notifications', 'eventReminders']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Event reminders</Text>
            </Form.Item>
            <Form.Item name={['notifications', 'newEvents']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>New events in your area</Text>
            </Form.Item>
            <Form.Item name={['notifications', 'promotions']} valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Promotional emails</Text>
            </Form.Item>
          </div>
        </div>

        <Divider />

        <div>
          <Text strong>Push Notifications</Text>
          <div style={{ marginTop: 8 }}>
            <Form.Item name={['notifications', 'push']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Enable push notifications</Text>
            </Form.Item>
          </div>
        </div>

        <Divider />

        <div>
          <Text strong>SMS Notifications</Text>
          <div style={{ marginTop: 8 }}>
            <Form.Item name={['notifications', 'sms']} valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Enable SMS notifications</Text>
            </Form.Item>
          </div>
        </div>
      </Space>
    </Card>
  );

  const renderPrivacySettings = () => (
    <Card title="Privacy Settings" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Profile Visibility</Text>
          <Form.Item name={['privacy', 'profileVisibility']} style={{ marginTop: 8, marginBottom: 0 }}>
            <Select style={{ width: 200 }}>
              <Option value="public">Public</Option>
              <Option value="friends">Friends Only</Option>
              <Option value="private">Private</Option>
            </Select>
          </Form.Item>
        </div>

        <Divider />

        <div>
          <Text strong>Contact Information</Text>
          <div style={{ marginTop: 8 }}>
            <Form.Item name={['privacy', 'showEmail']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Show email publicly</Text>
            </Form.Item>
            <Form.Item name={['privacy', 'showPhone']} valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Show phone publicly</Text>
            </Form.Item>
            <Form.Item name={['privacy', 'showLocation']} valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Show location publicly</Text>
            </Form.Item>
          </div>
        </div>

        <Divider />

        <div>
          <Text strong>Communication</Text>
          <div style={{ marginTop: 8 }}>
            <Form.Item name={['privacy', 'allowMessages']} valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" /> <Text style={{ marginLeft: 8 }}>Allow messages from other users</Text>
            </Form.Item>
          </div>
        </div>
      </Space>
    </Card>
  );

  const renderPreferences = () => (
    <Card title="Preferences" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name={['preferences', 'language']}
            label="Language"
          >
            <Select>
              <Option value="en">English</Option>
              <Option value="es">Spanish</Option>
              <Option value="fr">French</Option>
              <Option value="de">German</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name={['preferences', 'timezone']}
            label="Timezone"
          >
            <Select>
              <Option value="America/New_York">Eastern Time</Option>
              <Option value="America/Chicago">Central Time</Option>
              <Option value="America/Denver">Mountain Time</Option>
              <Option value="America/Los_Angeles">Pacific Time</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name={['preferences', 'currency']}
            label="Currency"
          >
            <Select>
              <Option value="USD">USD ($)</Option>
              <Option value="EUR">EUR (€)</Option>
              <Option value="GBP">GBP (£)</Option>
              <Option value="CAD">CAD (C$)</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name={['preferences', 'theme']}
            label="Theme"
          >
            <Select>
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
              <Option value="auto">Auto</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card title="Security" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Password</Text>
          <br />
          <Text type="secondary">Change your password to keep your account secure</Text>
          <br />
          <Button style={{ marginTop: 8 }} icon={<LockOutlined />}>
            Change Password
          </Button>
        </div>

        <Divider />

        <div>
          <Text strong>Two-Factor Authentication</Text>
          <br />
          <Text type="secondary">Add an extra layer of security to your account</Text>
          <br />
          <Button style={{ marginTop: 8 }} icon={<SafetyCertificateOutlined />}>
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
  );

  const renderDataManagement = () => (
    <Card title="Data Management">
      <Alert
        message="Data & Privacy"
        description="Manage your data and account settings. These actions may have permanent effects."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Export Account Data</Text>
          <br />
          <Text type="secondary">Download a copy of your account data and activity</Text>
          <br />
          <Button
            style={{ marginTop: 8 }}
            icon={<ExportOutlined />}
            onClick={handleExportData}
          >
            Export Data
          </Button>
        </div>

        <Divider />

        <div>
          <Text strong>Delete Account</Text>
          <br />
          <Text type="secondary">Permanently delete your account and all associated data</Text>
          <br />
          <Button
            danger
            style={{ marginTop: 8 }}
            icon={<DeleteOutlined />}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={16} xl={12}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>
              <SettingOutlined style={{ marginRight: 8 }} />
              Settings
            </Title>
            <Text type="secondary">
              Manage your account preferences and privacy settings
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSettings}
            initialValues={settings}
          >
            {renderNotificationSettings()}
            {renderPrivacySettings()}
            {renderPreferences()}
            {renderSecuritySettings()}
            {renderDataManagement()}

            {/* Save Button */}
            <Card style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button
                  size="large"
                  onClick={() => navigate('/profile')}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                >
                  Save Settings
                </Button>
              </Space>
            </Card>
          </Form>
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

export default SettingsScreen;
