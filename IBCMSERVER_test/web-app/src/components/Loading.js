import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Loading = ({ fullScreen, tip = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fff'
        }}
      >
        <Spin indicator={antIcon} tip={tip} size="large" />
      </div>
    );
  }

  return <Spin indicator={antIcon} tip={tip} />;
};

export default Loading; 