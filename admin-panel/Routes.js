import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ResetPassword from './components/Auth/ResetPassword';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AIInsightsDashboard from './components/Dashboard/AIInsightsDashboard';
import UserManagement from './components/Users/UserManagement';
import EventManagement from './components/Events/EventManagement';
import BusinessVerification from './components/Verification/BusinessVerification';
import FinancialManagement from './components/Financial/FinancialManagement';
import OrderManagement from './components/Orders/OrderManagement';
import ReportsAnalytics from './components/Reports/ReportsAnalytics';
import RolePermissions from './components/Settings/RolePermissions';
import SystemSettings from './components/Settings/SystemSettings';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<AIInsightsDashboard />} />
                <Route 
                    path="users" 
                    element={
                        <ProtectedRoute requiredPermissions={['users.view']}>
                            <UserManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="events" 
                    element={
                        <ProtectedRoute requiredPermissions={['events.view']}>
                            <EventManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="verification" 
                    element={
                        <ProtectedRoute requiredPermissions={['verification.view']}>
                            <BusinessVerification />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="financial" 
                    element={
                        <ProtectedRoute requiredPermissions={['financial.view']}>
                            <FinancialManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="orders" 
                    element={
                        <ProtectedRoute requiredPermissions={['orders.view']}>
                            <OrderManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="reports" 
                    element={
                        <ProtectedRoute requiredPermissions={['reports.view']}>
                            <ReportsAnalytics />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="roles" 
                    element={
                        <ProtectedRoute requiredPermissions={['roles.view']} requiredRoles={['admin']}>
                            <RolePermissions />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="settings" 
                    element={
                        <ProtectedRoute requiredPermissions={['settings.view']} requiredRoles={['admin']}>
                            <SystemSettings />
                        </ProtectedRoute>
                    } 
                />
            </Route>

            {/* AI routes */}
            <Route path="/ai-insights" element={<AIInsightsDashboard />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

export default AppRoutes;
