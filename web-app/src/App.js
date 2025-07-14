import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocationProvider } from "./contexts/LocationContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Auth Screens
import LoginScreen from "./screens/auth/LoginScreen";
import SignupScreen from "./screens/auth/SignupScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";

// Main Screens
import LandingPage from "./screens/landing/LandingPage";
import HomeScreen from "./screens/home/HomeScreen";
import DashboardScreen from "./screens/dashboard/DashboardScreen";
import EnterpriseDashboardScreen from "./screens/dashboard/EnterpriseDashboardScreen";

// Event Screens
import EventBrowseScreen from "./screens/event/EventBrowseScreen";
import EventCreationScreen from "./screens/event/EventCreationScreen";
import EventDetailsScreen from "./screens/event/EventDetailsScreen";
import EventDisplayScreen from "./screens/event/EventDisplayScreen";
import AddEventScreen from "./screens/event/AddEventScreen";
import LocationPickerScreen from "./screens/event/LocationPickerScreen";
import TicketBookingScreen from "./screens/event/TicketBookingScreen";
import WishlistScreen from "./screens/event/WishlistScreen";
import PhotoViewerScreen from "./screens/event/PhotoViewerScreen";

// Profile Screens
import EnhancedUserProfileScreen from "./screens/profile/EnhancedUserProfileScreen";
import PublicProfileScreen from "./screens/profile/PublicProfileScreen";
import SettingsScreen from "./screens/profile/SettingsScreen";
import UserProfileScreen from "./screens/profile/UserProfileScreen";

// Product/Service Screens
import ProductDetailsScreen from "./screens/product/ProductDetailsScreen";

// Order Screens
import OrderScreen from "./screens/order/OrderScreen";
import OrderDetailsScreen from "./screens/order/OrderDetailsScreen";
import OrderManagementScreen from "./screens/order/OrderManagementScreen";

// Payment Screens
import PaymentScreen from "./screens/payment/PaymentScreen";
import PackageScreen from "./screens/package/PackageScreen";
import PackagesScreen from "./screens/packages/PackageScreen";

// External Event Screens
import ExternalEventScreen from "./screens/external/ExternalEventScreen";

// Event Details Screens
import EventDetailsScreenNew from "./screens/eventdetails/EventDetailsScreen";

// Chat Screens
import ChatScreen from "./screens/chat/ChatScreen";

// Notification Screens
import NotificationScreen from "./screens/notifications/NotificationScreen";

// Review Screens
import EventReviewScreen from "./screens/review/EventReviewScreen";
import ProductReviewScreen from "./screens/review/ProductReviewScreen";

// Report Screen
import ReportScreen from "./screens/report/ReportScreen";

// Category Screen
import CategorySelectionScreen from "./screens/category/CategorySelectionScreen";

// Debug Screen
import ApiDebugScreen from "./screens/debug/ApiDebugScreen";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";
import BottomNavigation from "./components/BottomNavigation";

import "./App.css";
import "antd/dist/reset.css";

const theme = {
  token: {
    colorPrimary: "#1976d2",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: "#1890ff",
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <AuthProvider>
          <ThemeProvider>
            <LocationProvider>
              <NotificationProvider>
                <ErrorBoundary>
                  <Router>
                    <div className="App">
                      <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={<LoginScreen />} />
                        <Route path="/signup" element={<SignupScreen />} />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPasswordScreen />}
                        />

                        {/* Main Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route
                          path="/app"
                          element={
                            <ProtectedRoute>
                              <HomeScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/home"
                          element={
                            <ProtectedRoute>
                              <HomeScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Dashboard Routes */}
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <DashboardScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/enterprise-dashboard"
                          element={
                            <ProtectedRoute>
                              <EnterpriseDashboardScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Event Routes */}
                        <Route
                          path="/browse-events"
                          element={
                            <ProtectedRoute>
                              <EventBrowseScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/events"
                          element={
                            <ProtectedRoute>
                              <EventDisplayScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/events/:eventId"
                          element={
                            <ProtectedRoute>
                              <EventDetailsScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/create-event"
                          element={
                            <ProtectedRoute>
                              <EventCreationScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/add-event"
                          element={
                            <ProtectedRoute>
                              <AddEventScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/location-picker"
                          element={
                            <ProtectedRoute>
                              <LocationPickerScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ticket-booking/:eventId"
                          element={
                            <ProtectedRoute>
                              <TicketBookingScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/wishlist"
                          element={
                            <ProtectedRoute>
                              <WishlistScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/photo-viewer"
                          element={
                            <ProtectedRoute>
                              <PhotoViewerScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Profile Routes */}
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <EnhancedUserProfileScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile/:userId"
                          element={
                            <ProtectedRoute>
                              <PublicProfileScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/user-profile/:userId"
                          element={
                            <ProtectedRoute>
                              <UserProfileScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <SettingsScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Product/Service Routes */}
                        <Route
                          path="/product/:productId"
                          element={
                            <ProtectedRoute>
                              <ProductDetailsScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Order Routes */}
                        <Route
                          path="/orders"
                          element={
                            <ProtectedRoute>
                              <OrderScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/orders/:orderId"
                          element={
                            <ProtectedRoute>
                              <OrderDetailsScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/order-management"
                          element={
                            <ProtectedRoute>
                              <OrderManagementScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Payment Routes */}
                        <Route
                          path="/payment/:eventId"
                          element={
                            <ProtectedRoute>
                              <PaymentScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/packages"
                          element={
                            <ProtectedRoute>
                              <PackagesScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/package"
                          element={
                            <ProtectedRoute>
                              <PackageScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* External Events Routes */}
                        <Route
                          path="/external-events"
                          element={
                            <ProtectedRoute>
                              <ExternalEventScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Event Details Routes */}
                        <Route
                          path="/event-details/:eventId"
                          element={
                            <ProtectedRoute>
                              <EventDetailsScreenNew />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/event-details/:eventId/:source"
                          element={
                            <ProtectedRoute>
                              <EventDetailsScreenNew />
                            </ProtectedRoute>
                          }
                        />

                        {/* Chat Routes */}
                        <Route
                          path="/chat"
                          element={
                            <ProtectedRoute>
                              <ChatScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/chat/:chatId"
                          element={
                            <ProtectedRoute>
                              <ChatScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Notification Routes */}
                        <Route
                          path="/notifications"
                          element={
                            <ProtectedRoute>
                              <NotificationScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/notification/:notificationId"
                          element={
                            <ProtectedRoute>
                              <NotificationScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Review Routes */}
                        <Route
                          path="/event-review/:eventId"
                          element={
                            <ProtectedRoute>
                              <EventReviewScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/product-review/:productId"
                          element={
                            <ProtectedRoute>
                              <ProductReviewScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Other Routes */}
                        <Route
                          path="/report"
                          element={
                            <ProtectedRoute>
                              <ReportScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/category-selection"
                          element={
                            <ProtectedRoute>
                              <CategorySelectionScreen />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/api-debug"
                          element={
                            <ProtectedRoute>
                              <ApiDebugScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Category Events */}
                        <Route
                          path="/category/:categoryId"
                          element={
                            <ProtectedRoute>
                              <EventBrowseScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Event Analytics */}
                        <Route
                          path="/event-analytics/:eventId"
                          element={
                            <ProtectedRoute>
                              <DashboardScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Ticket Details */}
                        <Route
                          path="/ticket/:ticketId"
                          element={
                            <ProtectedRoute>
                              <TicketBookingScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Payment Details */}
                        <Route
                          path="/payment-details/:paymentId"
                          element={
                            <ProtectedRoute>
                              <PaymentScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Service Details */}
                        <Route
                          path="/service/:serviceId"
                          element={
                            <ProtectedRoute>
                              <ProductDetailsScreen />
                            </ProtectedRoute>
                          }
                        />

                        {/* Catch all route */}
                        <Route path="*" element={<Navigate to="/app" />} />
                      </Routes>

                      {/* Bottom Navigation for mobile */}
                      <BottomNavigation />
                    </div>
                  </Router>
                </ErrorBoundary>
              </NotificationProvider>
            </LocationProvider>
          </ThemeProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
