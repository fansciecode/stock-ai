import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    Box,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Event as EventIcon,
    VerifiedUser as VerifiedUserIcon,
    AttachMoney as MoneyIcon,
    ShoppingCart as CartIcon,
    Assessment as AssessmentIcon,
    Settings as SettingsIcon,
    Psychology as PsychologyIcon,
    AccountCircle as AccountCircleIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const MainLayout = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'AI Insights', icon: <PsychologyIcon />, path: '/ai-insights' },
        { text: 'User Management', icon: <PeopleIcon />, path: '/users' },
        { text: 'Event Management', icon: <EventIcon />, path: '/events' },
        { text: 'Business Verification', icon: <VerifiedUserIcon />, path: '/verification' },
        { text: 'Financial Management', icon: <MoneyIcon />, path: '/financial' },
        { text: 'Order Management', icon: <CartIcon />, path: '/orders' },
        { text: 'Reports & Analytics', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'System Settings', icon: <SettingsIcon />, path: '/settings' }
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
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
                        sx={{ marginRight: 2 }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Admin Panel
                    </Typography>
                    <IconButton color="inherit">
                        <NotificationsIcon />
                    </IconButton>
                    <IconButton
                        edge="end"
                        aria-label="account of current user"
                        aria-haspopup="true"
                        onClick={handleProfileMenuOpen}
                        color="inherit"
                    >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                            {user?.name?.charAt(0) || 'A'}
                        </Avatar>
                    </IconButton>
                    <Menu
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
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                            <ListItemIcon>
                                <AccountCircleIcon fontSize="small" />
                            </ListItemIcon>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
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
                        whiteSpace: 'nowrap',
                        overflowX: 'hidden',
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                        }),
                        ...(!open && {
                            width: theme.spacing(7),
                            overflowX: 'hidden',
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen,
                            }),
                        }),
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                }}
                            >
                                <ListItemIcon
                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{ opacity: open ? 1 : 0 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout; 