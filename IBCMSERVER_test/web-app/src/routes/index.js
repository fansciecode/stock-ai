import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ResetPassword from '../pages/ResetPassword';
import ForgotPassword from '../pages/ForgotPassword';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* ... other routes ... */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes; 