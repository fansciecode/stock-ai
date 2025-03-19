import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ 
    children, 
    requiredPermissions = [], 
    requiredRoles = [] 
}) => {
    const { user, hasPermission, hasRole } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasRequiredPermissions = requiredPermissions.length === 0 || 
        requiredPermissions.every(permission => hasPermission(permission));

    const hasRequiredRoles = requiredRoles.length === 0 || 
        requiredRoles.some(role => hasRole(role));

    if (!hasRequiredPermissions || !hasRequiredRoles) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute; 