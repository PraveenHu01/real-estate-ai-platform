import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Client-side route guard. This is UX only — the server enforces authorization
 * on every API call. Hiding a route here does not protect data.
 *
 * Usage:
 *   <ProtectedRoute><WishlistPage /></ProtectedRoute>
 *   <ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>
 */
const HIERARCHY = { Guest: 0, Buyer: 1, Seller: 2, Agent: 3, Admin: 4 };

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, status } = useContext(AuthContext);
  const location = useLocation();

  // Wait for /auth/me to resolve — redirecting during load would bounce
  // authenticated users to the login page on every refresh.
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole) {
    const has = HIERARCHY[user.role] ?? -1;
    const needs = HIERARCHY[requiredRole] ?? 999;
    if (has < needs) {
      return (
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400">
            This page requires the <span className="text-slate-200 font-semibold">{requiredRole}</span> role.
            You are signed in as <span className="text-slate-200 font-semibold">{user.role}</span>.
          </p>
        </div>
      );
    }
  }

  return children;
}
