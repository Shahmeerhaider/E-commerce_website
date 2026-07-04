import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

export const SellerRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'seller' || user?.role === 'admin' ? children : <Navigate to="/" replace />;
};
