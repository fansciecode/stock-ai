import React from 'react';
import { Avatar, Typography, Space } from 'antd';
import './Comment.css';

const { Text, Paragraph } = Typography;

/**
 * A simple Comment component based on antd components
 */
const Comment = ({ author, avatar, content, datetime, actions }) => {
  return (
    <div className="ant-comment">
      <div className="ant-comment-inner">
        <div className="ant-comment-avatar">
          <Avatar src={avatar} alt={author} />
        </div>
        <div className="ant-comment-content">
          <div className="ant-comment-content-author">
            <span className="ant-comment-content-author-name">
              <Text strong>{author}</Text>
            </span>
            <span className="ant-comment-content-author-time">
              <Text type="secondary">{datetime}</Text>
            </span>
          </div>
          <div className="ant-comment-content-detail">
            {typeof content === 'string' ? <Paragraph>{content}</Paragraph> : content}
          </div>
          {actions && actions.length > 0 && (
            <ul className="ant-comment-actions">
              {actions.map((action, index) => (
                <li key={`action-${index}`}>
                  <Space>{action}</Space>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment; 