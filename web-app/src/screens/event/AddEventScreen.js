import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  TimePicker,
  Upload,
  InputNumber,
  Switch,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AddEventScreen = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageList, setImageList] = useState([]);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const categories = [
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
    'educational',
    'cultural',
    'other'
  ];

  const onFinish = async (values) => {
    if (!user) {
      showError('Please login to create events');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        showSuccess('Event created successfully!');
        navigate('/events');
      }, 2000);
    } catch (error) {
      showError('Failed to create event');
      setLoading(false);
    }
  };

  const handleImageUpload = ({ fileList }) => {
    setImageList(fileList);
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={16} xl={12}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2}>Add New Event</Title>
            <Text type="secondary">
              Create and share your event with the community
            </Text>
          </div>

          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
            >
              {/* Basic Information */}
              <Title level={4}>Basic Information</Title>
              <Divider />

              <Form.Item
                name="title"
                label="Event Title"
                rules={[{ required: true, message: 'Please enter event title' }]}
              >
                <Input placeholder="Enter a descriptive title for your event" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Event Description"
                rules={[{ required: true, message: 'Please enter event description' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe your event in detail..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select a category' }]}
                  >
                    <Select placeholder="Select event category">
                      {categories.map(category => (
                        <Option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="maxAttendees"
                    label="Maximum Attendees"
                    rules={[{ required: true, message: 'Please set maximum attendees' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={10000}
                      placeholder="e.g., 100"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Date and Time */}
              <Title level={4} style={{ marginTop: 24 }}>Date & Time</Title>
              <Divider />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="date"
                    label="Event Date"
                    rules={[{ required: true, message: 'Please select event date' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="time"
                    label="Start Time"
                    rules={[{ required: true, message: 'Please select start time' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="Select time"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="duration"
                label="Duration (Hours)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.5}
                  max={24}
                  step={0.5}
                  placeholder="e.g., 2.5"
                />
              </Form.Item>

              {/* Location */}
              <Title level={4} style={{ marginTop: 24 }}>Location</Title>
              <Divider />

              <Form.Item
                name="location"
                label="Event Location"
                rules={[{ required: true, message: 'Please enter event location' }]}
              >
                <Input
                  placeholder="Enter venue address"
                  prefix={<EnvironmentOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="venueDetails"
                label="Venue Details (Optional)"
              >
                <TextArea
                  rows={2}
                  placeholder="Additional venue information, parking details, etc."
                />
              </Form.Item>

              <Form.Item
                name="isOnline"
                valuePropName="checked"
              >
                <Switch /> <Text>This is an online event</Text>
              </Form.Item>

              {/* Pricing */}
              <Title level={4} style={{ marginTop: 24 }}>Pricing</Title>
              <Divider />

              <Form.Item
                name="isFree"
                valuePropName="checked"
              >
                <Switch /> <Text>This is a free event</Text>
              </Form.Item>

              <Form.Item
                dependencies={['isFree']}
                style={{ marginBottom: 0 }}
              >
                {({ getFieldValue }) =>
                  !getFieldValue('isFree') ? (
                    <Form.Item
                      name="price"
                      label="Ticket Price ($)"
                      rules={[{ required: true, message: 'Please enter ticket price' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder="0.00"
                        prefix={<DollarOutlined />}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              {/* Images */}
              <Title level={4} style={{ marginTop: 24 }}>Event Images</Title>
              <Divider />

              <Form.Item
                name="images"
                label="Upload Images"
                extra="Upload images to make your event more attractive (max 5 images)"
              >
                <Upload
                  listType="picture-card"
                  fileList={imageList}
                  onChange={handleImageUpload}
                  beforeUpload={() => false}
                  multiple
                >
                  {imageList.length >= 5 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              {/* Contact Information */}
              <Title level={4} style={{ marginTop: 24 }}>Contact Information</Title>
              <Divider />

              <Form.Item
                name="contactInfo"
                label="Contact Details"
                extra="Provide contact information for attendee inquiries"
              >
                <TextArea
                  rows={2}
                  placeholder="Phone number, email, or other contact details"
                />
              </Form.Item>

              <Form.Item
                name="specialRequirements"
                label="Special Requirements (Optional)"
              >
                <TextArea
                  rows={2}
                  placeholder="Dress code, what to bring, age restrictions, etc."
                />
              </Form.Item>

              {/* Actions */}
              <Divider />
              <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
                <Space size="large">
                  <Button
                    size="large"
                    onClick={() => navigate('/events')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Create Event
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {/* Info Alert */}
          <Alert
            message="Event Creation Tips"
            description="Make sure to provide clear and detailed information about your event. High-quality images and comprehensive descriptions help attract more attendees."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default AddEventScreen;
