import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { formatDate } from '../../utils/date';
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Eye,
  ArrowRight,
  AlertCircle,
  Inbox,
  User,
} from 'lucide-react';

export const AgentDashboardPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAgentDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ticketService.getTickets();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support agent dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentDashboardData();
  }, []);

  // Compute live queue metrics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const unassignedTickets = tickets.filter((t) => !t.assigned_to).length;

  // Urgent/High priority open tickets needing immediate triage
  const priorityQueue = tickets
    .filter((t) => (t.priority === 'urgent' || t.priority === 'high') && (t.status === 'open' || t.status === 'in_progress'))
    .slice(0, 5);

  const recentTickets = tickets.slice(0, 6);

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Support Agent Operations</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>Agent {user?.name || 'Agent'}</strong>. Live overview of global customer support queue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchAgentDashboardData}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title="Refresh Queue"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh Queue</span>
          </button>
          <Link to="/agent/tickets" className="btn btn-primary btn-sm">
            <Inbox size={16} />
            <span>View All Tickets ({totalTickets})</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={fetchAgentDashboardData} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : totalTickets}</div>
            <div className="stat-label">Total System Tickets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--info-50)', color: 'var(--info-600)' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : openTickets}</div>
            <div className="stat-label">Open Queue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-600)' }}>
            <AlertTriangle size={22} />
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

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
            <HelpCircle size={22} />
          </div>
          <div>
            <div className="stat-value">{isLoading ? '--' : unassignedTickets}</div>
            <div className="stat-label">Unassigned Tickets</div>
          </div>
        </div>
      </div>

      {/* Priority Triage Queue (Urgent & High) */}
      {priorityQueue.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-600)' }}>
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger-600)' }} />
                <h2 className="card-title" style={{ fontSize: '1.0625rem' }}>
                  Critical & High Priority Attention Queue
                </h2>
              </div>
              <p className="card-subtitle">Tickets requiring immediate agent triage and assignment</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityQueue.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 600, color: 'var(--slate-500)' }}>#{ticket.id}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{ticket.customer_name}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)' }}>{ticket.customer_email}</span>
                      </td>
                      <td>
                        <Link to={`/agent/tickets/${ticket.id}`} style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                          {ticket.subject}
                        </Link>
                      </td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td style={{ fontSize: '0.8125rem', color: ticket.assigned_agent_name ? 'var(--slate-800)' : 'var(--danger-600)', fontWeight: ticket.assigned_agent_name ? 500 : 600 }}>
                        {ticket.assigned_agent_name || '⚠️ Unassigned'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/agent/tickets/${ticket.id}`} className="btn btn-primary btn-sm" style={{ padding: '0.375rem 0.625rem' }}>
                          <Eye size={14} />
                          <span>Triage</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent System Tickets Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Support Tickets</h2>
            <p className="card-subtitle">Global support tickets across all customers</p>
          </div>
          {tickets.length > 0 && (
            <Link to="/agent/tickets" className="btn btn-secondary btn-sm">
              <span>View All Tickets ({tickets.length})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)' }}></div>
              <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading global tickets...</p>
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Inbox size={48} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                No support tickets in queue
              </h3>
              <p style={{ color: 'var(--slate-500)', maxWidth: '400px', margin: '0 auto', fontSize: '0.875rem' }}>
                All support queues are currently clear. New customer tickets will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
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
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{ticket.customer_name}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)' }}>{ticket.customer_email}</span>
                      </td>
                      <td>
                        <Link to={`/agent/tickets/${ticket.id}`} style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                          {ticket.subject}
                        </Link>
                        <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.description}
                        </p>
                      </td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td style={{ fontSize: '0.8125rem', color: ticket.assigned_agent_name ? 'var(--slate-800)' : 'var(--slate-400)' }}>
                        {ticket.assigned_agent_name || 'Unassigned'}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                        {formatDate(ticket.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/agent/tickets/${ticket.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.375rem 0.625rem' }}>
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
