import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Steps, 
  Alert, 
  Upload, 
  Row, 
  Col, 
  Space,
  Progress,
  Tag,
  Divider,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import verificationService from '../../services/verificationService';
import './VerificationScreen.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const VerificationScreen = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState({
    emailVerified: false,
    phoneVerified: false,
    identityVerified: false,
    businessVerified: false
  });
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [verificationScore, setVerificationScore] = useState(0);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await verificationService.getVerificationStatus();
      if (response.success) {
        setVerificationData(response.data);
        calculateVerificationScore(response.data);
        determineCurrentStep(response.data);
      }
    } catch (error) {
      showError('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const calculateVerificationScore = (data) => {
    let score = 0;
    if (data.emailVerified) score += 25;
    if (data.phoneVerified) score += 25;
    if (data.identityVerified) score += 30;
    if (data.businessVerified) score += 20;
    setVerificationScore(score);
  };

  const determineCurrentStep = (data) => {
    if (!data.emailVerified) setCurrentStep(0);
    else if (!data.phoneVerified) setCurrentStep(1);
    else if (!data.identityVerified) setCurrentStep(2);
    else if (!data.businessVerified) setCurrentStep(3);
    else setCurrentStep(4);
  };

  const handleEmailVerification = async () => {
    try {
      setLoading(true);
      const response = await verificationService.sendEmailVerification();
      if (response.success) {
        showSuccess('Verification email sent! Please check your inbox.');
      } else {
        showError(response.message);
      }
    } catch (error) {
      showError('Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerification = async (values) => {
    try {
      setLoading(true);
      const response = await verificationService.verifyPhone({
        phoneNumber: values.phoneNumber,
        verificationCode: values.verificationCode
      });
      if (response.success) {
        showSuccess('Phone number verified successfully!');
        setVerificationData(prev => ({ ...prev, phoneVerified: true }));
        setCurrentStep(2);
      } else {
        showError(response.message);
      }
    } catch (error) {
      showError('Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (info) => {
    try {
      if (info.file.status === 'done') {
        const response = await verificationService.uploadDocument({
          documentType: info.file.documentType,
          file: info.file.originFileObj
        });
        
        if (response.success) {
          setUploadedDocuments(prev => [...prev, response.data]);
          showSuccess('Document uploaded successfully!');
        } else {
          showError(response.message);
        }
      }
    } catch (error) {
      showError('Failed to upload document');
    }
  };

  const handleIdentityVerification = async (values) => {
    try {
      setLoading(true);
      const response = await verificationService.submitIdentityVerification({
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        documents: uploadedDocuments
      });
      
      if (response.success) {
        showSuccess('Identity verification submitted! We\'ll review within 24-48 hours.');
        setVerificationData(prev => ({ ...prev, identityVerified: true }));
        setCurrentStep(3);
      } else {
        showError(response.message);
      }
    } catch (error) {
      showError('Failed to submit identity verification');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessVerification = async (values) => {
    try {
      setLoading(true);
      const response = await verificationService.submitBusinessVerification({
        businessName: values.businessName,
        businessType: values.businessType,
        registrationNumber: values.registrationNumber,
        businessAddress: values.businessAddress,
        documents: uploadedDocuments
      });
      
      if (response.success) {
        showSuccess('Business verification submitted! We\'ll review within 3-5 business days.');
        setVerificationData(prev => ({ ...prev, businessVerified: true }));
        setCurrentStep(4);
      } else {
        showError(response.message);
      }
    } catch (error) {
      showError('Failed to submit business verification');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationIcon = (verified, pending = false) => {
    if (verified) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (pending) return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getVerificationStatus = (verified, pending = false) => {
    if (verified) return <Tag color="success">Verified</Tag>;
    if (pending) return <Tag color="warning">Pending</Tag>;
    return <Tag color="error">Not Verified</Tag>;
  };

  const renderVerificationOverview = () => (
    <Card className="verification-overview">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <div className="verification-score">
            <Title level={4}>Verification Score</Title>
            <Progress
              type="circle"
              percent={verificationScore}
              format={percent => `${percent}%`}
              strokeColor={{
                '0%': '#ff4d4f',
                '50%': '#faad14',
                '100%': '#52c41a',
              }}
            />
            <Paragraph className="score-description">
              Complete all verification steps to unlock full platform features
            </Paragraph>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="verification-benefits">
            <Title level={4}>Verification Benefits</Title>
            <ul className="benefits-list">
              <li>✓ Increased trust from other users</li>
              <li>✓ Access to premium features</li>
              <li>✓ Higher event visibility</li>
              <li>✓ Payment processing capabilities</li>
              <li>✓ Enhanced security features</li>
            </ul>
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderEmailVerification = () => (
    <Card title="Email Verification" extra={getVerificationStatus(verificationData.emailVerified)}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className="verification-item">
          {getVerificationIcon(verificationData.emailVerified)}
          <Text strong>Email Address: {user?.email}</Text>
        </div>
        {!verificationData.emailVerified ? (
          <div>
            <Paragraph>
              We need to verify your email address to ensure secure communication and account recovery.
            </Paragraph>
            <Button 
              type="primary" 
              icon={<MailOutlined />}
              onClick={handleEmailVerification}
              loading={loading}
            >
              Send Verification Email
            </Button>
          </div>
        ) : (
          <Alert
            message="Email Verified"
            description="Your email address has been successfully verified."
            type="success"
            showIcon
          />
        )}
      </Space>
    </Card>
  );

  const renderPhoneVerification = () => (
    <Card title="Phone Verification" extra={getVerificationStatus(verificationData.phoneVerified)}>
      <Form form={form} onFinish={handlePhoneVerification} layout="vertical">
        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter your phone number' }]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" />
        </Form.Item>
        <Form.Item
          name="verificationCode"
          label="Verification Code"
          rules={[{ required: true, message: 'Please enter the verification code' }]}
        >
          <Input placeholder="Enter verification code from SMS" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Verify Phone
            </Button>
            <Button type="default">
              Resend Code
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderIdentityVerification = () => (
    <Card title="Identity Verification" extra={getVerificationStatus(verificationData.identityVerified)}>
      <Form form={form} onFinish={handleIdentityVerification} layout="vertical">
        <Form.Item
          name="documentType"
          label="Document Type"
          rules={[{ required: true, message: 'Please select document type' }]}
        >
          <Input placeholder="e.g., Passport, Driver's License, National ID" />
        </Form.Item>
        <Form.Item
          name="documentNumber"
          label="Document Number"
          rules={[{ required: true, message: 'Please enter document number' }]}
        >
          <Input prefix={<IdcardOutlined />} placeholder="Enter document number" />
        </Form.Item>
        <Form.Item label="Upload Documents">
          <Upload
            multiple
            listType="picture-card"
            onChange={handleDocumentUpload}
            customRequest={({ onSuccess }) => onSuccess('ok')}
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
          <Text type="secondary">
            Upload clear photos of your identification document (front and back if applicable)
          </Text>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Identity Verification
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderBusinessVerification = () => (
    <Card title="Business Verification (Optional)" extra={getVerificationStatus(verificationData.businessVerified)}>
      <Paragraph>
        Verify your business to access advanced features like event monetization and business analytics.
      </Paragraph>
      <Form form={form} onFinish={handleBusinessVerification} layout="vertical">
        <Form.Item
          name="businessName"
          label="Business Name"
          rules={[{ required: true, message: 'Please enter business name' }]}
        >
          <Input placeholder="Enter your business name" />
        </Form.Item>
        <Form.Item
          name="businessType"
          label="Business Type"
          rules={[{ required: true, message: 'Please enter business type' }]}
        >
          <Input placeholder="e.g., Event Planning, Corporate, Non-profit" />
        </Form.Item>
        <Form.Item
          name="registrationNumber"
          label="Registration Number"
        >
          <Input placeholder="Business registration/tax ID number" />
        </Form.Item>
        <Form.Item
          name="businessAddress"
          label="Business Address"
          rules={[{ required: true, message: 'Please enter business address' }]}
        >
          <Input.TextArea rows={3} placeholder="Enter complete business address" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Business Verification
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const steps = [
    {
      title: 'Email',
      description: 'Verify email address',
      icon: <MailOutlined />,
      status: verificationData.emailVerified ? 'finish' : (currentStep >= 0 ? 'process' : 'wait')
    },
    {
      title: 'Phone',
      description: 'Verify phone number',
      icon: <PhoneOutlined />,
      status: verificationData.phoneVerified ? 'finish' : (currentStep >= 1 ? 'process' : 'wait')
    },
    {
      title: 'Identity',
      description: 'Verify identity documents',
      icon: <IdcardOutlined />,
      status: verificationData.identityVerified ? 'finish' : (currentStep >= 2 ? 'process' : 'wait')
    },
    {
      title: 'Business',
      description: 'Verify business (optional)',
      icon: <SafetyCertificateOutlined />,
      status: verificationData.businessVerified ? 'finish' : (currentStep >= 3 ? 'process' : 'wait')
    }
  ];

  return (
    <div className="verification-screen">
      <div className="verification-header">
        <Title level={2}>Account Verification</Title>
        <Paragraph>
          Complete the verification process to unlock all features and increase your account security.
        </Paragraph>
      </div>

      {renderVerificationOverview()}

      <div className="verification-steps">
        <Steps current={currentStep} direction="horizontal" className="verification-progress">
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={step.status}
            />
          ))}
        </Steps>
      </div>

      <div className="verification-content">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            {renderEmailVerification()}
          </Col>
          <Col xs={24} lg={12}>
            {renderPhoneVerification()}
          </Col>
          <Col xs={24} lg={12}>
            {renderIdentityVerification()}
          </Col>
          <Col xs={24} lg={12}>
            {renderBusinessVerification()}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default VerificationScreen;