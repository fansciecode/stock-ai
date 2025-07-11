import React, { useState, useEffect } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  Typography,
  Input,
  Select,
  Avatar,
  Badge,
  Skeleton,
  Empty,
  Space,
  Tag,
  Carousel,
  Divider,
  Statistic,
  List,
  Modal,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  CalendarOutlined,
  HeartOutlined,
  TagOutlined,
  FilterOutlined,
  BellOutlined,
  UserOutlined,
  StarOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FireOutlined,
  CompassOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  TrophyOutlined,
  ShareAltOutlined,
  AppleOutlined,
  AndroidOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";
import { useNotification } from "../../contexts/NotificationContext";
import eventService from "../../services/eventService";
import categoryService from "../../services/categoryService";
import userService from "../../services/userService";
import searchService from "../../services/searchService";
import aiService from "../../services/aiService";
import RecommendationCard from "../../components/RecommendationCard";
import "./HomeScreen.css";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

// App download links - replace with actual links when available
const APP_LINKS = {
  android: "https://play.google.com/store/apps/details?id=com.ibcm.app",
  ios: "https://apps.apple.com/app/ibcm/id1234567890"
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location, requestLocation } = useLocation();
  const { showSuccess, showError } = useNotification();

  // State management
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState("featured");

  // Data state
  const [homeData, setHomeData] = useState({
    featuredEvents: [],
    nearbyEvents: [],
    trendingEvents: [],
    upcomingEvents: [],
    categories: [],
    userStats: {},
    recommendations: [],
    aiRecommendations: [], // Add AI recommendations
  });

  const [userInteractionCount, setUserInteractionCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    loadHomeData();
    if (!location.enabled) {
      requestLocation();
    }
  }, []);

  useEffect(() => {
    if (location.coordinates) {
      loadNearbyEvents();
    }
  }, [location.coordinates]);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [
        featuredResult,
        categoriesResult,
        trendingResult,
        upcomingResult,
        userStatsResult,
      ] = await Promise.all([
        eventService.getFeaturedEvents(),
        categoryService.getCategories(),
        eventService.getTrendingEvents(),
        eventService.getUpcomingEvents(),
        user
          ? userService.getUserStats(user.id)
          : Promise.resolve({ success: true, data: {} }),
      ]);

      setHomeData((prev) => ({
        ...prev,
        featuredEvents: featuredResult.success ? featuredResult.data : [],
        categories: categoriesResult.success ? categoriesResult.data : [],
        trendingEvents: trendingResult.success ? trendingResult.data : [],
        upcomingEvents: upcomingResult.success ? upcomingResult.data : [],
        userStats: userStatsResult.success ? userStatsResult.data : {},
      }));

      // Load user-specific data if authenticated
      if (user) {
        loadUserRecommendations();
        loadNotificationCount();
      }
    } catch (error) {
      showError("Failed to load home data");
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyEvents = async () => {
    if (!location.coordinates) return;

    try {
      const result = await searchService.searchNearby(
        location.coordinates.latitude,
        location.coordinates.longitude,
        10, // 10km radius
        "events",
      );

      if (result.success) {
        setHomeData((prev) => ({
          ...prev,
          nearbyEvents: result.data,
        }));
      }
    } catch (error) {
      console.error("Failed to load nearby events:", error);
    }
  };

  const loadUserRecommendations = async () => {
    try {
      // Load regular recommendations
      const result = await eventService.getRecommendedEvents(user.id);
      if (result.success) {
        setHomeData((prev) => ({
          ...prev,
          recommendations: result.data,
        }));
      }

      // Load AI-powered recommendations
      const aiResult = await aiService.getPersonalizedRecommendations(
        user.id,
        6, // Limit to 6 recommendations
        null, // No type filter
        location.coordinates ? `${location.coordinates.latitude},${location.coordinates.longitude}` : null
      );
      
      setHomeData((prev) => ({
        ...prev,
        aiRecommendations: aiResult || [],
      }));
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const result = await userService.getUnreadNotificationCount(user.id);
      if (result.success) {
        setUnreadNotifications(result.data.count);
      }
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  };

  const handleSearch = (value) => {
    if (!value.trim()) return;
    
    incrementUserInteraction();
    
    navigate("/browse-events", {
      state: {
        query: value,
        category: selectedCategory,
      },
    });
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    incrementUserInteraction();
  };

  const incrementUserInteraction = () => {
    setUserInteractionCount((prev) => prev + 1);

    // Check if user needs to log in (for non-authenticated users)
    if (!user && userInteractionCount >= 2) {
      Modal.confirm({
        title: "Sign in to continue",
        content:
          "Create an account or sign in to access more features and personalized recommendations.",
        okText: "Sign In",
        cancelText: "Later",
        onOk: () => navigate("/login"),
      });
    }
  };

  const handleEventClick = (event) => {
    incrementUserInteraction();
    navigate(`/events/${event.id}`);
  };

  const handleCreateEvent = () => {
    if (user) {
      navigate("/create-event");
    } else {
      Modal.confirm({
        title: "Sign in required",
        content: "You need to sign in to create an event.",
        okText: "Sign In",
        cancelText: "Cancel",
        onOk: () => navigate("/login"),
      });
    }
  };

  const renderHeroSection = () => (
    <div className="hero-section">
      <div className="hero-content">
        <Title level={1} className="hero-title">
          Discover Amazing Events Near You
        </Title>
        <Paragraph className="hero-subtitle">
          Find and join events that match your interests, or create your own and connect with like-minded people
        </Paragraph>
        
        <div className="hero-search">
          <Search
            placeholder="Search for events, venues, or activities..."
            enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            className="search-input-group"
          />
          
          <div className="hero-filters">
            <Select
              placeholder="Select Category"
              allowClear
              style={{ width: 200, marginRight: 16 }}
              onChange={(value) => setSelectedCategory(value)}
              value={selectedCategory}
            >
              {homeData.categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
            
            <Button 
              icon={<EnvironmentOutlined />}
              onClick={requestLocation}
              type="default"
              className="location-button"
            >
              {location.enabled ? "Update Location" : "Use My Location"}
            </Button>
          </div>
        </div>
        
        <div className="app-download-links">
          <Button 
            type="primary" 
            icon={<AppleOutlined />} 
            size="large"
            className="download-button ios-button"
            href={APP_LINKS.ios}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download for iOS
          </Button>
          <Button 
            type="primary" 
            icon={<AndroidOutlined />} 
            size="large"
            className="download-button android-button"
            href={APP_LINKS.android}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download for Android
          </Button>
        </div>
        
        <div className="hero-stats">
          <Row gutter={[24, 0]} className="stats-row">
            <Col xs={8}>
              <Statistic 
                title="Events" 
                value={homeData.featuredEvents.length + homeData.trendingEvents.length} 
                prefix={<CalendarOutlined />} 
              />
            </Col>
            <Col xs={8}>
              <Statistic 
                title="Categories" 
                value={homeData.categories.length} 
                prefix={<TagOutlined />} 
              />
            </Col>
            <Col xs={8}>
              <Statistic 
                title="Locations" 
                value={homeData.nearbyEvents.length > 0 ? homeData.nearbyEvents.length : "Many"} 
                prefix={<EnvironmentOutlined />} 
              />
            </Col>
          </Row>
        </div>
      </div>
      
      <div className="hero-wave">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );

  const renderCategorySection = () => (
    <div className="section category-section">
      <div className="section-header">
        <Title level={2} className="section-title">
          <TagOutlined className="section-icon" /> Explore Categories
        </Title>
        <Paragraph className="section-description">
          Find events by category to match your interests
        </Paragraph>
      </div>
      
      <Row gutter={[24, 24]} className="categories-grid">
        {loading ? (
          Array(8).fill(0).map((_, index) => (
            <Col xs={12} sm={8} md={6} lg={4} xl={3} key={index}>
              <Card className="category-card skeleton-card">
                <Skeleton active avatar paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))
        ) : homeData.categories.length > 0 ? (
          homeData.categories.map((category) => (
            <Col xs={12} sm={8} md={6} lg={4} xl={3} key={category.id}>
              <Card 
                className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
                onClick={() => handleCategoryFilter(category.id)}
                hoverable
              >
                <div className="category-content">
                  <div className="category-icon">
                    {category.icon || <TagOutlined />}
                  </div>
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">{category.eventCount || '0'} events</div>
                </div>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Empty description="No categories found" />
          </Col>
        )}
      </Row>
    </div>
  );

  const renderEventCard = (event) => (
    <Card 
      className="event-card" 
      hoverable 
      cover={
        <div className="event-image">
          <img alt={event.title} src={event.image || 'https://via.placeholder.com/300x200?text=Event'} />
          {event.featured && (
            <div className="event-badge featured">
              <StarOutlined /> Featured
            </div>
          )}
          {event.price && (
            <div className="event-badge price">
              ${event.price}
            </div>
          )}
          <div className="event-actions">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<HeartOutlined />} 
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Add favorite functionality
              }}
            />
          </div>
        </div>
      }
      onClick={() => handleEventClick(event)}
    >
      <div className="event-content">
        <div className="event-header">
          <Title level={4} className="event-title">
            {event.title}
          </Title>
          {event.rating && (
            <div className="event-rating">
              <StarOutlined /> {event.rating}
            </div>
          )}
        </div>
        
        <Paragraph className="event-description" ellipsis={{ rows: 2 }}>
          {event.description}
        </Paragraph>
        
        <div className="event-details">
          <div className="detail-item">
            <CalendarOutlined className="detail-icon" />
            <Text>{event.date || 'Date TBA'}</Text>
          </div>
          <div className="detail-item">
            <EnvironmentOutlined className="detail-icon" />
            <Text>{event.location || 'Location TBA'}</Text>
          </div>
          <div className="detail-item">
            <TeamOutlined className="detail-icon" />
            <Text>{event.attendees || 0} attending</Text>
          </div>
        </div>
        
        <div className="event-footer">
          <div className="event-tags">
            {event.tags && event.tags.map((tag, index) => (
              <Tag key={index} className="event-tag">{tag}</Tag>
            ))}
          </div>
          
          <div className="event-organizer">
            <Avatar size="small" src={event.organizer?.avatar} icon={<UserOutlined />} />
            <Text>{event.organizer?.name || 'Organizer'}</Text>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderEventSection = (title, events, icon, description) => (
    <div className="section events-section">
      <div className="section-header">
        <Title level={2} className="section-title">
          {icon} {title}
        </Title>
        <Paragraph className="section-description">
          {description}
        </Paragraph>
        <div className="section-controls">
          <div className="view-toggle">
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
            />
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <Row gutter={[24, 24]} className="events-grid">
          {Array(4).fill(0).map((_, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card className="event-card skeleton-card">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : events.length > 0 ? (
        viewMode === 'grid' ? (
          <Row gutter={[24, 24]} className="events-grid">
            {events.map((event) => (
              <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                {renderEventCard(event)}
              </Col>
            ))}
          </Row>
        ) : (
          <List
            className="events-list"
            itemLayout="vertical"
            dataSource={events}
            renderItem={(event) => (
              <List.Item
                key={event.id}
                className="event-list-item"
                onClick={() => handleEventClick(event)}
                extra={
                  <div className="event-list-image">
                    <img alt={event.title} src={event.image || 'https://via.placeholder.com/300x200?text=Event'} />
                  </div>
                }
              >
                <List.Item.Meta
                  title={<Title level={4}>{event.title}</Title>}
                  description={
                    <div className="event-list-details">
                      <div className="detail-item">
                        <CalendarOutlined className="detail-icon" />
                        <Text>{event.date || 'Date TBA'}</Text>
                      </div>
                      <div className="detail-item">
                        <EnvironmentOutlined className="detail-icon" />
                        <Text>{event.location || 'Location TBA'}</Text>
                      </div>
                      <div className="detail-item">
                        <TeamOutlined className="detail-icon" />
                        <Text>{event.attendees || 0} attending</Text>
                      </div>
                    </div>
                  }
                />
                <Paragraph ellipsis={{ rows: 2 }}>{event.description}</Paragraph>
                <div className="event-list-footer">
                  <div className="event-tags">
                    {event.tags && event.tags.map((tag, index) => (
                      <Tag key={index} className="event-tag">{tag}</Tag>
                    ))}
                  </div>
                  {event.rating && (
                    <div className="event-rating">
                      <StarOutlined /> {event.rating}
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )
      ) : (
        <Empty description={`No ${title.toLowerCase()} events found`} />
      )}
      
      <div className="section-footer">
        <Button 
          type="primary" 
          size="large" 
          onClick={() => navigate('/browse-events')}
        >
          View All Events
        </Button>
      </div>
    </div>
  );

  const renderFeaturedEvents = () => (
    <div className="featured-carousel">
      <Carousel autoplay dots={{ className: "featured-dots" }}>
        {homeData.featuredEvents.slice(0, 5).map((event) => (
          <div key={event.id} className="featured-slide">
            <div className="featured-card" onClick={() => handleEventClick(event)}>
              <div className="featured-image">
                <img alt={event.title} src={event.image || 'https://via.placeholder.com/800x400?text=Featured+Event'} />
                <div className="featured-overlay">
                  <div className="featured-actions">
                    <Button type="primary" shape="circle" icon={<HeartOutlined />} />
                    <Button type="primary" shape="circle" icon={<ShareAltOutlined />} />
                  </div>
                </div>
              </div>
              <div className="featured-content">
                <div className="featured-header">
                  <Title level={3} className="featured-title">{event.title}</Title>
                  {event.rating && (
                    <div className="featured-rating">
                      <StarOutlined className="rating-icon" /> {event.rating}
                    </div>
                  )}
                </div>
                <Paragraph className="featured-description" ellipsis={{ rows: 2 }}>
                  {event.description}
                </Paragraph>
                <div className="featured-details">
                  <div className="detail-item">
                    <CalendarOutlined className="detail-icon" />
                    <Text>{event.date || 'Date TBA'}</Text>
                  </div>
                  <div className="detail-item">
                    <EnvironmentOutlined className="detail-icon" />
                    <Text>{event.location || 'Location TBA'}</Text>
                  </div>
                  <div className="detail-item">
                    <TeamOutlined className="detail-icon" />
                    <Text>{event.attendees || 0} attending</Text>
                  </div>
                </div>
                <div className="featured-footer">
                  <div className="featured-tags">
                    {event.tags && event.tags.slice(0, 3).map((tag, index) => (
                      <Tag key={index} className="event-tag">{tag}</Tag>
                    ))}
                  </div>
                  {event.price !== undefined && (
                    <div className="featured-price">
                      <Text strong>${event.price}</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );

  const renderTabsSection = () => (
    <div className="section tabs-section">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        centered
        size="large"
        className="event-tabs"
      >
        <TabPane 
          tab={<span><StarOutlined /> Featured</span>} 
          key="featured"
        >
          {renderFeaturedEvents()}
        </TabPane>
        <TabPane 
          tab={<span><FireOutlined /> Trending</span>} 
          key="trending"
        >
          {renderEventSection("Trending Events", homeData.trendingEvents, <FireOutlined className="section-icon" />, "Popular events that are gaining attention")}
        </TabPane>
        <TabPane 
          tab={<span><ClockCircleOutlined /> Upcoming</span>} 
          key="upcoming"
        >
          {renderEventSection("Upcoming Events", homeData.upcomingEvents, <ClockCircleOutlined className="section-icon" />, "Events happening soon near you")}
        </TabPane>
        {location.coordinates && (
          <TabPane 
            tab={<span><CompassOutlined /> Nearby</span>} 
            key="nearby"
          >
            {renderEventSection("Nearby Events", homeData.nearbyEvents, <CompassOutlined className="section-icon" />, "Events close to your current location")}
          </TabPane>
        )}
        {user && homeData.recommendations.length > 0 && (
          <TabPane 
            tab={<span><ThunderboltOutlined /> For You</span>} 
            key="recommendations"
          >
            {renderEventSection("Recommended For You", homeData.recommendations, <ThunderboltOutlined className="section-icon" />, "Events tailored to your interests and preferences")}
          </TabPane>
        )}
      </Tabs>
    </div>
  );

  const renderCallToAction = () => (
    <div className="cta-section">
      <div className="cta-content">
        <Title level={2} className="cta-title">Ready to Host Your Own Event?</Title>
        <Paragraph className="cta-description">
          Create and manage your events, connect with attendees, and grow your community.
        </Paragraph>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />}
          onClick={handleCreateEvent}
          className="cta-button"
        >
          Create Event
        </Button>
      </div>
      <div className="cta-image">
        <img src="https://via.placeholder.com/600x400?text=Host+Events" alt="Host Events" />
      </div>
    </div>
  );

  const renderAIRecommendations = () => {
    if (!user) return null;

    return (
      <section className="home-section ai-recommendations-section">
        <div className="section-header">
          <Title level={4}>
            <RocketOutlined /> Recommended for You
          </Title>
          <Text type="secondary">
            Personalized recommendations based on your interests
          </Text>
        </div>

        {loading ? (
          <Row gutter={[16, 16]}>
            {[...Array(3)].map((_, index) => (
              <Col xs={24} sm={12} md={8} key={`loading-rec-${index}`}>
                <RecommendationCard loading={true} />
              </Col>
            ))}
          </Row>
        ) : homeData.aiRecommendations.length > 0 ? (
          <Row gutter={[16, 16]}>
            {homeData.aiRecommendations.map((item) => (
              <Col xs={24} sm={12} md={8} key={`ai-rec-${item.id}`}>
                <RecommendationCard
                  item={item}
                  onClick={(item) => {
                    incrementUserInteraction();
                    // Handle click based on item type
                    if (item.type === "event") {
                      navigate(`/events/${item.id}`);
                    } else if (item.type === "product") {
                      navigate(`/products/${item.id}`);
                    } else {
                      navigate(`/details/${item.id}?type=${item.type}`);
                    }
                    
                    // Submit feedback for AI learning
                    if (user) {
                      aiService.submitFeedback(
                        user.id,
                        item.id,
                        1, // Positive feedback (clicked)
                        null,
                        "recommendation_click"
                      ).catch(error => {
                        console.error("Failed to submit feedback:", error);
                      });
                    }
                  }}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="No recommendations available yet. Explore more events to get personalized recommendations."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </section>
    );
  };

  return (
    <Layout className="home-layout">
      <Content className="home-content">
        {renderHeroSection()}
        
        <div className="home-sections">
          {renderCategorySection()}
          
          {renderTabsSection()}
          
          <Divider />
          
          {renderCallToAction()}
        </div>
        
        {renderAIRecommendations()}

        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          className="create-event-fab"
          onClick={handleCreateEvent}
        />
      </Content>
    </Layout>
  );
};

export default HomeScreen;
