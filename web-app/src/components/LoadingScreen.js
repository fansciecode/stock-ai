import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingScreen = ({ tip = 'Loading...', size = 'large' }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Spin indicator={antIcon} tip={tip} size={size} />
        <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          Please wait while we load your content...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
