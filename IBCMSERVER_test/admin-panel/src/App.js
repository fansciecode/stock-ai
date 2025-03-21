import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import UsersList from './components/Users/UsersList';
import BusinessesList from './components/Businesses/BusinessesList';
import DeliveriesList from './components/Deliveries/DeliveriesList';

function App() {
    return (
        <Router>
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
                    <Route path="users" element={<UsersList />} />
                    <Route path="businesses" element={<BusinessesList />} />
                    <Route path="deliveries" element={<DeliveriesList />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;