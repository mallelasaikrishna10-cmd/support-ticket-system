import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { formatDate } from '../../utils/date';
import {
  Ticket,
  Search,
  Filter,
  PlusCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

export const CustomerTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const data = await ticketService.getTickets(params);
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customer tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter || priorityFilter);

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My Support Tickets</h1>
          <p className="dashboard-subtitle">
            View, filter, and track all support requests raised from your account.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title="Refresh List"
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

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={fetchTickets} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <div className="filter-toolbar" style={{ margin: 0 }}>
            {/* Search Input */}
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Search subject or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Dropdowns & Reset */}
            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} style={{ color: 'var(--slate-400)' }} />
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '130px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '130px' }}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary btn-sm"
                  title="Clear all filters"
                >
                  <X size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tickets ({tickets.length})</h2>
          {hasActiveFilters && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
              Filtered results
            </span>
          )}
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)' }}></div>
              <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Ticket size={48} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                {hasActiveFilters ? 'No matching tickets found' : 'No support tickets raised yet'}
              </h3>
              <p style={{ color: 'var(--slate-500)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                {hasActiveFilters
                  ? 'Try changing your search term or clearing the active filters.'
                  : 'Whenever you need assistance, submit a new support request and our team will get back to you promptly.'}
              </p>
              {hasActiveFilters ? (
                <button onClick={handleResetFilters} className="btn btn-secondary">
                  <span>Clear Filters</span>
                </button>
              ) : (
                <Link to="/customer/tickets/new" className="btn btn-primary">
                  <PlusCircle size={16} />
                  <span>Create Your First Ticket</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>ID</th>
                    <th>Subject & Details</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Agent</th>
                    <th>Created</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 600, color: 'var(--slate-500)' }}>#{ticket.id}</td>
                      <td>
                        <Link
                          to={`/customer/tickets/${ticket.id}`}
                          style={{ fontWeight: 600, color: 'var(--slate-900)' }}
                        >
                          {ticket.subject}
                        </Link>
                        <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      <td style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                        {formatDate(ticket.updated_at)}
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
