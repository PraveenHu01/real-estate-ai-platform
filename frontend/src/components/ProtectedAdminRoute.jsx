// Kept for backwards compatibility — ProtectedRoute supersedes this.
import React from 'react';
import ProtectedRoute from './ProtectedRoute';

export default function ProtectedAdminRoute({ children }) {
  return <ProtectedRoute requiredRole="Admin">{children}</ProtectedRoute>;
}
