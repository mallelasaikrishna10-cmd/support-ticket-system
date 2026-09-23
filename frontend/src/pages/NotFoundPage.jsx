import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const { isAuthenticated, role } = useAuth();
  const homeLink = !isAuthenticated ? '/login' : role === 'agent' ? '/agent/dashboard' : '/customer/dashboard';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '440px' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', color: 'var(--slate-400)' }}>
          <HelpCircle size={64} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>404 - Page Not Found</h1>
        <p style={{ color: 'var(--slate-500)', marginBottom: '1.5rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to={homeLink} className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
