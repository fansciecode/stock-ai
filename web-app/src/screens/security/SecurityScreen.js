import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Switch,
  Button,
  Progress,
  Alert,
  List,
  Avatar,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Tabs,
  Space,
  Tooltip,
  notification
} from 'antd';
import {
  ShieldCheckOutlined,
  LockOutlined,
  MobileOutlined,
  KeyOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SafetyOutlined,
  UserOutlined,
  DesktopOutlined,
  TabletOutlined,
  ApiOutlined,
  AuditOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import securityService from '../../services/securityService';
import './SecurityScreen.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const SecurityScreen = () => {
  const [loading, setLoading] = useState(true);
  const [securityData, setSecurityData] = useState({
    score: 0,
    recommendations: [],
    settings: {},
    sessions: [],
    events: [],
    devices: [],
    alerts: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [scoreResult, settingsResult, sessionsResult, eventsResult] = await Promise.all([
        securityService.getSecurityScore(),
        securityService.getSecuritySettings(),
        securityService.getActiveSessions(),
        securityService.getSecurityEvents()
      ]);

      setSecurityData({
        score: scoreResult.success ? scoreResult.data.score : 75,
        recommendations: scoreResult.success ? scoreResult.data.recommendations : [],
        settings: settingsResult.success ? settingsResult.data : {},
        sessions: sessionsResult.success ? sessionsResult.data : [],
        events: eventsResult.success ? eventsResult.data : []
      });
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to load security data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 75) return '#faad14';
    if (score >= 50) return '#fa541c';
    return '#f5222d';
  };

  const handleSettingChange = async (key, value) => {
    try {
      const updatedSettings = { ...securityData.settings, [key]: value };
      const result = await securityService.updateSecuritySettings(updatedSettings);

      if (result.success) {
        setSecurityData(prev => ({
          ...prev,
          settings: updatedSettings
        }));
        notification.success({
          message: 'Settings Updated',
          description: 'Security settings have been updated successfully'
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to update security settings'
      });
    }
  };

  const handleChangePassword = async (values) => {
    try {
      const result = await securityService.changePassword(
        values.currentPassword,
        values.newPassword
      );

      if (result.success) {
        setChangePasswordModal(false);
        form.resetFields();
        notification.success({
          message: 'Password Changed',
          description: 'Your password has been changed successfully'
        });
      } else {
        notification.error({
          message: 'Error',
          description: result.message || 'Failed to change password'
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to change password'
      });
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      const result = await securityService.terminateSession(sessionId);
      if (result.success) {
        loadSecurityData();
        notification.success({
          message: 'Session Terminated',
          description: 'Session has been terminated successfully'
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to terminate session'
      });
    }
  };

  const handleTerminateAllSessions = () => {
    confirm({
      title: 'Terminate All Sessions',
      content: 'Are you sure you want to terminate all active sessions? You will be logged out from all devices.',
      onOk: async () => {
        try {
          const result = await securityService.terminateAllSessions();
          if (result.success) {
            loadSecurityData();
            notification.success({
              message: 'All Sessions Terminated',
              description: 'All sessions have been terminated successfully'
            });
          }
        } catch (error) {
          notification.error({
            message: 'Error',
            description: 'Failed to terminate sessions'
          });
        }
      }
    });
  };

  const renderOverviewTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card title="Security Score" className="security-score-card">
          <div className="security-score-content">
            <Progress
              type="circle"
              percent={securityData.score}
              strokeColor={getSecurityScoreColor(securityData.score)}
              width={120}
              format={percent => `${percent}%`}
            />
            <div className="score-details">
              <Title level={4}>
                {securityData.score >= 90 ? 'Excellent' :
                 securityData.score >= 75 ? 'Good' :
                 securityData.score >= 50 ? 'Fair' : 'Poor'}
              </Title>
              <Text type="secondary">Your account security score</Text>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Security Recommendations" className="recommendations-card">
          {securityData.recommendations.length > 0 ? (
            <List
              dataSource={securityData.recommendations}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<WarningOutlined style={{ color: '#faad14' }} />}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          ) : (
            <div className="no-recommendations">
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Title level={4}>All Good!</Title>
              <Text type="secondary">No security recommendations at this time</Text>
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Quick Security Actions">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="primary"
                icon={<KeyOutlined />}
                block
                onClick={() => setChangePasswordModal(true)}
              >
                Change Password
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                icon={<ShieldCheckOutlined />}
                block
                onClick={() => setTwoFactorModal(true)}
              >
                Setup 2FA
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                icon={<DownloadOutlined />}
                block
                onClick={() => securityService.requestDataExport()}
              >
                Export Data
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                danger
                icon={<DeleteOutlined />}
                block
                onClick={() => {
                  // Handle account deletion
                }}
              >
                Delete Account
              </Button>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Recent Security Events">
          <List
            dataSource={securityData.events.slice(0, 5)}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar icon={
                      item.type === 'login' ? <UserOutlined /> :
                      item.type === 'password_change' ? <KeyOutlined /> :
                      item.type === '2fa_enabled' ? <ShieldCheckOutlined /> :
                      <ExclamationCircleOutlined />
                    } />
                  }
                  title={item.title}
                  description={
                    <Space>
                      <Text type="secondary">{item.description}</Text>
                      <Tag color={item.severity === 'high' ? 'red' : item.severity === 'medium' ? 'orange' : 'green'}>
                        {item.severity}
                      </Tag>
                    </Space>
                  }
                />
                <Text type="secondary">{new Date(item.timestamp).toLocaleString()}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderAuthenticationTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card title="Password Security">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="setting-item">
              <Text strong>Last Changed:</Text>
              <Text type="secondary">3 months ago</Text>
            </div>
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={() => setChangePasswordModal(true)}
            >
              Change Password
            </Button>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Two-Factor Authentication">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="setting-item">
              <Text strong>Status:</Text>
              <Badge
                status={securityData.settings.twoFactorEnabled ? 'success' : 'warning'}
                text={securityData.settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              />
            </div>
            <Button
              type={securityData.settings.twoFactorEnabled ? 'default' : 'primary'}
              icon={<ShieldCheckOutlined />}
              onClick={() => setTwoFactorModal(true)}
            >
              {securityData.settings.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
            </Button>
          </Space>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Login Settings">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="setting-row">
                <div>
                  <Text strong>Remember Me</Text>
                  <br />
                  <Text type="secondary">Stay logged in on this device</Text>
                </div>
                <Switch
                  checked={securityData.settings.rememberMe}
                  onChange={(checked) => handleSettingChange('rememberMe', checked)}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="setting-row">
                <div>
                  <Text strong>Login Notifications</Text>
                  <br />
                  <Text type="secondary">Get notified of new logins</Text>
                </div>
                <Switch
                  checked={securityData.settings.loginNotifications}
                  onChange={(checked) => handleSettingChange('loginNotifications', checked)}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );

  const renderSessionsTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card
          title="Active Sessions"
          extra={
            <Button danger onClick={handleTerminateAllSessions}>
              Terminate All
            </Button>
          }
        >
          <List
            dataSource={securityData.sessions}
            renderItem={item => (
              <List.Item
                actions={[
                  item.isCurrent ? (
                    <Tag color="green">Current Session</Tag>
                  ) : (
                    <Button
                      danger
                      size="small"
                      onClick={() => handleTerminateSession(item.id)}
                    >
                      Terminate
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar icon={
                      item.deviceType === 'mobile' ? <MobileOutlined /> :
                      item.deviceType === 'tablet' ? <TabletOutlined /> :
                      <DesktopOutlined />
                    } />
                  }
                  title={item.deviceName}
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">{item.location}</Text>
                      <Text type="secondary">
                        Last active: {new Date(item.lastActive).toLocaleString()}
                      </Text>
                      <Text type="secondary">IP: {item.ipAddress}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderPrivacyTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <Card title="Privacy Settings">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="setting-row">
                <div>
                  <Text strong>Profile Visibility</Text>
                  <br />
                  <Text type="secondary">Who can see your profile</Text>
                </div>
                <Select
                  value={securityData.settings.profileVisibility || 'public'}
                  style={{ width: 120 }}
                  onChange={(value) => handleSettingChange('profileVisibility', value)}
                >
                  <Select.Option value="public">Public</Select.Option>
                  <Select.Option value="friends">Friends Only</Select.Option>
                  <Select.Option value="private">Private</Select.Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="setting-row">
                <div>
                  <Text strong>Analytics</Text>
                  <br />
                  <Text type="secondary">Help improve our service</Text>
                </div>
                <Switch
                  checked={securityData.settings.analytics}
                  onChange={(checked) => handleSettingChange('analytics', checked)}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="setting-row">
                <div>
                  <Text strong>Location Tracking</Text>
                  <br />
                  <Text type="secondary">Allow location-based features</Text>
                </div>
                <Switch
                  checked={securityData.settings.locationTracking}
                  onChange={(checked) => handleSettingChange('locationTracking', checked)}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="setting-row">
                <div>
                  <Text strong>Marketing Emails</Text>
                  <br />
                  <Text type="secondary">Receive promotional content</Text>
                </div>
                <Switch
                  checked={securityData.settings.marketingEmails}
                  onChange={(checked) => handleSettingChange('marketingEmails', checked)}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Data Management">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Data Export"
              description="Download a copy of your data including profile information, events, and activity history."
              type="info"
              action={
                <Button size="small" onClick={() => securityService.requestDataExport()}>
                  Request Export
                </Button>
              }
            />
            <Alert
              message="Account Deletion"
              description="Permanently delete your account and all associated data. This action cannot be undone."
              type="warning"
              action={
                <Button size="small" danger>
                  Delete Account
                </Button>
              }
            />
          </Space>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div className="security-screen">
      <div className="security-header">
        <Title level={2}>
          <SafetyOutlined /> Security & Privacy
        </Title>
        <Paragraph>
          Manage your account security settings and privacy preferences
        </Paragraph>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <ShieldCheckOutlined />
              Overview
            </span>
          }
          key="overview"
        >
          {renderOverviewTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <LockOutlined />
              Authentication
            </span>
          }
          key="authentication"
        >
          {renderAuthenticationTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <DesktopOutlined />
              Sessions
            </span>
          }
          key="sessions"
        >
          {renderSessionsTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <EyeInvisibleOutlined />
              Privacy
            </span>
          }
          key="privacy"
        >
          {renderPrivacyTab()}
        </TabPane>
      </Tabs>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={changePasswordModal}
        onCancel={() => setChangePasswordModal(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
              <Button onClick={() => setChangePasswordModal(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Two Factor Auth Modal */}
      <Modal
        title="Two-Factor Authentication"
        open={twoFactorModal}
        onCancel={() => setTwoFactorModal(false)}
        footer={null}
        width={600}
      >
        <div className="two-factor-content">
          <Alert
            message="Enhanced Security"
            description="Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<ShieldCheckOutlined />}
              size="large"
              block
            >
              Enable Two-Factor Authentication
            </Button>

            <Button
              icon={<DownloadOutlined />}
              size="large"
              block
            >
              Download Backup Codes
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default SecurityScreen;
