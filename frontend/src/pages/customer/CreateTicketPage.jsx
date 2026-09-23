import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { PlusCircle, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CreateTicketPage = () => {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    const errs = {};

    if (!subject.trim()) {
      errs.subject = 'Ticket subject is required.';
    } else if (subject.trim().length < 3) {
      errs.subject = 'Subject must be at least 3 characters.';
    }

    if (!description.trim()) {
      errs.description = 'Please provide a detailed description of your issue.';
    } else if (description.trim().length < 5) {
      errs.description = 'Description must be at least 5 characters long.';
    }

    if (!priority) {
      errs.priority = 'Priority is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await ticketService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      if (response.success && response.ticket) {
        // Route to the newly created ticket detail page
        navigate(`/customer/tickets/${response.ticket.id}`, {
          state: { flashMessage: 'Your support ticket has been created successfully.' },
        });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/customer/tickets" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} />
          <span>Back to Tickets</span>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title">Create New Support Ticket</h1>
            <p className="card-subtitle">
              Submit your issue or inquiry to our customer support engineering team.
            </p>
          </div>
        </div>

        <div className="card-body">
          {apiError && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Subject */}
            <div className="form-group">
              <label className="form-label" htmlFor="subject">
                Ticket Subject <span style={{ color: 'var(--danger-600)' }}>*</span>
              </label>
              <input
                id="subject"
                type="text"
                className="form-control"
                placeholder="e.g. Cannot complete subscription checkout"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSubmitting}
                maxLength={255}
              />
              {errors.subject && <p className="form-error">{errors.subject}</p>}
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" htmlFor="priority">
                Priority Level <span style={{ color: 'var(--danger-600)' }}>*</span>
              </label>
              <select
                id="priority"
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="low">Low - General inquiry or minor issue</option>
                <option value="medium">Medium - Standard issue with workaround</option>
                <option value="high">High - Important feature impaired</option>
                <option value="urgent">Urgent - Critical business blocker</option>
              </select>
              {errors.priority && <p className="form-error">{errors.priority}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Issue Description <span style={{ color: 'var(--danger-600)' }}>*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                className="form-control"
                placeholder="Provide details about what happened, steps to reproduce, or any relevant error codes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
              {errors.description && <p className="form-error">{errors.description}</p>}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Link to="/customer/tickets" className="btn btn-secondary" disabled={isSubmitting}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
