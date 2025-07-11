import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import theme from './theme';
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Users/UsersList';
import BusinessVerification from './components/Businesses/BusinessesList';
import DeliveriesList from './components/Deliveries/DeliveriesList';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <SnackbarProvider 
                    maxSnack={3} 
                    anchorOrigin={{ 
                        vertical: 'top', 
                        horizontal: 'right' 
                    }}
                >
                    <AuthProvider>
                        <CssBaseline />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Dashboard />} />
                                <Route path="users" element={<UserManagement />} />
                                <Route path="businesses" element={<BusinessVerification />} />
                                <Route path="deliveries" element={<DeliveriesList />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AuthProvider>
                </SnackbarProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;