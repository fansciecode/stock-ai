import React, { useState, useEffect } from 'react';
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
  Switch,
  Slider,
  InputNumber,
  Checkbox,
  Radio,
  Space,
  Divider,
  Alert,
  Steps,
  Tag,
  AutoComplete,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
  UploadOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const EventCreationScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [eventData, setEventData] = useState({});
  const [imageList, setImageList] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);

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
    'religious',
    'other'
  ];

  const eventTypes = [
    'public',
    'private',
    'invitation-only'
  ];

  const pricingTypes = [
    'free',
    'paid',
    'donation'
  ];

  useEffect(() => {
    // Load saved draft if exists
    const savedDraft = localStorage.getItem('eventDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      form.setFieldsValue(draft);
      setEventData(draft);
    }
  }, [form]);

  const handleStepChange = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
    } else {
      form.validateFields().then(() => {
        setCurrentStep(step);
        saveDraft();
      }).catch(() => {
        showError('Please fill in all required fields before proceeding');
      });
    }
  };

  const saveDraft = () => {
    const values = form.getFieldsValue();
    localStorage.setItem('eventDraft', JSON.stringify(values));
    setEventData(values);
  };

  const handleLocationSearch = (value) => {
    if (value) {
      // Simulate location API search
      const suggestions = [
        `${value}, New York, NY`,
        `${value}, Los Angeles, CA`,
        `${value}, Chicago, IL`,
        `${value}, Houston, TX`,
        `${value}, Phoenix, AZ`,
      ];
      setLocationSuggestions(suggestions);
    }
  };

  const handleImageUpload = ({ fileList }) => {
    setImageList(fileList);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        showSuccess('Event created successfully!');
        localStorage.removeItem('eventDraft');
        navigate('/events');
      }, 2000);

    } catch (error) {
      showError('Failed to create event');
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const requiredFields = {
      0: ['title', 'description', 'category'],
      1: ['date', 'time', 'location'],
      2: ['pricingType'],
      3: ['maxAttendees']
    };

    return form.validateFields(requiredFields[step] || []);
  };

  const renderBasicInfo = () => (
    <Card title="Basic Event Information" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item
            name="title"
            label="Event Title"
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input
              placeholder="Enter a catchy title for your event"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col span={24}>
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
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select event category" size="large">
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
            name="eventType"
            label="Event Type"
            initialValue="public"
          >
            <Radio.Group>
              <Radio value="public">Public</Radio>
              <Radio value="private">Private</Radio>
              <Radio value="invitation-only">Invitation Only</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="tags"
            label="Tags"
            extra="Enter relevant tags to help people find your event"
          >
            <Select
              mode="tags"
              placeholder="Add tags (e.g., networking, tech, fun)"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="images"
            label="Event Images"
            extra="Upload images to make your event more attractive"
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
        </Col>
      </Row>
    </Card>
  );

  const renderDateLocation = () => (
    <Card title="Date, Time & Location" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="date"
            label="Event Date"
            rules={[{ required: true, message: 'Please select event date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              disabledDate={(current) => current && current < moment().startOf('day')}
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
              size="large"
              format="HH:mm"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="endTime"
            label="End Time (Optional)"
          >
            <TimePicker
              style={{ width: '100%' }}
              size="large"
              format="HH:mm"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="duration"
            label="Duration (Hours)"
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0.5}
              max={24}
              step={0.5}
              placeholder="e.g., 2.5"
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="location"
            label="Event Location"
            rules={[{ required: true, message: 'Please enter event location' }]}
          >
            <AutoComplete
              options={locationSuggestions.map(location => ({ value: location }))}
              onSearch={handleLocationSearch}
              placeholder="Enter venue address or search location"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="venueDetails"
            label="Venue Details (Optional)"
          >
            <TextArea
              rows={2}
              placeholder="Additional venue information, parking details, etc."
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="isOnline"
            valuePropName="checked"
          >
            <Checkbox>This is an online event</Checkbox>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderPricing = () => (
    <Card title="Pricing & Tickets" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item
            name="pricingType"
            label="Pricing Type"
            rules={[{ required: true, message: 'Please select pricing type' }]}
          >
            <Radio.Group>
              <Radio value="free">Free Event</Radio>
              <Radio value="paid">Paid Event</Radio>
              <Radio value="donation">Donation Based</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>

        <Form.Item dependencies={['pricingType']} noStyle>
          {({ getFieldValue }) => {
            const pricingType = getFieldValue('pricingType');

            if (pricingType === 'paid') {
              return (
                <>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="ticketPrice"
                      label="Ticket Price ($)"
                      rules={[{ required: true, message: 'Please enter ticket price' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="earlyBirdPrice"
                      label="Early Bird Price ($) - Optional"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      name="earlyBirdDeadline"
                      label="Early Bird Deadline"
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </>
              );
            }

            if (pricingType === 'donation') {
              return (
                <Col span={24}>
                  <Form.Item
                    name="suggestedDonation"
                    label="Suggested Donation Amount ($)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      size="large"
                      min={0}
                      step={0.01}
                      precision={2}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
              );
            }

            return null;
          }}
        </Form.Item>

        <Col span={24}>
          <Form.Item
            name="refundPolicy"
            label="Refund Policy"
          >
            <Select placeholder="Select refund policy" size="large">
              <Option value="full">Full refund up to 24 hours before</Option>
              <Option value="partial">Partial refund with fees</Option>
              <Option value="none">No refunds</Option>
              <Option value="custom">Custom policy</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderAdditionalSettings = () => (
    <Card title="Additional Settings" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="maxAttendees"
            label="Maximum Attendees"
            rules={[{ required: true, message: 'Please set maximum attendees' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={1}
              max={10000}
              placeholder="e.g., 100"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="minAttendees"
            label="Minimum Attendees (Optional)"
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={1}
              placeholder="e.g., 10"
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="registrationDeadline"
            label="Registration Deadline"
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              showTime
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="requiresApproval"
            valuePropName="checked"
          >
            <Checkbox>Require manual approval for registrations</Checkbox>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="allowWaitlist"
            valuePropName="checked"
          >
            <Checkbox>Allow waitlist when event is full</Checkbox>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="sendReminders"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>Send email reminders to attendees</Checkbox>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="specialRequirements"
            label="Special Requirements or Instructions"
          >
            <TextArea
              rows={3}
              placeholder="Any special requirements, dress code, what to bring, etc."
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="contactInfo"
            label="Contact Information"
          >
            <TextArea
              rows={2}
              placeholder="Contact details for attendee inquiries"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderPreview = () => (
    <Card title="Event Preview" style={{ marginBottom: 16 }}>
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Title level={3}>{eventData.title || 'Event Title'}</Title>
        <Paragraph>
          {eventData.description || 'Event description will appear here...'}
        </Paragraph>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space direction="vertical" size={8}>
              <Space>
                <CalendarOutlined />
                <Text>
                  {eventData.date ? moment(eventData.date).format('MMMM Do, YYYY') : 'Date not set'}
                  {eventData.time && ` at ${moment(eventData.time).format('HH:mm')}`}
                </Text>
              </Space>

              <Space>
                <EnvironmentOutlined />
                <Text>{eventData.location || 'Location not set'}</Text>
              </Space>

              <Space>
                <UserOutlined />
                <Text>Max {eventData.maxAttendees || 'unlimited'} attendees</Text>
              </Space>

              <Space>
                <DollarOutlined />
                <Text>
                  {eventData.pricingType === 'free' && 'Free Event'}
                  {eventData.pricingType === 'paid' && `$${eventData.ticketPrice || '0'}`}
                  {eventData.pricingType === 'donation' && 'Donation Based'}
                </Text>
              </Space>
            </Space>
          </Col>
        </Row>

        {eventData.tags && eventData.tags.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {eventData.tags.map(tag => (
              <Tag key={tag} style={{ marginBottom: 4 }}>
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  const steps = [
    {
      title: 'Basic Info',
      content: renderBasicInfo,
      icon: <EditOutlined />
    },
    {
      title: 'Date & Location',
      content: renderDateLocation,
      icon: <CalendarOutlined />
    },
    {
      title: 'Pricing',
      content: renderPricing,
      icon: <DollarOutlined />
    },
    {
      title: 'Settings',
      content: renderAdditionalSettings,
      icon: <SettingOutlined />
    },
    {
      title: 'Preview',
      content: renderPreview,
      icon: <EyeOutlined />
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={20} xl={16}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2}>Create New Event</Title>
            <Text type="secondary">
              Create an amazing event and connect with your community
            </Text>
          </div>

          {/* Steps */}
          <Card style={{ marginBottom: 24 }}>
            <Steps
              current={currentStep}
              onChange={handleStepChange}
              type="navigation"
              size="small"
            >
              {steps.map((step, index) => (
                <Step
                  key={index}
                  title={step.title}
                  icon={step.icon}
                />
              ))}
            </Steps>
          </Card>

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={saveDraft}
            size="large"
          >
            {steps[currentStep].content()}

            {/* Navigation Buttons */}
            <Card>
              <Row justify="space-between">
                <Col>
                  {currentStep > 0 && (
                    <Button
                      size="large"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      Previous
                    </Button>
                  )}
                </Col>

                <Col>
                  <Space>
                    <Button
                      type="default"
                      size="large"
                      onClick={() => navigate('/events')}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="default"
                      size="large"
                      icon={<SaveOutlined />}
                      onClick={saveDraft}
                    >
                      Save Draft
                    </Button>

                    {currentStep < steps.length - 1 ? (
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                          validateStep(currentStep).then(() => {
                            setCurrentStep(currentStep + 1);
                          }).catch(() => {
                            showError('Please fill in all required fields');
                          });
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={loading}
                        icon={<CheckCircleOutlined />}
                      >
                        Create Event
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default EventCreationScreen;
