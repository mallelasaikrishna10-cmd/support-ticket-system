import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { CustomerDashboardPage } from '../pages/customer/CustomerDashboardPage';
import { CustomerTicketsPage } from '../pages/customer/CustomerTicketsPage';
import { CreateTicketPage } from '../pages/customer/CreateTicketPage';
import { CustomerTicketDetailPage } from '../pages/customer/CustomerTicketDetailPage';
import { AgentDashboardPage } from '../pages/agent/AgentDashboardPage';
import { AgentTicketsPage } from '../pages/agent/AgentTicketsPage';
import { AgentTicketDetailPage } from '../pages/agent/AgentTicketDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  // Redirect root path to appropriate dashboard or login
  const getRootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return role === 'agent' ? <Navigate to="/agent/dashboard" replace /> : <Navigate to="/customer/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={getRootRedirect()} />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            role === 'agent' ? <Navigate to="/agent/dashboard" replace /> : <Navigate to="/customer/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            role === 'agent' ? <Navigate to="/agent/dashboard" replace /> : <Navigate to="/customer/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Protected Customer Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="tickets" element={<CustomerTicketsPage />} />
        <Route path="tickets/new" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<CustomerTicketDetailPage />} />
      </Route>

      {/* Protected Agent Routes */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="tickets" element={<AgentTicketsPage />} />
        <Route path="tickets/:id" element={<AgentTicketDetailPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
