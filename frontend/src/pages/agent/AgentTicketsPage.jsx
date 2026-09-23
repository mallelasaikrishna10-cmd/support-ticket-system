import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { formatDate } from '../../utils/date';
import {
  Inbox,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';

export const AgentTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  // Fetch agents list for assignment filter
  useEffect(() => {
    const fetchAgentsList = async () => {
      try {
        const response = await ticketService.getAgents();
        if (response.success) {
          setAgents(response.users || []);
        }
      } catch (err) {
        console.warn('Failed to load agents list for filter:', err.message);
      }
    };
    fetchAgentsList();
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (assignedFilter) params.assigned_to = assignedFilter;

      const data = await ticketService.getTickets(params);
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch global tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssignedFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter || priorityFilter || assignedFilter);

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Support Ticket Queue</h1>
          <p className="dashboard-subtitle">
            Global ticket queue across all customers. Filter, triage, and update assignments.
          </p>
        </div>
        <div>
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title="Refresh List"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh Queue</span>
          </button>
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
              {/* Status Filter */}
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

              {/* Priority Filter */}
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

              {/* Assignment Filter */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '150px' }}
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
              >
                <option value="">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    Assigned: {agent.name}
                  </option>
                ))}
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
          <h2 className="card-title">All Tickets ({tickets.length})</h2>
          {hasActiveFilters && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
              Filtered queue
            </span>
          )}
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div className="spinner" style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)' }}></div>
              <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading ticket queue...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Inbox size={48} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                {hasActiveFilters ? 'No tickets match your filters' : 'Queue is currently empty'}
              </h3>
              <p style={{ color: 'var(--slate-500)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                {hasActiveFilters
                  ? 'Try modifying your search keywords or resetting status/assignment filters.'
                  : 'There are currently no active customer support tickets in the database.'}
              </p>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="btn btn-secondary">
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>ID</th>
                    <th>Customer</th>
                    <th>Subject & Details</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 600, color: 'var(--slate-500)' }}>#{ticket.id}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{ticket.customer_name}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)' }}>{ticket.customer_email}</span>
                      </td>
                      <td>
                        <Link
                          to={`/agent/tickets/${ticket.id}`}
                          style={{ fontWeight: 600, color: 'var(--slate-900)' }}
                        >
                          {ticket.subject}
                        </Link>
                        <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.description}
                        </p>
                      </td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {ticket.assigned_agent_name ? (
                          <span style={{ color: 'var(--slate-800)', fontWeight: 500 }}>
                            {ticket.assigned_agent_name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger-600)', fontWeight: 600, fontSize: '0.75rem' }}>
                            ⚠️ Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                        {formatDate(ticket.created_at)}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                        {formatDate(ticket.updated_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/agent/tickets/${ticket.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.375rem 0.625rem' }}
                        >
                          <Eye size={14} />
                          <span>Triage</span>
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
