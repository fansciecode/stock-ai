import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth Screens
import Login from './screens/auth/Login';
import Signup from './screens/auth/Signup';
import ForgotPassword from './screens/auth/ForgotPassword';

// Main Screens
import Home from './screens/home/Home';
import Dashboard from './screens/dashboard/Dashboard';
import Profile from './screens/profile/Profile';
import Settings from './screens/settings/Settings';
import CategorySelection from './screens/category/CategorySelection';

// Event Screens
import EventDetails from './screens/eventdetails/EventDetails';
import EventCreation from './screens/event/EventCreation';
import EventSearch from './screens/search/EventSearch';
import BrowseEvents from './screens/event/BrowseEvents';
import CategoryEvents from './screens/category/CategoryEvents';

// User Screens
import UserProfile from './screens/profile/UserProfile';
import Orders from './screens/order/Orders';
import EventAnalytics from './screens/event/EventAnalytics';

// Other Screens
import Notifications from './screens/notifications/Notifications';
import TicketBooking from './screens/event/TicketBooking';
import TicketDetails from './screens/event/TicketDetails';
import PaymentDetails from './screens/payment/PaymentDetails';
import ChatDetail from './screens/chat/ChatDetail';
import Report from './screens/report/Report';
import Review from './screens/review/Review';
import LocationPicker from './screens/event/LocationPicker';
import ServiceDetails from './screens/event/ServiceDetails';
import LandingPage from './screens/LandingPage';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// App Component
const App = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize app
    setInitialized(true);
  }, []);

  if (!initialized) {
    return <LoadingSpinner />;
  }

  return (
        <AuthProvider>
                  <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
                      <Routes>
                        {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />
                        {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

                        {/* Main Routes */}
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={
                            <ProtectedRoute>
                  <Dashboard />
                            </ProtectedRoute>
              } />
              
              {/* Profile Routes */}
              <Route path="/profile" element={
                            <ProtectedRoute>
                  <Profile />
                            </ProtectedRoute>
              } />
              <Route path="/user-profile/:userId" element={<UserProfile />} />
              <Route path="/settings" element={
                            <ProtectedRoute>
                  <Settings />
                            </ProtectedRoute>
              } />
              
              {/* Category Routes */}
              <Route path="/category-selection" element={
                            <ProtectedRoute>
                  <CategorySelection />
                            </ProtectedRoute>
              } />
              <Route path="/category/:categoryId" element={<CategoryEvents />} />

                        {/* Event Routes */}
              <Route path="/events/:eventId" element={<EventDetails />} />
              <Route path="/create-event" element={
                            <ProtectedRoute>
                  <EventCreation />
                            </ProtectedRoute>
              } />
              <Route path="/event-search" element={<EventSearch />} />
              <Route path="/browse-events" element={<BrowseEvents />} />
              <Route path="/event-analytics/:eventId" element={
                            <ProtectedRoute>
                  <EventAnalytics />
                            </ProtectedRoute>
              } />

                        {/* Order Routes */}
              <Route path="/orders/:userId" element={
                            <ProtectedRoute>
                  <Orders />
                            </ProtectedRoute>
              } />
              <Route path="/order-details/:orderId" element={
                            <ProtectedRoute>
                  <Orders />
                            </ProtectedRoute>
              } />

                        {/* Other Routes */}
              <Route path="/notifications" element={
                            <ProtectedRoute>
                  <Notifications />
                            </ProtectedRoute>
              } />
              <Route path="/ticket-booking" element={
                            <ProtectedRoute>
                  <TicketBooking />
                            </ProtectedRoute>
              } />
              <Route path="/ticket-details/:ticketId" element={
                            <ProtectedRoute>
                  <TicketDetails />
                            </ProtectedRoute>
              } />
              <Route path="/payment-details/:paymentId" element={
                            <ProtectedRoute>
                  <PaymentDetails />
                            </ProtectedRoute>
              } />
              <Route path="/chat-detail/:chatId" element={
                            <ProtectedRoute>
                  <ChatDetail />
                            </ProtectedRoute>
              } />
              <Route path="/report" element={
                            <ProtectedRoute>
                  <Report />
                            </ProtectedRoute>
              } />
              <Route path="/review" element={
                            <ProtectedRoute>
                  <Review />
                            </ProtectedRoute>
              } />
              <Route path="/location-picker" element={
                            <ProtectedRoute>
                  <LocationPicker />
                            </ProtectedRoute>
              } />
              <Route path="/service-details/:serviceId" element={<ServiceDetails />} />

              {/* 404 Route */}
              <Route path="*" element={<div>Page not found</div>} />
                      </Routes>
          </main>
          <Footer />
                    </div>
                  </Router>
        </AuthProvider>
  );
};

export default App;
