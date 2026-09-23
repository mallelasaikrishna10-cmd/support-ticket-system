import api from './api';

export const ticketService = {
  /**
   * Get tickets with optional filters (search, status, priority, assigned_to, etc.)
   */
  async getTickets(params = {}) {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  /**
   * Get single ticket by ID
   */
  async getTicketById(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  /**
   * Create a new ticket (Customer primary)
   */
  async createTicket(ticketData) {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  /**
   * Update a ticket (Status, priority, assigned_to, subject, description)
   */
  async updateTicket(id, updateData) {
    const response = await api.put(`/tickets/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a ticket (Agent only)
   */
  async deleteTicket(id) {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },

  /**
   * Get comments for a ticket
   */
  async getComments(ticketId) {
    const response = await api.get(`/tickets/${ticketId}/comments`);
    return response.data;
  },

  /**
   * Add a comment to a ticket
   */
  async createComment(ticketId, comment) {
    const response = await api.post(`/tickets/${ticketId}/comments`, { comment });
    return response.data;
  },

  /**
   * Get list of support agents (for ticket assignment)
   */
  async getAgents() {
    const response = await api.get('/users');
    return response.data;
  },
};
