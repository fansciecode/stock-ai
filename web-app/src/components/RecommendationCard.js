import React from 'react';
import { Card, Typography, Tag, Rate, Space, Tooltip } from 'antd';
import { StarOutlined, TagOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './RecommendationCard.css';

const { Meta } = Card;
const { Text, Paragraph } = Typography;

/**
 * RecommendationCard component for displaying AI-powered recommendations
 * @param {Object} props - Component props
 * @param {Object} props.item - Recommendation item data
 * @param {Function} props.onClick - Click handler function
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} RecommendationCard component
 */
const RecommendationCard = ({ item, onClick, loading = false }) => {
  if (loading) {
    return (
      <Card
        hoverable
        className="recommendation-card"
        cover={
          <div className="recommendation-card-image-placeholder" />
        }
        loading={true}
      >
        <Meta title="Loading..." description="Loading recommendation..." />
      </Card>
    );
  }

  if (!item) return null;

  const { id, title, description, type, score, reasons, imageUrl, metadata } = item;

  return (
    <Card
      hoverable
      className="recommendation-card"
      onClick={() => onClick && onClick(item)}
      cover={
        <div className="recommendation-card-image-container">
          {imageUrl ? (
            <img 
              alt={title}
              src={imageUrl}
              className="recommendation-card-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x150?text=No+Image';
              }}
            />
          ) : (
            <div className="recommendation-card-image-placeholder">
              <TagOutlined />
            </div>
          )}
          <div className="recommendation-card-type-badge">
            {type}
          </div>
        </div>
      }
    >
      <Meta
        title={title}
        description={
          <Paragraph ellipsis={{ rows: 2 }} className="recommendation-card-description">
            {description}
          </Paragraph>
        }
      />
      
      <div className="recommendation-card-footer">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div className="recommendation-card-score">
            <Rate 
              disabled 
              defaultValue={Math.round(score * 5)} 
              count={5} 
              allowHalf 
            />
            <Text type="secondary" className="recommendation-card-score-text">
              {(score * 100).toFixed(0)}% match
            </Text>
          </div>
          
          {reasons && reasons.length > 0 && (
            <div className="recommendation-card-reasons">
              <Tooltip title={reasons.join(', ')}>
                <Text type="secondary" ellipsis>
                  <InfoCircleOutlined /> {reasons[0]}
                </Text>
              </Tooltip>
            </div>
          )}
          
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="recommendation-card-tags">
              {Object.entries(metadata).slice(0, 2).map(([key, value]) => (
                <Tag key={key} color="blue">
                  {key}: {value}
                </Tag>
              ))}
            </div>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default RecommendationCard; 