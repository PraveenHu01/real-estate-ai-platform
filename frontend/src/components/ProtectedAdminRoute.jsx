import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedAdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}
