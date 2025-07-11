import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, requiredPermissions = [], requiredRoles = [] }) {
  const { loading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if authenticated
  try {
    if (!isAuthenticated()) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch (error) {
    console.error('Authentication check error:', error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if specified
  if (requiredPermissions.length > 0) {
    try {
      const hasRequiredPermission = requiredPermissions.some(permission => hasPermission(permission));
      if (!hasRequiredPermission) {
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return <Navigate to="/" replace />;
    }
  }

  // Check roles if specified
  if (requiredRoles.length > 0) {
    try {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      console.error('Role check error:', error);
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute; 