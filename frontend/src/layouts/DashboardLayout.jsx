import React from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Headphones,
  LogOut,
  User as UserIcon,
  Shield,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Inbox,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardHome = role === 'agent' ? '/agent/dashboard' : '/customer/dashboard';

  return (
    <div className="app-container">
      {/* Top Enterprise Navigation */}
      <header className="navbar">
        <div className="navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to={dashboardHome} className="navbar-brand">
              <div className="navbar-brand-icon">
                <Headphones size={18} />
              </div>
              <span>SupportDesk Pro</span>
            </Link>

            {/* Desktop Navigation Links */}
            {role === 'customer' && (
              <nav className="nav-links desktop-nav">
                <NavLink
                  to="/customer/dashboard"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink
                  to="/customer/tickets"
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Ticket size={16} />
                  <span>My Tickets</span>
                </NavLink>
                <NavLink
                  to="/customer/tickets/new"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <PlusCircle size={16} />
                  <span>New Ticket</span>
                </NavLink>
              </nav>
            )}

            {role === 'agent' && (
              <nav className="nav-links desktop-nav">
                <NavLink
                  to="/agent/dashboard"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink
                  to="/agent/tickets"
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Inbox size={16} />
                  <span>All Tickets</span>
                </NavLink>
              </nav>
            )}
          </div>

          <div className="navbar-user">
            <div className="user-meta">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className={`badge badge-role-${role || 'customer'}`} style={{ alignSelf: 'flex-end' }}>
                {role === 'agent' ? (
                  <>
                    <Shield size={12} /> Support Agent
                  </>
                ) : (
                  <>
                    <UserIcon size={12} /> Customer
                  </>
                )}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="mobile-nav-bar">
          {role === 'customer' && (
            <nav className="mobile-nav-links">
              <NavLink
                to="/customer/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/customer/tickets"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Ticket size={15} />
                <span>My Tickets</span>
              </NavLink>
              <NavLink
                to="/customer/tickets/new"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <PlusCircle size={15} />
                <span>New Ticket</span>
              </NavLink>
            </nav>
          )}

          {role === 'agent' && (
            <nav className="mobile-nav-links">
              <NavLink
                to="/agent/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/agent/tickets"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Inbox size={15} />
                <span>All Tickets</span>
              </NavLink>
            </nav>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
