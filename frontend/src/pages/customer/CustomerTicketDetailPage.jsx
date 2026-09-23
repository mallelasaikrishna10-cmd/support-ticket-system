import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  Ticket,
  UserCheck,
} from 'lucide-react';

export const CustomerTicketDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment submission state
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || '');

  const fetchTicketAndComments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getComments(id),
      ]);

      if (ticketRes.success) {
        setTicket(ticketRes.ticket);
      }
      if (commentsRes.success) {
        setComments(commentsRes.comments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketAndComments();
  }, [fetchTicketAndComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError('');

    if (!newComment.trim()) {
      setCommentError('Please enter a comment message before submitting.');
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
      setCommentError(err.response?.data?.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary-600)' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--slate-500)', fontSize: '0.9375rem' }}>Loading ticket details...</p>
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
              Unable to Access Ticket
            </h2>
            <p style={{ color: 'var(--slate-600)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {error || 'The requested ticket could not be found or you do not have permission to view it.'}
            </p>
            <Link to="/customer/tickets" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Back to My Tickets</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/customer/tickets" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} />
          <span>Back to Tickets</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Flash Success Message */}
      {flashMessage && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="ticket-details-grid">
        {/* Left Column: Description & Comments Thread */}
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
                  <span style={{ fontSize: '0.8125rem', color: 'var(--slate-400)' }}>
                    Created {formatDate(ticket.created_at)}
                  </span>
                </div>
                <h1 className="card-title" style={{ fontSize: '1.25rem' }}>{ticket.subject}</h1>
              </div>
            </div>
            <div className="card-body">
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Description
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
                  Conversation Thread ({comments.length})
                </h2>
              </div>
            </div>

            <div className="card-body">
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--slate-400)' }}>
                  <MessageSquare size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No responses or comments yet.</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                    Post a comment below to update our support team with more details.
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
                              {isAgent && (
                                <span
                                  className="badge badge-role-agent"
                                  style={{ marginLeft: '0.5rem', fontSize: '0.6875rem' }}
                                >
                                  Support Agent
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

              {/* Add Comment Form */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--slate-100)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.75rem' }}>
                  Post a Reply
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
                      rows={3}
                      className="form-control"
                      placeholder="Type your message or response here..."
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
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ fontSize: '1rem' }}>Ticket Properties</h2>
            </div>
            <div className="card-body">
              <div className="meta-sidebar">
                <div className="meta-item">
                  <span className="meta-label">Ticket ID</span>
                  <span className="meta-value" style={{ fontWeight: 700 }}>#{ticket.id}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Current Status</span>
                  <div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Priority Level</span>
                  <div>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Assigned Agent</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <UserCheck size={16} style={{ color: ticket.assigned_agent_name ? 'var(--primary-600)' : 'var(--slate-400)' }} />
                    <span className="meta-value">
                      {ticket.assigned_agent_name || 'Unassigned'}
                    </span>
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
