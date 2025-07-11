import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Steps,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Checkbox,
  Divider,
  Alert,
  Modal,
  Spin,
  Result,
  Tag,
  Avatar,
  Descriptions,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  TagOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

const TicketBookingScreen = () => {
  const { eventId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [event, setEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState('regular');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      showWarning('Please login to book tickets');
      navigate('/login');
      return;
    }
    fetchEventDetails();
  }, [eventId, user, navigate]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockEvent = {
          id: eventId,
          title: 'Annual Tech Conference 2024',
          description: 'Join us for the biggest tech conference of the year featuring industry leaders.',
          category: 'conference',
          location: 'San Francisco Convention Center, 747 Howard St, San Francisco, CA 94103',
          date: '2024-03-15',
          time: '09:00',
          endTime: '18:00',
          organizer: {
            name: 'Tech Events Inc.',
            email: 'info@techevents.com',
            phone: '+1 (555) 123-4567',
            avatar: '/api/placeholder/40/40',
          },
          ticketTypes: [
            {
              id: 'early-bird',
              name: 'Early Bird',
              price: 120,
              originalPrice: 150,
              available: 50,
              description: 'Limited time offer with 20% discount',
              features: ['All sessions access', 'Lunch included', 'Networking events', 'Conference materials']
            },
            {
              id: 'regular',
              name: 'Regular Ticket',
              price: 150,
              available: 200,
              description: 'Standard conference ticket',
              features: ['All sessions access', 'Lunch included', 'Networking events', 'Conference materials']
            },
            {
              id: 'vip',
              name: 'VIP Pass',
              price: 300,
              available: 25,
              description: 'Premium experience with exclusive perks',
              features: ['All sessions access', 'Premium lunch', 'VIP networking', 'Conference materials', 'Meet & greet with speakers', 'Priority seating']
            }
          ],
          maxTicketsPerUser: 5,
          refundPolicy: 'Full refund up to 48 hours before event',
          terms: 'By booking this ticket, you agree to our terms and conditions.',
          image: '/api/placeholder/400/200'
        };
        setEvent(mockEvent);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load event details');
      setLoading(false);
    }
  };

  const handleStepChange = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step === currentStep + 1) {
      validateCurrentStep().then(() => {
        setCurrentStep(step);
      }).catch(() => {
        showError('Please complete the current step before proceeding');
      });
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return Promise.resolve(ticketQuantity > 0 && selectedTicketType);
      case 1:
        return form.validateFields(['firstName', 'lastName', 'email', 'phone']);
      case 2:
        return form.validateFields(['paymentMethod']);
      default:
        return Promise.resolve(true);
    }
  };

  const calculateTotal = () => {
    const selectedTicket = event?.ticketTypes.find(t => t.id === selectedTicketType);
    if (!selectedTicket) return 0;

    const subtotal = selectedTicket.price * ticketQuantity;
    const processingFee = subtotal * 0.029; // 2.9% processing fee
    const tax = subtotal * 0.0875; // 8.75% tax

    return {
      subtotal,
      processingFee,
      tax,
      total: subtotal + processingFee + tax
    };
  };

  const handleBooking = async (values) => {
    try {
      setProcessing(true);

      // Simulate payment processing
      setTimeout(() => {
        const booking = {
          id: `booking-${Date.now()}`,
          eventId: event.id,
          eventTitle: event.title,
          ticketType: selectedTicketType,
          quantity: ticketQuantity,
          attendeeInfo: values,
          paymentMethod: values.paymentMethod,
          total: calculateTotal().total,
          bookingDate: new Date().toISOString(),
          status: 'confirmed',
          qrCode: `qr-${Date.now()}`,
          tickets: Array.from({ length: ticketQuantity }, (_, i) => ({
            id: `ticket-${Date.now()}-${i}`,
            number: `TCK${Date.now()}${i}`,
            valid: true
          }))
        };

        setBookingDetails(booking);
        setBookingComplete(true);
        setProcessing(false);
        showSuccess('Booking confirmed successfully!');
      }, 3000);

    } catch (error) {
      showError('Booking failed. Please try again.');
      setProcessing(false);
    }
  };

  const formatPrice = (price) => `$${price.toFixed(2)}`;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading event details...</Text>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Result
          status="404"
          title="Event Not Found"
          subTitle="The event you're trying to book doesn't exist or is no longer available."
          extra={
            <Button type="primary" onClick={() => navigate('/events')}>
              Browse Events
            </Button>
          }
        />
      </div>
    );
  }

  if (bookingComplete && bookingDetails) {
    return (
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <Row justify="center">
          <Col xs={24} lg={16} xl={12}>
            <Result
              status="success"
              title="Booking Confirmed!"
              subTitle={`Your tickets for ${event.title} have been successfully booked.`}
              extra={[
                <Button type="primary" key="tickets" onClick={() => navigate('/profile/bookings')}>
                  View My Tickets
                </Button>,
                <Button key="events" onClick={() => navigate('/events')}>
                  Browse More Events
                </Button>,
              ]}
            />

            <Card title="Booking Details" style={{ marginTop: 24 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Booking ID">{bookingDetails.id}</Descriptions.Item>
                <Descriptions.Item label="Event">{bookingDetails.eventTitle}</Descriptions.Item>
                <Descriptions.Item label="Date">{formatDate(event.date)} at {event.time}</Descriptions.Item>
                <Descriptions.Item label="Location">{event.location}</Descriptions.Item>
                <Descriptions.Item label="Ticket Type">{selectedTicketType}</Descriptions.Item>
                <Descriptions.Item label="Quantity">{bookingDetails.quantity}</Descriptions.Item>
                <Descriptions.Item label="Total Paid">{formatPrice(bookingDetails.total)}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="green">Confirmed</Tag>
                </Descriptions.Item>
              </Descriptions>

              <Alert
                message="Important Information"
                description="A confirmation email has been sent to your registered email address. Please bring a valid ID and your ticket confirmation to the event."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  const steps = [
    {
      title: 'Select Tickets',
      icon: <TagOutlined />
    },
    {
      title: 'Attendee Info',
      icon: <UserOutlined />
    },
    {
      title: 'Payment',
      icon: <CreditCardOutlined />
    },
    {
      title: 'Confirmation',
      icon: <CheckCircleOutlined />
    }
  ];

  const renderTicketSelection = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div>
        <Title level={4}>Select Ticket Type</Title>
        <Radio.Group
          value={selectedTicketType}
          onChange={(e) => setSelectedTicketType(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {event.ticketTypes.map((ticket) => (
              <Card
                key={ticket.id}
                style={{
                  border: selectedTicketType === ticket.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedTicketType(ticket.id)}
              >
                <Radio value={ticket.id} style={{ marginBottom: 8 }}>
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ fontSize: 16 }}>{ticket.name}</Text>
                    <Space>
                      <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                        {formatPrice(ticket.price)}
                      </Text>
                      {ticket.originalPrice && (
                        <Text delete type="secondary">
                          {formatPrice(ticket.originalPrice)}
                        </Text>
                      )}
                    </Space>
                    <Text type="secondary">{ticket.description}</Text>
                    <Text type="secondary">Available: {ticket.available}</Text>
                  </Space>
                </Radio>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Features:</Text>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {ticket.features.map((feature, index) => (
                      <li key={index}><Text type="secondary">{feature}</Text></li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </Space>
        </Radio.Group>
      </div>

      <div>
        <Title level={4}>Quantity</Title>
        <Space>
          <Text>Number of tickets:</Text>
          <InputNumber
            min={1}
            max={event.maxTicketsPerUser}
            value={ticketQuantity}
            onChange={setTicketQuantity}
            size="large"
          />
          <Text type="secondary">(Max {event.maxTicketsPerUser} per person)</Text>
        </Space>
      </div>
    </Space>
  );

  const renderAttendeeInfo = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={4}>Attendee Information</Title>
      <Form.Item
        name="firstName"
        label="First Name"
        rules={[{ required: true, message: 'Please enter first name' }]}
      >
        <Input size="large" placeholder="Enter first name" />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[{ required: true, message: 'Please enter last name' }]}
      >
        <Input size="large" placeholder="Enter last name" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Please enter valid email' }
        ]}
      >
        <Input size="large" placeholder="Enter email address" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Phone Number"
        rules={[{ required: true, message: 'Please enter phone number' }]}
      >
        <Input size="large" placeholder="Enter phone number" />
      </Form.Item>

      <Form.Item
        name="organization"
        label="Organization (Optional)"
      >
        <Input size="large" placeholder="Company or organization name" />
      </Form.Item>

      <Form.Item
        name="specialRequests"
        label="Special Requests (Optional)"
      >
        <TextArea
          rows={3}
          placeholder="Dietary restrictions, accessibility needs, etc."
        />
      </Form.Item>
    </Space>
  );

  const renderPayment = () => {
    const pricing = calculateTotal();

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Payment Information</Title>

        {/* Order Summary */}
        <Card title="Order Summary" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{ticketQuantity}x {selectedTicketType} ticket(s)</Text>
              <Text>{formatPrice(pricing.subtotal)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Processing fee (2.9%)</Text>
              <Text type="secondary">{formatPrice(pricing.processingFee)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Tax (8.75%)</Text>
              <Text type="secondary">{formatPrice(pricing.tax)}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 16 }}>Total</Text>
              <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                {formatPrice(pricing.total)}
              </Text>
            </div>
          </Space>
        </Card>

        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[{ required: true, message: 'Please select payment method' }]}
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value="card">Credit/Debit Card</Radio>
              <Radio value="paypal">PayPal</Radio>
              <Radio value="apple-pay">Apple Pay</Radio>
              <Radio value="google-pay">Google Pay</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item dependencies={['paymentMethod']} noStyle>
          {({ getFieldValue }) => {
            const method = getFieldValue('paymentMethod');

            if (method === 'card') {
              return (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    name="cardNumber"
                    label="Card Number"
                    rules={[{ required: true, message: 'Please enter card number' }]}
                  >
                    <Input
                      size="large"
                      placeholder="1234 5678 9012 3456"
                      prefix={<CreditCardOutlined />}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="expiryDate"
                        label="Expiry Date"
                        rules={[{ required: true, message: 'Please enter expiry date' }]}
                      >
                        <Input size="large" placeholder="MM/YY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="cvv"
                        label="CVV"
                        rules={[{ required: true, message: 'Please enter CVV' }]}
                      >
                        <Input size="large" placeholder="123" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="cardholderName"
                    label="Cardholder Name"
                    rules={[{ required: true, message: 'Please enter cardholder name' }]}
                  >
                    <Input size="large" placeholder="Name on card" />
                  </Form.Item>
                </Space>
              );
            }

            return null;
          }}
        </Form.Item>

        <Form.Item
          name="agreeTerms"
          valuePropName="checked"
          rules={[{ required: true, message: 'Please agree to terms and conditions' }]}
        >
          <Checkbox>
            I agree to the <a href="/terms" target="_blank">terms and conditions</a> and{' '}
            <a href="/refund-policy" target="_blank">refund policy</a>
          </Checkbox>
        </Form.Item>

        <Alert
          message="Secure Payment"
          description="Your payment information is encrypted and secure. We never store your card details."
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
        />
      </Space>
    );
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={20} xl={16}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/events/${eventId}`)}
              >
                Back to Event
              </Button>
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Book Tickets
                </Title>
                <Text type="secondary">{event.title}</Text>
              </div>
            </Space>
          </div>

          {/* Event Summary */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16} align="middle">
              <Col xs={24} md={18}>
                <Space direction="vertical" size={4}>
                  <Title level={4} style={{ margin: 0 }}>{event.title}</Title>
                  <Space>
                    <CalendarOutlined />
                    <Text>{formatDate(event.date)} at {event.time}</Text>
                  </Space>
                  <Space>
                    <EnvironmentOutlined />
                    <Text>{event.location}</Text>
                  </Space>
                  <Space>
                    <UserOutlined />
                    <Text>Organized by {event.organizer.name}</Text>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <div
                  style={{
                    height: 100,
                    background: '#f0f0f0',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text type="secondary">Event Image</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Booking Steps */}
          <Card style={{ marginBottom: 24 }}>
            <Steps current={currentStep} onChange={handleStepChange}>
              {steps.map((step, index) => (
                <Step key={index} title={step.title} icon={step.icon} />
              ))}
            </Steps>
          </Card>

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleBooking}
            size="large"
            initialValues={{
              firstName: user?.displayName?.split(' ')[0] || '',
              lastName: user?.displayName?.split(' ')[1] || '',
              email: user?.email || '',
            }}
          >
            <Card>
              {currentStep === 0 && renderTicketSelection()}
              {currentStep === 1 && renderAttendeeInfo()}
              {currentStep === 2 && renderPayment()}
              {currentStep === 3 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" spinning={processing} />
                  <div style={{ marginTop: 16 }}>
                    <Text>{processing ? 'Processing your booking...' : 'Ready to confirm'}</Text>
                  </div>
                </div>
              )}
            </Card>

            {/* Navigation */}
            <Card style={{ marginTop: 16 }}>
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
                      size="large"
                      onClick={() => navigate(`/events/${eventId}`)}
                    >
                      Cancel
                    </Button>

                    {currentStep < steps.length - 1 ? (
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                          validateCurrentStep().then(() => {
                            setCurrentStep(currentStep + 1);
                          }).catch(() => {
                            showError('Please complete all required fields');
                          });
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={processing}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : 'Confirm Booking'}
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

export default TicketBookingScreen;
