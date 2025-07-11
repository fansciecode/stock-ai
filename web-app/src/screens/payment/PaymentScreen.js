import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Steps,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Radio,
  Checkbox,
  Select,
  Space,
  Spin,
  Result,
  Tag,
  Avatar,
  List,
  Modal,
  Tooltip,
} from 'antd';
import {
  CreditCardOutlined,
  BankOutlined,
  WalletOutlined,
  MobileOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './PaymentScreen.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

const PaymentScreen = () => {
  const { eventId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [eventDetails, setEventDetails] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [billingAddress, setBillingAddress] = useState(null);
  const [razorpayInstance, setRazorpayInstance] = useState(null);

  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadEventDetails();
    loadSavedCards();
    loadRazorpayScript();
  }, [eventId]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
    };
    script.onerror = () => {
      showError('Error', 'Failed to load payment gateway');
    };
    document.body.appendChild(script);
  };

  const loadEventDetails = async () => {
    try {
      setLoading(true);

      // Mock event details - replace with actual API call
      const mockEventDetails = {
        id: eventId,
        title: 'Tech Innovation Summit 2024',
        description: 'The biggest tech conference of the year',
        date: '2024-03-15',
        time: '09:00 AM',
        location: 'San Francisco Convention Center',
        image: '/api/placeholder/400/300',
        organizer: 'TechCorp',
        category: 'Technology',
        packages: [
          {
            id: 1,
            name: 'Basic',
            price: 99,
            features: ['Event Access', 'Welcome Kit', 'Networking Lunch'],
            recommended: false,
          },
          {
            id: 2,
            name: 'Premium',
            price: 199,
            features: ['Event Access', 'Welcome Kit', 'Networking Lunch', 'Workshop Access', 'Premium Seating'],
            recommended: true,
          },
          {
            id: 3,
            name: 'VIP',
            price: 299,
            features: ['Event Access', 'Welcome Kit', 'Networking Lunch', 'Workshop Access', 'VIP Seating', 'Meet & Greet'],
            recommended: false,
          },
        ],
      };

      setEventDetails(mockEventDetails);

      // Set default order summary
      setOrderSummary({
        selectedPackage: mockEventDetails.packages[1], // Premium package
        quantity: 1,
        subtotal: 199,
        tax: 35.82,
        processingFee: 4.99,
        discount: 0,
        total: 239.81,
      });
    } catch (error) {
      console.error('Error loading event details:', error);
      showError('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCards = async () => {
    try {
      // Mock saved cards - replace with actual API call
      const mockSavedCards = [
        {
          id: 1,
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
        {
          id: 2,
          last4: '5555',
          brand: 'Mastercard',
          expiryMonth: 8,
          expiryYear: 2026,
          isDefault: false,
        },
      ];

      setSavedCards(mockSavedCards);
      setSelectedCard(mockSavedCards.find(card => card.isDefault));
    } catch (error) {
      console.error('Error loading saved cards:', error);
    }
  };

  const handlePackageChange = (packageId) => {
    const selectedPackage = eventDetails.packages.find(pkg => pkg.id === packageId);
    const subtotal = selectedPackage.price;
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% tax
    const processingFee = 4.99;
    const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const total = subtotal + tax + processingFee - discount;

    setOrderSummary({
      selectedPackage,
      quantity: 1,
      subtotal,
      tax,
      processingFee,
      discount,
      total,
    });
  };

  const handleApplyPromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setPromoApplied(true);
      const discount = Math.round(orderSummary.subtotal * 0.1 * 100) / 100;
      setOrderSummary({
        ...orderSummary,
        discount,
        total: orderSummary.subtotal + orderSummary.tax + orderSummary.processingFee - discount,
      });
      showSuccess('Promo Code Applied', '10% discount applied successfully!');
    } else {
      showError('Invalid Promo Code', 'Please enter a valid promo code');
    }
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const createRazorpayOrder = async () => {
    try {
      // Create order on backend
      const orderData = {
        amount: Math.round(orderSummary.total * 100), // Amount in paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        eventId: eventId,
        packageId: orderSummary.selectedPackage.id,
        userId: user.id,
      };

      // Mock API call - replace with actual API
      const response = {
        id: 'order_' + Date.now(),
        currency: 'INR',
        amount: orderData.amount,
      };

      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      setProcessing(true);

      const order = await createRazorpayOrder();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: order.amount,
        currency: order.currency,
        name: 'IBCM Events',
        description: `Payment for ${eventDetails.title}`,
        order_id: order.id,
        image: '/logo.png',
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        notes: {
          eventId: eventId,
          userId: user.id,
        },
        theme: {
          color: '#1890ff',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            showInfo('Payment Cancelled', 'Payment was cancelled by user');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        handlePaymentFailure(response.error);
      });
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      showError('Payment Error', 'Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      // Verify payment on backend
      const verificationData = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      };

      // Mock verification - replace with actual API call
      const verificationResult = {
        success: true,
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
      };

      if (verificationResult.success) {
        setPaymentResult({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: orderSummary.total,
        });
        setCurrentStep(2);
        showSuccess('Payment Successful', 'Your payment has been processed successfully!');
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentResult({
        success: false,
        error: error.message,
      });
      setCurrentStep(2);
      showError('Payment Verification Failed', 'Payment verification failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setPaymentResult({
      success: false,
      error: error.description || 'Payment failed',
    });
    setCurrentStep(2);
    showError('Payment Failed', error.description || 'Payment failed. Please try again.');
    setProcessing(false);
  };

  const handleProceedToPayment = () => {
    if (paymentMethod === 'card' || paymentMethod === 'razorpay') {
      handleRazorpayPayment();
    } else {
      // Handle other payment methods
      showInfo('Coming Soon', 'This payment method will be available soon');
    }
  };

  const renderPackageSelection = () => (
    <div className="package-selection">
      <Title level={3}>Select Package</Title>
      <Row gutter={[16, 16]}>
        {eventDetails.packages.map((pkg) => (
          <Col key={pkg.id} xs={24} md={8}>
            <Card
              className={`package-card ${orderSummary.selectedPackage.id === pkg.id ? 'package-selected' : ''}`}
              hoverable
              onClick={() => handlePackageChange(pkg.id)}
            >
              {pkg.recommended && (
                <div className="package-badge">
                  <Tag color="gold">Recommended</Tag>
                </div>
              )}
              <Title level={4} className="package-name">
                {pkg.name}
              </Title>
              <div className="package-price">
                <Text className="price-currency">₹</Text>
                <Text className="price-amount">{pkg.price}</Text>
              </div>
              <Divider />
              <div className="package-features">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <CheckCircleOutlined className="feature-icon" />
                    <Text>{feature}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="payment-methods">
      <Title level={3}>Payment Method</Title>
      <Radio.Group
        value={paymentMethod}
        onChange={handlePaymentMethodChange}
        className="payment-method-group"
      >
        <div className="payment-method-options">
          <Radio value="card" className="payment-method-option">
            <div className="payment-method-content">
              <CreditCardOutlined className="payment-method-icon" />
              <div className="payment-method-text">
                <Text strong>Credit/Debit Card</Text>
                <Text type="secondary">Pay with your card</Text>
              </div>
            </div>
          </Radio>

          <Radio value="upi" className="payment-method-option">
            <div className="payment-method-content">
              <MobileOutlined className="payment-method-icon" />
              <div className="payment-method-text">
                <Text strong>UPI</Text>
                <Text type="secondary">Pay with UPI ID</Text>
              </div>
            </div>
          </Radio>

          <Radio value="netbanking" className="payment-method-option">
            <div className="payment-method-content">
              <BankOutlined className="payment-method-icon" />
              <div className="payment-method-text">
                <Text strong>Net Banking</Text>
                <Text type="secondary">Pay with your bank</Text>
              </div>
            </div>
          </Radio>

          <Radio value="wallet" className="payment-method-option">
            <div className="payment-method-content">
              <WalletOutlined className="payment-method-icon" />
              <div className="payment-method-text">
                <Text strong>Wallet</Text>
                <Text type="secondary">Pay with digital wallet</Text>
              </div>
            </div>
          </Radio>
        </div>
      </Radio.Group>

      {paymentMethod === 'card' && savedCards.length > 0 && (
        <div className="saved-cards">
          <Title level={4}>Saved Cards</Title>
          <Radio.Group
            value={selectedCard?.id}
            onChange={(e) => setSelectedCard(savedCards.find(card => card.id === e.target.value))}
          >
            {savedCards.map((card) => (
              <Radio key={card.id} value={card.id} className="saved-card-option">
                <div className="saved-card-content">
                  <div className="card-info">
                    <Text strong>{card.brand} •••• {card.last4}</Text>
                    <Text type="secondary">
                      Expires {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear}
                    </Text>
                  </div>
                  {card.isDefault && <Tag color="blue">Default</Tag>}
                </div>
              </Radio>
            ))}
          </Radio.Group>
          <Button type="link" className="add-new-card-btn">
            + Add New Card
          </Button>
        </div>
      )}
    </div>
  );

  const renderOrderSummary = () => (
    <Card className="order-summary-card">
      <Title level={3}>Order Summary</Title>

      <div className="event-summary">
        <div className="event-info">
          <Avatar src={eventDetails.image} size={64} shape="square" />
          <div className="event-details">
            <Title level={4}>{eventDetails.title}</Title>
            <Text type="secondary">{eventDetails.date} • {eventDetails.time}</Text>
            <Text type="secondary">{eventDetails.location}</Text>
          </div>
        </div>
      </div>

      <Divider />

      <div className="package-summary">
        <div className="summary-item">
          <Text>{orderSummary.selectedPackage.name} Package</Text>
          <Text>₹{orderSummary.subtotal}</Text>
        </div>
        <div className="summary-item">
          <Text>Tax (18%)</Text>
          <Text>₹{orderSummary.tax}</Text>
        </div>
        <div className="summary-item">
          <Text>Processing Fee</Text>
          <Text>₹{orderSummary.processingFee}</Text>
        </div>
        {orderSummary.discount > 0 && (
          <div className="summary-item discount">
            <Text>Discount</Text>
            <Text>-₹{orderSummary.discount}</Text>
          </div>
        )}
      </div>

      <Divider />

      <div className="promo-code">
        <Input.Group compact>
          <Input
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            style={{ width: '70%' }}
            disabled={promoApplied}
          />
          <Button
            type="primary"
            onClick={handleApplyPromoCode}
            disabled={!promoCode || promoApplied}
            style={{ width: '30%' }}
          >
            Apply
          </Button>
        </Input.Group>
        {promoApplied && (
          <Text type="success" className="promo-applied">
            <CheckCircleOutlined /> Promo code applied successfully!
          </Text>
        )}
      </div>

      <Divider />

      <div className="total-summary">
        <div className="total-item">
          <Title level={3}>Total</Title>
          <Title level={3} className="total-amount">₹{orderSummary.total}</Title>
        </div>
      </div>

      <div className="security-info">
        <SafetyOutlined className="security-icon" />
        <Text type="secondary">Your payment information is secure and encrypted</Text>
      </div>
    </Card>
  );

  const renderPaymentResult = () => (
    <div className="payment-result">
      {paymentResult.success ? (
        <Result
          status="success"
          title="Payment Successful!"
          subTitle={`Payment ID: ${paymentResult.paymentId}`}
          extra={[
            <Button type="primary" key="details" onClick={() => navigate(`/orders/${paymentResult.orderId}`)}>
              View Details
            </Button>,
            <Button key="events" onClick={() => navigate('/events')}>
              Browse More Events
            </Button>,
          ]}
        >
          <div className="payment-success-details">
            <Paragraph>
              <Text strong>Amount Paid: </Text>
              <Text>₹{paymentResult.amount}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Event: </Text>
              <Text>{eventDetails.title}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Package: </Text>
              <Text>{orderSummary.selectedPackage.name}</Text>
            </Paragraph>
            <Paragraph type="secondary">
              A confirmation email has been sent to your registered email address.
            </Paragraph>
          </div>
        </Result>
      ) : (
        <Result
          status="error"
          title="Payment Failed"
          subTitle={paymentResult.error}
          extra={[
            <Button type="primary" key="retry" onClick={() => setCurrentStep(1)}>
              Try Again
            </Button>,
            <Button key="support" onClick={() => navigate('/support')}>
              Contact Support
            </Button>,
          ]}
        />
      )}
    </div>
  );

  const steps = [
    {
      title: 'Select Package',
      content: renderPackageSelection(),
    },
    {
      title: 'Payment Details',
      content: renderPaymentMethods(),
    },
    {
      title: 'Confirmation',
      content: renderPaymentResult(),
    },
  ];

  if (loading) {
    return (
      <div className="payment-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          className="back-button"
        >
          Back
        </Button>
        <Title level={2}>Complete Payment</Title>
      </div>

      <div className="payment-content">
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <Card className="payment-steps-card">
              <Steps current={currentStep} className="payment-steps">
                {steps.map((step, index) => (
                  <Step key={index} title={step.title} />
                ))}
              </Steps>

              <div className="payment-step-content">
                {steps[currentStep].content}
              </div>

              {currentStep < 2 && (
                <div className="payment-actions">
                  {currentStep > 0 && (
                    <Button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="prev-button"
                    >
                      <LeftOutlined /> Previous
                    </Button>
                  )}
                  {currentStep === 0 && (
                    <Button
                      type="primary"
                      onClick={() => setCurrentStep(1)}
                      className="next-button"
                    >
                      Continue <RightOutlined />
                    </Button>
                  )}
                  {currentStep === 1 && (
                    <Button
                      type="primary"
                      onClick={handleProceedToPayment}
                      loading={processing}
                      className="pay-button"
                    >
                      Pay ₹{orderSummary.total}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {renderOrderSummary()}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PaymentScreen;
