import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRoles = [] }) => {
    const { user, loading, isAuthenticated, hasPermission, hasRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated()) {
        // Redirect to login page with the current location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check permissions if specified
    if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => hasPermission(permission))) {
        // Redirect to unauthorized page or dashboard
        return <Navigate to="/unauthorized" replace />;
    }

    // Check roles if specified
    if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
        // Redirect to unauthorized page or dashboard
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute; 