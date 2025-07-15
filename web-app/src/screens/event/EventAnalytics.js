import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Typography, Card, Row, Col, Statistic, Spin, Tabs, Table, Progress } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  RiseOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EventAnalytics = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    // Mock data for demonstration
    setTimeout(() => {
      const mockEventData = {
        id: eventId,
        title: 'Tech Conference 2023',
        date: '2023-12-15',
        location: 'San Francisco, CA',
        organizer: 'IBCM Events'
      };
      
      const mockAnalyticsData = {
        totalRegistrations: 256,
        totalAttendees: 218,
        totalRevenue: 12840,
        averageRating: 4.7,
        registrationsByDay: [
          { date: '2023-10-01', count: 15 },
          { date: '2023-10-02', count: 22 },
          { date: '2023-10-03', count: 18 },
          { date: '2023-10-04', count: 25 },
          { date: '2023-10-05', count: 30 }
        ],
        attendeesByCategory: [
          { category: 'Professional', count: 120 },
          { category: 'Student', count: 75 },
          { category: 'Early Bird', count: 45 },
          { category: 'VIP', count: 16 }
        ],
        ticketSalesByType: [
          { type: 'General Admission', count: 150, revenue: 7500 },
          { type: 'VIP', count: 50, revenue: 3750 },
          { type: 'Workshop', count: 30, revenue: 1500 },
          { type: 'All Access', count: 26, revenue: 3900 }
        ],
        demographicData: {
          gender: [
            { group: 'Male', percentage: 62 },
            { group: 'Female', percentage: 35 },
            { group: 'Non-binary', percentage: 3 }
          ],
          age: [
            { group: '18-24', percentage: 15 },
            { group: '25-34', percentage: 45 },
            { group: '35-44', percentage: 25 },
            { group: '45-54', percentage: 10 },
            { group: '55+', percentage: 5 }
          ],
          location: [
            { group: 'Local', percentage: 55 },
            { group: 'Regional', percentage: 30 },
            { group: 'National', percentage: 12 },
            { group: 'International', percentage: 3 }
          ]
        }
      };
      
      setEventData(mockEventData);
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1500);
  }, [eventId]);

  const ticketColumns = [
    {
      title: 'Ticket Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: 'Revenue ($)',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (text) => `$${text.toLocaleString()}`
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (_, record) => {
        const total = analyticsData.ticketSalesByType.reduce((acc, curr) => acc + curr.count, 0);
        const percentage = (record.count / total * 100).toFixed(1);
        return `${percentage}%`;
      }
    }
  ];

  if (loading) {
    return (
      <Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Event Analytics: {eventData.title}</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {eventData.date} • {eventData.location} • Organized by {eventData.organizer}
      </Text>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Registrations"
              value={analyticsData.totalRegistrations}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Attendees"
              value={analyticsData.totalAttendees}
              prefix={<UserOutlined />}
              suffix={`(${Math.round(analyticsData.totalAttendees / analyticsData.totalRegistrations * 100)}%)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={analyticsData.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              formatter={value => `$${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Rating"
              value={analyticsData.averageRating}
              prefix={<RiseOutlined />}
              suffix="/5"
            />
          </Card>
        </Col>
      </Row>
      
      <Card style={{ marginTop: '24px' }}>
        <Tabs defaultActiveKey="tickets">
          <TabPane 
            tab={<span><BarChartOutlined /> Ticket Sales</span>} 
            key="tickets"
          >
            <Table 
              dataSource={analyticsData.ticketSalesByType} 
              columns={ticketColumns} 
              rowKey="type"
              pagination={false}
            />
          </TabPane>
          
          <TabPane 
            tab={<span><PieChartOutlined /> Demographics</span>} 
            key="demographics"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card title="Gender Distribution">
                  {analyticsData.demographicData.gender.map(item => (
                    <div key={item.group} style={{ marginBottom: '16px' }}>
                      <Text>{item.group}</Text>
                      <Progress 
                        percent={item.percentage} 
                        status="active" 
                        strokeColor={
                          item.group === 'Male' ? '#1890ff' : 
                          item.group === 'Female' ? '#eb2f96' : 
                          '#52c41a'
                        }
                      />
                    </div>
                  ))}
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card title="Age Distribution">
                  {analyticsData.demographicData.age.map(item => (
                    <div key={item.group} style={{ marginBottom: '16px' }}>
                      <Text>{item.group}</Text>
                      <Progress 
                        percent={item.percentage} 
                        status="active" 
                        strokeColor="#1890ff"
                      />
                    </div>
                  ))}
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card title="Location Distribution">
                  {analyticsData.demographicData.location.map(item => (
                    <div key={item.group} style={{ marginBottom: '16px' }}>
                      <Text>{item.group}</Text>
                      <Progress 
                        percent={item.percentage} 
                        status="active" 
                        strokeColor="#52c41a"
                      />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane 
            tab={<span><LineChartOutlined /> Trends</span>} 
            key="trends"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card title="Registration Trends">
                  <Text>Chart visualization would be displayed here</Text>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </Content>
  );
};

export default EventAnalytics; 