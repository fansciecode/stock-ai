import React from 'react';
import { Layout, Typography, Tabs, Card, Form, Input, Button, Switch, Select, Divider } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  BellOutlined, 
  GlobalOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Settings = () => {
  const handleProfileSubmit = (values) => {
    console.log('Profile form submitted:', values);
  };

  const handleSecuritySubmit = (values) => {
    console.log('Security form submitted:', values);
  };

  const handleNotificationSubmit = (values) => {
    console.log('Notification settings updated:', values);
  };

  return (
    <Content className="settings-content" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2}>Settings</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        Manage your account settings and preferences
      </Text>

      <Card>
        <Tabs defaultActiveKey="profile">
          <TabPane 
            tab={<span><UserOutlined /> Profile</span>} 
            key="profile"
          >
            <Form 
              layout="vertical" 
              onFinish={handleProfileSubmit}
              initialValues={{
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1 (555) 123-4567',
                bio: 'Software developer and event enthusiast.'
              }}
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input disabled />
              </Form.Item>
              
              <Form.Item
                label="Phone Number"
                name="phone"
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Bio"
                name="bio"
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={<span><LockOutlined /> Security</span>} 
            key="security"
          >
            <Form 
              layout="vertical" 
              onFinish={handleSecuritySubmit}
            >
              <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password />
              </Form.Item>
              
              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[{ required: true, message: 'Please enter your new password' }]}
              >
                <Input.Password />
              </Form.Item>
              
              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              
              <Divider />
              
              <Form.Item
                label="Two-Factor Authentication"
                name="twoFactor"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Update Security Settings
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={<span><BellOutlined /> Notifications</span>} 
            key="notifications"
          >
            <Form 
              layout="vertical" 
              onFinish={handleNotificationSubmit}
              initialValues={{
                emailNotifications: true,
                pushNotifications: true,
                eventReminders: true,
                marketingEmails: false
              }}
            >
              <Form.Item
                label="Email Notifications"
                name="emailNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                label="Push Notifications"
                name="pushNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                label="Event Reminders"
                name="eventReminders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                label="Marketing Emails"
                name="marketingEmails"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save Notification Preferences
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={<span><GlobalOutlined /> Preferences</span>} 
            key="preferences"
          >
            <Form 
              layout="vertical" 
              initialValues={{
                language: 'en',
                timezone: 'UTC',
                theme: 'light'
              }}
            >
              <Form.Item
                label="Language"
                name="language"
              >
                <Select>
                  <Option value="en">English</Option>
                  <Option value="es">Spanish</Option>
                  <Option value="fr">French</Option>
                  <Option value="de">German</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                label="Timezone"
                name="timezone"
              >
                <Select>
                  <Option value="UTC">UTC</Option>
                  <Option value="EST">Eastern Standard Time</Option>
                  <Option value="CST">Central Standard Time</Option>
                  <Option value="PST">Pacific Standard Time</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                label="Theme"
                name="theme"
              >
                <Select>
                  <Option value="light">Light</Option>
                  <Option value="dark">Dark</Option>
                  <Option value="system">System Default</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save Preferences
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </Content>
  );
};

export default Settings; 