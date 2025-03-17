import React, { useState } from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    Avatar,
    Menu,
    MenuItem,
    Collapse,
    ListItemButton
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Event as EventIcon,
    Analytics as AnalyticsIcon,
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Business as BusinessIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    ExpandLess,
    ExpandMore,
    MonetizationOn as MonetizationOnIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const MainLayout = ({ children }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuOpen, setMenuOpen] = useState({
        settings: false,
        management: false
    });

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuClick = (category) => {
        setMenuOpen(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/dashboard',
            category: null
        },
        {
            text: 'AI Insights',
            icon: <AnalyticsIcon />,
            path: '/insights',
            category: null
        },
        {
            text: 'User Management',
            icon: <PeopleIcon />,
            path: '/users',
            category: 'management'
        },
        {
            text: 'Event Management',
            icon: <EventIcon />,
            path: '/events',
            category: 'management'
        },
        {
            text: 'Business Verification',
            icon: <BusinessIcon />,
            path: '/verification',
            category: 'management'
        },
        {
            text: 'Financial Management',
            icon: <MonetizationOnIcon />,
            path: '/financial',
            category: 'management'
        },
        {
            text: 'Reports & Analytics',
            icon: <AssignmentIcon />,
            path: '/reports',
            category: 'management'
        },
        {
            text: 'Role & Permissions',
            icon: <SecurityIcon />,
            path: '/roles',
            category: 'settings'
        },
        {
            text: 'System Settings',
            icon: <SettingsIcon />,
            path: '/settings',
            category: 'settings'
        }
    ];

    const categories = {
        management: {
            title: 'Management',
            items: menuItems.filter(item => item.category === 'management')
        },
        settings: {
            title: 'Settings',
            items: menuItems.filter(item => item.category === 'settings')
        }
    };

    const renderMenuItems = () => (
        <List>
            {menuItems.filter(item => !item.category).map((item) => (
                <ListItem
                    button
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                </ListItem>
            ))}
            
            <Divider />
            
            {Object.entries(categories).map(([key, category]) => (
                <React.Fragment key={key}>
                    <ListItemButton onClick={() => handleMenuClick(key)}>
                        <ListItemText primary={category.title} />
                        {menuOpen[key] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={menuOpen[key]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {category.items.map((item) => (
                                <ListItem
                                    button
                                    key={item.text}
                                    onClick={() => navigate(item.path)}
                                    selected={location.pathname === item.path}
                                    sx={{ pl: 4 }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                </React.Fragment>
            ))}
        </List>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(open && {
                        marginLeft: drawerWidth,
                        width: `calc(100% - ${drawerWidth}px)`,
                        transition: theme.transitions.create(['width', 'margin'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ marginRight: 5 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Admin Panel
                    </Typography>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="notifications"
                        color="inherit"
                    >
                        <NotificationsIcon />
                    </IconButton>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="account"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleProfileMenuOpen}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                    >
                        <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
                        <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
                        <MenuItem onClick={handleProfileMenuClose}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        ...(open && {
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            overflowX: 'hidden',
                        }),
                        ...(!open && {
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen,
                            }),
                            overflowX: 'hidden',
                            width: theme.spacing(7),
                            [theme.breakpoints.up('sm')]: {
                                width: theme.spacing(9),
                            },
                        }),
                    },
                }}
            >
                <Toolbar
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        px: [1],
                    }}
                >
                    <IconButton onClick={handleDrawerToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                {renderMenuItems()}
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    marginTop: '64px',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout; 