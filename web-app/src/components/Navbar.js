import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer, Space } from 'antd';
import { 
  MenuOutlined, 
  HomeOutlined, 
  CalendarOutlined, 
  ShoppingOutlined, 
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const { Header } = Layout;

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const showDrawer = () => {
    setVisible(true);
  };
  
  const onClose = () => {
    setVisible(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };
  
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      path: '/home'
    },
    {
      key: 'events',
      icon: <CalendarOutlined />,
      label: 'Events',
      path: '/browse-events'
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Products',
      path: '/products'
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: 'Search',
      path: '/search'
    }
  ];
  
  const authItems = isAuthenticated ? [
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      path: '/notifications'
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      path: '/profile'
    }
  ] : [
    {
      key: 'login',
      icon: <LoginOutlined />,
      label: 'Login',
      path: '/login'
    },
    {
      key: 'signup',
      icon: <UserAddOutlined />,
      label: 'Sign Up',
      path: '/signup'
    }
  ];
  
  const allItems = [...menuItems, ...authItems];
  
  return (
    <Header className="app-header">
      <div className="header-content">
        <div className="logo">
          <Link to="/">IBCM</Link>
        </div>
        
        <div className="menu-section">
          <div className="desktop-menu">
            <Menu 
              mode="horizontal" 
              selectedKeys={[location.pathname]}
              className="main-menu"
            >
              {menuItems.map(item => (
                <Menu.Item key={item.path} icon={item.icon}>
                  <Link to={item.path}>{item.label}</Link>
                </Menu.Item>
              ))}
            </Menu>
            
            <Space size="middle" className="auth-buttons">
              {isAuthenticated ? (
                <>
                  <Button 
                    icon={<BellOutlined />} 
                    onClick={() => navigate('/notifications')}
                  />
                  <Button 
                    icon={<UserOutlined />} 
                    onClick={() => navigate('/profile')}
                  />
                </>
              ) : (
                <>
                  <Button 
                    type="text" 
                    icon={<LoginOutlined />}
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<UserAddOutlined />}
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Space>
          </div>
          
          <div className="mobile-menu">
            <Button 
              className="menu-button" 
              icon={<MenuOutlined />} 
              onClick={showDrawer}
            />
            <Drawer
              title="Menu"
              placement="right"
              onClose={onClose}
              open={visible}
            >
              <Menu mode="vertical" selectedKeys={[location.pathname]}>
                {allItems.map(item => (
                  <Menu.Item key={item.path} icon={item.icon}>
                    <Link to={item.path} onClick={onClose}>{item.label}</Link>
                  </Menu.Item>
                ))}
                {isAuthenticated && (
                  <Menu.Item key="logout" onClick={handleLogout}>
                    Logout
                  </Menu.Item>
                )}
              </Menu>
            </Drawer>
          </div>
        </div>
      </div>
    </Header>
  );
};

export default Navbar;
