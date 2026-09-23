import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { formatDate } from '../../utils/date';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle2,
  User,
  Shield,
  Clock,
  UserCheck,
  Trash2,
  Save,
  Mail,
} from 'lucide-react';

export const AgentTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Agent Management Form State
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentPriority, setCurrentPriority] = useState('');
  const [currentAssignedTo, setCurrentAssignedTo] = useState('');
  const [isUpdatingProperties, setIsUpdatingProperties] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState({ type: '', message: '' });

  // Agent Reply State
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTicketData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes, agentsRes] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getComments(id),
        ticketService.getAgents(),
      ]);

      if (ticketRes.success) {
        setTicket(ticketRes.ticket);
        setCurrentStatus(ticketRes.ticket.status);
        setCurrentPriority(ticketRes.ticket.priority);
        setCurrentAssignedTo(ticketRes.ticket.assigned_to ? String(ticketRes.ticket.assigned_to) : '');
      }

      if (commentsRes.success) {
        setComments(commentsRes.comments || []);
      }

      if (agentsRes.success) {
        setAgents(agentsRes.users || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // Handle Status / Priority / Assignment Updates
  const handlePropertyChange = async (propertyKey, value) => {
    setUpdateFeedback({ type: '', message: '' });
    setIsUpdatingProperties(true);

    const updatePayload = {};
    if (propertyKey === 'status') {
      updatePayload.status = value;
      setCurrentStatus(value);
    } else if (propertyKey === 'priority') {
      updatePayload.priority = value;
      setCurrentPriority(value);
    } else if (propertyKey === 'assigned_to') {
      updatePayload.assigned_to = value === '' ? null : parseInt(value, 10);
      setCurrentAssignedTo(value);
    }

    try {
      const response = await ticketService.updateTicket(id, updatePayload);
      if (response.success && response.ticket) {
        setTicket(response.ticket);
        setUpdateFeedback({
          type: 'success',
          message: `Ticket ${propertyKey.replace('_', ' ')} updated successfully.`,
        });
      }
    } catch (err) {
      setUpdateFeedback({
        type: 'danger',
        message: err.response?.data?.message || `Failed to update ${propertyKey}.`,
      });
      // Revert to current ticket state
      if (propertyKey === 'status') setCurrentStatus(ticket.status);
      if (propertyKey === 'priority') setCurrentPriority(ticket.priority);
      if (propertyKey === 'assigned_to') setCurrentAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
    } finally {
      setIsUpdatingProperties(false);
    }
  };

  // Handle Agent Posting Reply
  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError('');

    if (!newComment.trim()) {
      setCommentError('Please enter a response message before submitting.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await ticketService.createComment(id, newComment.trim());
      if (response.success && response.comment) {
        setComments((prev) => [...prev, response.comment]);
        setNewComment('');
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to post response. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Ticket Deletion
  const handleDeleteTicket = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete Ticket #${ticket.id}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await ticketService.deleteTicket(id);
      navigate('/agent/tickets', { replace: true });
    } catch (err) {
      setUpdateFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to delete ticket.',
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary-600)' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--slate-500)', fontSize: '0.9375rem' }}>Loading ticket triage workspace...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '2.5rem 1.5rem' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: 'var(--danger-600)' }}>
              <AlertCircle size={48} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Ticket Not Found
            </h2>
            <p style={{ color: 'var(--slate-600)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error || 'The requested ticket could not be found or has been removed.'}
            </p>
            <Link to="/agent/tickets" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Back to All Tickets</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/agent/tickets" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} />
          <span>Back to Ticket Queue</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="ticket-details-grid">
        {/* Left Column: Customer Details, Description & Comments Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Ticket Description Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                    Ticket #{ticket.id}
                  </span>
                  <span style={{ color: 'var(--slate-300)' }}>•</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                    Customer: <strong>{ticket.customer_name}</strong> ({ticket.customer_email})
                  </span>
                </div>
                <h1 className="card-title" style={{ fontSize: '1.25rem' }}>{ticket.subject}</h1>
              </div>
            </div>
            <div className="card-body">
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Customer Issue Description
              </h3>
              <p style={{ color: 'var(--slate-800)', fontSize: '0.9375rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Conversation / Comments Thread */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--primary-600)' }} />
                <h2 className="card-title" style={{ fontSize: '1.125rem' }}>
                  Support Conversation Thread ({comments.length})
                </h2>
              </div>
            </div>

            <div className="card-body">
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--slate-400)' }}>
                  <MessageSquare size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No responses or comments on this ticket yet.</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                    Post an official agent response below to assist the customer.
                  </p>
                </div>
              ) : (
                <div className="comment-thread" style={{ marginTop: 0 }}>
                  {comments.map((c) => {
                    const isAgent = c.author_role === 'agent';
                    return (
                      <div
                        key={c.id}
                        className={`comment-card ${isAgent ? 'agent-response' : ''}`}
                      >
                        <div className="comment-header">
                          <div className="comment-author-info">
                            {isAgent ? (
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary-600)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Shield size={14} />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--slate-200)',
                                  color: 'var(--slate-700)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <User size={14} />
                              </div>
                            )}

                            <div>
                              <span className="comment-author-name">{c.author_name}</span>
                              {isAgent ? (
                                <span
                                  className="badge badge-role-agent"
                                  style={{ marginLeft: '0.5rem', fontSize: '0.6875rem' }}
                                >
                                  Support Agent
                                </span>
                              ) : (
                                <span
                                  className="badge badge-role-customer"
                                  style={{ marginLeft: '0.5rem', fontSize: '0.6875rem' }}
                                >
                                  Customer
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="comment-time">{formatDate(c.created_at)}</span>
                        </div>

                        <div className="comment-body">{c.comment}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Agent Reply Form */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--slate-100)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.75rem' }}>
                  Respond to Customer
                </h3>

                {commentError && (
                  <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{commentError}</span>
                  </div>
                )}

                <form onSubmit={handleAddComment}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Type your official support response to the customer..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={isSubmittingComment}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isSubmittingComment || !newComment.trim()}
                    >
                      {isSubmittingComment ? (
                        <>
                          <span className="spinner"></span>
                          <span>Sending Response...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Post Response</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Agent Management Controls & Metadata Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Management Controls Panel */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: '1rem' }}>Triage Controls</h2>
            </div>
            <div className="card-body">
              {updateFeedback.message && (
                <div
                  className={`alert alert-${updateFeedback.type}`}
                  role="alert"
                  style={{ padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                >
                  {updateFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  )}
                  <span>{updateFeedback.message}</span>
                </div>
              )}

              {/* Status Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="status-select">
                  Ticket Status
                </label>
                <select
                  id="status-select"
                  className="form-control"
                  value={currentStatus}
                  onChange={(e) => handlePropertyChange('status', e.target.value)}
                  disabled={isUpdatingProperties}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="priority-select">
                  Priority Level
                </label>
                <select
                  id="priority-select"
                  className="form-control"
                  value={currentPriority}
                  onChange={(e) => handlePropertyChange('priority', e.target.value)}
                  disabled={isUpdatingProperties}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Assigned Agent Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="assigned-select">
                  Assign Agent
                </label>
                <select
                  id="assigned-select"
                  className="form-control"
                  value={currentAssignedTo}
                  onChange={(e) => handlePropertyChange('assigned_to', e.target.value)}
                  disabled={isUpdatingProperties}
                >
                  <option value="">Unassigned (Queue)</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete Ticket Action */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--slate-100)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  disabled={isDeleting || isUpdatingProperties}
                  className="btn btn-danger btn-sm btn-block"
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner"></span>
                      <span>Deleting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Information & Customer Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: '1rem' }}>Ticket Metadata</h2>
            </div>
            <div className="card-body">
              <div className="meta-sidebar">
                <div className="meta-item">
                  <span className="meta-label">Customer Name</span>
                  <span className="meta-value">{ticket.customer_name}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Customer Email</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Mail size={14} style={{ color: 'var(--slate-400)' }} />
                    <a href={`mailto:${ticket.customer_email}`} className="meta-value" style={{ fontSize: '0.8125rem' }}>
                      {ticket.customer_email}
                    </a>
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Created At</span>
                  <span className="meta-value" style={{ fontSize: '0.8125rem' }}>
                    {formatDate(ticket.created_at)}
                  </span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Last Updated</span>
                  <span className="meta-value" style={{ fontSize: '0.8125rem' }}>
                    {formatDate(ticket.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
