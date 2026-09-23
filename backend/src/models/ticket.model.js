const { pool } = require('../config/database');

/**
 * Ticket Data Access Layer / Model
 * Uses parameterized queries to prevent SQL injection.
 */
class TicketModel {
  /**
   * Create a new ticket
   * @param {Object} ticketData
   * @param {number} ticketData.userId - Ticket creator (Customer)
   * @param {string} ticketData.subject
   * @param {string} ticketData.description
   * @param {string} ticketData.priority - 'low', 'medium', 'high', 'urgent'
   * @param {string} [ticketData.status='open']
   * @param {number|null} [ticketData.assignedTo=null]
   * @returns {Promise<Object>}
   */
  static async create({ userId, subject, description, priority = 'medium', status = 'open', assignedTo = null }) {
    const query = `
      INSERT INTO tickets (user_id, subject, description, priority, status, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      userId,
      subject.trim(),
      description.trim(),
      priority,
      status,
      assignedTo,
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find raw ticket by ID (without joins, for permission/ownership checks)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findRawById(id) {
    const query = `
      SELECT id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at
      FROM tickets
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a ticket by ID with customer and assigned agent details
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        u.name AS customer_name,
        u.email AS customer_email,
        a.name AS assigned_agent_name,
        a.email AS assigned_agent_email
      FROM tickets t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get tickets list with optional filters, search, and sorting
   * @param {Object} filters
   * @param {number} [filters.userId] - Filter by customer user_id (for customer scoping)
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.priority] - Filter by priority
   * @param {number} [filters.assignedTo] - Filter by assigned agent ID
   * @param {string} [filters.search] - Search keyword matching subject or description
   * @param {string} [filters.sortBy='created_at'] - 'created_at', 'priority', 'status', 'updated_at'
   * @param {string} [filters.sortOrder='DESC'] - 'ASC' or 'DESC'
   * @returns {Promise<Array>}
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        u.name AS customer_name,
        u.email AS customer_email,
        a.name AS assigned_agent_name,
        a.email AS assigned_agent_email
      FROM tickets t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by customer user_id
    if (filters.userId) {
      query += ` AND t.user_id = ?`;
      params.push(filters.userId);
    }

    // Filter by status
    if (filters.status) {
      query += ` AND t.status = ?`;
      params.push(filters.status);
    }

    // Filter by priority
    if (filters.priority) {
      query += ` AND t.priority = ?`;
      params.push(filters.priority);
    }

    // Filter by assigned agent (support filtering unassigned with 'unassigned')
    if (filters.assignedTo !== undefined && filters.assignedTo !== null && filters.assignedTo !== '') {
      if (filters.assignedTo === 'null' || filters.assignedTo === 'unassigned') {
        query += ` AND t.assigned_to IS NULL`;
      } else {
        query += ` AND t.assigned_to = ?`;
        params.push(parseInt(filters.assignedTo, 10));
      }
    }

    // Search keyword in subject or description
    if (filters.search && filters.search.trim() !== '') {
      query += ` AND (t.subject LIKE ? OR t.description LIKE ?)`;
      const searchParam = `%${filters.search.trim()}%`;
      params.push(searchParam, searchParam);
    }

    // Valid sort columns
    const allowedSortColumns = {
      created_at: 't.created_at',
      updated_at: 't.updated_at',
      priority: 't.priority',
      status: 't.status',
      subject: 't.subject',
    };

    const sortColumn = allowedSortColumns[filters.sortBy] || 't.created_at';
    const sortDirection = filters.sortOrder && filters.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Handle priority custom ordering if requested
    if (filters.sortBy === 'priority') {
      // Urgent > High > Medium > Low
      const priorityOrder = sortDirection === 'ASC'
        ? "FIELD(t.priority, 'low', 'medium', 'high', 'urgent')"
        : "FIELD(t.priority, 'urgent', 'high', 'medium', 'low')";
      query += ` ORDER BY ${priorityOrder}, t.created_at DESC`;
    } else {
      query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Update a ticket by ID
   * @param {number} id
   * @param {Object} updateFields
   * @returns {Promise<Object|null>}
   */
  static async update(id, updateFields) {
    const fields = [];
    const values = [];

    if (updateFields.subject !== undefined) {
      fields.push('subject = ?');
      values.push(updateFields.subject.trim());
    }

    if (updateFields.description !== undefined) {
      fields.push('description = ?');
      values.push(updateFields.description.trim());
    }

    if (updateFields.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updateFields.priority);
    }

    if (updateFields.status !== undefined) {
      fields.push('status = ?');
      values.push(updateFields.status);
    }

    if (updateFields.assigned_to !== undefined) {
      fields.push('assigned_to = ?');
      values.push(updateFields.assigned_to === null || updateFields.assigned_to === '' ? null : updateFields.assigned_to);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    const query = `
      UPDATE tickets
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    values.push(id);

    await pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Delete a ticket by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const query = `DELETE FROM tickets WHERE id = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = TicketModel;
