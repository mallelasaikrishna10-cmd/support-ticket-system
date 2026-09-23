import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { formatDate } from '../../utils/date';
import {
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle2,
  Archive,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Eye,
} from 'lucide-react';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ticketService.getTickets();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute live summary metrics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const closedTickets = tickets.filter((t) => t.status === 'closed').length;

  const recentTickets = tickets.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Customer Support Portal</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name || 'Customer'}</strong>. Track and manage your active tickets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/customer/tickets/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Create New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Ticket size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : totalTickets}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--info-50)', color: 'var(--info-600)' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : openTickets}</div>
            <div className="stat-label">Open Tickets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-600)' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : inProgressTickets}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : resolvedTickets}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      {/* Recent Tickets Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Tickets</h2>
            <p className="card-subtitle">Your latest support requests and responses</p>
          </div>
          {tickets.length > 0 && (
            <Link to="/customer/tickets" className="btn btn-secondary btn-sm">
              <span>View All ({tickets.length})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)' }}></div>
              <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading tickets...</p>
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Ticket size={48} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                No support tickets found
              </h3>
              <p style={{ color: 'var(--slate-500)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                You haven&apos;t created any support tickets yet. If you need help with your account or services, submit a ticket below.
              </p>
              <Link to="/customer/tickets/new" className="btn btn-primary">
                <PlusCircle size={16} />
                <span>Create Your First Ticket</span>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Agent</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 600, color: 'var(--slate-500)' }}>#{ticket.id}</td>
                      <td>
                        <Link
                          to={`/customer/tickets/${ticket.id}`}
                          style={{ fontWeight: 600, color: 'var(--slate-900)' }}
                        >
                          {ticket.subject}
                        </Link>
                        <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.description}
                        </p>
                      </td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: ticket.assigned_agent_name ? 'var(--slate-800)' : 'var(--slate-400)' }}>
                        {ticket.assigned_agent_name || 'Unassigned'}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                        {formatDate(ticket.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/customer/tickets/${ticket.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.375rem 0.625rem' }}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
