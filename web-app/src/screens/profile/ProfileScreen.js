import aiService from "../../services/aiService";

const [userInsights, setUserInsights] = useState(null);
const [insightsLoading, setInsightsLoading] = useState(false);

const loadUserInsights = async () => {
  if (!user) return;
  
  setInsightsLoading(true);
  try {
    const insights = await aiService.getUserInsights(user.id);
    setUserInsights(insights);
  } catch (error) {
    console.error("Failed to load user insights:", error);
  } finally {
    setInsightsLoading(false);
  }
};

useEffect(() => {
  loadUserData();
  if (user) {
    loadUserInsights();
  }
}, [user?.id]);

const renderUserInsights = () => {
  if (!userInsights) return null;
  
  return (
    <Card 
      title={<><RobotOutlined /> AI Insights</>} 
      className="profile-insights-card"
      loading={insightsLoading}
    >
      {userInsights ? (
        <>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic 
                title="Activity Score" 
                value={userInsights.activityScore ? (userInsights.activityScore * 100).toFixed(0) : 0} 
                suffix="%" 
                prefix={<FireOutlined />} 
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Events Attended" 
                value={userInsights.eventsAttended || 0} 
                prefix={<CalendarOutlined />} 
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Engagement" 
                value={userInsights.engagementLevel || 'Low'} 
                prefix={<StarOutlined />} 
              />
            </Col>
          </Row>
          
          {userInsights.topInterests && userInsights.topInterests.length > 0 && (
            <div className="profile-interests">
              <Title level={5}>Your Top Interests</Title>
              <div className="interest-tags">
                {userInsights.topInterests.map((interest, index) => (
                  <Tag color="blue" key={`interest-${index}`}>
                    {interest}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          
          {userInsights.recommendedCategories && userInsights.recommendedCategories.length > 0 && (
            <div className="profile-recommendations">
              <Title level={5}>Recommended Categories</Title>
              <div className="recommendation-tags">
                {userInsights.recommendedCategories.map((category, index) => (
                  <Tag color="green" key={`category-${index}`}>
                    {category}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          
          {userInsights.nextEventPrediction && (
            <div className="profile-prediction">
              <Title level={5}>Event Prediction</Title>
              <Text>
                You might enjoy attending a {userInsights.nextEventPrediction.category} event 
                {userInsights.nextEventPrediction.timeframe ? ` ${userInsights.nextEventPrediction.timeframe}` : ''}.
              </Text>
            </div>
          )}
        </>
      ) : (
        <Empty description="No insights available yet. Attend more events to get personalized insights." />
      )}
    </Card>
  );
}; 