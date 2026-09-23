import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Wrapper
 * Enforces authentication and role-based authorization
 */
export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading application...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based access restriction
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect customer trying to access agent page to customer dashboard, and vice versa
    const fallbackPath = role === 'agent' ? '/agent/dashboard' : '/customer/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};
