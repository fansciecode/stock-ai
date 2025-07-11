import aiService from "../../services/aiService";
import RecommendationCard from "../../components/RecommendationCard";

const [aiSearchResults, setAiSearchResults] = useState([]);
const [useAiSearch, setUseAiSearch] = useState(false);
const [aiSearchLoading, setAiSearchLoading] = useState(false);

const performAiSearch = async (query, filters = {}) => {
  if (!query) return;
  
  setAiSearchLoading(true);
  try {
    const userId = user ? user.id : null;
    const locationParam = location.coordinates ? {
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude
    } : null;
    
    const results = await aiService.enhancedSearch(
      query,
      userId,
      filters,
      locationParam,
      null // No preferences
    );
    
    setAiSearchResults(results || []);
  } catch (error) {
    console.error("AI search error:", error);
    showError("Enhanced search failed. Falling back to standard search.");
    setUseAiSearch(false);
  } finally {
    setAiSearchLoading(false);
  }
};

const handleSearch = async (value) => {
  if (!value.trim()) return;
  
  setSearchText(value);
  setCurrentPage(1);
  setLoading(true);
  
  try {
    // Perform regular search
    const filters = {
      category: selectedCategory,
      location: selectedLocation,
      startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
      endDate: endDate ? endDate.format("YYYY-MM-DD") : null,
      minPrice,
      maxPrice,
    };
    
    // Track search in analytics
    if (user) {
      try {
        await searchService.trackSearch(user.id, value, filters);
      } catch (error) {
        console.error("Failed to track search:", error);
      }
    }
    
    // If AI search is enabled, use it
    if (useAiSearch) {
      await performAiSearch(value, filters);
    } else {
      // Otherwise use regular search
      const result = await searchService.search(value, filters, currentPage, pageSize);
      if (result.success) {
        setSearchResults(result.data.results);
        setTotalResults(result.data.total);
      } else {
        setSearchResults([]);
        setTotalResults(0);
      }
    }
  } catch (error) {
    console.error("Search error:", error);
    showError("Search failed. Please try again.");
    setSearchResults([]);
    setTotalResults(0);
  } finally {
    setLoading(false);
  }
};

const renderSearchControls = () => (
  <div className="search-controls">
    <Input.Search
      placeholder="Search events, venues, activities..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      onSearch={handleSearch}
      enterButton
      loading={loading}
      className="search-input"
    />
    <div className="search-options">
      <Button
        type={useAiSearch ? "primary" : "default"}
        icon={<RobotOutlined />}
        onClick={() => setUseAiSearch(!useAiSearch)}
        className="ai-search-toggle"
      >
        {useAiSearch ? "AI Search: ON" : "AI Search: OFF"}
      </Button>
    </div>
  </div>
);

const renderAiSearchResults = () => {
  if (!useAiSearch || !searchText) return null;
  
  return (
    <div className="ai-search-results">
      <div className="section-header">
        <Title level={4}>
          <RobotOutlined /> AI-Powered Results
        </Title>
        <Text type="secondary">
          Intelligent results based on your preferences and behavior
        </Text>
      </div>
      
      {aiSearchLoading ? (
        <Row gutter={[16, 16]}>
          {[...Array(3)].map((_, index) => (
            <Col xs={24} sm={12} md={8} key={`loading-ai-${index}`}>
              <RecommendationCard loading={true} />
            </Col>
          ))}
        </Row>
      ) : aiSearchResults.length > 0 ? (
        <Row gutter={[16, 16]}>
          {aiSearchResults.map((item) => (
            <Col xs={24} sm={12} md={8} key={`ai-result-${item.id}`}>
              <RecommendationCard
                item={item}
                onClick={(item) => {
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
                      "search_result_click"
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
          description="No AI-powered results found. Try adjusting your search."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

return (
  <div className="search-screen">
    {renderSearchControls()}
    {renderAiSearchResults()}
    {/* The rest of the search screen content would go here */}
  </div>
); 