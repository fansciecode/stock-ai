import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Button,
  List,
  Space,
  Avatar,
  Tag,
  Skeleton,
  Empty,
  Alert,
  AutoComplete,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  HomeOutlined,
  ShopOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text } = Typography;
const { Search } = Input;

const LocationPickerScreen = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);
  const [popularLocations, setPopularLocations] = useState([]);

  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadPopularLocations();
    loadRecentLocations();
  }, []);

  const loadPopularLocations = () => {
    const mockPopular = [
      {
        id: '1',
        name: 'San Francisco Convention Center',
        address: '747 Howard St, San Francisco, CA 94103',
        type: 'Convention Center',
        capacity: 5000,
        amenities: ['WiFi', 'Parking', 'Catering'],
        rating: 4.5
      },
      {
        id: '2',
        name: 'Central Park',
        address: 'New York, NY 10024',
        type: 'Park',
        capacity: 10000,
        amenities: ['Outdoor', 'Scenic Views', 'Photography'],
        rating: 4.8
      },
      {
        id: '3',
        name: 'Chicago Theatre',
        address: '175 N State St, Chicago, IL 60601',
        type: 'Theatre',
        capacity: 3600,
        amenities: ['Stage', 'Sound System', 'Historic'],
        rating: 4.7
      },
      {
        id: '4',
        name: 'Austin Convention Center',
        address: '500 E Cesar Chavez St, Austin, TX 78701',
        type: 'Convention Center',
        capacity: 8000,
        amenities: ['WiFi', 'Parking', 'Multiple Halls'],
        rating: 4.4
      }
    ];
    setPopularLocations(mockPopular);
  };

  const loadRecentLocations = () => {
    const saved = localStorage.getItem('recentLocations');
    if (saved) {
      setRecentLocations(JSON.parse(saved));
    }
  };

  const handleSearch = async (value) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setSearchQuery(value);

    // Simulate API call to location service
    setTimeout(() => {
      const mockResults = [
        {
          id: `search-1-${value}`,
          name: `${value} Convention Center`,
          address: `123 Main St, ${value}, CA 90210`,
          type: 'Convention Center',
          capacity: 2000,
          amenities: ['WiFi', 'Parking'],
          rating: 4.2
        },
        {
          id: `search-2-${value}`,
          name: `${value} Community Hall`,
          address: `456 Oak Ave, ${value}, CA 90211`,
          type: 'Community Hall',
          capacity: 500,
          amenities: ['Tables', 'Chairs'],
          rating: 4.0
        },
        {
          id: `search-3-${value}`,
          name: `${value} Hotel Ballroom`,
          address: `789 Hotel Blvd, ${value}, CA 90212`,
          type: 'Hotel',
          capacity: 300,
          amenities: ['Catering', 'A/V Equipment'],
          rating: 4.6
        }
      ];
      setSearchResults(mockResults);
      setLoading(false);
    }, 800);
  };

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);

    // Save to recent locations
    const recent = [locationData, ...recentLocations.filter(l => l.id !== locationData.id)].slice(0, 5);
    setRecentLocations(recent);
    localStorage.setItem('recentLocations', JSON.stringify(recent));

    showSuccess('Location selected successfully');
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      showError('Please select a location first');
      return;
    }

    // Pass location data back to the calling screen
    const returnTo = location.state?.returnTo || '/events/create';
    navigate(returnTo, {
      state: { selectedLocation }
    });
  };

  const getLocationIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'convention center':
        return <BankOutlined style={{ color: '#1890ff' }} />;
      case 'park':
        return <GlobalOutlined style={{ color: '#52c41a' }} />;
      case 'theatre':
        return <HomeOutlined style={{ color: '#722ed1' }} />;
      case 'hotel':
        return <ShopOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <EnvironmentOutlined style={{ color: '#999' }} />;
    }
  };

  const LocationItem = ({ location, isSelected, onSelect }) => (
    <List.Item
      style={{
        padding: 16,
        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
        borderRadius: 8,
        marginBottom: 8,
        cursor: 'pointer',
        background: isSelected ? '#f6ffed' : 'white'
      }}
      onClick={() => onSelect(location)}
    >
      <List.Item.Meta
        avatar={getLocationIcon(location.type)}
        title={
          <Space>
            <Text strong>{location.name}</Text>
            {isSelected && <CheckOutlined style={{ color: '#52c41a' }} />}
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">{location.address}</Text>
            <Space>
              <Tag color="blue">{location.type}</Tag>
              <Text type="secondary">Capacity: {location.capacity.toLocaleString()}</Text>
              <Text type="secondary">★ {location.rating}</Text>
            </Space>
            <div>
              {location.amenities.map(amenity => (
                <Tag key={amenity} size="small">
                  {amenity}
                </Tag>
              ))}
            </div>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Row justify="center">
        <Col xs={24} lg={16} xl={12}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Choose Location
                </Title>
                <Text type="secondary">
                  Select the perfect venue for your event
                </Text>
              </div>
            </Space>
          </div>

          {/* Search */}
          <Card style={{ marginBottom: 24 }}>
            <Search
              placeholder="Search for venues, addresses, or landmarks..."
              allowClear
              size="large"
              onSearch={handleSearch}
              loading={loading}
              style={{ marginBottom: 16 }}
            />

            {searchQuery && (
              <Text type="secondary">
                Search results for "{searchQuery}"
              </Text>
            )}
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card title="Search Results" style={{ marginBottom: 24 }}>
              {searchResults.map(location => (
                <LocationItem
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onSelect={handleLocationSelect}
                />
              ))}
            </Card>
          )}

          {/* Recent Locations */}
          {recentLocations.length > 0 && (
            <Card title="Recent Locations" style={{ marginBottom: 24 }}>
              {recentLocations.map(location => (
                <LocationItem
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onSelect={handleLocationSelect}
                />
              ))}
            </Card>
          )}

          {/* Popular Locations */}
          <Card title="Popular Venues" style={{ marginBottom: 24 }}>
            {popularLocations.map(location => (
              <LocationItem
                key={location.id}
                location={location}
                isSelected={selectedLocation?.id === location.id}
                onSelect={handleLocationSelect}
              />
            ))}
          </Card>

          {/* Selected Location Summary */}
          {selectedLocation && (
            <Card
              title="Selected Location"
              style={{ marginBottom: 24 }}
              extra={
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleConfirmLocation}
                >
                  Confirm Location
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ fontSize: 16 }}>
                  {selectedLocation.name}
                </Text>
                <Text type="secondary">{selectedLocation.address}</Text>
                <Space>
                  <Tag color="blue">{selectedLocation.type}</Tag>
                  <Text>Capacity: {selectedLocation.capacity.toLocaleString()}</Text>
                  <Text>Rating: ★ {selectedLocation.rating}</Text>
                </Space>
                <div>
                  <Text strong>Amenities: </Text>
                  {selectedLocation.amenities.map(amenity => (
                    <Tag key={amenity} size="small">
                      {amenity}
                    </Tag>
                  ))}
                </div>
              </Space>
            </Card>
          )}

          {/* Help Text */}
          <Alert
            message="Location Tips"
            description="Choose a venue that matches your event size and requirements. Consider parking availability, public transportation access, and necessary amenities."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* Manual Entry Option */}
          <Card title="Can't find your venue?">
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Enter the location details manually if your venue isn't listed above.
            </Text>
            <Button
              type="dashed"
              block
              size="large"
              onClick={() => {
                const manualLocation = {
                  id: 'manual-entry',
                  name: 'Custom Location',
                  address: searchQuery || 'Enter address manually',
                  type: 'Custom',
                  capacity: 0,
                  amenities: [],
                  rating: 0
                };
                handleLocationSelect(manualLocation);
              }}
            >
              Enter Location Manually
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LocationPickerScreen;
