# Hyperlocal Web Application

## Overview
A modern React-based web application for hyperlocal delivery management. This application provides user authentication, profile management, and a dashboard interface for managing deliveries and orders.

## Technology Stack
- **Frontend Framework**: React 18
- **UI Library**: Ant Design (antd)
- **State Management**: React Hooks
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS Modules + Ant Design theming

## Application Structure
```
web-app/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout/        # Layout components
│   │   ├── Loading.js     # Loading spinner component
│   │   └── ProtectedRoute.js  # Route protection wrapper
│   ├── pages/             # Page components
│   │   ├── Login.js       # Login page
│   │   ├── Register.js    # Registration page
│   │   ├── Dashboard.js   # Main dashboard
│   │   └── Profile.js     # User profile page
│   ├── services/          # API services
│   │   └── api.js         # Axios configuration and API calls
│   ├── styles/            # Global styles
│   │   ├── global.css     # Global CSS
│   │   └── Auth.css       # Authentication pages styling
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
```

## Application Flow

### 1. Authentication Flow
```
Login/Register → Token Generation → Store Token → Redirect to Dashboard
```
- Users can login with email/password
- JWT token is stored in localStorage
- Protected routes check for token presence
- Automatic redirect to login if token is invalid/missing

### 2. Protected Routes
```
Request → Token Check → Allow/Redirect
```
- All routes except login/register are protected
- ProtectedRoute component handles authentication check
- Unauthenticated users are redirected to login

### 3. API Integration
```
Request → Interceptor → Add Token → API Call → Handle Response
```
- Axios interceptors handle token injection
- Automatic token refresh on expiration
- Global error handling for API calls
- Consistent error messages using Ant Design message system

### 4. Main Features

#### Dashboard
- Overview statistics
- Recent activity feed
- Quick action buttons
- Real-time updates

#### Profile Management
- View user details
- Update profile information
- Change password
- Profile picture upload

#### Navigation
- Responsive sidebar
- Collapsible menu
- Breadcrumb navigation
- Quick logout access

## Setup Instructions

1. **Installation**
   ```bash
   # Clone the repository
   git clone <repository-url>

   # Navigate to web-app directory
   cd web-app

   # Install dependencies
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## API Integration

### Endpoints
- `/auth/login` - User authentication
- `/auth/register` - User registration
- `/users/me` - Get current user profile
- `/users/update` - Update user profile
- `/dashboard/stats` - Get dashboard statistics

### Error Handling
The application handles various error scenarios:
- Network errors
- Authentication errors
- Validation errors
- Server errors

### Security Features
- JWT token authentication
- Protected routes
- XSS protection
- CSRF protection
- HTTP-only cookies

## Component Usage

### MainLayout
```jsx
<MainLayout>
  <YourComponent />
</MainLayout>
```
Provides consistent layout with:
- Header with user menu
- Sidebar navigation
- Content area
- Responsive design

### Loading Component
```jsx
<Loading fullScreen={true} tip="Loading data..." />
```
Shows loading state with:
- Centered spinner
- Optional loading text
- Full screen or inline display

### Protected Route
```jsx
<ProtectedRoute>
  <DashboardComponent />
</ProtectedRoute>
```
Ensures route protection with:
- Authentication check
- Redirect handling
- Loading states

## Styling Guide

### Theme Customization
The application uses Ant Design's theme customization:
```javascript
const theme = {
  token: {
    colorPrimary: '#1976d2',
    borderRadius: 4,
  },
};
```

### CSS Classes
Common utility classes available:
- `.text-center` - Center align text
- `.mt-{1-5}` - Margin top utilities
- `.mb-{1-5}` - Margin bottom utilities

## Development Guidelines

1. **Code Structure**
   - Use functional components
   - Implement proper error boundaries
   - Follow React best practices
   - Maintain consistent file structure

2. **State Management**
   - Use React hooks for local state
   - Implement context for global state
   - Follow immutability principles
   - Handle side effects properly

3. **Error Handling**
   - Implement error boundaries
   - Use try-catch blocks
   - Display user-friendly error messages
   - Log errors appropriately

4. **Performance**
   - Implement code splitting
   - Use React.memo for optimization
   - Lazy load components
   - Optimize images and assets

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License
