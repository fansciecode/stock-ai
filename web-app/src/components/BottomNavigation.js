import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, Event, Message, Person, Search } from '@mui/icons-material';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  // Map routes to navigation values
  const getValueFromPath = (pathname) => {
    if (pathname === '/' || pathname === '/home') return 0;
    if (pathname === '/events' || pathname.startsWith('/events')) return 1;
    if (pathname === '/search') return 2;
    if (pathname === '/messages' || pathname.startsWith('/chat')) return 3;
    if (pathname === '/profile' || pathname.startsWith('/profile')) return 4;
    return 0;
  };

  React.useEffect(() => {
    setValue(getValueFromPath(location.pathname));
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/events');
        break;
      case 2:
        navigate('/search');
        break;
      case 3:
        navigate('/messages');
        break;
      case 4:
        navigate('/profile');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: { xs: 'block', md: 'none' }, // Only show on mobile
        borderTop: '1px solid #e0e0e0'
      }}
      elevation={3}
    >
      <MuiBottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 60,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 0 8px',
            '&.Mui-selected': {
              color: '#1976d2',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
        />
        <BottomNavigationAction
          label="Events"
          icon={<Event />}
        />
        <BottomNavigationAction
          label="Search"
          icon={<Search />}
        />
        <BottomNavigationAction
          label="Messages"
          icon={<Message />}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<Person />}
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;
