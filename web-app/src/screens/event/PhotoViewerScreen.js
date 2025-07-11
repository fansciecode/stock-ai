import React, { useState, useEffect } from 'react';
import {
  Modal,
  Image,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Avatar,
  Tag,
  List,
  Empty,
  Spin,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled,
  FullscreenOutlined,
  CloseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const { Title, Text } = Typography;

const PhotoViewerScreen = () => {
  const { eventId, photoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventPhotos();
  }, [eventId, photoId]);

  const fetchEventPhotos = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockEvent = {
          id: eventId,
          title: 'Annual Tech Conference 2024',
          date: '2024-03-15',
          location: 'San Francisco, CA',
        };

        const mockPhotos = [
          {
            id: 'photo-1',
            url: '/api/placeholder/800/600',
            thumbnail: '/api/placeholder/200/150',
            title: 'Opening Ceremony',
            description: 'The grand opening of the tech conference',
            photographer: 'John Doe',
            timestamp: '2024-03-15T09:00:00Z',
            likes: 25,
            tags: ['opening', 'ceremony', 'crowd'],
          },
          {
            id: 'photo-2',
            url: '/api/placeholder/800/600',
            thumbnail: '/api/placeholder/200/150',
            title: 'Keynote Speaker',
            description: 'CEO presenting the future of AI',
            photographer: 'Jane Smith',
            timestamp: '2024-03-15T10:30:00Z',
            likes: 42,
            tags: ['keynote', 'speaker', 'AI'],
          },
          {
            id: 'photo-3',
            url: '/api/placeholder/800/600',
            thumbnail: '/api/placeholder/200/150',
            title: 'Networking Session',
            description: 'Attendees networking during lunch break',
            photographer: 'Mike Johnson',
            timestamp: '2024-03-15T12:00:00Z',
            likes: 18,
            tags: ['networking', 'lunch', 'break'],
          },
          {
            id: 'photo-4',
            url: '/api/placeholder/800/600',
            thumbnail: '/api/placeholder/200/150',
            title: 'Workshop Demo',
            description: 'Hands-on workshop demonstration',
            photographer: 'Sarah Wilson',
            timestamp: '2024-03-15T14:00:00Z',
            likes: 33,
            tags: ['workshop', 'demo', 'hands-on'],
          },
          {
            id: 'photo-5',
            url: '/api/placeholder/800/600',
            thumbnail: '/api/placeholder/200/150',
            title: 'Award Ceremony',
            description: 'Recognition of outstanding contributors',
            photographer: 'David Brown',
            timestamp: '2024-03-15T16:30:00Z',
            likes: 56,
            tags: ['awards', 'ceremony', 'recognition'],
          },
        ];

        setEvent(mockEvent);
        setPhotos(mockPhotos);

        // Find current photo index
        if (photoId) {
          const index = mockPhotos.findIndex(p => p.id === photoId);
          setCurrentPhotoIndex(index >= 0 ? index : 0);
        }

        // Set initial like status and count
        const currentPhoto = mockPhotos[0];
        setLiked(false); // Would check user's like status from API
        setLikeCount(currentPhoto.likes);

        setLoading(false);
      }, 1000);
    } catch (error) {
      showError('Failed to load photos');
      setLoading(false);
    }
  };

  const currentPhoto = photos[currentPhotoIndex];

  const handlePrevious = () => {
    const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
    setCurrentPhotoIndex(newIndex);
    navigate(`/events/${eventId}/photos/${photos[newIndex].id}`, { replace: true });
  };

  const handleNext = () => {
    const newIndex = currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
    setCurrentPhotoIndex(newIndex);
    navigate(`/events/${eventId}/photos/${photos[newIndex].id}`, { replace: true });
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    showSuccess(liked ? 'Photo unliked' : 'Photo liked');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentPhoto.title,
        text: currentPhoto.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Photo link copied to clipboard');
    }
  };

  const handleDownload = () => {
    // Simulate download
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = `${currentPhoto.title}.jpg`;
    link.click();
    showSuccess('Download started');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading photos...</Text>
        </div>
      </div>
    );
  }

  if (!currentPhoto) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Empty
          description="Photo not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate(`/events/${eventId}`)}>
            Back to Event
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '16px 24px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => navigate(`/events/${eventId}`)}
                style={{ color: 'white' }}
              >
                Close
              </Button>
              <div>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  {event?.title}
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
                  {currentPhotoIndex + 1} of {photos.length} photos
                </Text>
              </div>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button
                type="text"
                icon={liked ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleLike}
                style={{ color: liked ? '#ff4d4f' : 'white' }}
              >
                {likeCount}
              </Button>
              <Button
                type="text"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                style={{ color: 'white' }}
              >
                Share
              </Button>
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ color: 'white' }}
              >
                Download
              </Button>
              <Button
                type="text"
                icon={<FullscreenOutlined />}
                onClick={() => setIsFullscreen(true)}
                style={{ color: 'white' }}
              >
                Fullscreen
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: 80, display: 'flex', height: '100vh' }}>
        {/* Photo Display */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: 24,
          }}
        >
          {/* Previous Button */}
          <Button
            type="text"
            size="large"
            icon={<LeftOutlined />}
            onClick={handlePrevious}
            style={{
              position: 'absolute',
              left: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontSize: 24,
              height: 60,
              width: 60,
              zIndex: 10,
            }}
          />

          {/* Photo */}
          <div
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.title}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 160px)',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          </div>

          {/* Next Button */}
          <Button
            type="text"
            size="large"
            icon={<RightOutlined />}
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontSize: 24,
              height: 60,
              width: 60,
              zIndex: 10,
            }}
          />
        </div>

        {/* Side Panel */}
        <div
          style={{
            width: 350,
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#000',
            padding: 24,
            overflowY: 'auto',
          }}
        >
          {/* Photo Info */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
              {currentPhoto.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {currentPhoto.description}
            </Text>

            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div>
                <Text strong>Photographer: </Text>
                <Text>{currentPhoto.photographer}</Text>
              </div>
              <div>
                <Text strong>Taken: </Text>
                <Text>{formatTimestamp(currentPhoto.timestamp)}</Text>
              </div>
              <div>
                <Text strong>Tags: </Text>
                {currentPhoto.tags.map(tag => (
                  <Tag key={tag} style={{ marginBottom: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </Space>
          </div>

          {/* Photo Thumbnails */}
          <div>
            <Title level={5}>More Photos</Title>
            <List
              grid={{ gutter: 8, column: 2 }}
              dataSource={photos}
              renderItem={(photo, index) => (
                <List.Item>
                  <div
                    style={{
                      cursor: 'pointer',
                      border: index === currentPhotoIndex ? '2px solid #1890ff' : '2px solid transparent',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                    onClick={() => {
                      setCurrentPhotoIndex(index);
                      navigate(`/events/${eventId}/photos/${photo.id}`, { replace: true });
                    }}
                  >
                    <img
                      src={photo.thumbnail}
                      alt={photo.title}
                      style={{
                        width: '100%',
                        height: 80,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Modal
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        footer={null}
        width="100vw"
        style={{
          top: 0,
          padding: 0,
          maxWidth: 'none',
        }}
        bodyStyle={{
          height: '100vh',
          padding: 0,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        closeIcon={
          <CloseOutlined style={{ color: 'white', fontSize: 24 }} />
        }
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.title}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </Modal>

      {/* Keyboard Navigation */}
      <div
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 16, textAlign: 'center' }}
      >
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
          Use arrow keys to navigate • Press ESC to close
        </Text>
      </div>
    </div>
  );
};

export default PhotoViewerScreen;
