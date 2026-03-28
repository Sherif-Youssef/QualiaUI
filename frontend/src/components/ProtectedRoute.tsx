import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const mustChange = localStorage.getItem('must_change_password') === 'true';
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (mustChange) {
    return null;
  }
  return <Outlet />;
};

export default ProtectedRoute;
